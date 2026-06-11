package service

import (
	"errors"
	"im-backend/internal/model"
	"im-backend/internal/repository"
)

type FavoriteService struct {
	favRepo     *repository.FavoriteRepository
	messageRepo *repository.MessageRepository
}

func NewFavoriteService(favRepo *repository.FavoriteRepository, messageRepo *repository.MessageRepository) *FavoriteService {
	return &FavoriteService{
		favRepo:     favRepo,
		messageRepo: messageRepo,
	}
}

// AddFavorite 添加收藏（保存消息内容快照）
func (s *FavoriteService) AddFavorite(userID string, messageID uint) error {
	already, _ := s.favRepo.IsFavorited(userID, messageID)
	if already {
		return errors.New("已收藏该消息")
	}

	msg, err := s.messageRepo.GetMessageByID(messageID)
	if err != nil {
		return errors.New("消息不存在")
	}

	// 验证用户是否有权收藏（发送者或接收者）
	if msg.FromUserID != userID && msg.ToUserID != userID {
		return errors.New("无权收藏该消息")
	}

	fav := &model.MessageFavorite{
		UserID:      userID,
		MessageID:   messageID,
		MessageType: msg.MessageType,
		Content:     msg.Content,
		MediaURL:    msg.MediaURL,
		FromUserID:  msg.FromUserID,
	}

	return s.favRepo.AddFavorite(fav)
}

// RemoveFavorite 取消收藏
func (s *FavoriteService) RemoveFavorite(userID string, messageID uint) error {
	return s.favRepo.RemoveFavorite(userID, messageID)
}

// GetUserFavorites 获取用户收藏列表
func (s *FavoriteService) GetUserFavorites(userID string, page, pageSize int) ([]model.MessageFavorite, int64, error) {
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}
	return s.favRepo.GetUserFavorites(userID, page, pageSize)
}
