package handler

import (
	"encoding/json"
	"im-backend/internal/controller"
	"im-backend/internal/model"
	"im-backend/internal/pkg"
	"log"
	"net/http"
	"strconv"

	"errors"
	"im-backend/internal/repository"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
)

type MessageHandler struct {
	controller *controller.MessageController
	upgrader   websocket.Upgrader
	userRepo   *repository.UserRepository
}

func NewMessageHandler(controller *controller.MessageController, userRepo *repository.UserRepository) *MessageHandler {
	return &MessageHandler{
		controller: controller,
		upgrader: websocket.Upgrader{
			ReadBufferSize:  1024,
			WriteBufferSize: 1024,
			CheckOrigin:     func(r *http.Request) bool { return true },
		},
		userRepo: userRepo,
	}
}

// WebSocketHandler WebSocket连接处理
func (h *MessageHandler) WebSocketHandler(w http.ResponseWriter, r *http.Request) {
	log.Printf("🔌 WebSocket连接请求: %s", r.RemoteAddr)

	// 从上下文获取用户ID（已通过AuthMiddleware认证）
	// 对于WebSocket，token也可能在URL参数中
	userID := pkg.GetUserIDFromContext(r.Context())

	// 如果从上下文获取不到，尝试从URL参数获取token
	if userID == "" {
		tokenString := r.URL.Query().Get("token")

		if tokenString == "" {
			log.Printf("❌ 未提供token")
			pkg.Error(w, 4001, "未认证：缺少token")
			return
		}

		// 显示token首几位用于调试
		tokenPreview := tokenString
		if len(tokenString) > 20 {
			tokenPreview = tokenString[:20] + "..."
		}
		log.Printf("🔑 从URL参数获取token: %s", tokenPreview)

		// 验证token
		claims, err := pkg.VerifyToken(tokenString, pkg.RDB)
		if err != nil {
			log.Printf("❌ Token验证失败: %v", err)
			pkg.Error(w, 4001, "Token无效或过期")
			return
		}
		userID = claims.Email
		log.Printf("✅ Token验证成功, 用户: %s", userID)
	}

	if userID == "" {
		log.Printf("❌ 未认证")
		pkg.Error(w, 4001, "未认证")
		return
	}

	// 升级HTTP连接为WebSocket连接
	conn, err := h.upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket升级失败: %v", err)
		return
	}

	// 创建客户端
	client := &pkg.Client{
		UserID: userID,
		Conn:   conn,
		Send:   make(chan []byte, 256),
		Hub:    pkg.GlobalHub,
	}

	// 注册客户端
	client.Hub.Register <- client

	// 启动读写协程
	go client.WritePump()
	go client.ReadPump()
}

// getCurrentUserID 将上下文中的email映射为user_id
func (h *MessageHandler) getCurrentUserID(r *http.Request) (string, error) {
	email := pkg.GetUserIDFromContext(r.Context())
	if email == "" {
		return "", errors.New("未认证")
	}
	user, err := h.userRepo.FindByEmail(email)
	if err != nil || user == nil {
		return "", errors.New("用户不存在")
	}
	return user.UserID, nil
}

