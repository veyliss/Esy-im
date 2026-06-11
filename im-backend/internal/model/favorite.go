package model

import (
	"time"

	"gorm.io/gorm"
)

// MessageFavorite 消息收藏表（内容快照，即使原消息撤回也保留）
type MessageFavorite struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	UserID      string         `gorm:"not null;uniqueIndex:idx_fav_user_msg,priority:1" json:"user_id"`
	MessageID   uint           `gorm:"not null;uniqueIndex:idx_fav_user_msg,priority:2" json:"message_id"`
	MessageType int            `json:"message_type"`
	Content     string         `gorm:"type:text" json:"content"`
	MediaURL    string         `gorm:"size:500" json:"media_url"`
	FromUserID  string         `json:"from_user_id"`
	CreatedAt   time.Time      `json:"created_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index:idx_fav_deleted" json:"-"`
}

// GroupPinnedMessage 群置顶消息表
type GroupPinnedMessage struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	GroupID   string         `gorm:"not null;uniqueIndex:idx_pin_group_msg,priority:1" json:"group_id"`
	MessageID uint           `gorm:"not null;uniqueIndex:idx_pin_group_msg,priority:2" json:"message_id"`
	PinnedBy  string         `gorm:"not null" json:"pinned_by"`
	CreatedAt time.Time      `json:"created_at"`
	DeletedAt gorm.DeletedAt `gorm:"index:idx_pin_deleted" json:"-"`
}
