package handler

import (
	"encoding/json"
	"errors"
	"im-backend/internal/controller"
	"im-backend/internal/model"
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

// getCurrentUserID 从Context的Email获取user_id
func (h *GroupHandler) getCurrentUserID(r *http.Request) (string, error) {
	email := pkg.GetUserIDFromContext(r.Context())
	if email == "" {
		return "", errors.New("未认证")
	}
	user, err := h.userRepo.FindByEmail(email)
	if err != nil || user == nil {
		return "", errors.New("用户不存在")
	}
	return user.UserID, nil
}

// ==================== Group 管理 ====================

// CreateGroup 创建群组
func (h *GroupHandler) CreateGroup(w http.ResponseWriter, r *http.Request) {
	userID, err := h.getCurrentUserID(r)
	if err != nil {
		pkg.ServiceError(w, err, pkg.CodeUnauthorized)
		return
	}

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
		pkg.ServiceError(w, err, pkg.CodeBadRequest)
		return
	}

	pkg.Success(w, group)
}

// GetGroupInfo 获取群组信息
func (h *GroupHandler) GetGroupInfo(w http.ResponseWriter, r *http.Request) {
	userID, err := h.getCurrentUserID(r)
	if err != nil {
		pkg.ServiceError(w, err, pkg.CodeUnauthorized)
		return
	}
	vars := mux.Vars(r)
	groupID := vars["group_id"]

	if groupID == "" {
		pkg.Error(w, 4001, "群组ID不能为空")
		return
	}

	group, err := h.groupController.GetGroupInfo(groupID, userID)
	if err != nil {
		pkg.ServiceError(w, err, pkg.CodeBadRequest)
		return
	}

	pkg.Success(w, group)
}

// UpdateGroupInfo 更新群组信息
func (h *GroupHandler) UpdateGroupInfo(w http.ResponseWriter, r *http.Request) {
	userID, err := h.getCurrentUserID(r)
	if err != nil {
		pkg.ServiceError(w, err, pkg.CodeUnauthorized)
		return
	}
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

	err = h.groupController.UpdateGroupInfo(groupID, userID, req.Name, req.Description, req.Avatar)
	if err != nil {
		pkg.ServiceError(w, err, pkg.CodeBadRequest)
		return
	}

	pkg.Success(w, "群组信息更新成功")
}

// DeleteGroup 解散群组
func (h *GroupHandler) DeleteGroup(w http.ResponseWriter, r *http.Request) {
	userID, err := h.getCurrentUserID(r)
	if err != nil {
		pkg.ServiceError(w, err, pkg.CodeUnauthorized)
		return
	}
	vars := mux.Vars(r)
	groupID := vars["group_id"]

	if groupID == "" {
		pkg.Error(w, 4001, "群组ID不能为空")
		return
	}

	err = h.groupController.DeleteGroup(groupID, userID)
	if err != nil {
		pkg.ServiceError(w, err, pkg.CodeBadRequest)
		return
	}

	pkg.Success(w, "群组解散成功")
}

// GetUserGroups 获取用户加入的群组列表
func (h *GroupHandler) GetUserGroups(w http.ResponseWriter, r *http.Request) {
	userID, err := h.getCurrentUserID(r)
	if err != nil {
		pkg.ServiceError(w, err, pkg.CodeUnauthorized)
		return
	}

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
		pkg.ServiceError(w, err, pkg.CodeDatabaseError)
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
		pkg.ServiceError(w, err, pkg.CodeDatabaseError)
		return
	}

	pkg.Success(w, groups)
}

// ==================== Group Member 管理 ====================

// JoinGroup 加入群组
func (h *GroupHandler) JoinGroup(w http.ResponseWriter, r *http.Request) {
	userID, err := h.getCurrentUserID(r)
	if err != nil {
		pkg.ServiceError(w, err, pkg.CodeUnauthorized)
		return
	}

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

	group, err := h.groupController.JoinGroup(req.GroupID, userID)
	if err != nil {
		pkg.ServiceError(w, err, pkg.CodeBadRequest)
		return
	}

	pkg.Success(w, group)
}

