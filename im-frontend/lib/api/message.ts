import api from "./index";
import type { 
  ApiResponse, 
  Message, 
  Conversation,
  MessageType,
  PaginationParams 
} from "@/lib/types/api";

// ============ 请求参数类型 ============

export interface SendMessageParams {
  to_user_id: string;
  message_type: MessageType;
  content: string;
  media_url?: string;
}

export interface CreateConversationParams {
  friend_user_id: string;
}

// ============ API方法 ============

export const MessageAPI = {
  /**
   * 发送消息
   */
  sendMessage: (data: SendMessageParams) =>
    api.post<ApiResponse<Message>>("/messages/send", data),

  /**
   * 获取会话列表
   */
  getConversationList: (params?: PaginationParams) => {
    const queryString = params 
      ? `?page=${params.page || 1}&page_size=${params.page_size || 20}`
      : '';
    return api.get<ApiResponse<Conversation[]>>(`/messages/conversations${queryString}`);
  },

  /**
   * 获取或创建会话
   */
  getOrCreateConversation: (data: CreateConversationParams) =>
    api.post<ApiResponse<Conversation>>("/messages/conversations/create", data),

  /**
   * 获取会话消息历史
   */
  getConversationMessages: (conversationId: number, params?: PaginationParams) => {
    const queryString = params 
      ? `?page=${params.page || 1}&page_size=${params.page_size || 50}`
      : '';
    return api.get<ApiResponse<Message[]>>(
      `/messages/conversations/${conversationId}/messages${queryString}`
    );
  },

  /**
   * 标记会话为已读
   */
  markConversationAsRead: (conversationId: number) =>
    api.put<ApiResponse<string>>(`/messages/conversations/${conversationId}/read`),

  /**
   * 撤回消息
   */
  recallMessage: (messageId: number) =>
    api.put<ApiResponse<string>>(`/messages/${messageId}/recall`),

  /**
   * 删除消息
   */
  deleteMessage: (messageId: number) =>
    api.delete<ApiResponse<string>>(`/messages/${messageId}`),

  /**
   * 获取未读消息总数
   */
  getUnreadCount: () =>
    api.get<ApiResponse<{ count: number }>>("/messages/unread-count"),
};
