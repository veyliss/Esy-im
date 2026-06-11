package repository

import (
	"im-backend/internal/model"

	"gorm.io/gorm"
)

type FavoriteRepository struct {
	db *gorm.DB
}

func NewFavoriteRepository(db *gorm.DB) *FavoriteRepository {
	return &FavoriteRepository{db: db}
}

// AddFavorite 添加收藏
func (r *FavoriteRepository) AddFavorite(fav *model.MessageFavorite) error {
	return r.db.Create(fav).Error
}

// RemoveFavorite 取消收藏
func (r *FavoriteRepository) RemoveFavorite(userID string, messageID uint) error {
	return r.db.Where("user_id = ? AND message_id = ?", userID, messageID).
		Delete(&model.MessageFavorite{}).Error
}

// GetUserFavorites 获取用户收藏列表
func (r *FavoriteRepository) GetUserFavorites(userID string, page, pageSize int) ([]model.MessageFavorite, int64, error) {
	var favorites []model.MessageFavorite
	var total int64

	r.db.Model(&model.MessageFavorite{}).Where("user_id = ?", userID).Count(&total)

	offset := (page - 1) * pageSize
	if err := r.db.Where("user_id = ?", userID).
		Order("created_at DESC").
		Offset(offset).
		Limit(pageSize).
		Find(&favorites).Error; err != nil {
		return nil, 0, err
	}

	return favorites, total, nil
}

// IsFavorited 检查是否已收藏
func (r *FavoriteRepository) IsFavorited(userID string, messageID uint) (bool, error) {
	var count int64
	err := r.db.Model(&model.MessageFavorite{}).
		Where("user_id = ? AND message_id = ?", userID, messageID).
		Count(&count).Error
	return count > 0, err
}
