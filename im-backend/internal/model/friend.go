package model

import (
	"time"

	"gorm.io/gorm"
)

// FriendRequest 好友请求表
type FriendRequest struct {
	ID         uint           `gorm:"primaryKey" json:"id"`
	FromUserID string         `gorm:"not null;index:idx_from_user,priority:1;index:idx_from_to,priority:1" json:"from_user_id"` // 发起请求的用户ID
	ToUserID   string         `gorm:"not null;index:idx_to_user,priority:1;index:idx_from_to,priority:2" json:"to_user_id"`     // 接收请求的用户ID
	Message    string         `gorm:"size:255" json:"message"`                                                                  // 验证信息
	Status     int            `gorm:"default:0;index:idx_status" json:"status"`                                                 // 状态：0-待处理，1-已同意，2-已拒绝
	CreatedAt  time.Time      `gorm:"index:idx_created_at" json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `gorm:"index:idx_deleted_at" json:"-"`

	// 关联查询
	FromUser *User `gorm:"foreignKey:FromUserID;references:UserID" json:"from_user,omitempty"`
	ToUser   *User `gorm:"foreignKey:ToUserID;references:UserID" json:"to_user,omitempty"`
}

// Friend 好友关系表
type Friend struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	UserID    string         `gorm:"not null;uniqueIndex:idx_user_friend,priority:1;index:idx_user" json:"user_id"`     // 用户ID
	FriendID  string         `gorm:"not null;uniqueIndex:idx_user_friend,priority:2;index:idx_friend" json:"friend_id"` // 好友ID
	Remark    string         `gorm:"size:50" json:"remark"`                                                             // 备注名
	CreatedAt time.Time      `gorm:"index:idx_created_at" json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index:idx_deleted_at" json:"-"`

	// 关联查询
	User       *User `gorm:"foreignKey:UserID;references:UserID" json:"user,omitempty"`
	FriendUser *User `gorm:"foreignKey:FriendID;references:UserID" json:"friend_user,omitempty"`
}
