package repository

import (
	"im-backend/internal/model"

	"gorm.io/gorm"
)

type MomentRepository struct {
	db *gorm.DB
}

func NewMomentRepository(db *gorm.DB) *MomentRepository {
	return &MomentRepository{db: db}
}

// CreateMoment 创建朋友圈动态
func (r *MomentRepository) CreateMoment(moment *model.Moment) error {
	return r.db.Create(moment).Error
}

// FindMomentByID 根据ID查询动态
func (r *MomentRepository) FindMomentByID(id uint) (*model.Moment, error) {
	var moment model.Moment
	if err := r.db.Preload("User").
		Preload("Likes.User").
		Preload("Comments.User").
		Preload("Comments.ReplyTo").
		First(&moment, id).Error; err != nil {
		return nil, err
	}
	return &moment, nil
}

// GetMomentList 获取朋友圈动态列表（支持分页）
func (r *MomentRepository) GetMomentList(userID string, offset, limit int) ([]model.Moment, error) {
	var moments []model.Moment
	if err := r.db.Where("user_id = ?", userID).
		Preload("User").
		Preload("Likes.User").
		Preload("Comments.User").
		Order("created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&moments).Error; err != nil {
		return nil, err
	}
	return moments, nil
}

// GetFriendMomentList 获取好友的朋友圈动态列表
func (r *MomentRepository) GetFriendMomentList(friendIDs []string, offset, limit int) ([]model.Moment, error) {
	var moments []model.Moment
	if err := r.db.Where("user_id IN ? AND (visible = 0 OR visible = 1)", friendIDs).
		Preload("User").
		Preload("Likes.User").
		Preload("Comments.User").
		Order("created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&moments).Error; err != nil {
		return nil, err
	}
	return moments, nil
}

// DeleteMoment 删除动态
func (r *MomentRepository) DeleteMoment(id uint, userID string) error {
	return r.db.Where("id = ? AND user_id = ?", id, userID).Delete(&model.Moment{}).Error
}

// UpdateMoment 更新动态
func (r *MomentRepository) UpdateMoment(moment *model.Moment) error {
	return r.db.Save(moment).Error
}

// IncreaseLikeCount 增加点赞数
func (r *MomentRepository) IncreaseLikeCount(momentID uint) error {
	return r.db.Model(&model.Moment{}).
		Where("id = ?", momentID).
		UpdateColumn("like_count", gorm.Expr("like_count + ?", 1)).Error
}

// DecreaseLikeCount 减少点赞数
func (r *MomentRepository) DecreaseLikeCount(momentID uint) error {
	return r.db.Model(&model.Moment{}).
		Where("id = ?", momentID).
		UpdateColumn("like_count", gorm.Expr("like_count - ?", 1)).Error
}

// IncreaseCommentCount 增加评论数
func (r *MomentRepository) IncreaseCommentCount(momentID uint) error {
	return r.db.Model(&model.Moment{}).
		Where("id = ?", momentID).
		UpdateColumn("comment_count", gorm.Expr("comment_count + ?", 1)).Error
}

// DecreaseCommentCount 减少评论数
func (r *MomentRepository) DecreaseCommentCount(momentID uint) error {
	return r.db.Model(&model.Moment{}).
		Where("id = ?", momentID).
		UpdateColumn("comment_count", gorm.Expr("comment_count - ?", 1)).Error
}

// CreateLike 创建点赞
func (r *MomentRepository) CreateLike(like *model.MomentLike) error {
	return r.db.Create(like).Error
}

// DeleteLike 删除点赞
func (r *MomentRepository) DeleteLike(momentID uint, userID string) error {
	return r.db.Where("moment_id = ? AND user_id = ?", momentID, userID).
		Delete(&model.MomentLike{}).Error
}

// FindLike 查询点赞记录
func (r *MomentRepository) FindLike(momentID uint, userID string) (*model.MomentLike, error) {
	var like model.MomentLike
	if err := r.db.Where("moment_id = ? AND user_id = ?", momentID, userID).
		First(&like).Error; err != nil {
		return nil, err
	}
	return &like, nil
}

// GetLikeList 获取动态的点赞列表
func (r *MomentRepository) GetLikeList(momentID uint) ([]model.MomentLike, error) {
	var likes []model.MomentLike
	if err := r.db.Where("moment_id = ?", momentID).
		Preload("User").
		Order("created_at DESC").
		Find(&likes).Error; err != nil {
		return nil, err
	}
	return likes, nil
}

// CreateComment 创建评论
func (r *MomentRepository) CreateComment(comment *model.MomentComment) error {
	return r.db.Create(comment).Error
}

// FindCommentByID 根据ID查询评论
func (r *MomentRepository) FindCommentByID(id uint) (*model.MomentComment, error) {
	var comment model.MomentComment
	if err := r.db.Preload("User").First(&comment, id).Error; err != nil {
		return nil, err
	}
	return &comment, nil
}

// DeleteComment 删除评论
func (r *MomentRepository) DeleteComment(id uint, userID string) error {
	return r.db.Where("id = ? AND user_id = ?", id, userID).
		Delete(&model.MomentComment{}).Error
}

// GetCommentList 获取动态的评论列表
func (r *MomentRepository) GetCommentList(momentID uint) ([]model.MomentComment, error) {
	var comments []model.MomentComment
	if err := r.db.Where("moment_id = ?", momentID).
		Preload("User").
		Preload("ReplyTo.User").
		Order("created_at ASC").
		Find(&comments).Error; err != nil {
		return nil, err
	}
	return comments, nil
}
