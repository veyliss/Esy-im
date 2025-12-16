import api from "./index";
import type { ApiResponse, User } from "@/lib/types/api";

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
  searchUser: (userId: string) =>
    api.get<ApiResponse<User>>(`/friends/search?user_id=${userId}`),
};
