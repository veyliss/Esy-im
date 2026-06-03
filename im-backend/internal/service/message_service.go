package service

import (
	"errors"
	"im-backend/internal/model"
	"im-backend/internal/repository"
	"strings"
	"time"
)

type MessageService struct {
	messageRepo *repository.MessageRepository
	friendRepo  *repository.FriendRepository
}

type MessagePage struct {
	List     []model.Message `json:"list"`
	Page     int             `json:"page"`
	PageSize int             `json:"page_size"`
	HasMore  bool            `json:"has_more"`
}

func NewMessageService(messageRepo *repository.MessageRepository, friendRepo *repository.FriendRepository) *MessageService {
	return &MessageService{
		messageRepo: messageRepo,
		friendRepo:  friendRepo,
	}
}

// SendMessage 发送消息
func (s *MessageService) SendMessage(fromUserID, toUserID string, messageType int, content, mediaURL string) (*model.Message, error) {
	content = strings.TrimSpace(content)
	mediaURL = strings.TrimSpace(mediaURL)

	if toUserID == "" {
		return nil, errors.New("接收方不能为空")
	}
	if messageType == model.MessageTypeText && content == "" {
		return nil, errors.New("文本消息内容不能为空")
	}
	if messageType != model.MessageTypeText && content == "" && mediaURL == "" {
		return nil, errors.New("消息内容或媒体地址不能为空")
	}

	// 检查是否为好友关系
	isFriend, err := s.friendRepo.IsFriend(fromUserID, toUserID)
	if err != nil {
		return nil, err
	}
	if !isFriend {
		return nil, errors.New("只能给好友发送消息")
	}

	return s.messageRepo.CreatePrivateMessageInTx(fromUserID, toUserID, messageType, content, mediaURL)
}

// GetConversationList 获取会话列表
func (s *MessageService) GetConversationList(userID string, page, pageSize int) ([]model.Conversation, error) {
	return s.messageRepo.GetUserConversations(userID, page, pageSize)
}

// GetConversationMessages 获取会话消息历史
func (s *MessageService) GetConversationMessages(conversationID uint, userID string, page, pageSize int) (*MessagePage, error) {
	// 验证用户是否属于该会话
	conversation, err := s.messageRepo.GetConversationByID(conversationID)
	if err != nil {
		return nil, errors.New("会话不存在")
	}

	if conversation.User1ID != userID && conversation.User2ID != userID {
		return nil, errors.New("无权访问该会话")
	}

	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 50
	}
	if pageSize > 100 {
		pageSize = 100
	}

	messages, hasMore, err := s.messageRepo.GetConversationMessages(conversationID, page, pageSize)
	if err != nil {
		return nil, err
	}

	return &MessagePage{
		List:     messages,
		Page:     page,
		PageSize: pageSize,
		HasMore:  hasMore,
	}, nil
}

// GetLatestMessages 获取会话的最新消息
func (s *MessageService) GetLatestMessages(conversationID uint, userID string, limit int) ([]model.Message, error) {
	// 验证用户是否属于该会话
	conversation, err := s.messageRepo.GetConversationByID(conversationID)
	if err != nil {
		return nil, errors.New("会话不存在")
	}

	if conversation.User1ID != userID && conversation.User2ID != userID {
		return nil, errors.New("无权访问该会话")
	}

	return s.messageRepo.GetLatestMessages(conversationID, limit)
}

// MarkMessageAsRead 标记消息为已读
func (s *MessageService) MarkMessageAsRead(messageID uint, userID string) error {
	// 获取消息
	message, err := s.messageRepo.GetMessageByID(messageID)
	if err != nil {
		return errors.New("消息不存在")
	}

	// 验证是否为接收方
	if message.ToUserID != userID {
		return errors.New("无权操作该消息")
	}

	// 如果已经是已读状态，直接返回
	if message.IsRead {
		return nil
	}

	return s.messageRepo.MarkMessageAsRead(messageID)
}

// MarkConversationAsRead 标记会话中所有消息为已读
func (s *MessageService) MarkConversationAsRead(conversationID uint, userID string) error {
	// 验证用户是否属于该会话
	conversation, err := s.messageRepo.GetConversationByID(conversationID)
	if err != nil {
		return errors.New("会话不存在")
	}

	if conversation.User1ID != userID && conversation.User2ID != userID {
		return errors.New("无权访问该会话")
	}

	// 标记所有未读消息为已读
	if err := s.messageRepo.MarkConversationMessagesAsRead(conversationID, userID); err != nil {
		return err
	}

	// 清空会话的未读计数
	return s.messageRepo.ClearUnreadCount(conversationID, userID)
}

// RecallMessage 撤回消息
func (s *MessageService) RecallMessage(messageID uint, userID string) error {
	// 获取消息
	message, err := s.messageRepo.GetMessageByID(messageID)
	if err != nil {
		return errors.New("消息不存在")
	}

	// 验证是否为发送方
	if message.FromUserID != userID {
		return errors.New("只能撤回自己发送的消息")
	}

	// 验证消息是否已经撤回
	if message.IsRecalled {
		return errors.New("消息已被撤回")
	}

	// 验证是否在2分钟内
	if time.Since(message.CreatedAt) > 2*time.Minute {
		return errors.New("只能撤回2分钟内的消息")
	}

	return s.messageRepo.RecallMessage(messageID)
}

// DeleteMessage 删除消息
func (s *MessageService) DeleteMessage(messageID uint, userID string) error {
	// 获取消息
	message, err := s.messageRepo.GetMessageByID(messageID)
	if err != nil {
		return errors.New("消息不存在")
	}

	// 验证是否为发送方或接收方
	if message.FromUserID != userID && message.ToUserID != userID {
		return errors.New("无权删除该消息")
	}

	return s.messageRepo.DeleteMessage(messageID)
}

// GetUnreadMessageCount 获取未读消息总数
func (s *MessageService) GetUnreadMessageCount(userID string) (int64, error) {
	return s.messageRepo.GetUnreadMessageCount(userID)
}

// GetConversationUnreadCount 获取会话未读消息数
func (s *MessageService) GetConversationUnreadCount(conversationID uint, userID string) (int64, error) {
	// 验证用户是否属于该会话
	conversation, err := s.messageRepo.GetConversationByID(conversationID)
	if err != nil {
		return 0, errors.New("会话不存在")
	}

	if conversation.User1ID != userID && conversation.User2ID != userID {
		return 0, errors.New("无权访问该会话")
	}

	return s.messageRepo.GetConversationUnreadCount(conversationID, userID)
}

// GetOrCreateConversation 获取或创建会话
func (s *MessageService) GetOrCreateConversation(user1ID, user2ID string) (*model.Conversation, error) {
	// 检查是否为好友关系
	isFriend, err := s.friendRepo.IsFriend(user1ID, user2ID)
	if err != nil {
		return nil, err
	}
	if !isFriend {
		return nil, errors.New("只能与好友创建会话")
	}

	return s.messageRepo.FindOrCreateConversation(user1ID, user2ID)
}
