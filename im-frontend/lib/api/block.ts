import api from "./index";
import type { ApiResponse, BlockedUser } from "@/lib/types/api";

// ============ API方法 ============

export const BlockAPI = {
  /**
   * 拉黑用户
   */
  blockUser: (blockedUserId: string) =>
    api.post<ApiResponse<BlockedUser>>("/users/block", { blocked_user_id: blockedUserId }),

  /**
   * 解除拉黑
   */
  unblockUser: (blockId: number) =>
    api.delete<ApiResponse<string>>(`/users/block/${blockId}`),

  /**
   * 获取黑名单列表
   */
  getBlockedUsers: () =>
    api.get<ApiResponse<BlockedUser[]>>("/users/blocked-list"),
};
