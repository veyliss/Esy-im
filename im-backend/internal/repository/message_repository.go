package repository

import (
	"im-backend/internal/model"
	"time"

	"gorm.io/gorm"
)

type MessageRepository struct {
	db *gorm.DB
}

func NewMessageRepository(db *gorm.DB) *MessageRepository {
	return &MessageRepository{db: db}
}

// ==================== Conversation 相关方法 ====================

// FindOrCreateConversation 查找或创建会话（确保user1_id < user2_id）
func (r *MessageRepository) FindOrCreateConversation(user1ID, user2ID string) (*model.Conversation, error) {
	// 确保user1ID字母序小于user2ID
	if user1ID > user2ID {
		user1ID, user2ID = user2ID, user1ID
	}

	var conversation model.Conversation
	err := r.db.Where("user1_id = ? AND user2_id = ?", user1ID, user2ID).
		First(&conversation).Error

	if err == gorm.ErrRecordNotFound {
		// 创建新会话
		conversation = model.Conversation{
			User1ID:   user1ID,
			User2ID:   user2ID,
			CreatedAt: time.Now(),
		}
		if err := r.db.Create(&conversation).Error; err != nil {
			return nil, err
		}
		return &conversation, nil
	}

	if err != nil {
		return nil, err
	}

	return &conversation, nil
}

// GetConversationByID 根据ID获取会话
func (r *MessageRepository) GetConversationByID(id uint) (*model.Conversation, error) {
	var conversation model.Conversation
	if err := r.db.Preload("User1").Preload("User2").Preload("LastMessage.FromUser").
		First(&conversation, id).Error; err != nil {
		return nil, err
	}
	return &conversation, nil
}

// GetUserConversations 获取用户的所有会话列表
func (r *MessageRepository) GetUserConversations(userID string, page, pageSize int) ([]model.Conversation, error) {
	var conversations []model.Conversation
	offset := (page - 1) * pageSize

	err := r.db.Where("user1_id = ? OR user2_id = ?", userID, userID).
		Preload("User1").
		Preload("User2").
		Preload("LastMessage.FromUser").
		Order("last_message_time DESC NULLS LAST").
		Offset(offset).
		Limit(pageSize).
		Find(&conversations).Error

	return conversations, err
}

// UpdateConversationLastMessage 更新会话的最后一条消息
func (r *MessageRepository) UpdateConversationLastMessage(conversationID uint, messageID uint, messageTime time.Time) error {
	return r.db.Model(&model.Conversation{}).
		Where("id = ?", conversationID).
		Updates(map[string]interface{}{
			"last_message_id":   messageID,
			"last_message_time": messageTime,
		}).Error
}

// IncrementUnreadCount 增加未读消息数
func (r *MessageRepository) IncrementUnreadCount(conversationID uint, userID string) error {
	var conversation model.Conversation
	if err := r.db.First(&conversation, conversationID).Error; err != nil {
		return err
	}

	// 判断是给哪个用户增加未读数
	if conversation.User1ID == userID {
		return r.db.Model(&model.Conversation{}).
			Where("id = ?", conversationID).
			UpdateColumn("user1_unread", gorm.Expr("user1_unread + ?", 1)).Error
	} else {
		return r.db.Model(&model.Conversation{}).
			Where("id = ?", conversationID).
			UpdateColumn("user2_unread", gorm.Expr("user2_unread + ?", 1)).Error
	}
}

// ClearUnreadCount 清空未读消息数
func (r *MessageRepository) ClearUnreadCount(conversationID uint, userID string) error {
	var conversation model.Conversation
	if err := r.db.First(&conversation, conversationID).Error; err != nil {
		return err
	}

	// 判断是给哪个用户清空未读数
	if conversation.User1ID == userID {
		return r.db.Model(&model.Conversation{}).
			Where("id = ?", conversationID).
			Update("user1_unread", 0).Error
	} else {
		return r.db.Model(&model.Conversation{}).
			Where("id = ?", conversationID).
			Update("user2_unread", 0).Error
	}
}

// ==================== Message 相关方法 ====================

// CreateMessage 创建消息
func (r *MessageRepository) CreateMessage(message *model.Message) error {
	return r.db.Create(message).Error
}

// GetMessageByID 根据ID获取消息
func (r *MessageRepository) GetMessageByID(id uint) (*model.Message, error) {
	var message model.Message
	if err := r.db.Preload("FromUser").Preload("ToUser").First(&message, id).Error; err != nil {
		return nil, err
	}
	return &message, nil
}

// GetConversationMessages 获取会话的消息列表（分页）
func (r *MessageRepository) GetConversationMessages(conversationID uint, page, pageSize int) ([]model.Message, error) {
	var messages []model.Message
	offset := (page - 1) * pageSize

	err := r.db.Where("conversation_id = ?", conversationID).
		Preload("FromUser").
		Preload("ToUser").
		Order("created_at ASC").
		Offset(offset).
		Limit(pageSize).
		Find(&messages).Error

	return messages, err
}

// GetLatestMessages 获取会话的最新N条消息
func (r *MessageRepository) GetLatestMessages(conversationID uint, limit int) ([]model.Message, error) {
	var messages []model.Message

	err := r.db.Where("conversation_id = ?", conversationID).
		Preload("FromUser").
		Preload("ToUser").
		Order("created_at DESC").
		Limit(limit).
		Find(&messages).Error

	// 反转顺序，让最新的消息在最后
	for i, j := 0, len(messages)-1; i < j; i, j = i+1, j-1 {
		messages[i], messages[j] = messages[j], messages[i]
	}

	return messages, err
}

// MarkMessageAsRead 标记消息为已读
func (r *MessageRepository) MarkMessageAsRead(messageID uint) error {
	now := time.Now()
	return r.db.Model(&model.Message{}).
		Where("id = ?", messageID).
		Updates(map[string]interface{}{
			"is_read": true,
			"read_at": now,
		}).Error
}

// MarkConversationMessagesAsRead 将会话中所有未读消息标记为已读
func (r *MessageRepository) MarkConversationMessagesAsRead(conversationID uint, userID string) error {
	now := time.Now()
	return r.db.Model(&model.Message{}).
		Where("conversation_id = ? AND to_user_id = ? AND is_read = ?", conversationID, userID, false).
		Updates(map[string]interface{}{
			"is_read": true,
			"read_at": now,
		}).Error
}

// RecallMessage 撤回消息
func (r *MessageRepository) RecallMessage(messageID uint) error {
	now := time.Now()
	return r.db.Model(&model.Message{}).
		Where("id = ?", messageID).
		Updates(map[string]interface{}{
			"is_recalled": true,
			"recalled_at": now,
		}).Error
}

// DeleteMessage 删除消息（软删除）
func (r *MessageRepository) DeleteMessage(messageID uint) error {
	return r.db.Delete(&model.Message{}, messageID).Error
}

// GetUnreadMessageCount 获取用户的未读消息总数
func (r *MessageRepository) GetUnreadMessageCount(userID string) (int64, error) {
	var count int64
	err := r.db.Model(&model.Message{}).
		Where("to_user_id = ? AND is_read = ?", userID, false).
		Count(&count).Error
	return count, err
}

// GetConversationUnreadCount 获取会话中用户的未读消息数
func (r *MessageRepository) GetConversationUnreadCount(conversationID uint, userID string) (int64, error) {
	var count int64
	err := r.db.Model(&model.Message{}).
		Where("conversation_id = ? AND to_user_id = ? AND is_read = ?", conversationID, userID, false).
		Count(&count).Error
	return count, err
}
