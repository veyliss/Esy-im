package repository

import (
	"im-backend/internal/model"

	"gorm.io/gorm"
)

type UserRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) *UserRepository {
	return &UserRepository{db: db}
}

// Create 创建用户
func (r *UserRepository) Create(user *model.User) error {
	return r.db.Create(user).Error
}

// FindByEmail 根据邮箱查询
func (r *UserRepository) FindByEmail(email string) (*model.User, error) {
	var user model.User
	if err := r.db.Where("email = ?", email).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

// FindByUserID 根据用户ID查询
func (r *UserRepository) FindByUserID(userID string) (*model.User, error) {
	var user model.User
	if err := r.db.Where("user_id = ?", userID).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

// Update 更新用户（用于修改密码/昵称等）
func (r *UserRepository) Update(user *model.User) error {
	return r.db.Save(user).Error
}

// UpdateField 更新单个字段（例如密码、昵称）
func (r *UserRepository) UpdateField(userID string, field string, value interface{}) error {
	return r.db.Model(&model.User{}).
		Where("user_id = ?", userID).
		Update(field, value).Error
}
