import api from "./index";
import type { 
  ApiResponse, 
  Group, 
  GroupMember,
  GroupMessage,
  GroupMessageType,
  PaginationParams 
} from "@/lib/types/api";

// ============ 请求参数类型 ============

export interface CreateGroupParams {
  name: string;
  description?: string;
  avatar?: string;
  max_members?: number;
  is_public?: boolean;
  join_approval?: boolean;
}

export interface UpdateGroupParams {
  name?: string;
  description?: string;
  avatar?: string;
}

export interface SendGroupMessageParams {
  group_id: string;
  message_type: GroupMessageType;
  content: string;
  media_url?: string;
  at_users?: string;
}

export interface JoinGroupParams {
  group_id: string;
}

export interface KickMemberParams {
  target_user_id: string;
}

export interface SetMemberRoleParams {
  target_user_id: string;
  role: number;
}

// ============ API方法 ============

export const GroupAPI = {
  /**
   * 创建群组
   */
  createGroup: (data: CreateGroupParams) =>
    api.post<ApiResponse<Group>>("/groups/create", data),

  /**
   * 获取群组信息
   */
  getGroupInfo: (groupId: string) =>
    api.get<ApiResponse<Group>>(`/groups/${groupId}`),

  /**
   * 更新群组信息
   */
  updateGroupInfo: (groupId: string, data: UpdateGroupParams) =>
    api.put<ApiResponse<string>>(`/groups/${groupId}`, data),

  /**
   * 解散群组
   */
  deleteGroup: (groupId: string) =>
    api.delete<ApiResponse<string>>(`/groups/${groupId}`),

  /**
   * 获取用户加入的群组列表
   */
  getUserGroups: (params?: PaginationParams) => {
    const queryString = params 
      ? `?page=${params.page || 1}&page_size=${params.page_size || 20}`
      : '';
    return api.get<ApiResponse<Group[]>>(`/groups/my-list${queryString}`);
  },

  /**
   * 搜索群组
   */
  searchGroups: (keyword?: string, params?: PaginationParams) => {
    const searchParams = new URLSearchParams();
    if (keyword) searchParams.append('keyword', keyword);
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.page_size) searchParams.append('page_size', params.page_size.toString());
    
    const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return api.get<ApiResponse<Group[]>>(`/groups/search${queryString}`);
  },

  // ==================== 群成员管理 ====================

  /**
   * 加入群组
   */
  joinGroup: (data: JoinGroupParams) =>
    api.post<ApiResponse<string>>("/groups/join", data),

  /**
   * 退出群组
   */
  leaveGroup: (groupId: string) =>
    api.post<ApiResponse<string>>(`/groups/${groupId}/leave`),

  /**
   * 踢出成员
   */
  kickMember: (groupId: string, data: KickMemberParams) =>
    api.post<ApiResponse<string>>(`/groups/${groupId}/kick`, data),

  /**
   * 设置成员角色
   */
  setMemberRole: (groupId: string, data: SetMemberRoleParams) =>
    api.post<ApiResponse<string>>(`/groups/${groupId}/set-role`, data),

  /**
   * 获取群成员列表
   */
  getGroupMembers: (groupId: string, params?: PaginationParams) => {
    const queryString = params 
      ? `?page=${params.page || 1}&page_size=${params.page_size || 50}`
      : '';
    return api.get<ApiResponse<GroupMember[]>>(`/groups/${groupId}/members${queryString}`);
  },

  // ==================== 群消息管理 ====================

  /**
   * 发送群消息
   */
  sendGroupMessage: (data: SendGroupMessageParams) =>
    api.post<ApiResponse<GroupMessage>>("/groups/messages/send", data),

  /**
   * 获取群消息历史
   */
  getGroupMessages: (groupId: string, params?: PaginationParams) => {
    const queryString = params 
      ? `?page=${params.page || 1}&page_size=${params.page_size || 50}`
      : '';
    return api.get<ApiResponse<GroupMessage[]>>(`/groups/${groupId}/messages${queryString}`);
  },

  /**
   * 撤回群消息
   */
  recallGroupMessage: (messageId: number) =>
    api.put<ApiResponse<string>>(`/groups/messages/${messageId}/recall`),

  /**
   * 标记群消息为已读
   */
  markGroupMessagesAsRead: (groupId: string) =>
    api.put<ApiResponse<string>>(`/groups/${groupId}/messages/read`),

  /**
   * 获取群组未读消息数
   */
  getGroupUnreadCount: (groupId: string) =>
    api.get<ApiResponse<{ count: number }>>(`/groups/${groupId}/unread-count`),
};