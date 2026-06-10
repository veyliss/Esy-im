package service

import (
	"encoding/json"
	"errors"
	"fmt"
	"im-backend/internal/model"
	"im-backend/internal/repository"
	"strings"
	"time"
)

type MessageService struct {
	messageRepo *repository.MessageRepository
	friendRepo  *repository.FriendRepository
	groupRepo   *repository.GroupRepository
	blockRepo   *repository.BlockRepository
}

type MessagePage struct {
	List     []model.Message `json:"list"`
	Page     int             `json:"page"`
	PageSize int             `json:"page_size"`
	HasMore  bool            `json:"has_more"`
}

type CursorPage struct {
	List       []model.Message `json:"list"`
	HasMore    bool            `json:"has_more"`
	NextCursor string          `json:"next_cursor"`
}

type MessageSearchResult struct {
	List     []model.Message `json:"list"`
	Total    int64           `json:"total"`
	Page     int             `json:"page"`
	PageSize int             `json:"page_size"`
	HasMore  bool            `json:"has_more"`
}

type UnreadCountResult struct {
	Total   int64 `json:"total"`
	Offline int64 `json:"offline"`
}

type ForwardTarget struct {
	ConversationID *uint   `json:"conversation_id"`
	GroupID        *string `json:"group_id"`
}

