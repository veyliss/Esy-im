package model

import (
	"time"

	"gorm.io/gorm"
)

// ConversationSetting 会话设置（置顶/免打扰）
type ConversationSetting struct {
	ID             uint           `gorm:"primaryKey" json:"id"`
	UserID         string         `gorm:"not null;uniqueIndex:idx_user_conv,priority:1" json:"user_id"`
	ConversationID uint           `gorm:"not null;uniqueIndex:idx_user_conv,priority:2;index:idx_conv_setting_conv" json:"conversation_id"`
	IsPinned       bool           `gorm:"default:false" json:"is_pinned"`
	IsMuted        bool           `gorm:"default:false" json:"is_muted"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `gorm:"index:idx_conv_setting_deleted_at" json:"-"`

	Conversation *Conversation `gorm:"foreignKey:ConversationID" json:"conversation,omitempty"`
}
