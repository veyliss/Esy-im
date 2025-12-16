package handler

import (
	"encoding/json"
	"im-backend/internal/controller"
	"im-backend/internal/pkg"
	"im-backend/internal/repository"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
)

type GroupHandler struct {
	groupController *controller.GroupController
	userRepo        *repository.UserRepository
}

func NewGroupHandler(groupController *controller.GroupController, userRepo *repository.UserRepository) *GroupHandler {
	return &GroupHandler{
		groupController: groupController,
		userRepo:        userRepo,
	}
}

// ==================== Group 管理 ====================

// CreateGroup 创建群组
func (h *GroupHandler) CreateGroup(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(string)

	var req struct {
		Name         string `json:"name"`
		Description  string `json:"description"`
		Avatar       string `json:"avatar"`
		MaxMembers   int    `json:"max_members"`
		IsPublic     bool   `json:"is_public"`
		JoinApproval bool   `json:"join_approval"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		pkg.Error(w, 4001, "请求参数格式错误")
		return
	}

	// 参数验证
	if req.Name == "" {
		pkg.Error(w, 4001, "群组名称不能为空")
		return
	}

	if req.MaxMembers <= 0 {
		req.MaxMembers = 500 // 默认最大成员数
	}

	group, err := h.groupController.CreateGroup(
		userID,
		req.Name,
		req.Description,
		req.Avatar,
		req.MaxMembers,
		req.IsPublic,
		req.JoinApproval,
	)
	if err != nil {
		pkg.Error(w, 4002, err.Error())
		return
	}

	pkg.Success(w, group)
}

// GetGroupInfo 获取群组信息
func (h *GroupHandler) GetGroupInfo(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(string)
	vars := mux.Vars(r)
	groupID := vars["group_id"]

	if groupID == "" {
		pkg.Error(w, 4001, "群组ID不能为空")
		return
	}

	group, err := h.groupController.GetGroupInfo(groupID, userID)
	if err != nil {
		pkg.Error(w, 4002, err.Error())
		return
	}

	pkg.Success(w, group)
}

// UpdateGroupInfo 更新群组信息
func (h *GroupHandler) UpdateGroupInfo(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(string)
	vars := mux.Vars(r)
	groupID := vars["group_id"]

	if groupID == "" {
		pkg.Error(w, 4001, "群组ID不能为空")
		return
	}

	var req struct {
		Name        string `json:"name"`
		Description string `json:"description"`
		Avatar      string `json:"avatar"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		pkg.Error(w, 4001, "请求参数格式错误")
		return
	}

	err := h.groupController.UpdateGroupInfo(groupID, userID, req.Name, req.Description, req.Avatar)
	if err != nil {
		pkg.Error(w, 4002, err.Error())
		return
	}

	pkg.Success(w, "群组信息更新成功")
}

// DeleteGroup 解散群组
func (h *GroupHandler) DeleteGroup(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(string)
	vars := mux.Vars(r)
	groupID := vars["group_id"]

	if groupID == "" {
		pkg.Error(w, 4001, "群组ID不能为空")
		return
	}

	err := h.groupController.DeleteGroup(groupID, userID)
	if err != nil {
		pkg.Error(w, 4002, err.Error())
		return
	}

	pkg.Success(w, "群组解散成功")
}

// GetUserGroups 获取用户加入的群组列表
func (h *GroupHandler) GetUserGroups(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(string)

	// 获取分页参数
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	pageSize, _ := strconv.Atoi(r.URL.Query().Get("page_size"))

	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}

	groups, err := h.groupController.GetUserGroups(userID, page, pageSize)
	if err != nil {
		pkg.Error(w, 5001, err.Error())
		return
	}

	pkg.Success(w, groups)
}

// SearchGroups 搜索群组
func (h *GroupHandler) SearchGroups(w http.ResponseWriter, r *http.Request) {
	keyword := r.URL.Query().Get("keyword")

	// 获取分页参数
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	pageSize, _ := strconv.Atoi(r.URL.Query().Get("page_size"))

	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}

	groups, err := h.groupController.SearchGroups(keyword, page, pageSize)
	if err != nil {
		pkg.Error(w, 5001, err.Error())
		return
	}

	pkg.Success(w, groups)
}

// ==================== Group Member 管理 ====================

// JoinGroup 加入群组
func (h *GroupHandler) JoinGroup(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(string)

	var req struct {
		GroupID string `json:"group_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		pkg.Error(w, 4001, "请求参数格式错误")
		return
	}

	if req.GroupID == "" {
		pkg.Error(w, 4001, "群组ID不能为空")
		return
	}

	err := h.groupController.JoinGroup(req.GroupID, userID)
	if err != nil {
		pkg.Error(w, 4002, err.Error())
		return
	}

	pkg.Success(w, "加入群组成功")
}

// LeaveGroup 退出群组
func (h *GroupHandler) LeaveGroup(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(string)
	vars := mux.Vars(r)
	groupID := vars["group_id"]

	if groupID == "" {
		pkg.Error(w, 4001, "群组ID不能为空")
		return
	}

	err := h.groupController.LeaveGroup(groupID, userID)
	if err != nil {
		pkg.Error(w, 4002, err.Error())
		return
	}

	pkg.Success(w, "退出群组成功")
}

// KickMember 踢出成员
func (h *GroupHandler) KickMember(w http.ResponseWriter, r *http.Request) {
	operatorID := r.Context().Value("user_id").(string)
	vars := mux.Vars(r)
	groupID := vars["group_id"]

	if groupID == "" {
		pkg.Error(w, 4001, "群组ID不能为空")
		return
	}

	var req struct {
		TargetUserID string `json:"target_user_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		pkg.Error(w, 4001, "请求参数格式错误")
		return
	}

	if req.TargetUserID == "" {
		pkg.Error(w, 4001, "目标用户ID不能为空")
		return
	}

	err := h.groupController.KickMember(groupID, operatorID, req.TargetUserID)
	if err != nil {
		pkg.Error(w, 4002, err.Error())
		return
	}

	pkg.Success(w, "踢出成员成功")
}

