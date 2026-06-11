import api from "./index";
import type { ApiResponse } from "@/lib/types/api";

export interface UploadImageResponse {
  url: string;
  path: string;
}

export interface UploadFileResponse {
  url: string;
  path: string;
  filename: string;
  size: number;
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

  uploadFile: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post<ApiResponse<UploadFileResponse>>("/upload/file", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};
