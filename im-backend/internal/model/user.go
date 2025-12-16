package model

import (
	"time"

	"gorm.io/gorm"
)

// User 用户表
type User struct {
	ID        uint           `gorm:"primaryKey" json:"id"`                                 // 自增id
	UserID    string         `gorm:"uniqueIndex:idx_user_id;not null" json:"user_id"`      // 用户号
	Email     string         `gorm:"uniqueIndex:idx_email;size:100;not null" json:"email"` // 邮箱
	Password  string         `gorm:"size:255" json:"-"`                                    // 可以留空，如果只用验证码登录
	Nickname  string         `gorm:"size:50;index:idx_nickname" json:"nickname"`           // 昵称
	Avatar    string         `gorm:"size:255" json:"avatar"`                               // 头像
	CreatedAt time.Time      `gorm:"index:idx_created_at" json:"created_at"`               // 创建时间
	UpdatedAt time.Time      `json:"updated_at"`                                           // 更新时间
	DeletedAt gorm.DeletedAt `gorm:"index:idx_deleted_at" json:"-"`                        // 软删除
}
