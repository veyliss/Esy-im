import api from "./index";
import type { ApiResponse, MessageFavorite } from "@/lib/types/api";

export const FavoriteAPI = {
  addFavorite: (messageId: number) =>
    api.post<ApiResponse<string>>("/favorites/add", { message_id: messageId }),

  removeFavorite: (messageId: number) =>
    api.delete<ApiResponse<string>>("/favorites/remove", { data: { message_id: messageId } }),

  getFavorites: (page = 1, pageSize = 20) =>
    api.get<ApiResponse<{ list: MessageFavorite[]; total: number }>>(
      `/favorites/list?page=${page}&page_size=${pageSize}`
    ),
};
