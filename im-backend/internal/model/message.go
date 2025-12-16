package model

import (
	"time"

	"gorm.io/gorm"
)

// Conversation 会话表（记录两个用户之间的会话）
type Conversation struct {
	ID              uint           `gorm:"primaryKey" json:"id"`
	User1ID         string         `gorm:"not null;uniqueIndex:idx_users,priority:1" json:"user1_id"` // 用户1的ID（字母序较小）
	User2ID         string         `gorm:"not null;uniqueIndex:idx_users,priority:2" json:"user2_id"` // 用户2的ID（字母序较大）
	LastMessageID   *uint          `gorm:"index:idx_last_message" json:"last_message_id"`             // 最后一条消息ID
	LastMessageTime *time.Time     `gorm:"index:idx_last_message_time" json:"last_message_time"`      // 最后消息时间
	User1Unread     int            `gorm:"default:0" json:"user1_unread"`                             // 用户1未读数
	User2Unread     int            `gorm:"default:0" json:"user2_unread"`                             // 用户2未读数
	CreatedAt       time.Time      `gorm:"index:idx_created_at" json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
	DeletedAt       gorm.DeletedAt `gorm:"index:idx_deleted_at" json:"-"`

	// 关联查询
	User1       *User    `gorm:"foreignKey:User1ID;references:UserID" json:"user1,omitempty"`
	User2       *User    `gorm:"foreignKey:User2ID;references:UserID" json:"user2,omitempty"`
	LastMessage *Message `gorm:"foreignKey:LastMessageID" json:"last_message,omitempty"`
}

// Message 消息表
type Message struct {
	ID             uint           `gorm:"primaryKey" json:"id"`
	ConversationID uint           `gorm:"not null;index:idx_conversation" json:"conversation_id"` // 会话ID
	FromUserID     string         `gorm:"not null;index:idx_from_user" json:"from_user_id"`       // 发送者用户ID
	ToUserID       string         `gorm:"not null;index:idx_to_user" json:"to_user_id"`           // 接收者用户ID
	MessageType    int            `gorm:"default:1;index:idx_message_type" json:"message_type"`   // 消息类型：1-文本，2-图片，3-语音，4-视频，5-文件
	Content        string         `gorm:"type:text" json:"content"`                               // 消息内容
	MediaURL       string         `gorm:"size:500" json:"media_url"`                              // 媒体文件URL（图片、语音、视频、文件）
	IsRead         bool           `gorm:"default:false;index:idx_is_read" json:"is_read"`         // 是否已读
	ReadAt         *time.Time     `json:"read_at"`                                                // 读取时间
	IsRecalled     bool           `gorm:"default:false;index:idx_is_recalled" json:"is_recalled"` // 是否撤回
	RecalledAt     *time.Time     `json:"recalled_at"`                                            // 撤回时间
	CreatedAt      time.Time      `gorm:"index:idx_created_at" json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `gorm:"index:idx_deleted_at" json:"-"`

	// 关联查询
	FromUser     *User         `gorm:"foreignKey:FromUserID;references:UserID" json:"from_user,omitempty"`
	ToUser       *User         `gorm:"foreignKey:ToUserID;references:UserID" json:"to_user,omitempty"`
	Conversation *Conversation `gorm:"foreignKey:ConversationID" json:"conversation,omitempty"`
}

// MessageType 消息类型常量
const (
	MessageTypeText  = 1 // 文本消息
	MessageTypeImage = 2 // 图片消息
	MessageTypeAudio = 3 // 语音消息
	MessageTypeVideo = 4 // 视频消息
	MessageTypeFile  = 5 // 文件消息
)