// SetMemberRole 设置成员角色
func (h *GroupHandler) SetMemberRole(w http.ResponseWriter, r *http.Request) {
	operatorID := r.Context().Value("user_id").(string)
	vars := mux.Vars(r)
	groupID := vars["group_id"]

	if groupID == "" {
		pkg.Error(w, 4001, "群组ID不能为空")
		return
	}

	var req struct {
		TargetUserID string `json:"target_user_id"`
		Role         int    `json:"role"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		pkg.Error(w, 4001, "请求参数格式错误")
		return
	}

	if req.TargetUserID == "" {
		pkg.Error(w, 4001, "目标用户ID不能为空")
		return
	}

	err := h.groupController.SetMemberRole(groupID, operatorID, req.TargetUserID, req.Role)
	if err != nil {
		pkg.Error(w, 4002, err.Error())
		return
	}

	pkg.Success(w, "设置成员角色成功")
}

// GetGroupMembers 获取群成员列表
func (h *GroupHandler) GetGroupMembers(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(string)
	vars := mux.Vars(r)
	groupID := vars["group_id"]

	if groupID == "" {
		pkg.Error(w, 4001, "群组ID不能为空")
		return
	}

	// 获取分页参数
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	pageSize, _ := strconv.Atoi(r.URL.Query().Get("page_size"))

	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 50
	}

	members, err := h.groupController.GetGroupMembers(groupID, userID, page, pageSize)
	if err != nil {
		pkg.Error(w, 4002, err.Error())
		return
	}

	pkg.Success(w, members)
}

// ==================== Group Message 管理 ====================

// SendGroupMessage 发送群消息
func (h *GroupHandler) SendGroupMessage(w http.ResponseWriter, r *http.Request) {
	fromUserID := r.Context().Value("user_id").(string)

	var req struct {
		GroupID     string `json:"group_id"`
		MessageType int    `json:"message_type"`
		Content     string `json:"content"`
		MediaURL    string `json:"media_url"`
		AtUsers     string `json:"at_users"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		pkg.Error(w, 4001, "请求参数格式错误")
		return
	}

	if req.GroupID == "" {
		pkg.Error(w, 4001, "群组ID不能为空")
		return
	}

	if req.MessageType <= 0 {
		req.MessageType = 1 // 默认文本消息
	}

	message, err := h.groupController.SendGroupMessage(
		req.GroupID,
		fromUserID,
		req.MessageType,
		req.Content,
		req.MediaURL,
		req.AtUsers,
	)
	if err != nil {
		pkg.Error(w, 4002, err.Error())
		return
	}

	pkg.Success(w, message)
}

// GetGroupMessages 获取群消息历史
func (h *GroupHandler) GetGroupMessages(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(string)
	vars := mux.Vars(r)
	groupID := vars["group_id"]

	if groupID == "" {
		pkg.Error(w, 4001, "群组ID不能为空")
		return
	}

	// 获取分页参数
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	pageSize, _ := strconv.Atoi(r.URL.Query().Get("page_size"))

	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 50
	}

	messages, err := h.groupController.GetGroupMessages(groupID, userID, page, pageSize)
	if err != nil {
		pkg.Error(w, 4002, err.Error())
		return
	}

	pkg.Success(w, messages)
}

// RecallGroupMessage 撤回群消息
func (h *GroupHandler) RecallGroupMessage(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(string)
	vars := mux.Vars(r)
	messageIDStr := vars["message_id"]

	messageID, err := strconv.ParseUint(messageIDStr, 10, 32)
	if err != nil {
		pkg.Error(w, 4001, "消息ID格式错误")
		return
	}

	err = h.groupController.RecallGroupMessage(uint(messageID), userID)
	if err != nil {
		pkg.Error(w, 4002, err.Error())
		return
	}

	pkg.Success(w, "消息撤回成功")
}

// MarkGroupMessagesAsRead 标记群消息为已读
func (h *GroupHandler) MarkGroupMessagesAsRead(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(string)
	vars := mux.Vars(r)
	groupID := vars["group_id"]

	if groupID == "" {
		pkg.Error(w, 4001, "群组ID不能为空")
		return
	}

	err := h.groupController.MarkGroupMessagesAsRead(groupID, userID)
	if err != nil {
		pkg.Error(w, 4002, err.Error())
		return
	}

	pkg.Success(w, "标记已读成功")
}

// GetUserUnreadGroupMessages 获取用户在群组中的未读消息数
func (h *GroupHandler) GetUserUnreadGroupMessages(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(string)
	vars := mux.Vars(r)
	groupID := vars["group_id"]

	if groupID == "" {
		pkg.Error(w, 4001, "群组ID不能为空")
		return
	}

	count, err := h.groupController.GetUserUnreadGroupMessages(groupID, userID)
	if err != nil {
		pkg.Error(w, 4002, err.Error())
		return
	}

	pkg.Success(w, map[string]interface{}{
		"count": count,
	})
}
