package pkg

import (
	"encoding/json"
	"log"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

// WSMessage WebSocket消息结构
type WSMessage struct {
	Type      string      `json:"type"`      // 消息类型：chat, read, recall, typing等
	Data      interface{} `json:"data"`      // 消息数据
	Timestamp int64       `json:"timestamp"` // 时间戳
}

// Client WebSocket客户端
type Client struct {
	UserID     string          // 用户ID
	Conn       *websocket.Conn // WebSocket连接
	Send       chan []byte     // 发送消息通道
	Hub        *Hub            // 所属Hub
	closed     bool            // channel是否已关闭
	closedLock sync.Mutex      // 保护closed标志的互斥锁
}

// Hub WebSocket连接管理中心
type Hub struct {
	// 已注册的客户端
	Clients map[string]*Client

	// 注册请求
	Register chan *Client

	// 注销请求
	Unregister chan *Client

	// 广播消息
	Broadcast chan *BroadcastMessage

	// 互斥锁
	mu sync.RWMutex
}

// BroadcastMessage 广播消息
type BroadcastMessage struct {
	UserID  string // 目标用户ID
	Message []byte // 消息内容
}

// 全局Hub实例
var GlobalHub *Hub

// InitHub 初始化Hub
func InitHub() {
	GlobalHub = &Hub{
		Clients:    make(map[string]*Client),
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
		Broadcast:  make(chan *BroadcastMessage),
	}
	go GlobalHub.Run()
}

// closeClientSend 安全地关闭客户端的Send channel
func (c *Client) closeClientSend() {
	c.closedLock.Lock()
	defer c.closedLock.Unlock()
	if !c.closed {
		close(c.Send)
		c.closed = true
	}
}

// Run 运行Hub
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			h.mu.Lock()
			// 如果用户已经有连接，先关闭旧连接
			if oldClient, exists := h.Clients[client.UserID]; exists {
				oldClient.closeClientSend()
				oldClient.Conn.Close()
			}
			h.Clients[client.UserID] = client
			h.mu.Unlock()
			log.Printf("✅ 用户 %s 已连接 WebSocket", client.UserID)

		case client := <-h.Unregister:
			h.mu.Lock()
			if _, exists := h.Clients[client.UserID]; exists {
				delete(h.Clients, client.UserID)
				client.closeClientSend()
				log.Printf("❌ 用户 %s 已断开 WebSocket", client.UserID)
			}
			h.mu.Unlock()

		case message := <-h.Broadcast:
			h.mu.RLock()
			client, exists := h.Clients[message.UserID]
			h.mu.RUnlock()

			if exists {
				select {
				case client.Send <- message.Message:
					// 消息已发送
				default:
					// 发送失败，关闭连接
					h.mu.Lock()
					client.closeClientSend()
					delete(h.Clients, client.UserID)
					h.mu.Unlock()
				}
			}
		}
	}
}

// SendToUser 发送消息给指定用户
func (h *Hub) SendToUser(userID string, message interface{}) error {
	wsMsg := WSMessage{
		Type:      "message",
		Data:      message,
		Timestamp: time.Now().Unix(),
	}

	data, err := json.Marshal(wsMsg)
	if err != nil {
		return err
	}

	h.Broadcast <- &BroadcastMessage{
		UserID:  userID,
		Message: data,
	}

	return nil
}

// SendFriendRequest 发送好友请求通知
func (h *Hub) SendFriendRequest(userID string, request interface{}) error {
	wsMsg := WSMessage{
		Type:      "friend_request",
		Data:      request,
		Timestamp: time.Now().Unix(),
	}

	data, err := json.Marshal(wsMsg)
	if err != nil {
		return err
	}

	h.Broadcast <- &BroadcastMessage{
		UserID:  userID,
		Message: data,
	}

	log.Printf("📨 发送好友请求通知给用户 %s", userID)
	return nil
}

// SendFriendAccepted 发送好友请求被接受通知
func (h *Hub) SendFriendAccepted(userID string, friend interface{}) error {
	wsMsg := WSMessage{
		Type:      "friend_accepted",
		Data:      friend,
		Timestamp: time.Now().Unix(),
	}

	data, err := json.Marshal(wsMsg)
	if err != nil {
		return err
	}

	h.Broadcast <- &BroadcastMessage{
		UserID:  userID,
		Message: data,
	}

	log.Printf("✅ 发送好友请求接受通知给用户 %s", userID)
	return nil
}

// IsUserOnline 检查用户是否在线
func (h *Hub) IsUserOnline(userID string) bool {
	h.mu.RLock()
	defer h.mu.RUnlock()
	_, exists := h.Clients[userID]
	return exists
}

// GetOnlineUsers 获取所有在线用户
func (h *Hub) GetOnlineUsers() []string {
	h.mu.RLock()
	defer h.mu.RUnlock()

	users := make([]string, 0, len(h.Clients))
	for userID := range h.Clients {
		users = append(users, userID)
	}
	return users
}

// ReadPump 从WebSocket读取消息
func (c *Client) ReadPump() {
	defer func() {
		c.Hub.Unregister <- c
		c.Conn.Close()
	}()

	// 设置读取超时
	c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.Conn.SetPongHandler(func(string) error {
		c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket错误: %v", err)
			}
			break
		}

		// 处理接收到的消息（可以在这里添加消息处理逻辑）
		log.Printf("收到来自用户 %s 的消息: %s", c.UserID, string(message))

		// 这里可以根据消息类型进行不同的处理
		var wsMsg WSMessage
		if err := json.Unmarshal(message, &wsMsg); err == nil {
			// 处理不同类型的消息
			switch wsMsg.Type {
			case "ping":
				// 心跳响应
				pong := WSMessage{
					Type:      "pong",
					Timestamp: time.Now().Unix(),
				}
				data, _ := json.Marshal(pong)
				c.Send <- data
			case "typing":
				// 正在输入状态（可以转发给对方）
				log.Printf("用户 %s 正在输入", c.UserID)
			}
		}
	}
}

// WritePump 向WebSocket写入消息
func (c *Client) WritePump() {
	ticker := time.NewTicker(54 * time.Second)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.Send:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				// Hub关闭了通道
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.Conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			// 批量写入队列中的其他消息
			n := len(c.Send)
			for i := 0; i < n; i++ {
				w.Write([]byte{'\n'})
				w.Write(<-c.Send)
			}

			if err := w.Close(); err != nil {
				return
			}

		case <-ticker.C:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}
