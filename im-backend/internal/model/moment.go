package model

import (
	"time"

	"gorm.io/gorm"
)

// Moment 朋友圈动态表
type Moment struct {
	ID           uint           `gorm:"primaryKey" json:"id"`
	UserID       string         `gorm:"not null;index:idx_user" json:"user_id"`     // 发布者用户ID
	Content      string         `gorm:"type:text" json:"content"`                   // 动态内容
	Images       string         `gorm:"type:text" json:"images"`                    // 图片列表（JSON数组字符串）
	Location     string         `gorm:"size:100" json:"location"`                   // 位置信息
	Visible      int            `gorm:"default:0;index:idx_visible" json:"visible"` // 可见范围：0-所有人，1-仅好友，2-私密
	LikeCount    int            `gorm:"default:0" json:"like_count"`                // 点赞数
	CommentCount int            `gorm:"default:0" json:"comment_count"`             // 评论数
	CreatedAt    time.Time      `gorm:"index:idx_created_at" json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index:idx_deleted_at" json:"-"`

	// 关联查询
	User     *User           `gorm:"foreignKey:UserID;references:UserID" json:"user,omitempty"`
	Likes    []MomentLike    `gorm:"foreignKey:MomentID" json:"likes,omitempty"`
	Comments []MomentComment `gorm:"foreignKey:MomentID" json:"comments,omitempty"`
}

// MomentLike 朋友圈点赞表
type MomentLike struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	MomentID  uint           `gorm:"not null;uniqueIndex:idx_moment_user,priority:1;index:idx_moment" json:"moment_id"` // 动态ID
	UserID    string         `gorm:"not null;uniqueIndex:idx_moment_user,priority:2;index:idx_user" json:"user_id"`     // 点赞用户ID
	CreatedAt time.Time      `gorm:"index:idx_created_at" json:"created_at"`
	DeletedAt gorm.DeletedAt `gorm:"index:idx_deleted_at" json:"-"`

	// 关联查询
	User   *User   `gorm:"foreignKey:UserID;references:UserID" json:"user,omitempty"`
	Moment *Moment `gorm:"foreignKey:MomentID" json:"moment,omitempty"`
}

// MomentComment 朋友圈评论表
type MomentComment struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	MomentID  uint           `gorm:"not null;index:idx_moment" json:"moment_id"` // 动态ID
	UserID    string         `gorm:"not null;index:idx_user" json:"user_id"`     // 评论用户ID
	ReplyToID *uint          `gorm:"index:idx_reply_to" json:"reply_to_id"`      // 回复的评论aID（空表示直接评论动态）
	Content   string         `gorm:"type:text;not null" json:"content"`          // 评论内容
	CreatedAt time.Time      `gorm:"index:idx_created_at" json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index:idx_deleted_at" json:"-"`

	// 关联查询
	User    *User          `gorm:"foreignKey:UserID;references:UserID" json:"user,omitempty"`
	Moment  *Moment        `gorm:"foreignKey:MomentID" json:"moment,omitempty"`
	ReplyTo *MomentComment `gorm:"foreignKey:ReplyToID" json:"reply_to,omitempty"`
}
