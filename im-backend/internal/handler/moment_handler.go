package handler

import (
	"encoding/json"
	"im-backend/internal/controller"
	"im-backend/internal/pkg"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
)

type MomentHandler struct {
	controller *controller.MomentController
}

func NewMomentHandler(controller *controller.MomentController) *MomentHandler {
	return &MomentHandler{controller: controller}
}

// CreateMoment 发布朋友圈动态
func (h *MomentHandler) CreateMoment(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Content  string `json:"content"`
		Images   string `json:"images"` // JSON数组字符串，如：["url1", "url2"]
		Location string `json:"location"`
		Visible  int    `json:"visible"` // 0-所有人，1-仅好友，2-私密
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		pkg.Error(w, 400, "请求参数错误")
		return
	}

	// 从上下文获取当前用户ID
	userID := pkg.GetUserIDFromContext(r.Context())

	if err := h.controller.CreateMoment(userID, req.Content, req.Images, req.Location, req.Visible); err != nil {
		pkg.Error(w, 500, err.Error())
		return
	}

	pkg.Success(w, "发布成功")
}

// GetMomentByID 获取动态详情
func (h *MomentHandler) GetMomentByID(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	momentIDStr := vars["id"]

	momentID, err := strconv.ParseUint(momentIDStr, 10, 32)
	if err != nil {
		pkg.Error(w, 400, "动态ID格式错误")
		return
	}

	// 从上下文获取当前用户ID
	userID := pkg.GetUserIDFromContext(r.Context())

	moment, err := h.controller.GetMomentByID(uint(momentID), userID)
	if err != nil {
		pkg.Error(w, 500, err.Error())
		return
	}

	pkg.Success(w, moment)
}

// GetMyMoments 获取自己的朋友圈列表
func (h *MomentHandler) GetMyMoments(w http.ResponseWriter, r *http.Request) {
	// 从上下文获取当前用户ID
	userID := pkg.GetUserIDFromContext(r.Context())

	// 获取分页参数
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	if page <= 0 {
		page = 1
	}
	pageSize, _ := strconv.Atoi(r.URL.Query().Get("page_size"))
	if pageSize <= 0 {
		pageSize = 20
	}

	moments, err := h.controller.GetMyMoments(userID, page, pageSize)
	if err != nil {
		pkg.Error(w, 500, err.Error())
		return
	}

	pkg.Success(w, moments)
}

// GetFriendMoments 获取好友的朋友圈时间线
func (h *MomentHandler) GetFriendMoments(w http.ResponseWriter, r *http.Request) {
	// 从上下文获取当前用户ID
	userID := pkg.GetUserIDFromContext(r.Context())

	// 获取分页参数
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	if page <= 0 {
		page = 1
	}
	pageSize, _ := strconv.Atoi(r.URL.Query().Get("page_size"))
	if pageSize <= 0 {
		pageSize = 20
	}

	moments, err := h.controller.GetFriendMoments(userID, page, pageSize)
	if err != nil {
		pkg.Error(w, 500, err.Error())
		return
	}

	pkg.Success(w, moments)
}

// DeleteMoment 删除动态
func (h *MomentHandler) DeleteMoment(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	momentIDStr := vars["id"]

	momentID, err := strconv.ParseUint(momentIDStr, 10, 32)
	if err != nil {
		pkg.Error(w, 400, "动态ID格式错误")
		return
	}

	// 从上下文获取当前用户ID
	userID := pkg.GetUserIDFromContext(r.Context())

	if err := h.controller.DeleteMoment(uint(momentID), userID); err != nil {
		pkg.Error(w, 500, err.Error())
		return
	}

	pkg.Success(w, "删除成功")
}

// LikeMoment 点赞动态
func (h *MomentHandler) LikeMoment(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	momentIDStr := vars["id"]

	momentID, err := strconv.ParseUint(momentIDStr, 10, 32)
	if err != nil {
		pkg.Error(w, 400, "动态ID格式错误")
		return
	}

	// 从上下文获取当前用户ID
	userID := pkg.GetUserIDFromContext(r.Context())

	if err := h.controller.LikeMoment(uint(momentID), userID); err != nil {
		pkg.Error(w, 500, err.Error())
		return
	}

	pkg.Success(w, "点赞成功")
}

// UnlikeMoment 取消点赞
func (h *MomentHandler) UnlikeMoment(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	momentIDStr := vars["id"]

	momentID, err := strconv.ParseUint(momentIDStr, 10, 32)
	if err != nil {
		pkg.Error(w, 400, "动态ID格式错误")
		return
	}

	// 从上下文获取当前用户ID
	userID := pkg.GetUserIDFromContext(r.Context())

	if err := h.controller.UnlikeMoment(uint(momentID), userID); err != nil {
		pkg.Error(w, 500, err.Error())
		return
	}

	pkg.Success(w, "已取消点赞")
}

// GetLikeList 获取点赞列表
func (h *MomentHandler) GetLikeList(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	momentIDStr := vars["id"]

	momentID, err := strconv.ParseUint(momentIDStr, 10, 32)
	if err != nil {
		pkg.Error(w, 400, "动态ID格式错误")
		return
	}

	// 从上下文获取当前用户ID
	userID := pkg.GetUserIDFromContext(r.Context())

	likes, err := h.controller.GetLikeList(uint(momentID), userID)
	if err != nil {
		pkg.Error(w, 500, err.Error())
		return
	}

	pkg.Success(w, likes)
}

// CommentMoment 评论动态
func (h *MomentHandler) CommentMoment(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	momentIDStr := vars["id"]

	momentID, err := strconv.ParseUint(momentIDStr, 10, 32)
	if err != nil {
		pkg.Error(w, 400, "动态ID格式错误")
		return
	}

	var req struct {
		Content   string `json:"content"`
		ReplyToID *uint  `json:"reply_to_id"` // 可选，回复某条评论
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		pkg.Error(w, 400, "请求参数错误")
		return
	}

	if req.Content == "" {
		pkg.Error(w, 400, "评论内容不能为空")
		return
	}

	// 从上下文获取当前用户ID
	userID := pkg.GetUserIDFromContext(r.Context())

	if err := h.controller.CommentMoment(uint(momentID), userID, req.Content, req.ReplyToID); err != nil {
		pkg.Error(w, 500, err.Error())
		return
	}

	pkg.Success(w, "评论成功")
}

// DeleteComment 删除评论
func (h *MomentHandler) DeleteComment(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	commentIDStr := vars["comment_id"]

	commentID, err := strconv.ParseUint(commentIDStr, 10, 32)
	if err != nil {
		pkg.Error(w, 400, "评论ID格式错误")
		return
	}

	// 从上下文获取当前用户ID
	userID := pkg.GetUserIDFromContext(r.Context())

	if err := h.controller.DeleteComment(uint(commentID), userID); err != nil {
		pkg.Error(w, 500, err.Error())
		return
	}

	pkg.Success(w, "删除成功")
}

// GetCommentList 获取评论列表
func (h *MomentHandler) GetCommentList(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	momentIDStr := vars["id"]

	momentID, err := strconv.ParseUint(momentIDStr, 10, 32)
	if err != nil {
		pkg.Error(w, 400, "动态ID格式错误")
		return
	}

	// 从上下文获取当前用户ID
	userID := pkg.GetUserIDFromContext(r.Context())

	comments, err := h.controller.GetCommentList(uint(momentID), userID)
	if err != nil {
		pkg.Error(w, 500, err.Error())
		return
	}

	pkg.Success(w, comments)
}
