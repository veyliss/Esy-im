import api from "./index";
import type { 
  ApiResponse, 
  Moment, 
  MomentLike, 
  MomentComment,
  PaginationParams 
} from "@/lib/types/api";

// ============ 请求参数类型 ============

export interface CreateMomentParams {
  content: string;
  images?: string; // JSON字符串，如 '["url1","url2"]'
  location?: string;
  visible?: 0 | 1 | 2; // 0-所有人 1-仅好友 2-私密
}

export interface CommentMomentParams {
  content: string;
  reply_to_id?: number | null;
}

// ============ API方法 ============

export const MomentAPI = {
  /**
   * 发布朋友圈动态
   */
  createMoment: (data: CreateMomentParams) =>
    api.post<ApiResponse<string>>("/moments/create", data),

  /**
   * 获取动态详情
   */
  getMoment: (id: number) =>
    api.get<ApiResponse<Moment>>(`/moments/${id}`),

  /**
   * 获取自己的朋友圈列表
   */
  getMyMoments: (params?: PaginationParams) => {
    const queryString = params 
      ? `?page=${params.page || 1}&page_size=${params.page_size || 20}`
      : '';
    return api.get<ApiResponse<Moment[]>>(`/moments/my-list${queryString}`);
  },

  /**
   * 获取好友圈时间线（自己和好友的动态）
   */
  getTimeline: (params?: PaginationParams) => {
    const queryString = params 
      ? `?page=${params.page || 1}&page_size=${params.page_size || 20}`
      : '';
    return api.get<ApiResponse<Moment[]>>(`/moments/timeline${queryString}`);
  },

  /**
   * 删除动态
   */
  deleteMoment: (id: number) =>
    api.delete<ApiResponse<string>>(`/moments/${id}`),

  /**
   * 点赞动态
   */
  likeMoment: (id: number) =>
    api.post<ApiResponse<string>>(`/moments/${id}/like`),

  /**
   * 取消点赞
   */
  unlikeMoment: (id: number) =>
    api.delete<ApiResponse<string>>(`/moments/${id}/unlike`),

  /**
   * 获取点赞列表
   */
  getLikeList: (id: number) =>
    api.get<ApiResponse<MomentLike[]>>(`/moments/${id}/likes`),

  /**
   * 评论动态
   */
  commentMoment: (id: number, data: CommentMomentParams) =>
    api.post<ApiResponse<string>>(`/moments/${id}/comment`, data),

  /**
   * 获取评论列表
   */
  getCommentList: (id: number) =>
    api.get<ApiResponse<MomentComment[]>>(`/moments/${id}/comments`),

  /**
   * 删除评论
   */
  deleteComment: (commentId: number) =>
    api.delete<ApiResponse<string>>(`/moments/comments/${commentId}`),
};
