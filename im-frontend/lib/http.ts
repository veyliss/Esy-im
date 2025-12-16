// Axios实例，内置授权与刷新逻辑
import axios, { AxiosError } from "axios";
import { useAuthStore } from "@/lib/store";
import { handleApiError, shouldRelogin, isNetworkError, createUserFriendlyErrorMessage } from "@/lib/utils/errors";
import type { ApiResponse } from "@/lib/types/api";

// const isRefreshing = false;
// let pendingRequests: Array<(token: string | null) => void> = [];

// function onRefreshed(newToken: string | null) {
//   pendingRequests.forEach(cb => cb(newToken));
//   pendingRequests = [];
// }

export const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080/api/v1",
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器：附带访问token
http.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token || (typeof window !== "undefined" ? localStorage.getItem("token") : null);
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

// 响应拦截器：处理响应和错误
http.interceptors.response.use(
  (res) => {
    // 处理响应数据
    const data = res.data as ApiResponse;
    
    // 如果业务错误码不为0，抛出错误
    if (data.code !== 0) {
      const error = handleApiError({ response: { data } });
      
      // 添加请求信息到错误详情
      error.detail = `请求URL: ${res.config.url}, 请求方法: ${res.config.method}`;
      
      // 如果需要重新登录
      if (shouldRelogin(error.code)) {
        useAuthStore.getState().clearToken();
        if (typeof window !== "undefined") {
          // 显示友好的错误消息
          console.error(createUserFriendlyErrorMessage(error));
          window.location.href = "/login";
        }
      }
      
      return Promise.reject(error);
    }
    
    return res;
  },
  async (error: AxiosError) => {
    const status = error?.response?.status;
    const originalRequest = error.config as { url?: string; method?: string; __isRetry?: boolean };
    const apiError = handleApiError(error);
    
    // 添加请求信息到错误详情
    if (originalRequest) {
      apiError.detail = `请求URL: ${originalRequest.url}, 请求方法: ${originalRequest.method}`;
    }

    // 处理401错误
    if (status === 401 && !originalRequest.__isRetry) {
      // Token无效，清除并跳转登录
      useAuthStore.getState().clearToken();
      if (typeof window !== "undefined") {
        // 显示友好的错误消息
        console.error(createUserFriendlyErrorMessage(apiError));
        window.location.href = "/login";
      }
      return Promise.reject(apiError);
    }

    // 处理网络错误
    if (isNetworkError(apiError)) {
      console.warn('网络错误，请检查网络连接:', apiError.message);
      // 可以在这里添加重试逻辑或显示网络状态提示
    }

    // 其他错误
    return Promise.reject(apiError);
  }
);