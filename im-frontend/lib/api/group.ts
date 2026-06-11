import api from "./index";
import type { 
  ApiResponse, 
  Group, 
  GroupMember,
  GroupMessage,
  GroupMessageType,
  PaginationParams,
  CursorPaginationParams,
  CursorPaginatedResponse,
  GroupPinnedMessage,
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
    api.post<ApiResponse<Group>>("/groups/join", data),

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

  // ==================== Typing ====================

  /**
   * 发送群聊Typing状态
   */
  sendGroupTyping: (groupId: string) =>
    api.post<ApiResponse<string>>(`/groups/${groupId}/typing`),

  // ==================== 群邀请 ====================

  /**
   * 邀请用户入群
   */
  inviteUser: (groupId: string, inviteeUserId: string) =>
    api.post<ApiResponse<string>>(`/groups/${groupId}/invite`, { invitee_user_id: inviteeUserId }),

  /**
   * 接受群邀请
   */
  acceptInvitation: (invitationId: number) =>
    api.post<ApiResponse<string>>(`/groups/invitations/${invitationId}/accept`),

  /**
   * 拒绝群邀请
   */
  rejectInvitation: (invitationId: number) =>
    api.post<ApiResponse<string>>(`/groups/invitations/${invitationId}/reject`),

  /**
   * 获取收到的群邀请列表
   */
  getReceivedInvitations: () =>
    api.get<ApiResponse<import("@/lib/types/api").GroupInvitation[]>>("/groups/invitations/received"),

  // ==================== 群公告 ====================

  /**
   * 创建群公告
   */
  createAnnouncement: (groupId: string, data: { content: string; is_pinned?: boolean }) =>
    api.post<ApiResponse<import("@/lib/types/api").GroupAnnouncement>>(`/groups/${groupId}/announcements`, data),

  /**
   * 获取群公告列表
   */
  getAnnouncements: (groupId: string) =>
    api.get<ApiResponse<import("@/lib/types/api").GroupAnnouncement[]>>(`/groups/${groupId}/announcements`),

  /**
   * 更新群公告
   */
  updateAnnouncement: (announcementId: number, data: { content?: string; is_pinned?: boolean }) =>
    api.put<ApiResponse<string>>(`/groups/announcements/${announcementId}`, data),

  /**
   * 删除群公告
   */
  deleteAnnouncement: (announcementId: number) =>
    api.delete<ApiResponse<string>>(`/groups/announcements/${announcementId}`),

  // ==================== 游标分页 + 批量未读 ====================

  /**
   * 游标分页获取群消息
   */
  getGroupMessagesCursor: (groupId: string, params?: CursorPaginationParams) => {
    const queryString = params
      ? `?cursor=${params.cursor ?? 0}&limit=${params.limit ?? 20}`
      : '?cursor=0&limit=20';
    return api.get<ApiResponse<CursorPaginatedResponse<GroupMessage>>>(`/groups/${groupId}/messages${queryString}`);
  },

  /**
   * 批量获取多个群的未读消息数
   */
  batchGetUnreadCounts: (groupIds: string[]) =>
    api.post<ApiResponse<Record<string, number>>>("/groups/unread-counts-batch", { group_ids: groupIds }),

  // ==================== 群置顶消息 ====================

  /**
   * 置顶群消息
   */
  pinMessage: (groupId: string, messageId: number) =>
    api.post<ApiResponse<string>>(`/groups/${groupId}/messages/${messageId}/pin`),

  /**
   * 取消置顶
   */
  unpinMessage: (groupId: string, messageId: number) =>
    api.delete<ApiResponse<string>>(`/groups/${groupId}/messages/${messageId}/unpin`),

  /**
   * 获取群置顶消息
   */
  getPinnedMessages: (groupId: string) =>
    api.get<ApiResponse<GroupPinnedMessage[]>>(`/groups/${groupId}/pinned-messages`),
};
