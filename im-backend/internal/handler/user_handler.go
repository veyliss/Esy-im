package handler

import (
	"encoding/json"
	"im-backend/internal/controller"
	"im-backend/internal/pkg"
	"net/http"
	"strings"
)

type UserHandler struct {
	controller *controller.UserController
}

func NewUserHandler(c *controller.UserController) *UserHandler {
	return &UserHandler{controller: c}
}

// 注册请求体
type registerRequest struct {
	Email    string `json:"email"`
	Code     string `json:"code"`
	UserID   string `json:"user_id"` // 用户自选 ID
	Nickname string `json:"nickname"`
}

// 登陆请求体
type loginRequest struct {
	Email string `json:"email"`
	Code  string `json:"code"`
}

// 发送验证码请求体
type sendCodeRequest struct {
	Email string `json:"email"`
}

// 验证验证码请求体
type verifyCodeRequest struct {
	Email string `json:"email"`
	Code  string `json:"code"`
}

// 密码注册请求体
type registerPasswordRequest struct {
	Email    string `json:"email"`
	UserID   string `json:"user_id"`
	Nickname string `json:"nickname"`
	Password string `json:"password"`
}

// 密码登录请求体
type loginPasswordRequest struct {
	Email    string `json:"email"` // 支持 Email 或 User ID
	Password string `json:"password"`
}

// Register 注册
func (h *UserHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req registerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		pkg.Error(w, 4001, "参数错误")
		return
	}

	// 必填校验（email/code/user_id 至少要有）
	if req.Email == "" || req.Code == "" || req.UserID == "" {
		pkg.Error(w, 4001, "email、code、user_id 不能为空")
		return
	}

	// 调用 controller.Register（只返回 error）
	if err := h.controller.Register(req.Email, req.Code, req.UserID, req.Nickname); err != nil {
		pkg.Error(w, 4002, err.Error())
		return
	}

	// 注册成功：按你要求，不返回 user 信息，只返回成功消息
	pkg.Success(w, map[string]string{"message": "注册成功"})
}

// Login 登录
func (h *UserHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req loginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		pkg.Error(w, 4001, "参数错误")
		return
	}

	data, err := h.controller.Login(req.Email, req.Code)
	if err != nil {
		pkg.Error(w, 4003, err.Error())
		return
	}

	pkg.Success(w, data)
}

// Me 获取当前用户
func (h *UserHandler) Me(w http.ResponseWriter, r *http.Request) {
	userID := pkg.GetUserIDFromContext(r.Context())
	if userID == "" {
		pkg.Error(w, 4003, "用户未登录")
		return
	}

	data, err := h.controller.Me(userID)
	if err != nil {
		pkg.Error(w, 4004, err.Error())
		return
	}

	pkg.Success(w, data)
}

// Logout 登出
func (h *UserHandler) Logout(w http.ResponseWriter, r *http.Request) {
	tokenString := strings.TrimPrefix(r.Header.Get("Authorization"), "Bearer ")
	if err := h.controller.Logout(tokenString); err != nil {
		pkg.Error(w, 4005, "登出失败")
		return
	}

	pkg.Success(w, "退出成功")
}

// SendCode 发送邮件验证码
func (h *UserHandler) SendCode(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email string `json:"email"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Email == "" {
		pkg.Error(w, 4001, "参数错误")
		return
	}

	if err := h.controller.SendCode(req.Email); err != nil {
		pkg.Error(w, 4002, err.Error())
		return
	}

	pkg.Success(w, map[string]string{"message": "验证码已发送"})
}

// VerifyCode 验证邮件验证码
func (h *UserHandler) VerifyCode(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email string `json:"email"`
		Code  string `json:"code"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		pkg.Error(w, 4001, "参数错误")
		return
	}

	ok, err := h.controller.VerifyCode(req.Email, req.Code)
	if err != nil {
		pkg.Error(w, 4002, err.Error())
		return
	}
	if !ok {
		pkg.Error(w, 4003, "验证码错误或已过期")
		return
	}

	pkg.Success(w, map[string]string{"message": "验证码验证成功"})
}

// RegisterWithPassword 密码注册
func (h *UserHandler) RegisterWithPassword(w http.ResponseWriter, r *http.Request) {
	var req registerPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		pkg.Error(w, 4001, "参数错误")
		return
	}

	if err := h.controller.RegisterWithPassword(req.Email, req.UserID, req.Nickname, req.Password); err != nil {
		pkg.Error(w, 4002, err.Error())
		return
	}

	pkg.Success(w, "注册成功")
}

// LoginWithPassword 密码登录
func (h *UserHandler) LoginWithPassword(w http.ResponseWriter, r *http.Request) {
	var req loginPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		pkg.Error(w, 4001, "参数错误")
		return
	}

	// 支持使用email或user_id登录
	account := req.Email
	if account == "" {
		// 兼容旧的user_id字段
		account = r.FormValue("user_id")
	}
	data, err := h.controller.LoginWithPassword(account, req.Password)
	if err != nil {
		pkg.Error(w, 4003, err.Error())
		return
	}

	pkg.Success(w, data)
}

type setPasswordRequest struct {
	Password string `json:"password"`
}

// SetPassword 设置或修改密码
func (h *UserHandler) SetPassword(w http.ResponseWriter, r *http.Request) {
	var req setPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		pkg.Error(w, 4001, "参数错误")
		return
	}

	// 从上下文获取当前用户email
	email := pkg.GetUserIDFromContext(r.Context())
	if email == "" {
		pkg.Error(w, 4001, "未认证")
		return
	}

	if err := h.controller.SetPassword(email, req.Password); err != nil {
		pkg.Error(w, 4002, err.Error())
		return
	}

	pkg.Success(w, "密码设置成功")
}

type updateProfileRequest struct {
	Nickname *string `json:"nickname"`
	Avatar   *string `json:"avatar"`
}

// UpdateProfile 更新用户资料
func (h *UserHandler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	var req updateProfileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		pkg.Error(w, 4001, "参数错误")
		return
	}

	// 从上下文获取当前用户email
	email := pkg.GetUserIDFromContext(r.Context())
	if email == "" {
		pkg.Error(w, 4001, "未认证")
		return
	}

	if err := h.controller.UpdateProfile(email, req.Nickname, req.Avatar); err != nil {
		pkg.Error(w, 4002, err.Error())
		return
	}

	pkg.Success(w, "资料更新成功")
}
