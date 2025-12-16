/**
 * WebSocket 客户端
 * 用于实时消息通信
 */

import type { WSMessage, WSGroupMessage, Message, GroupMessage, FriendRequest } from "@/lib/types/api";
import { handleApiError, ErrorCode, isWebSocketError } from "@/lib/utils/errors";

type MessageHandler = (message: Message) => void;
type GroupMessageHandler = (message: GroupMessage) => void;
type FriendRequestHandler = (request: FriendRequest) => void;
type FriendAcceptedHandler = (data: { friend?: { nickname: string } }) => void;
type ConnectionHandler = () => void;

class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private token: string | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private messageHandlers: Set<MessageHandler> = new Set();
  private groupMessageHandlers: Set<GroupMessageHandler> = new Set();
  private friendRequestHandlers: Set<FriendRequestHandler> = new Set();
  private friendAcceptedHandlers: Set<FriendAcceptedHandler> = new Set();
  private connectHandlers: Set<ConnectionHandler> = new Set();
  private disconnectHandlers: Set<ConnectionHandler> = new Set();
  private errorHandlers: Set<(error: unknown) => void> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isManualDisconnect = false;
  private connectionState: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' = 'disconnected';
  private lastHeartbeatTime = 0;
  private heartbeatTimeout = 5000; // 5秒内没有收到心跳响应认为连接异常

  constructor(baseURL: string) {
    // 将 http:// 或 https:// 转换为 ws:// 或 wss://
    this.url = baseURL.replace(/^http/, 'ws') + '/messages/ws';
  }

  /**
   * 连接WebSocket
   */
  connect(token: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket已经连接');
      return;
    }

    this.token = token;
    this.isManualDisconnect = false;
    this.reconnectAttempts = 0;
    this._createConnection();
  }

  /**
   * 创建WebSocket连接
   */
  private _createConnection() {
    if (this.connectionState === 'connecting' || this.connectionState === 'connected') {
      console.log('WebSocket正在连接或已连接，跳过重复连接');
      return;
    }

    try {
      this.connectionState = 'connecting';
      console.log('正在连接WebSocket...');
      
      // 验证token有效性
      if (!this.token) {
        console.error('WebSocket连接失败: 缺少认证token');
        this._handleError(new Error('缺少认证token'));
        return;
      }
      
      // 将token作为URL参数传递
      const wsUrlWithToken = `${this.url}?token=${encodeURIComponent(this.token)}`;
      console.log('WebSocket URL:', wsUrlWithToken);
      console.log('Token 首几位:', this.token.substring(0, 20) + '...');
      
      this.ws = new WebSocket(wsUrlWithToken);
      console.log('WebSocket 对象已创建, 初始状态:', this.ws.readyState);
      
      this.ws.onopen = this._handleOpen.bind(this);
      this.ws.onmessage = this._handleMessage.bind(this);
      this.ws.onclose = this._handleClose.bind(this);
      this.ws.onerror = this._handleError.bind(this);
      
      // 设置连接超时
      setTimeout(() => {
        if (this.connectionState === 'connecting') {
          console.error('WebSocket连接超时');
          this.ws?.close();
          this._handleError(new Error('连接超时'));
        }
      }, 10000); // 10秒超时
    } catch (error) {
      console.error('WebSocket连接失败:', error);
      this.connectionState = 'disconnected';
      this._handleError(error);
      this._scheduleReconnect();
    }
  }

  /**
   * 处理连接打开
   */
  private _handleOpen() {
    console.log('✅ WebSocket已连接');
    this.connectionState = 'connected';
    this.reconnectAttempts = 0;
    this.lastHeartbeatTime = Date.now();
    this.startHeartbeat();
    
    // 通知所有连接处理器
    this.connectHandlers.forEach(handler => {
      try {
        handler();
      } catch (error) {
        console.error('连接处理器执行失败:', error);
      }
    });
  }

  /**
   * 处理收到消息
   */
  private _handleMessage(event: MessageEvent) {
    try {
      const data: WSMessage | WSGroupMessage = JSON.parse(event.data);
      
      switch (data.type) {
        case 'message':
          if (data.data) {
            // 验证消息数据完整性
            const message = data.data as Message;
            if (!message.id || !message.conversation_id) {
              console.warn('收到不完整的消息数据:', message);
              return;
            }
            // 通知所有消息处理器
            this.messageHandlers.forEach(handler => {
              try {
                handler(message);
              } catch (error) {
                console.error('消息处理器执行失败:', error);
              }
            });
          }
          break;
          
        case 'group_message':
          if (data.data) {
            // 验证群消息数据完整性
            const groupMessage = data.data as GroupMessage;
            if (!groupMessage.id || !groupMessage.group_id) {
              console.warn('收到不完整的群消息数据:', groupMessage);
              return;
            }
            // 通知所有群消息处理器
            this.groupMessageHandlers.forEach(handler => {
              try {
                handler(groupMessage);
              } catch (error) {
                console.error('群消息处理器执行失败:', error);
              }
            });
          }
          break;
          
        case 'friend_request':
          console.log('📨 收到好友请求:', data.data);
          if (data.data) {
            // 通知所有好友请求处理器
            this.friendRequestHandlers.forEach(handler => {
              try {
                handler(data.data as FriendRequest);
              } catch (error) {
                console.error('好友请求处理器执行失败:', error);
              }
            });
          }
          break;
          
        case 'friend_accepted':
          console.log('✅ 好友请求已被接受:', data.data);
          if (data.data) {
            // 通知所有好友接受处理器
            this.friendAcceptedHandlers.forEach(handler => {
              try {
                handler(data.data as { friend?: { nickname: string } });
              } catch (error) {
                console.error('好友接受处理器执行失败:', error);
              }
            });
          }
          break;
          
        case 'pong':
          console.log('❤️ 心跳响应');
          this.lastHeartbeatTime = Date.now();
          break;
          
        case 'typing':
          // 可以添加正在输入的处理
          console.log('对方正在输入...');
          break;
          
        case 'error':
          console.error('服务器返回错误:', data.data);
          this._handleError(new Error(data.data as string));
          break;
          
        default:
          console.log('未知消息类型:', data.type);
      }
    } catch (error) {
      console.error('WebSocket消息解析失败:', error);
      this._handleError(error);
    }
  }

  /**
   * 处理连接关闭
   */
  private _handleClose(event: CloseEvent) {
    console.log('❌ WebSocket已断开');
    console.log(`关闭代码: ${event.code}, 原因: ${event.reason || '无'}`);
    
    this.connectionState = 'disconnected';
    this.stopHeartbeat();
    
    // 通知所有断开处理器
    this.disconnectHandlers.forEach(handler => {
      try {
        handler();
      } catch (error) {
        console.error('断开处理器执行失败:', error);
      }
    });
    
    // 如果不是手动断开，尝试重连
    if (!this.isManualDisconnect) {
      // 特殊关闭码处理
      if (event.code === 4001) {
        console.error('认证失败，需要重新登录');
        this._handleError(new Error('认证失败'));
        return; // 不重连
      }
      
      this._scheduleReconnect();
    }
  }

  /**
   * 处理连接错误
   */
  private _handleError(error: unknown) {
    console.error('WebSocket错误:', error);
    
    // 提供更详细的错误信息
    if (this.ws) {
      console.error('WebSocket状态:', this.status);
      console.error('WebSocket URL:', this.url);
    }
    
    // 转换为ApiError
    const apiError = handleApiError(error);
    if (!isWebSocketError(apiError)) {
      apiError.code = ErrorCode.WS_CONNECTION_FAILED;
    }
    
    // 通知所有错误处理器
    this.errorHandlers.forEach(handler => {
      try {
        handler(apiError);
      } catch (err) {
        console.error('错误处理器执行失败:', err);
      }
    });
  }

  /**
   * 断开连接
   */
  disconnect() {
    this.isManualDisconnect = true;
    this.stopHeartbeat();
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * 开始心跳
   */
  private startHeartbeat() {
    this.stopHeartbeat();
    
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        // 检查上次心跳响应时间
        if (Date.now() - this.lastHeartbeatTime > this.heartbeatTimeout) {
          console.warn('心跳超时，可能连接已断开');
          this.ws.close();
          return;
        }
        
        this.ws.send(JSON.stringify({
          type: 'ping',
          timestamp: Date.now()
        }));
      }
    }, 30000); // 30秒心跳
  }

  /**
   * 停止心跳
   */
  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * 计划重连
   */
  private _scheduleReconnect() {
    if (this.isManualDisconnect || !this.token) {
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('WebSocket重连次数已达上限');
      this.connectionState = 'disconnected';
      return;
    }

    this.connectionState = 'reconnecting';
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000); // 指数退避，最大30秒

    console.log(`🔄 ${delay/1000}秒后尝试重新连接... (第${this.reconnectAttempts}次)`);
    
    this.reconnectTimer = setTimeout(() => {
      this._createConnection();
    }, delay);
  }

  /**
   * 发送消息（通过WebSocket发送打字状态等）
   */
  send(data: Record<string, unknown>) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(data));
      } catch (error) {
        console.error('发送WebSocket消息失败:', error);
        this._handleError(error);
      }
    } else {
      console.warn('WebSocket未连接，无法发送消息');
      this._handleError(new Error('WebSocket未连接'));
    }
  }

  /**
   * 发送正在输入状态
   */
  sendTyping(conversationId: number) {
    this.send({
      type: 'typing',
      data: {
        conversation_id: conversationId
      },
      timestamp: Date.now()
    });
  }

  /**
   * 注册消息处理器
   */
  onMessage(handler: MessageHandler) {
    this.messageHandlers.add(handler);
  }

  /**
   * 移除消息处理器
   */
  offMessage(handler: MessageHandler) {
    this.messageHandlers.delete(handler);
  }

  /**
   * 注册群消息处理器
   */
  onGroupMessage(handler: GroupMessageHandler) {
    this.groupMessageHandlers.add(handler);
  }

  /**
   * 移除群消息处理器
   */
  offGroupMessage(handler: GroupMessageHandler) {
    this.groupMessageHandlers.delete(handler);
  }

  /**
   * 注册好友请求处理器
   */
  onFriendRequest(handler: FriendRequestHandler) {
    this.friendRequestHandlers.add(handler);
  }

  /**
   * 移除好友请求处理器
   */
  offFriendRequest(handler: FriendRequestHandler) {
    this.friendRequestHandlers.delete(handler);
  }

  /**
   * 注册好友接受处理器
   */
  onFriendAccepted(handler: FriendAcceptedHandler) {
    this.friendAcceptedHandlers.add(handler);
  }

  /**
   * 移除好友接受处理器
   */
  offFriendAccepted(handler: FriendAcceptedHandler) {
    this.friendAcceptedHandlers.delete(handler);
  }

  /**
   * 注册连接处理器
   */
  onConnect(handler: ConnectionHandler) {
    this.connectHandlers.add(handler);
  }

  /**
   * 移除连接处理器
   */
  offConnect(handler: ConnectionHandler) {
    this.connectHandlers.delete(handler);
  }

  /**
   * 注册断开处理器
   */
  onDisconnect(handler: ConnectionHandler) {
    this.disconnectHandlers.add(handler);
  }

  /**
   * 移除断开处理器
   */
  offDisconnect(handler: ConnectionHandler) {
    this.disconnectHandlers.delete(handler);
  }

  /**
   * 注册错误处理器
   */
  onError(handler: (error: unknown) => void) {
    this.errorHandlers.add(handler);
  }

  /**
   * 移除错误处理器
   */
  offError(handler: (error: unknown) => void) {
    this.errorHandlers.delete(handler);
  }

  /**
   * 获取连接状态
   */
  get isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * 获取连接状态文本
   */
  get status(): string {
    if (!this.ws) return '未连接';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return '连接中...';
      case WebSocket.OPEN:
        return '已连接';
      case WebSocket.CLOSING:
        return '断开中...';
      case WebSocket.CLOSED:
        return '已断开';
      default:
        return '未知';
    }
  }

  /**
   * 获取连接状态
   */
  get connectionStateType() {
    return this.connectionState;
  }
}

// 导出单例
export const wsClient = new WebSocketClient(
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080/api/v1"
);

// 导出类型
export type { MessageHandler, GroupMessageHandler, FriendRequestHandler, FriendAcceptedHandler, ConnectionHandler };
