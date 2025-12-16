package controller

import (
	"context"
	"im-backend/internal/pkg"
	"im-backend/internal/service"
)

type UserController struct {
	userService *service.UserService
	codeService *service.CodeService
}

func NewUserController(userService *service.UserService, codeService *service.CodeService) *UserController {
	return &UserController{userService, codeService}
}

// Register 注册
func (c *UserController) Register(email, code, userID, nickname string) error {
	ctx := context.Background()
	return c.userService.Register(ctx, email, code, userID, nickname)
}

// Login 登录
func (c *UserController) Login(email, code string) (map[string]interface{}, error) {
	ctx := context.Background()
	user, err := c.userService.Login(ctx, email, code)
	if err != nil {
		return nil, err
	}

	// 生成 Token 并存入 Redis
	token, err := pkg.GenerateToken(user.Email, c.userService.RDB)
	if err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"token": token,
		"user":  user,
	}, nil
}

// Me 获取用户信息
func (c *UserController) Me(email string) (interface{}, error) {
	return c.userService.FindByEmail(email)
}

// Logout 登出
func (c *UserController) Logout(tokenString string) error {
	// 先验证并解析 token
	claims, err := pkg.VerifyToken(tokenString, c.userService.RDB)
	if err != nil {
		return err
	}

	// 用 userID 删除 Redis 中的 token
	return pkg.DeleteToken(claims.Email, c.userService.RDB)
}

// RegisterWithPassword 注册（邮箱+密码）
func (c *UserController) RegisterWithPassword(email, userID, nickname, password string) error {
	return c.userService.RegisterWithPassword(context.Background(), email, userID, nickname, password)
}

// LoginWithPassword 登录（User ID/Email + 密码）
func (c *UserController) LoginWithPassword(account, password string) (map[string]interface{}, error) {
	user, err := c.userService.LoginWithPassword(context.Background(), account, password)
	if err != nil {
		return nil, err
	}

	token, err := pkg.GenerateToken(user.Email, c.userService.RDB)
	if err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"token": token,
		"user":  user,
	}, nil
}

// SetPassword 设置密码
func (c *UserController) SetPassword(email, password string) error {
	return c.userService.SetPassword(context.Background(), email, password)
}

// SendCode 发送邮件验证码
func (c *UserController) SendCode(email string) error {
	return c.codeService.SendCode(email)
}

// VerifyCode 验证邮件验证码
func (c *UserController) VerifyCode(email, code string) (bool, error) {
	return c.codeService.VerifyCode(email, code)
}

// UpdateProfile 更新用户资料
func (c *UserController) UpdateProfile(email string, nickname, avatar *string) error {
	ctx := context.Background()
	return c.userService.UpdateProfile(ctx, email, nickname, avatar)
}
