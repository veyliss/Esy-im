/**
 * 路由常量与权限分组（对齐当前实现与需求）
 * - 公共：未登录允许访问
 * - 受保护：登录后访问
 * - 登录后默认重定向：/chat
 */

export const ROUTES = {
  LANDING: "/",           // 欢迎页（未登录）
  LOGIN: "/login",        // 登录页（未登录）
  REGISTER: "/register",  // 注册页（如需独立路由；目前在登录页内面板）
  FORGOT: "/auth/forgot", // 找回密码占位（未登录）
  CHAT: "/chat",          // 聊天（登录后首页）
  CONTACTS: "/contacts",
  MOMENTS: "/moments",
  ME: "/me",
};

// 主应用导航路由（受保护）
export const MAIN_APP_ROUTES = [
  ROUTES.CHAT,
  ROUTES.CONTACTS,
  ROUTES.MOMENTS,
  ROUTES.ME,
];

// 公共路由（未登录可访问）
export const PUBLIC_ROUTES = [
  ROUTES.LANDING,
  ROUTES.LOGIN,
  ROUTES.REGISTER,
  ROUTES.FORGOT,
];

// 受保护路由（需登录）
export const PROTECTED_ROUTES = MAIN_APP_ROUTES;

// 登录后默认重定向目标
export const DEFAULT_AUTH_REDIRECT = ROUTES.CHAT;