package repository

import (
	"im-backend/internal/model"

	"gorm.io/gorm"
)

type FriendRepository struct {
	db *gorm.DB
}

func NewFriendRepository(db *gorm.DB) *FriendRepository {
	return &FriendRepository{db: db}
}

// CreateFriendRequest 创建好友请求
func (r *FriendRepository) CreateFriendRequest(req *model.FriendRequest) error {
	return r.db.Create(req).Error
}

// FindFriendRequestByID 根据ID查询好友请求
func (r *FriendRepository) FindFriendRequestByID(id uint) (*model.FriendRequest, error) {
	var req model.FriendRequest
	if err := r.db.Preload("FromUser").Preload("ToUser").First(&req, id).Error; err != nil {
		return nil, err
	}
	return &req, nil
}

// FindPendingRequest 查询是否存在待处理的好友请求
func (r *FriendRepository) FindPendingRequest(fromUserID, toUserID string) (*model.FriendRequest, error) {
	var req model.FriendRequest
	if err := r.db.Where("from_user_id = ? AND to_user_id = ? AND status = 0", fromUserID, toUserID).First(&req).Error; err != nil {
		return nil, err
	}
	return &req, nil
}

// UpdateFriendRequestStatus 更新好友请求状态
func (r *FriendRepository) UpdateFriendRequestStatus(id uint, status int) error {
	return r.db.Model(&model.FriendRequest{}).Where("id = ?", id).Update("status", status).Error
}

// GetReceivedRequests 获取收到的好友请求列表
func (r *FriendRepository) GetReceivedRequests(userID string, status int) ([]model.FriendRequest, error) {
	var requests []model.FriendRequest
	query := r.db.Where("to_user_id = ?", userID).Preload("FromUser")
	if status >= 0 {
		query = query.Where("status = ?", status)
	}
	if err := query.Order("created_at DESC").Find(&requests).Error; err != nil {
		return nil, err
	}
	return requests, nil
}

// GetSentRequests 获取发出的好友请求列表
func (r *FriendRepository) GetSentRequests(userID string, status int) ([]model.FriendRequest, error) {
	var requests []model.FriendRequest
	query := r.db.Where("from_user_id = ?", userID).Preload("ToUser")
	if status >= 0 {
		query = query.Where("status = ?", status)
	}
	if err := query.Order("created_at DESC").Find(&requests).Error; err != nil {
		return nil, err
	}
	return requests, nil
}

// CreateFriend 创建好友关系
func (r *FriendRepository) CreateFriend(friend *model.Friend) error {
	return r.db.Create(friend).Error
}

// FindFriendRelation 查询好友关系
func (r *FriendRepository) FindFriendRelation(userID, friendID string) (*model.Friend, error) {
	var friend model.Friend
	if err := r.db.Where("user_id = ? AND friend_id = ?", userID, friendID).First(&friend).Error; err != nil {
		return nil, err
	}
	return &friend, nil
}

// DeleteFriend 删除好友关系
func (r *FriendRepository) DeleteFriend(userID, friendID string) error {
	return r.db.Where("user_id = ? AND friend_id = ?", userID, friendID).Delete(&model.Friend{}).Error
}

// GetFriendList 获取好友列表
func (r *FriendRepository) GetFriendList(userID string) ([]model.Friend, error) {
	var friends []model.Friend
	if err := r.db.Where("user_id = ?", userID).
		Preload("FriendUser").
		Order("created_at DESC").
		Find(&friends).Error; err != nil {
		return nil, err
	}
	return friends, nil
}

// UpdateFriendRemark 更新好友备注
func (r *FriendRepository) UpdateFriendRemark(userID, friendID, remark string) error {
	return r.db.Model(&model.Friend{}).
		Where("user_id = ? AND friend_id = ?", userID, friendID).
		Update("remark", remark).Error
}

// IsFriend 判断是否为好友关系
func (r *FriendRepository) IsFriend(userID, friendID string) (bool, error) {
	var count int64
	if err := r.db.Model(&model.Friend{}).
		Where("user_id = ? AND friend_id = ?", userID, friendID).
		Count(&count).Error; err != nil {
		return false, err
	}
	return count > 0, nil
}
