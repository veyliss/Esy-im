package controller

import (
	"im-backend/internal/service"
)

type MomentController struct {
	momentService *service.MomentService
}

func NewMomentController(momentService *service.MomentService) *MomentController {
	return &MomentController{momentService: momentService}
}

// CreateMoment 发布朋友圈动态
func (c *MomentController) CreateMoment(userID, content, images, location string, visible int) error {
	return c.momentService.CreateMoment(userID, content, images, location, visible)
}

// GetMomentByID 获取动态详情
func (c *MomentController) GetMomentByID(momentID uint, userID string) (interface{}, error) {
	return c.momentService.GetMomentByID(momentID, userID)
}

// GetMyMoments 获取自己的朋友圈列表
func (c *MomentController) GetMyMoments(userID string, page, pageSize int) (interface{}, error) {
	return c.momentService.GetMyMoments(userID, page, pageSize)
}

// GetFriendMoments 获取好友的朋友圈列表
func (c *MomentController) GetFriendMoments(userID string, page, pageSize int) (interface{}, error) {
	return c.momentService.GetFriendMoments(userID, page, pageSize)
}

// DeleteMoment 删除动态
func (c *MomentController) DeleteMoment(momentID uint, userID string) error {
	return c.momentService.DeleteMoment(momentID, userID)
}

// LikeMoment 点赞动态
func (c *MomentController) LikeMoment(momentID uint, userID string) error {
	return c.momentService.LikeMoment(momentID, userID)
}

// UnlikeMoment 取消点赞
func (c *MomentController) UnlikeMoment(momentID uint, userID string) error {
	return c.momentService.UnlikeMoment(momentID, userID)
}

// GetLikeList 获取点赞列表
func (c *MomentController) GetLikeList(momentID uint, userID string) (interface{}, error) {
	return c.momentService.GetLikeList(momentID, userID)
}

// CommentMoment 评论动态
func (c *MomentController) CommentMoment(momentID uint, userID, content string, replyToID *uint) error {
	return c.momentService.CommentMoment(momentID, userID, content, replyToID)
}

// DeleteComment 删除评论
func (c *MomentController) DeleteComment(commentID uint, userID string) error {
	return c.momentService.DeleteComment(commentID, userID)
}

// GetCommentList 获取评论列表
func (c *MomentController) GetCommentList(momentID uint, userID string) (interface{}, error) {
	return c.momentService.GetCommentList(momentID, userID)
}
