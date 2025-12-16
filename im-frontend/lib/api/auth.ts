import api from "./index";
import type { ApiResponse, LoginResponse, User } from "@/lib/types/api";

// ============ 请求参数类型 ============

export interface LoginByPasswordParams {
  email: string;
  password: string;
}

export interface LoginByCodeParams {
  email: string;
  code: string;
}

export interface RegisterParams {
  email: string;
  code: string;
  user_id: string;
  nickname: string;
}

export interface RegisterByPasswordParams {
  email: string;
  user_id: string;
  nickname: string;
  password: string;
}

export interface SetPasswordParams {
  password: string;
}

export interface VerifyCodeParams {
  email: string;
  code: string;
}

// ============ API方法 ============

export const AuthAPI = {
  /**
   * 密码登录
   */
  loginByPassword: (data: LoginByPasswordParams) =>
    api.post<ApiResponse<LoginResponse>>("/users/login-pwd", data),

  /**
   * 验证码登录
   */
  loginByCode: (data: LoginByCodeParams) =>
    api.post<ApiResponse<LoginResponse>>("/users/login", data),

  /**
   * 发送邮箱验证码
   */
  sendEmailCode: (email: string) =>
    api.post<ApiResponse<{ message: string }>>("/users/send-code", { email }),

  /**
   * 验证邮箱验证码
   */
  verifyCode: (data: VerifyCodeParams) =>
    api.post<ApiResponse<{ message: string }>>("/users/verify-code", data),

  /**
   * 注册（验证码方式）
   */
  registerByCode: (data: RegisterParams) =>
    api.post<ApiResponse<{ message: string }>>("/users/register", data),

  /**
   * 注册（密码方式）
   */
  registerByPassword: (data: RegisterByPasswordParams) =>
    api.post<ApiResponse<string>>("/users/register-pwd", data),

  /**
   * 设置/修改密码
   */
  setPassword: (data: SetPasswordParams) =>
    api.post<ApiResponse<string>>("/users/set-password", data),

  /**
   * 登出
   */
  logout: () =>
    api.post<ApiResponse<string>>("/users/logout"),

  /**
   * 获取当前用户信息
   */
  getCurrentUser: () =>
    api.get<ApiResponse<User>>("/users/me"),
};
