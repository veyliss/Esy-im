package pkg

import (
	"encoding/json"
	"errors"
	"net/http/httptest"
	"testing"
)

func TestCodeFromMessage(t *testing.T) {
	tests := []struct {
		name     string
		message  string
		fallback ErrorCode
		want     ErrorCode
	}{
		{name: "bad request", message: "群组ID不能为空", fallback: CodeInternalError, want: CodeBadRequest},
		{name: "unauthorized", message: "用户未认证", fallback: CodeInternalError, want: CodeUnauthorized},
		{name: "permission denied", message: "您不是该群组的成员", fallback: CodeInternalError, want: CodePermissionDenied},
		{name: "validation failed", message: "密码长度至少8位", fallback: CodeInternalError, want: CodeValidationFailed},
		{name: "user exists", message: "邮箱已被注册", fallback: CodeInternalError, want: CodeUserExists},
		{name: "not found", message: "用户不存在", fallback: CodeInternalError, want: CodeNotFound},
		{name: "wrong password", message: "密码错误", fallback: CodeInternalError, want: CodeWrongPassword},
		{name: "invalid code", message: "验证码错误或已过期", fallback: CodeInternalError, want: CodeCodeInvalid},
		{name: "friend exists", message: "已经是好友关系", fallback: CodeInternalError, want: CodeFriendExists},
		{name: "request exists", message: "已发送过好友请求", fallback: CodeInternalError, want: CodeRequestExists},
		{name: "group member exists", message: "已经是该群组的成员", fallback: CodeInternalError, want: CodeConflict},
		{name: "processed", message: "该请求已被处理", fallback: CodeInternalError, want: CodeConflict},
		{name: "fallback", message: "服务异常", fallback: CodeDatabaseError, want: CodeDatabaseError},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := CodeFromMessage(tt.message, tt.fallback); got != tt.want {
				t.Fatalf("CodeFromMessage() = %d, want %d", got, tt.want)
			}
		})
	}
}

func TestServiceError(t *testing.T) {
	recorder := httptest.NewRecorder()

	ServiceError(recorder, errors.New("您不是该群组的成员"), CodeInternalError)

	var response Response
	if err := json.NewDecoder(recorder.Body).Decode(&response); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if response.Code != int(CodePermissionDenied) {
		t.Fatalf("response.Code = %d, want %d", response.Code, CodePermissionDenied)
	}
	if response.Msg != "您不是该群组的成员" {
		t.Fatalf("response.Msg = %q, want original message", response.Msg)
	}
}