func NewMessageService(messageRepo *repository.MessageRepository, friendRepo *repository.FriendRepository, groupRepo *repository.GroupRepository, blockRepo *repository.BlockRepository) *MessageService {
	return &MessageService{
		messageRepo: messageRepo,
		friendRepo:  friendRepo,
		groupRepo:   groupRepo,
		blockRepo:   blockRepo,
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

	// 黑名单检查
	if s.blockRepo != nil {
		blocked, _ := s.blockRepo.IsBlockedByEither(fromUserID, toUserID)
		if blocked {
			return nil, errors.New("对方已被屏蔽或您已被对方屏蔽，无法发送消息")
		}
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

// MarkConversationAsRead 标记会话中所有消息为已读，返回对方UserID用于WS推送
func (s *MessageService) MarkConversationAsRead(conversationID uint, userID string) (string, error) {
	// 验证用户是否属于该会话
	conversation, err := s.messageRepo.GetConversationByID(conversationID)
	if err != nil {
		return "", errors.New("会话不存在")
	}

	if conversation.User1ID != userID && conversation.User2ID != userID {
		return "", errors.New("无权访问该会话")
	}

	// 标记所有未读消息为已读
	if err := s.messageRepo.MarkConversationMessagesAsRead(conversationID, userID); err != nil {
		return "", err
	}

	// 清空会话的未读计数
	if err := s.messageRepo.ClearUnreadCount(conversationID, userID); err != nil {
		return "", err
	}

	// 返回对方UserID
	otherUserID := conversation.User1ID
	if conversation.User1ID == userID {
		otherUserID = conversation.User2ID
	}
	return otherUserID, nil
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

// ==================== 新功能方法 ====================

// GetConversationPartner 获取会话对方用户ID
func (s *MessageService) GetConversationPartner(conversationID uint, userID string) (string, error) {
	conversation, err := s.messageRepo.GetConversationByID(conversationID)
	if err != nil {
		return "", errors.New("会话不存在")
	}
	if conversation.User1ID != userID && conversation.User2ID != userID {
		return "", errors.New("无权访问该会话")
	}
	if conversation.User1ID == userID {
		return conversation.User2ID, nil
	}
	return conversation.User1ID, nil
}

// GetConversationMessagesByCursor 游标分页获取消息
func (s *MessageService) GetConversationMessagesByCursor(conversationID uint, userID string, cursor uint, limit int) (*CursorPage, error) {
	conversation, err := s.messageRepo.GetConversationByID(conversationID)
	if err != nil {
		return nil, errors.New("会话不存在")
	}
	if conversation.User1ID != userID && conversation.User2ID != userID {
		return nil, errors.New("无权访问该会话")
	}
	if limit <= 0 {
		limit = 50
	}
	if limit > 100 {
		limit = 100
	}

	messages, hasMore, err := s.messageRepo.GetConversationMessagesByCursor(conversationID, cursor, limit)
	if err != nil {
		return nil, err
	}

	nextCursor := ""
	if hasMore && len(messages) > 0 {
		nextCursor = fmt.Sprintf("%d", messages[0].ID)
	}

	return &CursorPage{
		List:       messages,
		HasMore:    hasMore,
		NextCursor: nextCursor,
	}, nil
}

// SearchMessages 搜索消息
func (s *MessageService) SearchMessages(userID, keyword string, conversationID *uint, page, pageSize int) (*MessageSearchResult, error) {
	if strings.TrimSpace(keyword) == "" {
		return nil, errors.New("搜索关键词不能为空")
	}

	messages, total, err := s.messageRepo.SearchMessages(userID, keyword, conversationID, page, pageSize)
	if err != nil {
		return nil, err
	}

	hasMore := int64(page*pageSize) < total
	return &MessageSearchResult{
		List:     messages,
		Total:    total,
		Page:     page,
		PageSize: pageSize,
		HasMore:  hasMore,
	}, nil
}

// GetUnreadCountWithOffline 获取未读消息数（含离线消息数）
func (s *MessageService) GetUnreadCountWithOffline(userID string, lastLoginAt *time.Time) (*UnreadCountResult, error) {
	total, err := s.messageRepo.GetUnreadMessageCount(userID)
	if err != nil {
		return nil, err
	}

	var offline int64
	if lastLoginAt != nil {
		offline, err = s.messageRepo.GetOfflineMessageCount(userID, *lastLoginAt)
		if err != nil {
			offline = 0
		}
	}

	return &UnreadCountResult{
		Total:   total,
		Offline: offline,
	}, nil
}

// ForwardMessage 转发消息
func (s *MessageService) ForwardMessage(messageID uint, fromUserID string, targets []ForwardTarget) ([]interface{}, error) {
	// 获取原始消息
	originalMsg, err := s.messageRepo.GetMessageByID(messageID)
	if err != nil {
		return nil, errors.New("消息不存在")
	}

	// 验证用户有权查看该消息
	if originalMsg.FromUserID != fromUserID && originalMsg.ToUserID != fromUserID {
		return nil, errors.New("无权转发该消息")
	}

	// 构造转发内容
	forwardContent := map[string]interface{}{
		"forwarded":        true,
		"original_from":    originalMsg.FromUserID,
		"original_content": originalMsg.Content,
		"original_type":    originalMsg.MessageType,
		"original_time":    originalMsg.CreatedAt,
	}
	contentJSON, _ := json.Marshal(forwardContent)

	var results []interface{}
	for _, target := range targets {
		if target.ConversationID != nil {
			// 单聊转发
			conv, err := s.messageRepo.GetConversationByID(*target.ConversationID)
			if err != nil {
				continue
			}
			toUserID := conv.User1ID
			if conv.User1ID == fromUserID {
				toUserID = conv.User2ID
			}
			msg, err := s.messageRepo.CreatePrivateMessageInTx(fromUserID, toUserID, model.MessageTypeForward, string(contentJSON), "")
			if err == nil {
				results = append(results, msg)
			}
		} else if target.GroupID != nil {
			// 群聊转发
			if s.groupRepo != nil {
				groupMsg := &model.GroupMessage{
					GroupID:     *target.GroupID,
					FromUserID:  fromUserID,
					MessageType: model.GroupMessageTypeForward,
					Content:     string(contentJSON),
					CreatedAt:   time.Now(),
				}
				if err := s.groupRepo.CreateGroupMessage(groupMsg); err == nil {
					loaded, _ := s.groupRepo.GetGroupMessageByID(groupMsg.ID)
					if loaded != nil {
						results = append(results, loaded)
					}
				}
			}
		}
	}

	return results, nil
}

// PinConversation 置顶/取消置顶会话
func (s *MessageService) PinConversation(userID string, conversationID uint, isPinned bool) error {
	// 验证会话存在且用户有权访问
	conversation, err := s.messageRepo.GetConversationByID(conversationID)
	if err != nil {
		return errors.New("会话不存在")
	}
	if conversation.User1ID != userID && conversation.User2ID != userID {
		return errors.New("无权访问该会话")
	}

	return s.messageRepo.SetConversationSetting(userID, conversationID, "is_pinned", isPinned)
}

// MuteConversation 免打扰/取消免打扰会话
func (s *MessageService) MuteConversation(userID string, conversationID uint, isMuted bool) error {
	conversation, err := s.messageRepo.GetConversationByID(conversationID)
	if err != nil {
		return errors.New("会话不存在")
	}
	if conversation.User1ID != userID && conversation.User2ID != userID {
		return errors.New("无权访问该会话")
	}

	return s.messageRepo.SetConversationSetting(userID, conversationID, "is_muted", isMuted)
}
