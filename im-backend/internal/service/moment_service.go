package service

import (
	"errors"
	"im-backend/internal/model"
	"im-backend/internal/repository"
	"strings"
	"time"
)

type MomentService struct {
	momentRepo *repository.MomentRepository
	friendRepo *repository.FriendRepository
}

func NewMomentService(momentRepo *repository.MomentRepository, friendRepo *repository.FriendRepository) *MomentService {
	return &MomentService{
		momentRepo: momentRepo,
		friendRepo: friendRepo,
	}
}

// CreateMoment 发布朋友圈动态
func (s *MomentService) CreateMoment(userID, content, images, location string, visible int) error {
	// 校验内容不能为空
	if len(strings.TrimSpace(content)) == 0 {
		return errors.New("动态内容不能为空")
	}

	moment := &model.Moment{
		UserID:    userID,
		Content:   content,
		Images:    images,
		Location:  location,
		Visible:   visible,
		CreatedAt: time.Now(),
	}

	return s.momentRepo.CreateMoment(moment)
}

// GetMomentByID 获取动态详情
func (s *MomentService) GetMomentByID(momentID uint, userID string) (*model.Moment, error) {
	moment, err := s.momentRepo.FindMomentByID(momentID)
	if err != nil {
		return nil, errors.New("动态不存在")
	}

	// 检查可见权限
	if moment.Visible == 2 && moment.UserID != userID {
		return nil, errors.New("无权查看该动态")
	}

	if moment.Visible == 1 && moment.UserID != userID {
		// 检查是否为好友
		isFriend, err := s.friendRepo.IsFriend(userID, moment.UserID)
		if err != nil || !isFriend {
			return nil, errors.New("无权查看该动态")
		}
	}

	return moment, nil
}

// GetMyMoments 获取自己的朋友圈列表
func (s *MomentService) GetMyMoments(userID string, page, pageSize int) ([]model.Moment, error) {
	offset := (page - 1) * pageSize
	return s.momentRepo.GetMomentList(userID, offset, pageSize)
}

// GetFriendMoments 获取好友的朋友圈列表（时间线）
func (s *MomentService) GetFriendMoments(userID string, page, pageSize int) ([]model.Moment, error) {
	// 获取好友列表
	friends, err := s.friendRepo.GetFriendList(userID)
	if err != nil {
		return nil, err
	}

	// 提取好友ID列表，并包含自己
	friendIDs := []string{userID}
	for _, friend := range friends {
		friendIDs = append(friendIDs, friend.FriendID)
	}

	offset := (page - 1) * pageSize
	return s.momentRepo.GetFriendMomentList(friendIDs, offset, pageSize)
}

// DeleteMoment 删除动态
func (s *MomentService) DeleteMoment(momentID uint, userID string) error {
	// 检查动态是否存在且是否为本人发布
	moment, err := s.momentRepo.FindMomentByID(momentID)
	if err != nil {
		return errors.New("动态不存在")
	}

	if moment.UserID != userID {
		return errors.New("无权删除该动态")
	}

	return s.momentRepo.DeleteMoment(momentID, userID)
}

// LikeMoment 点赞动态
func (s *MomentService) LikeMoment(momentID uint, userID string) error {
	// 检查动态是否存在
	moment, err := s.momentRepo.FindMomentByID(momentID)
	if err != nil {
		return errors.New("动态不存在")
	}

	// 检查可见权限
	if moment.Visible == 2 && moment.UserID != userID {
		return errors.New("无权访问该动态")
	}

	if moment.Visible == 1 && moment.UserID != userID {
		isFriend, err := s.friendRepo.IsFriend(userID, moment.UserID)
		if err != nil || !isFriend {
			return errors.New("无权访问该动态")
		}
	}

	// 检查是否已点赞
	existingLike, _ := s.momentRepo.FindLike(momentID, userID)
	if existingLike != nil {
		return errors.New("已经点赞过了")
	}

	// 创建点赞记录
	like := &model.MomentLike{
		MomentID:  momentID,
		UserID:    userID,
		CreatedAt: time.Now(),
	}

	if err := s.momentRepo.CreateLike(like); err != nil {
		return err
	}

	// 增加点赞数
	return s.momentRepo.IncreaseLikeCount(momentID)
}

// UnlikeMoment 取消点赞
func (s *MomentService) UnlikeMoment(momentID uint, userID string) error {
	// 检查是否已点赞
	existingLike, err := s.momentRepo.FindLike(momentID, userID)
	if err != nil || existingLike == nil {
		return errors.New("未点赞过该动态")
	}

	// 删除点赞记录
	if err := s.momentRepo.DeleteLike(momentID, userID); err != nil {
		return err
	}

	// 减少点赞数
	return s.momentRepo.DecreaseLikeCount(momentID)
}

// GetLikeList 获取点赞列表
func (s *MomentService) GetLikeList(momentID uint, userID string) ([]model.MomentLike, error) {
	// 检查动态是否存在及权限
	_, err := s.GetMomentByID(momentID, userID)
	if err != nil {
		return nil, err
	}

	return s.momentRepo.GetLikeList(momentID)
}

// CommentMoment 评论动态
func (s *MomentService) CommentMoment(momentID uint, userID, content string, replyToID *uint) error {
	// 检查动态是否存在
	moment, err := s.momentRepo.FindMomentByID(momentID)
	if err != nil {
		return errors.New("动态不存在")
	}

	// 检查可见权限
	if moment.Visible == 2 && moment.UserID != userID {
		return errors.New("无权访问该动态")
	}

	if moment.Visible == 1 && moment.UserID != userID {
		isFriend, err := s.friendRepo.IsFriend(userID, moment.UserID)
		if err != nil || !isFriend {
			return errors.New("无权访问该动态")
		}
	}

	// 如果是回复评论，检查被回复的评论是否存在
	if replyToID != nil {
		_, err := s.momentRepo.FindCommentByID(*replyToID)
		if err != nil {
			return errors.New("被回复的评论不存在")
		}
	}

	// 创建评论
	comment := &model.MomentComment{
		MomentID:  momentID,
		UserID:    userID,
		Content:   content,
		ReplyToID: replyToID,
		CreatedAt: time.Now(),
	}

	if err := s.momentRepo.CreateComment(comment); err != nil {
		return err
	}

	// 增加评论数
	return s.momentRepo.IncreaseCommentCount(momentID)
}

// DeleteComment 删除评论
func (s *MomentService) DeleteComment(commentID uint, userID string) error {
	// 检查评论是否存在且是否为本人发布
	comment, err := s.momentRepo.FindCommentByID(commentID)
	if err != nil {
		return errors.New("评论不存在")
	}

	if comment.UserID != userID {
		return errors.New("无权删除该评论")
	}

	// 删除评论
	if err := s.momentRepo.DeleteComment(commentID, userID); err != nil {
		return err
	}

	// 减少评论数
	return s.momentRepo.DecreaseCommentCount(comment.MomentID)
}

// GetCommentList 获取评论列表
func (s *MomentService) GetCommentList(momentID uint, userID string) ([]model.MomentComment, error) {
	// 检查动态是否存在及权限
	_, err := s.GetMomentByID(momentID, userID)
	if err != nil {
		return nil, err
	}

	return s.momentRepo.GetCommentList(momentID)
}
