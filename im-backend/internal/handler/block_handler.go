package handler

import (
	"encoding/json"
	"errors"
	"im-backend/internal/controller"
	"im-backend/internal/pkg"
	"im-backend/internal/repository"
	"net/http"

	"github.com/gorilla/mux"
)

type BlockHandler struct {
	blockController *controller.BlockController
	userRepo        *repository.UserRepository
}

func NewBlockHandler(blockController *controller.BlockController, userRepo *repository.UserRepository) *BlockHandler {
	return &BlockHandler{
		blockController: blockController,
		userRepo:        userRepo,
	}
}

func (h *BlockHandler) getCurrentUserID(r *http.Request) (string, error) {
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

// BlockUser 屏蔽用户
func (h *BlockHandler) BlockUser(w http.ResponseWriter, r *http.Request) {
	var req struct {
		BlockedUserID string `json:"blocked_user_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		pkg.Error(w, 400, "请求参数错误")
		return
	}

	userID, err := h.getCurrentUserID(r)
	if err != nil {
		pkg.ServiceError(w, err, pkg.CodeUnauthorized)
		return
	}

	if req.BlockedUserID == "" {
		pkg.Error(w, 400, "目标用户ID不能为空")
		return
	}

	if err := h.blockController.BlockUser(userID, req.BlockedUserID); err != nil {
		pkg.ServiceError(w, err, pkg.CodeInternalError)
		return
	}

	pkg.Success(w, "已屏蔽该用户")
}

// UnblockUser 取消屏蔽
func (h *BlockHandler) UnblockUser(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	blockedID := vars["blocked_id"]

	if blockedID == "" {
		pkg.Error(w, 400, "目标用户ID不能为空")
		return
	}

	userID, err := h.getCurrentUserID(r)
	if err != nil {
		pkg.ServiceError(w, err, pkg.CodeUnauthorized)
		return
	}

	if err := h.blockController.UnblockUser(userID, blockedID); err != nil {
		pkg.ServiceError(w, err, pkg.CodeInternalError)
		return
	}

	pkg.Success(w, "已取消屏蔽")
}

// GetBlockedList 获取屏蔽列表
func (h *BlockHandler) GetBlockedList(w http.ResponseWriter, r *http.Request) {
	userID, err := h.getCurrentUserID(r)
	if err != nil {
		pkg.ServiceError(w, err, pkg.CodeUnauthorized)
		return
	}

	blocks, err := h.blockController.GetBlockedList(userID)
	if err != nil {
		pkg.ServiceError(w, err, pkg.CodeInternalError)
		return
	}

	pkg.Success(w, blocks)
}
