package controller

import (
	"im-backend/internal/service"
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

// MarkConversationAsRead 标记会话所有消息为已读
func (c *MessageController) MarkConversationAsRead(conversationID uint, userID string) error {
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
