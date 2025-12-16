/**
 * 错误码定义和错误处理工具
 * 与后端错误码保持一致
 */

// ============ 错误码定义 ============

export enum ErrorCode {
  // 成功
  SUCCESS = 0,

  // 客户端错误 (40xx)
  BAD_REQUEST = 4001,
  UNAUTHORIZED = 4002,
  FORBIDDEN = 4003,
  NOT_FOUND = 4004,
  CONFLICT = 4009,
  VALIDATION_FAILED = 4010,

  // 业务错误 (41xx-44xx)
  USER_NOT_FOUND = 4101,
  USER_EXISTS = 4102,
  WRONG_PASSWORD = 4103,
  TOKEN_INVALID = 4104,
  TOKEN_EXPIRED = 4105,
  CODE_INVALID = 4106,
  CODE_EXPIRED = 4107,

  FRIEND_NOT_FOUND = 4201,
  FRIEND_EXISTS = 4202,
  REQUEST_EXISTS = 4203,

  MESSAGE_NOT_FOUND = 4301,

  MOMENT_NOT_FOUND = 4401,
  PERMISSION_DENIED = 4403,

  // 服务端错误 (50xx)
  INTERNAL_ERROR = 5000,
  DATABASE_ERROR = 5001,
  REDIS_ERROR = 5002,
  EMAIL_ERROR = 5003,
  
  // WebSocket错误 (51xx)
  WS_CONNECTION_FAILED = 5101,
  WS_MESSAGE_SEND_FAILED = 5102,
  WS_MESSAGE_PARSE_FAILED = 5103,
  WS_AUTH_FAILED = 5104,
}

// ============ 错误消息映射 ============

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.SUCCESS]: '成功',

  [ErrorCode.BAD_REQUEST]: '请求参数错误',
  [ErrorCode.UNAUTHORIZED]: '未授权，请先登录',
  [ErrorCode.FORBIDDEN]: '禁止访问',
  [ErrorCode.NOT_FOUND]: '资源不存在',
  [ErrorCode.CONFLICT]: '资源冲突',
  [ErrorCode.VALIDATION_FAILED]: '验证失败',

  [ErrorCode.USER_NOT_FOUND]: '用户不存在',
  [ErrorCode.USER_EXISTS]: '用户已存在',
  [ErrorCode.WRONG_PASSWORD]: '密码错误',
  [ErrorCode.TOKEN_INVALID]: 'Token无效',
  [ErrorCode.TOKEN_EXPIRED]: 'Token已过期，请重新登录',
  [ErrorCode.CODE_INVALID]: '验证码无效',
  [ErrorCode.CODE_EXPIRED]: '验证码已过期',

  [ErrorCode.FRIEND_NOT_FOUND]: '好友不存在',
  [ErrorCode.FRIEND_EXISTS]: '已经是好友关系',
  [ErrorCode.REQUEST_EXISTS]: '好友请求已存在',

  [ErrorCode.MESSAGE_NOT_FOUND]: '消息不存在',

  [ErrorCode.MOMENT_NOT_FOUND]: '朋友圈不存在',
  [ErrorCode.PERMISSION_DENIED]: '权限不足',

  [ErrorCode.INTERNAL_ERROR]: '内部服务器错误',
  [ErrorCode.DATABASE_ERROR]: '数据库错误',
  [ErrorCode.REDIS_ERROR]: '缓存服务错误',
  [ErrorCode.EMAIL_ERROR]: '邮件发送失败',
  
  [ErrorCode.WS_CONNECTION_FAILED]: 'WebSocket连接失败',
  [ErrorCode.WS_MESSAGE_SEND_FAILED]: '消息发送失败',
  [ErrorCode.WS_MESSAGE_PARSE_FAILED]: '消息解析失败',
  [ErrorCode.WS_AUTH_FAILED]: 'WebSocket认证失败',
};

// ============ 自定义错误类 ============

export class ApiError extends Error {
  code: ErrorCode;
  detail?: string;

  constructor(code: ErrorCode, message?: string, detail?: string) {
    super(message || ERROR_MESSAGES[code] || '未知错误');
    this.code = code;
    this.detail = detail;
    this.name = 'ApiError';
  }
}

// ============ 错误处理工具函数 ============

/**
 * 获取错误消息
 */
export function getErrorMessage(code: ErrorCode, fallback?: string): string {
  return ERROR_MESSAGES[code] || fallback || '未知错误';
}

/**
 * 判断是否需要重新登录
 */
export function shouldRelogin(code: ErrorCode): boolean {
  return code === ErrorCode.UNAUTHORIZED || 
         code === ErrorCode.TOKEN_INVALID || 
         code === ErrorCode.TOKEN_EXPIRED;
}

/**
 * 处理API错误响应
 */
export function handleApiError(error: unknown): ApiError {
  // 如果已经是ApiError，直接返回
  if (error instanceof ApiError) {
    return error;
  }

  // 处理axios错误
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { response?: { data?: { code?: number; msg?: string } } };
    const { data } = axiosError.response || {};
    const code = (data?.code as ErrorCode) || ErrorCode.INTERNAL_ERROR;
    const message = data?.msg || ERROR_MESSAGES[code] || '未知错误';
    return new ApiError(code, message);
  }

  // 网络错误
  if (error && typeof error === 'object' && 'request' in error) {
    return new ApiError(ErrorCode.INTERNAL_ERROR, '网络错误，请检查网络连接');
}

  // WebSocket错误
  if (error && typeof error === 'object' && 'message' in error) {
    const wsError = error as { message: string };
    if (wsError.message.includes('WebSocket')) {
      return new ApiError(ErrorCode.WS_CONNECTION_FAILED, wsError.message);
    }
  }
  
  // 其他错误
  return new ApiError(ErrorCode.INTERNAL_ERROR, '未知错误');
}

/**
 * 创建错误通知配置
 */
export function createErrorNotification(error: ApiError) {
  return {
    type: 'error' as const,
    title: '错误',
    message: error.message,
    duration: 3000,
  };
}

/**
 * 判断是否为WebSocket相关错误
 */
export function isWebSocketError(error: ApiError): boolean {
  return error.code >= 5101 && error.code <= 5104;
}

/**
 * 判断是否为网络连接错误
 */
export function isNetworkError(error: ApiError): boolean {
  return error.code === ErrorCode.INTERNAL_ERROR &&
         (error.message.includes('网络') || error.message.includes('连接'));
}

/**
 * 创建用户友好的错误消息
 */
export function createUserFriendlyErrorMessage(error: ApiError): string {
  // 网络错误
  if (isNetworkError(error)) {
    return '网络连接不稳定，请检查网络后重试';
  }
  
  // WebSocket错误
  if (isWebSocketError(error)) {
    return '实时连接出现问题，消息可能会延迟';
  }
  
  // 认证错误
  if (shouldRelogin(error.code)) {
    return '登录已过期，请重新登录';
  }
  
  // 其他错误
  return error.message;
}