// SendMessage 发送消息（HTTP接口）
func (h *MessageHandler) SendMessage(w http.ResponseWriter, r *http.Request) {
	var req struct {
		ToUserID    string `json:"to_user_id"`
		MessageType int    `json:"message_type"`
		Content     string `json:"content"`
		MediaURL    string `json:"media_url"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		pkg.Error(w, 400, "请求参数错误")
		return
	}

	// 使用 user_id 作为业务标识
	fromUserID, err := h.getCurrentUserID(r)
	if err != nil {
		pkg.Error(w, 4001, err.Error())
		return
	}

	if req.MessageType < 1 || req.MessageType > 5 {
		pkg.Error(w, 400, "无效的消息类型")
		return
	}

	if req.MessageType == model.MessageTypeText && req.Content == "" {
		pkg.Error(w, 400, "文本消息内容不能为空")
		return
	}

	message, err := h.controller.SendMessage(fromUserID, req.ToUserID, req.MessageType, req.Content, req.MediaURL)
	if err != nil {
		pkg.Error(w, 500, err.Error())
		return
	}

	// 通过Email进行WebSocket推送
	toUser, _ := h.userRepo.FindByUserID(req.ToUserID)
	if toUser != nil && pkg.GlobalHub.IsUserOnline(toUser.Email) {
		_ = pkg.GlobalHub.SendToUser(toUser.Email, message)
	}

	pkg.Success(w, message)
}

// GetConversationList 获取会话列表
func (h *MessageHandler) GetConversationList(w http.ResponseWriter, r *http.Request) {
	userID, err := h.getCurrentUserID(r)
	if err != nil {
		pkg.Error(w, 4001, err.Error())
		return
	}
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	if page <= 0 {
		page = 1
	}
	pageSize, _ := strconv.Atoi(r.URL.Query().Get("page_size"))
	if pageSize <= 0 {
		pageSize = 20
	}

	conversations, err := h.controller.GetConversationList(userID, page, pageSize)
	if err != nil {
		pkg.Error(w, 500, err.Error())
		return
	}
	pkg.Success(w, conversations)
}

// GetConversationMessages 获取会话消息历史
func (h *MessageHandler) GetConversationMessages(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	conversationIDStr := vars["conversation_id"]
	conversationID, err := strconv.ParseUint(conversationIDStr, 10, 32)
	if err != nil {
		pkg.Error(w, 400, "会话ID格式错误")
		return
	}
	userID, err := h.getCurrentUserID(r)
	if err != nil {
		pkg.Error(w, 4001, err.Error())
		return
	}

	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	if page <= 0 {
		page = 1
	}
	pageSize, _ := strconv.Atoi(r.URL.Query().Get("page_size"))
	if pageSize <= 0 {
		pageSize = 50
	}

	messages, err := h.controller.GetConversationMessages(uint(conversationID), userID, page, pageSize)
	if err != nil {
		pkg.Error(w, 500, err.Error())
		return
	}
	pkg.Success(w, messages)
}

// MarkConversationAsRead 标记会话为已读
func (h *MessageHandler) MarkConversationAsRead(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	conversationIDStr := vars["conversation_id"]
	conversationID, err := strconv.ParseUint(conversationIDStr, 10, 32)
	if err != nil {
		pkg.Error(w, 400, "会话ID格式错误")
		return
	}
	userID, err := h.getCurrentUserID(r)
	if err != nil {
		pkg.Error(w, 4001, err.Error())
		return
	}

	if err := h.controller.MarkConversationAsRead(uint(conversationID), userID); err != nil {
		pkg.Error(w, 500, err.Error())
		return
	}
	pkg.Success(w, "已标记为已读")
}

// RecallMessage 撤回消息
func (h *MessageHandler) RecallMessage(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	messageIDStr := vars["message_id"]
	messageID, err := strconv.ParseUint(messageIDStr, 10, 32)
	if err != nil {
		pkg.Error(w, 400, "消息ID格式错误")
		return
	}
	userID, err := h.getCurrentUserID(r)
	if err != nil {
		pkg.Error(w, 4001, err.Error())
		return
	}

	if err := h.controller.RecallMessage(uint(messageID), userID); err != nil {
		pkg.Error(w, 500, err.Error())
		return
	}
	pkg.Success(w, "消息已撤回")
}

// DeleteMessage 删除消息
func (h *MessageHandler) DeleteMessage(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	messageIDStr := vars["message_id"]
	messageID, err := strconv.ParseUint(messageIDStr, 10, 32)
	if err != nil {
		pkg.Error(w, 400, "消息ID格式错误")
		return
	}
	userID, err := h.getCurrentUserID(r)
	if err != nil {
		pkg.Error(w, 4001, err.Error())
		return
	}

	if err := h.controller.DeleteMessage(uint(messageID), userID); err != nil {
		pkg.Error(w, 500, err.Error())
		return
	}
	pkg.Success(w, "消息已删除")
}

// GetUnreadMessageCount 获取未读消息总数
func (h *MessageHandler) GetUnreadMessageCount(w http.ResponseWriter, r *http.Request) {
	userID, err := h.getCurrentUserID(r)
	if err != nil {
		pkg.Error(w, 4001, err.Error())
		return
	}
	count, err := h.controller.GetUnreadMessageCount(userID)
	if err != nil {
		pkg.Error(w, 500, err.Error())
		return
	}
	pkg.Success(w, map[string]interface{}{"count": count})
}

// GetOrCreateConversation 获取或创建会话
func (h *MessageHandler) GetOrCreateConversation(w http.ResponseWriter, r *http.Request) {
	var req struct {
		FriendUserID string `json:"friend_user_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		pkg.Error(w, 400, "请求参数错误")
		return
	}

	userID, err := h.getCurrentUserID(r)
	if err != nil {
		pkg.Error(w, 4001, err.Error())
		return
	}

	conversation, err := h.controller.GetOrCreateConversation(userID, req.FriendUserID)
	if err != nil {
		pkg.Error(w, 500, err.Error())
		return
	}
	pkg.Success(w, conversation)
}
