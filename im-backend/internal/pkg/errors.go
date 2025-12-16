package pkg

import "fmt"

// ErrorCode 错误码定义
type ErrorCode int

const (
	// 成功
	CodeSuccess ErrorCode = 0

	// 客户端错误 (4xxx)
	CodeBadRequest       ErrorCode = 4001 // 请求参数错误
	CodeUnauthorized     ErrorCode = 4002 // 未授权
	CodeForbidden        ErrorCode = 4003 // 禁止访问
	CodeNotFound         ErrorCode = 4004 // 资源不存在
	CodeConflict         ErrorCode = 4009 // 资源冲突
	CodeValidationFailed ErrorCode = 4010 // 验证失败

	// 业务错误 (4xxx)
	CodeUserNotFound     ErrorCode = 4101 // 用户不存在
	CodeUserExists       ErrorCode = 4102 // 用户已存在
	CodeWrongPassword    ErrorCode = 4103 // 密码错误
	CodeTokenInvalid     ErrorCode = 4104 // Token无效
	CodeTokenExpired     ErrorCode = 4105 // Token过期
	CodeCodeInvalid      ErrorCode = 4106 // 验证码无效
	CodeCodeExpired      ErrorCode = 4107 // 验证码过期
	CodeFriendNotFound   ErrorCode = 4201 // 好友不存在
	CodeFriendExists     ErrorCode = 4202 // 已经是好友
	CodeRequestExists    ErrorCode = 4203 // 好友请求已存在
	CodeMessageNotFound  ErrorCode = 4301 // 消息不存在
	CodeMomentNotFound   ErrorCode = 4401 // 朋友圈不存在
	CodePermissionDenied ErrorCode = 4403 // 权限不足

	// 服务端错误 (5xxx)
	CodeInternalError ErrorCode = 5000 // 内部服务器错误
	CodeDatabaseError ErrorCode = 5001 // 数据库错误
	CodeRedisError    ErrorCode = 5002 // Redis错误
	CodeEmailError    ErrorCode = 5003 // 邮件发送错误
)

// errorMessages 错误码对应的错误消息
var errorMessages = map[ErrorCode]string{
	CodeSuccess: "success",

	// 客户端错误
	CodeBadRequest:       "请求参数错误",
	CodeUnauthorized:     "未授权，请先登录",
	CodeForbidden:        "禁止访问",
	CodeNotFound:         "资源不存在",
	CodeConflict:         "资源冲突",
	CodeValidationFailed: "验证失败",

	// 业务错误
	CodeUserNotFound:     "用户不存在",
	CodeUserExists:       "用户已存在",
	CodeWrongPassword:    "密码错误",
	CodeTokenInvalid:     "Token无效",
	CodeTokenExpired:     "Token已过期，请重新登录",
	CodeCodeInvalid:      "验证码无效",
	CodeCodeExpired:      "验证码已过期",
	CodeFriendNotFound:   "好友不存在",
	CodeFriendExists:     "已经是好友关系",
	CodeRequestExists:    "好友请求已存在",
	CodeMessageNotFound:  "消息不存在",
	CodeMomentNotFound:   "朋友圈不存在",
	CodePermissionDenied: "权限不足",

	// 服务端错误
	CodeInternalError: "内部服务器错误",
	CodeDatabaseError: "数据库错误",
	CodeRedisError:    "缓存服务错误",
	CodeEmailError:    "邮件发送失败",
}

// AppError 应用错误结构
type AppError struct {
	Code    ErrorCode // 错误码
	Message string    // 错误消息
	Detail  string    // 详细错误信息（开发环境使用）
	Err     error     // 原始错误
}

// Error 实现error接口
func (e *AppError) Error() string {
	if e.Detail != "" {
		return fmt.Sprintf("[%d] %s: %s", e.Code, e.Message, e.Detail)
	}
	return fmt.Sprintf("[%d] %s", e.Code, e.Message)
}

// Unwrap 实现errors.Unwrap接口
func (e *AppError) Unwrap() error {
	return e.Err
}

// NewAppError 创建应用错误
func NewAppError(code ErrorCode, detail string) *AppError {
	message, ok := errorMessages[code]
	if !ok {
		message = "未知错误"
	}

	return &AppError{
		Code:    code,
		Message: message,
		Detail:  detail,
	}
}

// NewAppErrorWithErr 创建带原始错误的应用错误
func NewAppErrorWithErr(code ErrorCode, detail string, err error) *AppError {
	message, ok := errorMessages[code]
	if !ok {
		message = "未知错误"
	}

	return &AppError{
		Code:    code,
		Message: message,
		Detail:  detail,
		Err:     err,
	}
}

// WrapError 包装错误
func WrapError(err error, code ErrorCode, detail string) *AppError {
	if err == nil {
		return nil
	}

	// 如果已经是AppError，直接返回
	if appErr, ok := err.(*AppError); ok {
		return appErr
	}

	return NewAppErrorWithErr(code, detail, err)
}

// GetMessage 获取错误消息
func (code ErrorCode) GetMessage() string {
	if msg, ok := errorMessages[code]; ok {
		return msg
	}
	return "未知错误"
}
