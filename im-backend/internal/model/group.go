package model

import (
	"time"

	"gorm.io/gorm"
)

// Group 群组表
type Group struct {
	ID           uint           `gorm:"primaryKey" json:"id"`
	GroupID      string         `gorm:"uniqueIndex:idx_group_id;not null;size:50" json:"group_id"` // 群组ID
	Name         string         `gorm:"not null;size:100" json:"name"`                             // 群组名称
	Avatar       string         `gorm:"size:255" json:"avatar"`                                    // 群头像
	Description  string         `gorm:"size:500" json:"description"`                               // 群描述
	OwnerID      string         `gorm:"not null;index:idx_owner" json:"owner_id"`                  // 群主ID
	MaxMembers   int            `gorm:"default:500" json:"max_members"`                            // 最大成员数
	MemberCount  int            `gorm:"default:1" json:"member_count"`                             // 当前成员数
	IsPublic     bool           `gorm:"default:true" json:"is_public"`                             // 是否公开群组
	JoinApproval bool           `gorm:"default:false" json:"join_approval"`                        // 是否需要审批加入
	CreatedAt    time.Time      `gorm:"index:idx_created_at" json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index:idx_deleted_at" json:"-"`

	// 关联查询
	Owner   *User         `gorm:"foreignKey:OwnerID;references:UserID" json:"owner,omitempty"`
	Members []GroupMember `gorm:"foreignKey:GroupID;references:GroupID" json:"members,omitempty"`
}

// GroupMember 群成员表
type GroupMember struct {
	ID         uint           `gorm:"primaryKey" json:"id"`
	GroupID    string         `gorm:"not null;uniqueIndex:idx_group_user,priority:1" json:"group_id"` // 群组ID
	UserID     string         `gorm:"not null;uniqueIndex:idx_group_user,priority:2" json:"user_id"`  // 用户ID
	Role       int            `gorm:"default:1;index:idx_role" json:"role"`                           // 角色：1-普通成员，2-管理员，3-群主
	Nickname   string         `gorm:"size:50" json:"nickname"`                                        // 群内昵称
	JoinedAt   time.Time      `gorm:"index:idx_joined_at" json:"joined_at"`                           // 加入时间
	IsMuted    bool           `gorm:"default:false" json:"is_muted"`                                  // 是否被禁言
	MutedUntil *time.Time     `json:"muted_until"`                                                    // 禁言到期时间
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `gorm:"index:idx_deleted_at" json:"-"`

	// 关联查询
	Group *Group `gorm:"foreignKey:GroupID;references:GroupID" json:"group,omitempty"`
	User  *User  `gorm:"foreignKey:UserID;references:UserID" json:"user,omitempty"`
}

// GroupMessage 群消息表
type GroupMessage struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	GroupID     string         `gorm:"not null;index:idx_group" json:"group_id"`               // 群组ID
	FromUserID  string         `gorm:"not null;index:idx_from_user" json:"from_user_id"`       // 发送者用户ID
	MessageType int            `gorm:"default:1;index:idx_message_type" json:"message_type"`   // 消息类型：1-文本，2-图片，3-语音，4-视频，5-文件，6-系统消息
	Content     string         `gorm:"type:text" json:"content"`                               // 消息内容
	MediaURL    string         `gorm:"size:500" json:"media_url"`                              // 媒体文件URL
	AtUsers     string         `gorm:"type:text" json:"at_users"`                              // @的用户ID列表（JSON格式）
	IsRecalled  bool           `gorm:"default:false;index:idx_is_recalled" json:"is_recalled"` // 是否撤回
	RecalledAt  *time.Time     `json:"recalled_at"`                                            // 撤回时间
	CreatedAt   time.Time      `gorm:"index:idx_created_at" json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index:idx_deleted_at" json:"-"`

	// 关联查询
	Group    *Group `gorm:"foreignKey:GroupID;references:GroupID" json:"group,omitempty"`
	FromUser *User  `gorm:"foreignKey:FromUserID;references:UserID" json:"from_user,omitempty"`
}

// GroupMessageRead 群消息已读记录表
type GroupMessageRead struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	MessageID uint      `gorm:"not null;uniqueIndex:idx_message_user,priority:1" json:"message_id"` // 消息ID
	UserID    string    `gorm:"not null;uniqueIndex:idx_message_user,priority:2" json:"user_id"`    // 用户ID
	ReadAt    time.Time `gorm:"index:idx_read_at" json:"read_at"`                                   // 已读时间
	CreatedAt time.Time `json:"created_at"`

	// 关联查询
	Message *GroupMessage `gorm:"foreignKey:MessageID" json:"message,omitempty"`
	User    *User         `gorm:"foreignKey:UserID;references:UserID" json:"user,omitempty"`
}

// 角色常量
const (
	GroupRoleMember = 1 // 普通成员
	GroupRoleAdmin  = 2 // 管理员
	GroupRoleOwner  = 3 // 群主
)

// 消息类型常量（扩展原有的消息类型）
const (
	GroupMessageTypeText   = 1 // 文本消息
	GroupMessageTypeImage  = 2 // 图片消息
	GroupMessageTypeAudio  = 3 // 语音消息
	GroupMessageTypeVideo  = 4 // 视频消息
	GroupMessageTypeFile   = 5 // 文件消息
	GroupMessageTypeSystem = 6 // 系统消息（加入、退出、踢出等）
)
