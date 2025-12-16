import api from "./index";
import type { ApiResponse, Friend, FriendRequest, User } from "@/lib/types/api";

// ============ 请求参数类型 ============

export interface SendFriendRequestParams {
  to_user_id: string;
  message?: string;
}

export interface AcceptFriendRequestParams {
  request_id: number;
}

export interface RejectFriendRequestParams {
  request_id: number;
}

export interface UpdateRemarkParams {
  friend_id: string;
  remark: string;
}

// ============ API方法 ============

export const FriendAPI = {
  /**
   * 发送好友请求
   */
  sendRequest: (data: SendFriendRequestParams) =>
    api.post<ApiResponse<string>>("/friends/send-request", data),

  /**
   * 接受好友请求
   */
  acceptRequest: (data: AcceptFriendRequestParams) =>
    api.post<ApiResponse<string>>("/friends/accept-request", data),

  /**
   * 拒绝好友请求
   */
  rejectRequest: (data: RejectFriendRequestParams) =>
    api.post<ApiResponse<string>>("/friends/reject-request", data),

  /**
   * 获取好友列表
   */
  getFriendList: () =>
    api.get<ApiResponse<Friend[]>>("/friends/list"),

  /**
   * 删除好友
   */
  deleteFriend: (friendId: string) =>
    api.delete<ApiResponse<string>>(`/friends/${friendId}`),

  /**
   * 更新好友备注
   */
  updateRemark: (data: UpdateRemarkParams) =>
    api.put<ApiResponse<string>>("/friends/update-remark", data),

  /**
   * 获取收到的好友请求
   * @param status 0-待处理 1-已同意 2-已拒绝 -1或不传-全部
   */
  getReceivedRequests: (status?: number) => {
    const params = status !== undefined && status !== -1 ? `?status=${status}` : '';
    return api.get<ApiResponse<FriendRequest[]>>(`/friends/received-requests${params}`);
  },

  /**
   * 获取发出的好友请求
   * @param status 0-待处理 1-已同意 2-已拒绝 -1或不传-全部
   */
  getSentRequests: (status?: number) => {
    const params = status !== undefined && status !== -1 ? `?status=${status}` : '';
    return api.get<ApiResponse<FriendRequest[]>>(`/friends/sent-requests${params}`);
  },

  /**
   * 搜索好友
   */
  searchFriend: (userId: string) =>
    api.get<ApiResponse<User>>(`/friends/search?user_id=${userId}`),
};
