package controller

import (
	"im-backend/internal/service"
	"time"
)

type MessageController struct {
	messageService *service.MessageService
}

func NewMessageController(messageService *service.MessageService) *MessageController {
	return &MessageController{messageService: messageService}
}

// SendMessage 发送消息
func (c *MessageController) SendMessage(fromUserID, toUserID string, messageType int, content, mediaURL string) (interface{}, error) {
	return c.messageService.SendMessage(fromUserID, toUserID, messageType, content, mediaURL)
}

// GetConversationList 获取会话列表
func (c *MessageController) GetConversationList(userID string, page, pageSize int) (interface{}, error) {
	return c.messageService.GetConversationList(userID, page, pageSize)
}

// GetConversationMessages 获取会话消息历史
func (c *MessageController) GetConversationMessages(conversationID uint, userID string, page, pageSize int) (interface{}, error) {
	return c.messageService.GetConversationMessages(conversationID, userID, page, pageSize)
}

// GetLatestMessages 获取会话最新消息
func (c *MessageController) GetLatestMessages(conversationID uint, userID string, limit int) (interface{}, error) {
	return c.messageService.GetLatestMessages(conversationID, userID, limit)
}

// MarkMessageAsRead 标记消息为已读
func (c *MessageController) MarkMessageAsRead(messageID uint, userID string) error {
	return c.messageService.MarkMessageAsRead(messageID, userID)
}

// MarkConversationAsRead 标记会话所有消息为已读，返回对方UserID
func (c *MessageController) MarkConversationAsRead(conversationID uint, userID string) (string, error) {
	return c.messageService.MarkConversationAsRead(conversationID, userID)
}

// RecallMessage 撤回消息
func (c *MessageController) RecallMessage(messageID uint, userID string) error {
	return c.messageService.RecallMessage(messageID, userID)
}

// DeleteMessage 删除消息
func (c *MessageController) DeleteMessage(messageID uint, userID string) error {
	return c.messageService.DeleteMessage(messageID, userID)
}

// GetUnreadMessageCount 获取未读消息总数
func (c *MessageController) GetUnreadMessageCount(userID string) (interface{}, error) {
	return c.messageService.GetUnreadMessageCount(userID)
}

// GetConversationUnreadCount 获取会话未读消息数
func (c *MessageController) GetConversationUnreadCount(conversationID uint, userID string) (interface{}, error) {
	return c.messageService.GetConversationUnreadCount(conversationID, userID)
}

// GetOrCreateConversation 获取或创建会话
func (c *MessageController) GetOrCreateConversation(user1ID, user2ID string) (interface{}, error) {
	return c.messageService.GetOrCreateConversation(user1ID, user2ID)
}

// ==================== 新功能方法 ====================

// GetConversationPartner 获取会话对方用户ID
func (c *MessageController) GetConversationPartner(conversationID uint, userID string) (string, error) {
	return c.messageService.GetConversationPartner(conversationID, userID)
}

// GetConversationMessagesByCursor 游标分页获取消息
func (c *MessageController) GetConversationMessagesByCursor(conversationID uint, userID string, cursor uint, limit int) (interface{}, error) {
	return c.messageService.GetConversationMessagesByCursor(conversationID, userID, cursor, limit)
}

// SearchMessages 搜索消息
func (c *MessageController) SearchMessages(userID, keyword string, conversationID *uint, page, pageSize int) (interface{}, error) {
	return c.messageService.SearchMessages(userID, keyword, conversationID, page, pageSize)
}

// GetUnreadCountWithOffline 获取未读消息数（含离线）
func (c *MessageController) GetUnreadCountWithOffline(userID string, lastLoginAt *time.Time) (interface{}, error) {
	return c.messageService.GetUnreadCountWithOffline(userID, lastLoginAt)
}

// ForwardMessage 转发消息
func (c *MessageController) ForwardMessage(messageID uint, fromUserID string, targets []service.ForwardTarget) (interface{}, error) {
	return c.messageService.ForwardMessage(messageID, fromUserID, targets)
}

// PinConversation 置顶会话
func (c *MessageController) PinConversation(userID string, conversationID uint, isPinned bool) error {
	return c.messageService.PinConversation(userID, conversationID, isPinned)
}

// MuteConversation 免打扰会话
func (c *MessageController) MuteConversation(userID string, conversationID uint, isMuted bool) error {
	return c.messageService.MuteConversation(userID, conversationID, isMuted)
}

// ConversationInfo 会话信息（用于typing handler）
type ConversationInfo struct {
	OtherUserID string
}

// GetConversationByID 获取会话信息（返回简化结构）
func (c *MessageController) GetConversationByID(conversationID uint, userID string) (*ConversationInfo, error) {
	otherUserID, err := c.messageService.GetConversationPartner(conversationID, userID)
	if err != nil {
		return nil, err
	}
	return &ConversationInfo{OtherUserID: otherUserID}, nil
}