// LeaveGroup 退出群组
func (h *GroupHandler) LeaveGroup(w http.ResponseWriter, r *http.Request) {
	userID, err := h.getCurrentUserID(r)
	if err != nil {
		pkg.ServiceError(w, err, pkg.CodeUnauthorized)
		return
	}
	vars := mux.Vars(r)
	groupID := vars["group_id"]

	if groupID == "" {
		pkg.Error(w, 4001, "群组ID不能为空")
		return
	}

	err = h.groupController.LeaveGroup(groupID, userID)
	if err != nil {
		pkg.ServiceError(w, err, pkg.CodeBadRequest)
		return
	}

	pkg.Success(w, "退出群组成功")
}

// KickMember 踢出成员
func (h *GroupHandler) KickMember(w http.ResponseWriter, r *http.Request) {
	operatorID, err := h.getCurrentUserID(r)
	if err != nil {
		pkg.ServiceError(w, err, pkg.CodeUnauthorized)
		return
	}
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

	err = h.groupController.KickMember(groupID, operatorID, req.TargetUserID)
	if err != nil {
		pkg.ServiceError(w, err, pkg.CodeBadRequest)
		return
	}

	pkg.Success(w, "踢出成员成功")
}

// SetMemberRole 设置成员角色
func (h *GroupHandler) SetMemberRole(w http.ResponseWriter, r *http.Request) {
	operatorID, err := h.getCurrentUserID(r)
	if err != nil {
		pkg.ServiceError(w, err, pkg.CodeUnauthorized)
		return
	}
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

	err = h.groupController.SetMemberRole(groupID, operatorID, req.TargetUserID, req.Role)
	if err != nil {
		pkg.ServiceError(w, err, pkg.CodeBadRequest)
		return
	}

	pkg.Success(w, "设置成员角色成功")
}

// GetGroupMembers 获取群成员列表
func (h *GroupHandler) GetGroupMembers(w http.ResponseWriter, r *http.Request) {
	userID, err := h.getCurrentUserID(r)
	if err != nil {
		pkg.ServiceError(w, err, pkg.CodeUnauthorized)
		return
	}
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
		pkg.ServiceError(w, err, pkg.CodeBadRequest)
		return
	}

	pkg.Success(w, members)
}

// ==================== Group Message 管理 ====================

// SendGroupMessage 发送群消息
func (h *GroupHandler) SendGroupMessage(w http.ResponseWriter, r *http.Request) {
	fromUserID, err := h.getCurrentUserID(r)
	if err != nil {
		pkg.ServiceError(w, err, pkg.CodeUnauthorized)
		return
	}

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
		pkg.ServiceError(w, err, pkg.CodeBadRequest)
		return
	}

	pkg.Success(w, message)
}

// GetGroupMessages 获取群消息历史
func (h *GroupHandler) GetGroupMessages(w http.ResponseWriter, r *http.Request) {
	userID, err := h.getCurrentUserID(r)
	if err != nil {
		pkg.ServiceError(w, err, pkg.CodeUnauthorized)
		return
	}
	vars := mux.Vars(r)
	groupID := vars["group_id"]

	if groupID == "" {
		pkg.Error(w, 4001, "群组ID不能为空")
		return
	}

	// 检测游标分页参数
	cursorStr := r.URL.Query().Get("cursor")
	if cursorStr != "" {
		cursor, _ := strconv.ParseUint(cursorStr, 10, 32)
		limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
		if limit <= 0 {
			limit = 20
		}

		messages, hasMore, err := h.groupController.GetGroupMessagesByCursor(groupID, userID, uint(cursor), limit)
		if err != nil {
			pkg.ServiceError(w, err, pkg.CodeBadRequest)
			return
		}

		var nextCursor string
		if hasMore && len(messages.([]model.GroupMessage)) > 0 {
			msgList := messages.([]model.GroupMessage)
			nextCursor = strconv.FormatUint(uint64(msgList[0].ID), 10)
		}

		pkg.Success(w, map[string]interface{}{
			"list":        messages,
			"has_more":    hasMore,
			"next_cursor": nextCursor,
		})
		return
	}

	// 回退到传统分页
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
		pkg.ServiceError(w, err, pkg.CodeBadRequest)
		return
	}

	pkg.Success(w, messages)
}

