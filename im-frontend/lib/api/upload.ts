import api from "./index";
import type { ApiResponse } from "@/lib/types/api";

export interface UploadImageResponse {
  url: string;
  path: string;
}

export const UploadAPI = {
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post<ApiResponse<UploadImageResponse>>("/upload/image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};
