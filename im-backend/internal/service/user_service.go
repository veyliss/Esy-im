package service

import (
	"context"
	"errors"
	"im-backend/internal/model"
	"im-backend/internal/repository"
	"time"

	"github.com/redis/go-redis/v9"
	"golang.org/x/crypto/bcrypt"
)

type UserService struct {
	Repo        *repository.UserRepository
	RDB         *redis.Client
	CodeService *CodeService
}

func NewUserService(repo *repository.UserRepository, rdb *redis.Client, codeService *CodeService) *UserService {
	return &UserService{Repo: repo, RDB: rdb, CodeService: codeService}
}

//func NewUserService(repo *repository.UserRepository, rdb RedisClient, codeService *CodeService) *UserService {
//	return &UserService{Repo: repo, RDB: rdb, CodeService: codeService}
//}

// Register ----------------- 注册 -----------------
func (s *UserService) Register(ctx context.Context, email, code, userID, nickname string) error {
	// 校验验证码
	ok, err := s.CodeService.VerifyCode(email, code)
	if err != nil {
		return err
	}
	if !ok {
		return errors.New("验证码错误或已过期")
	}

	// 检查邮箱是否已注册
	if _, err := s.Repo.FindByEmail(email); err == nil {
		return errors.New("邮箱已被注册")
	}

	// 检查用户ID是否已存在
	if _, err := s.Repo.FindByUserID(userID); err == nil {
		return errors.New("用户ID已存在")
	}

	// 创建用户
	user := &model.User{
		UserID:    userID,
		Email:     email,
		Nickname:  nickname,
		CreatedAt: time.Now(),
	}
	if err := s.Repo.Create(user); err != nil {
		return err
	}

	// 注册成功后清除验证码
	_ = s.RDB.Del(ctx, CodePrefix+email).Err()

	return nil
}

// Login ----------------- 登录 -----------------
func (s *UserService) Login(ctx context.Context, email, code string) (*model.User, error) {
	// 校验验证码
	ok, err := s.CodeService.VerifyCode(email, code)
	if err != nil {
		return nil, err
	}
	if !ok {
		return nil, errors.New("验证码错误或已过期")
	}

	// 查找用户
	user, err := s.Repo.FindByEmail(email)
	if err != nil || user == nil {
		return nil, errors.New("用户不存在，请先注册")
	}

	// 登录成功后清除验证码
	_ = s.RDB.Del(ctx, CodePrefix+email).Err()

	return user, nil
}

// GetByID ----------------- 获取用户信息 -----------------
func (s *UserService) GetByID(userID string) (*model.User, error) {
	return s.Repo.FindByUserID(userID)
}

// RegisterWithPassword 注册（邮箱+密码）
func (s *UserService) RegisterWithPassword(ctx context.Context, email, userID, nickname, password string) error {
	// 校验密码长度
	if len(password) < 8 {
		return errors.New("密码长度至少8位")
	}

	// 检查邮箱是否已注册
	if _, err := s.Repo.FindByEmail(email); err == nil {
		return errors.New("邮箱已被注册")
	}
	// 检查用户ID是否已存在
	if _, err := s.Repo.FindByUserID(userID); err == nil {
		return errors.New("用户ID已存在")
	}

	// 加密密码
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	// 创建用户
	user := &model.User{
		UserID:    userID,
		Email:     email,
		Password:  string(hashedPassword),
		Nickname:  nickname,
		CreatedAt: time.Now(),
	}
	return s.Repo.Create(user)
}

// LoginWithPassword 登录（User ID/Email + 密码）
// 支持使用 User ID 或 Email 进行登录
func (s *UserService) LoginWithPassword(ctx context.Context, account, password string) (*model.User, error) {
	var user *model.User
	var err error

	// 先尝试用 User ID 查找
	user, err = s.Repo.FindByUserID(account)
	if err != nil || user == nil {
		// 如果找不到,再尝试用 Email 查找
		user, err = s.Repo.FindByEmail(account)
		if err != nil || user == nil {
			return nil, errors.New("用户不存在")
		}
	}

	// 校验密码
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		return nil, errors.New("密码错误")
	}

	return user, nil
}

// SetPassword 设置或修改密码
func (s *UserService) SetPassword(ctx context.Context, email, password string) error {
	// 校验密码长度
	if len(password) < 8 {
		return errors.New("密码长度至少8位")
	}

	user, err := s.Repo.FindByEmail(email)
	if err != nil || user == nil {
		return errors.New("用户不存在")
	}

	// 加密密码
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	// 只更新密码字段
	return s.Repo.UpdateField(user.UserID, "password", string(hashedPassword))
}

// FindByEmail 根据邮箱查找用户
func (s *UserService) FindByEmail(email string) (interface{}, error) {
	return s.Repo.FindByEmail(email)
}

// UpdateProfile 更新用户资料
func (s *UserService) UpdateProfile(ctx context.Context, email string, nickname, avatar *string) error {
	user, err := s.Repo.FindByEmail(email)
	if err != nil || user == nil {
		return errors.New("用户不存在")
	}

	// 更新昵称
	if nickname != nil && *nickname != "" {
		user.Nickname = *nickname
	}

	// 更新头像
	if avatar != nil {
		user.Avatar = *avatar
	}

	return s.Repo.Update(user)
}