// RecallGroupMessage 撤回群消息
func (h *GroupHandler) RecallGroupMessage(w http.ResponseWriter, r *http.Request) {
	userID, err := h.getCurrentUserID(r)
	if err != nil {
		pkg.ServiceError(w, err, pkg.CodeUnauthorized)
		return
	}
	vars := mux.Vars(r)
	messageIDStr := vars["message_id"]

	messageID, err := strconv.ParseUint(messageIDStr, 10, 32)
	if err != nil {
		pkg.Error(w, 4001, "消息ID格式错误")
		return
	}

	err = h.groupController.RecallGroupMessage(uint(messageID), userID)
	if err != nil {
		pkg.ServiceError(w, err, pkg.CodeBadRequest)
		return
	}

	pkg.Success(w, "消息撤回成功")
}

// MarkGroupMessagesAsRead 标记群消息为已读
func (h *GroupHandler) MarkGroupMessagesAsRead(w http.ResponseWriter, r *http.Request) {
	userID, err := h.getCurrentUserID(r)
	if err != nil {
		pkg.ServiceError(w, err, pkg.CodeUnauthorized)
		return
	}
	vars := mux.Vars(r)
	groupID := vars["group_id"]

	if groupID == "" {
		pkg.Error(w, 4001, "群组ID不能为空")
		return
	}

	err = h.groupController.MarkGroupMessagesAsRead(groupID, userID)
	if err != nil {
		pkg.ServiceError(w, err, pkg.CodeBadRequest)
		return
	}

	pkg.Success(w, "标记已读成功")
}

// GetUserUnreadGroupMessages 获取用户在群组中的未读消息数
func (h *GroupHandler) GetUserUnreadGroupMessages(w http.ResponseWriter, r *http.Request) {
	userID, err := h.getCurrentUserID(r)
	if err != nil {
		pkg.ServiceError(w, err, pkg.CodeUnauthorized)
		return
	}
	vars := mux.Vars(r)
	groupID := vars["group_id"]

	if groupID == "" {
		pkg.Error(w, 4001, "群组ID不能为空")
		return
	}

	count, err := h.groupController.GetUserUnreadGroupMessages(groupID, userID)
	if err != nil {
		pkg.ServiceError(w, err, pkg.CodeBadRequest)
		return
	}

	pkg.Success(w, map[string]interface{}{
		"count": count,
	})
}

// BatchGetUnreadCounts 批量获取多个群的未读消息数
func (h *GroupHandler) BatchGetUnreadCounts(w http.ResponseWriter, r *http.Request) {
	userID, err := h.getCurrentUserID(r)
	if err != nil {
		pkg.ServiceError(w, err, pkg.CodeUnauthorized)
		return
	}

	var req struct {
		GroupIDs []string `json:"group_ids"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || len(req.GroupIDs) == 0 {
		pkg.Error(w, 4001, "请提供群组ID列表")
		return
	}

	counts, err := h.groupController.BatchGetUnreadCounts(userID, req.GroupIDs)
	if err != nil {
		pkg.ServiceError(w, err, pkg.CodeBadRequest)
		return
	}

	pkg.Success(w, counts)
}

// ==================== 群邀请 ====================

// InviteToGroup 邀请用户入群
func (h *GroupHandler) InviteToGroup(w http.ResponseWriter, r *http.Request) {
	inviterID, err := h.getCurrentUserID(r)
	if err != nil {
		pkg.ServiceError(w, err, pkg.CodeUnauthorized)
		return
	}
	vars := mux.Vars(r)
	groupID := vars["group_id"]
	if groupID == "" {
		pkg.Error(w, 4001, "群组ID不能为空")
		return
	}

	var req struct {
		InviteeUserID string `json:"invitee_user_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		pkg.Error(w, 4001, "请求参数格式错误")
		return
	}
	if req.InviteeUserID == "" {
		pkg.Error(w, 4001, "被邀请用户ID不能为空")
		return
	}

	inv, err := h.groupController.InviteToGroup(groupID, inviterID, req.InviteeUserID)
	if err != nil {
		pkg.ServiceError(w, err, pkg.CodeBadRequest)
		return
	}

	// WS通知被邀请者
	if pkg.GlobalHub != nil {
		inviteeUser, _ := h.userRepo.FindByUserID(req.InviteeUserID)
		if inviteeUser != nil && pkg.GlobalHub.IsUserOnline(inviteeUser.Email) {
			pkg.GlobalHub.SendGroupNotification(inviteeUser.Email, "group_invitation", map[string]interface{}{
				"invitation": inv,
			})
		}
	}

	pkg.Success(w, inv)
}

