package model

import (
	"time"

	"gorm.io/gorm"
)

// Block 用户黑名单表
type Block struct {
	ID            uint           `gorm:"primaryKey" json:"id"`
	UserID        string         `gorm:"not null;uniqueIndex:idx_user_blocked,priority:1;index:idx_block_user" json:"user_id"`
	BlockedUserID string         `gorm:"not null;uniqueIndex:idx_user_blocked,priority:2;index:idx_block_blocked" json:"blocked_user_id"`
	CreatedAt     time.Time      `gorm:"index:idx_block_created_at" json:"created_at"`
	DeletedAt     gorm.DeletedAt `gorm:"index:idx_block_deleted_at" json:"-"`

	User        *User `gorm:"foreignKey:UserID;references:UserID" json:"user,omitempty"`
	BlockedUser *User `gorm:"foreignKey:BlockedUserID;references:UserID" json:"blocked_user,omitempty"`
}
