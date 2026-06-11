import api from "./index";
import type { 
  ApiResponse, 
  Message, 
  Conversation,
  MessageType,
  PaginationParams,
  PaginatedResponse,
  CursorPaginationParams,
  CursorPaginatedResponse,
  MessageSearchResult,
  UnreadCountResponse,
  ForwardTarget,
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
    return api.get<ApiResponse<PaginatedResponse<Message>>>(
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
    api.get<ApiResponse<UnreadCountResponse>>("/messages/unread-count"),

  /**
   * 发送Typing状态
   */
  sendTyping: (conversationId: number) =>
    api.post<ApiResponse<string>>("/messages/typing", { conversation_id: conversationId }),

  /**
   * 搜索消息
   */
  searchMessages: (params: { keyword: string; conversation_id?: number; page?: number; page_size?: number }) => {
    const searchParams = new URLSearchParams();
    searchParams.append('keyword', params.keyword);
    if (params.conversation_id) searchParams.append('conversation_id', params.conversation_id.toString());
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.page_size) searchParams.append('page_size', params.page_size.toString());
    return api.get<ApiResponse<MessageSearchResult>>(`/messages/search?${searchParams.toString()}`);
  },

  /**
   * 获取会话消息（游标分页）
   */
  getConversationMessagesCursor: (conversationId: number, params?: CursorPaginationParams) => {
    const searchParams = new URLSearchParams();
    if (params?.cursor !== undefined) searchParams.append('cursor', params.cursor.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    return api.get<ApiResponse<CursorPaginatedResponse<Message>>>(
      `/messages/conversations/${conversationId}/messages?${searchParams.toString()}`
    );
  },

  /**
   * 转发消息
   */
  forwardMessage: (data: { message_id: number; targets: ForwardTarget[] }) =>
    api.post<ApiResponse<string>>("/messages/forward", data),

  /**
   * 置顶/取消置顶会话
   */
  pinConversation: (conversationId: number, isPinned: boolean) =>
    api.put<ApiResponse<string>>(`/messages/conversations/${conversationId}/pin`, { is_pinned: isPinned }),

  /**
   * 免打扰/取消免打扰会话
   */
  muteConversation: (conversationId: number, isMuted: boolean) =>
    api.put<ApiResponse<string>>(`/messages/conversations/${conversationId}/mute`, { is_muted: isMuted }),
};