// AcceptGroupInvitation 接受群邀请
func (h *GroupHandler) AcceptGroupInvitation(w http.ResponseWriter, r *http.Request) {
	userID, err := h.getCurrentUserID(r)
	if err != nil {
		pkg.ServiceError(w, err, pkg.CodeUnauthorized)
		return
	}
	vars := mux.Vars(r)
	idStr := vars["id"]
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		pkg.Error(w, 4001, "邀请ID格式错误")
		return
	}

	if err := h.groupController.AcceptGroupInvitation(uint(id), userID); err != nil {
		pkg.ServiceError(w, err, pkg.CodeBadRequest)
		return
	}
	pkg.Success(w, "已接受群邀请")
}

// RejectGroupInvitation 拒绝群邀请
func (h *GroupHandler) RejectGroupInvitation(w http.ResponseWriter, r *http.Request) {
	userID, err := h.getCurrentUserID(r)
	if err != nil {
		pkg.ServiceError(w, err, pkg.CodeUnauthorized)
		return
	}
	vars := mux.Vars(r)
	idStr := vars["id"]
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		pkg.Error(w, 4001, "邀请ID格式错误")
		return
	}

	if err := h.groupController.RejectGroupInvitation(uint(id), userID); err != nil {
		pkg.ServiceError(w, err, pkg.CodeBadRequest)
		return
	}
	pkg.Success(w, "已拒绝群邀请")
}

// GetReceivedInvitations 获取收到的群邀请
func (h *GroupHandler) GetReceivedInvitations(w http.ResponseWriter, r *http.Request) {
	userID, err := h.getCurrentUserID(r)
	if err != nil {
		pkg.ServiceError(w, err, pkg.CodeUnauthorized)
		return
	}

	status := -1
	if statusStr := r.URL.Query().Get("status"); statusStr != "" {
		if s, err := strconv.Atoi(statusStr); err == nil {
			status = s
		}
	}

	invitations, err := h.groupController.GetReceivedInvitations(userID, status)
	if err != nil {
		pkg.ServiceError(w, err, pkg.CodeBadRequest)
		return
	}
	pkg.Success(w, invitations)
}

// ==================== 群公告 ====================

