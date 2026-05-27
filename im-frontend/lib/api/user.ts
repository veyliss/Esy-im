import api from "./index";
import type { ApiResponse, FriendSearchResult, User } from "@/lib/types/api";

// ============ 请求参数类型 ============

export interface UpdateProfileParams {
  nickname?: string;
  avatar?: string;
}

// ============ API方法 ============

export const UserAPI = {
  /**
   * 获取当前用户信息
   */
  getMe: () => 
    api.get<ApiResponse<User>>("/users/me"),

  /**
   * 更新用户信息
   */
  updateProfile: (data: UpdateProfileParams) =>
    api.put<ApiResponse<string>>("/users/me", data),

  /**
   * 搜索用户
   */
  searchUser: (keyword: string) =>
    api.get<ApiResponse<FriendSearchResult>>(`/friends/search?keyword=${encodeURIComponent(keyword)}`),
};
