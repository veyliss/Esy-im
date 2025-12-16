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

type FriendHandler struct {
	controller *controller.FriendController
	userRepo   *repository.UserRepository
}

func NewFriendHandler(controller *controller.FriendController, userRepo *repository.UserRepository) *FriendHandler {
	return &FriendHandler{
		controller: controller,
		userRepo:   userRepo,
	}
}

// getUserID 从Context的Email获取user_id
func (h *FriendHandler) getUserID(r *http.Request) (string, error) {
	email := pkg.GetUserIDFromContext(r.Context())
	user, err := h.userRepo.FindByEmail(email)
	if err != nil {
		return "", err
	}
	return user.UserID, nil
}

// SendRequest 发送好友请求
func (h *FriendHandler) SendRequest(w http.ResponseWriter, r *http.Request) {
	var req struct {
		ToUserID string `json:"to_user_id"`
		Message  string `json:"message"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		pkg.Error(w, 400, "请求参数错误")
		return
	}

	userID, err := h.getUserID(r)
	if err != nil {
		pkg.Error(w, 401, "用户不存在")
		return
	}

	if err := h.controller.SendRequest(userID, req.ToUserID, req.Message); err != nil {
		pkg.Error(w, 500, err.Error())
		return
	}

	pkg.Success(w, "好友请求已发送")
}

// AcceptRequest 接受好友请求
func (h *FriendHandler) AcceptRequest(w http.ResponseWriter, r *http.Request) {
	var req struct {
		RequestID uint `json:"request_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		pkg.Error(w, 400, "请求参数错误")
		return
	}

	userID, err := h.getUserID(r)
	if err != nil {
		pkg.Error(w, 401, "用户不存在")
		return
	}

	if err := h.controller.AcceptRequest(req.RequestID, userID); err != nil {
		pkg.Error(w, 500, err.Error())
		return
	}

	pkg.Success(w, "已接受好友请求")
}

// RejectRequest 拒绝好友请求
func (h *FriendHandler) RejectRequest(w http.ResponseWriter, r *http.Request) {
	var req struct {
		RequestID uint `json:"request_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		pkg.Error(w, 400, "请求参数错误")
		return
	}

	userID, err := h.getUserID(r)
	if err != nil {
		pkg.Error(w, 401, "用户不存在")
		return
	}

	if err := h.controller.RejectRequest(req.RequestID, userID); err != nil {
		pkg.Error(w, 500, err.Error())
		return
	}

	pkg.Success(w, "已拒绝好友请求")
}

// GetFriendList 获取好友列表
func (h *FriendHandler) GetFriendList(w http.ResponseWriter, r *http.Request) {
	userID, err := h.getUserID(r)
	if err != nil {
		pkg.Error(w, 401, "用户不存在")
		return
	}

	friends, err := h.controller.GetFriendList(userID)
	if err != nil {
		pkg.Error(w, 500, err.Error())
		return
	}

	pkg.Success(w, friends)
}

// DeleteFriend 删除好友
func (h *FriendHandler) DeleteFriend(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	friendID := vars["friend_id"]

	if friendID == "" {
		pkg.Error(w, 400, "好友ID不能为空")
		return
	}

	userID, err := h.getUserID(r)
	if err != nil {
		pkg.Error(w, 401, "用户不存在")
		return
	}

	if err := h.controller.DeleteFriend(userID, friendID); err != nil {
		pkg.Error(w, 500, err.Error())
		return
	}

	pkg.Success(w, "已删除好友")
}

// UpdateRemark 更新好友备注
func (h *FriendHandler) UpdateRemark(w http.ResponseWriter, r *http.Request) {
	var req struct {
		FriendID string `json:"friend_id"`
		Remark   string `json:"remark"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		pkg.Error(w, 400, "请求参数错误")
		return
	}

	userID, err := h.getUserID(r)
	if err != nil {
		pkg.Error(w, 401, "用户不存在")
		return
	}

	if err := h.controller.UpdateRemark(userID, req.FriendID, req.Remark); err != nil {
		pkg.Error(w, 500, err.Error())
		return
	}

	pkg.Success(w, "备注已更新")
}

// GetReceivedRequests 获取收到的好友请求
func (h *FriendHandler) GetReceivedRequests(w http.ResponseWriter, r *http.Request) {
	userID, err := h.getUserID(r)
	if err != nil {
		pkg.Error(w, 401, "用户不存在")
		return
	}

	status := -1
	if statusStr := r.URL.Query().Get("status"); statusStr != "" {
		if s, err := strconv.Atoi(statusStr); err == nil {
			status = s
		}
	}

	requests, err := h.controller.GetReceivedRequests(userID, status)
	if err != nil {
		pkg.Error(w, 500, err.Error())
		return
	}

	pkg.Success(w, requests)
}

// GetSentRequests 获取发出的好友请求
func (h *FriendHandler) GetSentRequests(w http.ResponseWriter, r *http.Request) {
	userID, err := h.getUserID(r)
	if err != nil {
		pkg.Error(w, 401, "用户不存在")
		return
	}

	status := -1
	if statusStr := r.URL.Query().Get("status"); statusStr != "" {
		if s, err := strconv.Atoi(statusStr); err == nil {
			status = s
		}
	}

	requests, err := h.controller.GetSentRequests(userID, status)
	if err != nil {
		pkg.Error(w, 500, err.Error())
		return
	}

	pkg.Success(w, requests)
}

// SearchFriend 搜索好友
func (h *FriendHandler) SearchFriend(w http.ResponseWriter, r *http.Request) {
	userID := r.URL.Query().Get("user_id")
	if userID == "" {
		pkg.Error(w, 400, "用户ID不能为空")
		return
	}

	user, err := h.controller.SearchFriend(userID)
	if err != nil {
		pkg.Error(w, 500, err.Error())
		return
	}

	pkg.Success(w, user)
}