// CreateAnnouncement 创建群公告
func (h *GroupHandler) CreateAnnouncement(w http.ResponseWriter, r *http.Request) {
	publisherID, err := h.getCurrentUserID(r)
	if err != nil {
		pkg.ServiceError(w, err, pkg.CodeUnauthorized)
		return
	}
	vars := mux.Vars(r)
	groupID := vars["group_id"]
	if groupID == "" {
		pkg.Error(w, 4001, "群组ID不能为空")
		return
	}

	var req struct {
		Content  string `json:"content"`
		IsPinned bool   `json:"is_pinned"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		pkg.Error(w, 4001, "请求参数格式错误")
		return
	}
	if req.Content == "" {
		pkg.Error(w, 4001, "公告内容不能为空")
		return
	}

	ann, err := h.groupController.CreateAnnouncement(groupID, publisherID, req.Content, req.IsPinned)
	if err != nil {
		pkg.ServiceError(w, err, pkg.CodeBadRequest)
		return
	}

	// WS通知群成员
	if pkg.GlobalHub != nil {
		members, _ := h.groupController.GetGroupOnlineMembers(groupID)
		if memberList, ok := members.([]model.GroupMember); ok {
			for _, member := range memberList {
				if member.UserID != publisherID {
					memberUser, _ := h.userRepo.FindByUserID(member.UserID)
					if memberUser != nil && pkg.GlobalHub.IsUserOnline(memberUser.Email) {
						pkg.GlobalHub.SendGroupNotification(memberUser.Email, "group_announcement", map[string]interface{}{
							"announcement": ann,
						})
					}
				}
			}
		}
	}

	pkg.Success(w, ann)
}

// GetGroupAnnouncements 获取群公告列表
func (h *GroupHandler) GetGroupAnnouncements(w http.ResponseWriter, r *http.Request) {
	userID, err := h.getCurrentUserID(r)
	if err != nil {
		pkg.ServiceError(w, err, pkg.CodeUnauthorized)
		return
	}
	vars := mux.Vars(r)
	groupID := vars["group_id"]
	if groupID == "" {
		pkg.Error(w, 4001, "群组ID不能为空")
		return
	}

	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	if page <= 0 {
		page = 1
	}
	pageSize, _ := strconv.Atoi(r.URL.Query().Get("page_size"))
	if pageSize <= 0 {
		pageSize = 20
	}

	announcements, err := h.groupController.GetGroupAnnouncements(groupID, userID, page, pageSize)
	if err != nil {
		pkg.ServiceError(w, err, pkg.CodeBadRequest)
		return
	}
	pkg.Success(w, announcements)
}

// UpdateAnnouncement 更新群公告
func (h *GroupHandler) UpdateAnnouncement(w http.ResponseWriter, r *http.Request) {
	userID, err := h.getCurrentUserID(r)
	if err != nil {
		pkg.ServiceError(w, err, pkg.CodeUnauthorized)
		return
	}
	vars := mux.Vars(r)
	idStr := vars["id"]
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		pkg.Error(w, 4001, "公告ID格式错误")
		return
	}

	var req map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		pkg.Error(w, 4001, "请求参数格式错误")
		return
	}

	if err := h.groupController.UpdateAnnouncement(uint(id), userID, req); err != nil {
		pkg.ServiceError(w, err, pkg.CodeBadRequest)
		return
	}
	pkg.Success(w, "公告已更新")
}

// DeleteAnnouncement 删除群公告
func (h *GroupHandler) DeleteAnnouncement(w http.ResponseWriter, r *http.Request) {
	userID, err := h.getCurrentUserID(r)
	if err != nil {
		pkg.ServiceError(w, err, pkg.CodeUnauthorized)
		return
	}
	vars := mux.Vars(r)
	idStr := vars["id"]
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		pkg.Error(w, 4001, "公告ID格式错误")
		return
	}

	if err := h.groupController.DeleteAnnouncement(uint(id), userID); err != nil {
		pkg.ServiceError(w, err, pkg.CodeBadRequest)
		return
	}
	pkg.Success(w, "公告已删除")
}

// ==================== 群 Typing ====================

// SendGroupTyping 发送群输入状态
func (h *GroupHandler) SendGroupTyping(w http.ResponseWriter, r *http.Request) {
	userID, err := h.getCurrentUserID(r)
	if err != nil {
		pkg.ServiceError(w, err, pkg.CodeUnauthorized)
		return
	}
	vars := mux.Vars(r)
	groupID := vars["group_id"]
	if groupID == "" {
		pkg.Error(w, 4001, "群组ID不能为空")
		return
	}

	// 获取群在线成员并推送 typing 状态
	if pkg.GlobalHub != nil {
		currentUser, _ := h.userRepo.FindByUserID(userID)
		members, _ := h.groupController.GetGroupOnlineMembers(groupID)
		if memberList, ok := members.([]model.GroupMember); ok {
			typingData := map[string]interface{}{
				"group_id": groupID,
				"user_id":  userID,
				"nickname": func() string { if currentUser != nil { return currentUser.Nickname }; return "" }(),
			}
			for _, member := range memberList {
				if member.UserID != userID {
					memberUser, _ := h.userRepo.FindByUserID(member.UserID)
					if memberUser != nil && pkg.GlobalHub.IsUserOnline(memberUser.Email) {
						pkg.GlobalHub.SendTypingStatus(memberUser.Email, typingData)
					}
				}
			}
		}
	}

	pkg.Success(w, "typing状态已发送")
}
