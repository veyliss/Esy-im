package handler

import (
	"encoding/json"
	"errors"
	"im-backend/internal/controller"
	"im-backend/internal/pkg"
	"im-backend/internal/repository"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
)

type FavoriteHandler struct {
	favController *controller.FavoriteController
	userRepo      *repository.UserRepository
}

func NewFavoriteHandler(favController *controller.FavoriteController, userRepo *repository.UserRepository) *FavoriteHandler {
	return &FavoriteHandler{
		favController: favController,
		userRepo:      userRepo,
	}
}

func (h *FavoriteHandler) getCurrentUserID(r *http.Request) (string, error) {
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

// ==================== 收藏 ====================

// AddFavorite 添加收藏
func (h *FavoriteHandler) AddFavorite(w http.ResponseWriter, r *http.Request) {
	userID, err := h.getCurrentUserID(r)
	if err != nil {
		pkg.ServiceError(w, err, pkg.CodeUnauthorized)
		return
	}

	var req struct {
		MessageID uint `json:"message_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.MessageID == 0 {
		pkg.Error(w, 4001, "请提供消息ID")
		return
	}

	if err := h.favController.AddFavorite(userID, req.MessageID); err != nil {
		pkg.ServiceError(w, err, pkg.CodeBadRequest)
		return
	}

	pkg.Success(w, "收藏成功")
}

// RemoveFavorite 取消收藏
func (h *FavoriteHandler) RemoveFavorite(w http.ResponseWriter, r *http.Request) {
	userID, err := h.getCurrentUserID(r)
	if err != nil {
		pkg.ServiceError(w, err, pkg.CodeUnauthorized)
		return
	}

	var req struct {
		MessageID uint `json:"message_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.MessageID == 0 {
		pkg.Error(w, 4001, "请提供消息ID")
		return
	}

	if err := h.favController.RemoveFavorite(userID, req.MessageID); err != nil {
		pkg.ServiceError(w, err, pkg.CodeBadRequest)
		return
	}

	pkg.Success(w, "取消收藏成功")
}

// GetUserFavorites 获取用户收藏列表
func (h *FavoriteHandler) GetUserFavorites(w http.ResponseWriter, r *http.Request) {
	userID, err := h.getCurrentUserID(r)
	if err != nil {
		pkg.ServiceError(w, err, pkg.CodeUnauthorized)
		return
	}

	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	pageSize, _ := strconv.Atoi(r.URL.Query().Get("page_size"))

	favorites, total, err := h.favController.GetUserFavorites(userID, page, pageSize)
	if err != nil {
		pkg.ServiceError(w, err, pkg.CodeBadRequest)
		return
	}

	pkg.Success(w, map[string]interface{}{
		"list":  favorites,
		"total": total,
	})
}

// ==================== 群置顶 ====================

// PinMessage 置顶群消息
func (h *FavoriteHandler) PinMessage(w http.ResponseWriter, r *http.Request) {
	userID, err := h.getCurrentUserID(r)
	if err != nil {
		pkg.ServiceError(w, err, pkg.CodeUnauthorized)
		return
	}

	vars := mux.Vars(r)
	groupID := vars["group_id"]
	messageIDStr := vars["message_id"]

	messageID, err := strconv.ParseUint(messageIDStr, 10, 32)
	if err != nil {
		pkg.Error(w, 4001, "消息ID格式错误")
		return
	}

	if err := h.favController.PinMessage(groupID, userID, uint(messageID)); err != nil {
		pkg.ServiceError(w, err, pkg.CodeBadRequest)
		return
	}

	pkg.Success(w, "置顶成功")
}

// UnpinMessage 取消置顶
func (h *FavoriteHandler) UnpinMessage(w http.ResponseWriter, r *http.Request) {
	userID, err := h.getCurrentUserID(r)
	if err != nil {
		pkg.ServiceError(w, err, pkg.CodeUnauthorized)
		return
	}

	vars := mux.Vars(r)
	groupID := vars["group_id"]
	messageIDStr := vars["message_id"]

	messageID, err := strconv.ParseUint(messageIDStr, 10, 32)
	if err != nil {
		pkg.Error(w, 4001, "消息ID格式错误")
		return
	}

	if err := h.favController.UnpinMessage(groupID, userID, uint(messageID)); err != nil {
		pkg.ServiceError(w, err, pkg.CodeBadRequest)
		return
	}

	pkg.Success(w, "取消置顶成功")
}

// GetGroupPinnedMessages 获取群置顶消息
func (h *FavoriteHandler) GetGroupPinnedMessages(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	groupID := vars["group_id"]

	pins, err := h.favController.GetGroupPinnedMessages(groupID)
	if err != nil {
		pkg.ServiceError(w, err, pkg.CodeBadRequest)
		return
	}

	pkg.Success(w, pins)
}
