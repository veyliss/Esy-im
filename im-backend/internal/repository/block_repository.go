package repository

import (
	"im-backend/internal/model"

	"gorm.io/gorm"
)

type BlockRepository struct {
	db *gorm.DB
}

func NewBlockRepository(db *gorm.DB) *BlockRepository {
	return &BlockRepository{db: db}
}

// CreateBlock 创建屏蔽记录
func (r *BlockRepository) CreateBlock(block *model.Block) error {
	return r.db.Create(block).Error
}

// DeleteBlock 取消屏蔽
func (r *BlockRepository) DeleteBlock(userID, blockedUserID string) error {
	return r.db.Where("user_id = ? AND blocked_user_id = ?", userID, blockedUserID).
		Delete(&model.Block{}).Error
}

// GetBlockedList 获取屏蔽列表
func (r *BlockRepository) GetBlockedList(userID string) ([]model.Block, error) {
	var blocks []model.Block
	err := r.db.Where("user_id = ?", userID).
		Preload("BlockedUser").
		Order("created_at DESC").
		Find(&blocks).Error
	return blocks, err
}

// IsBlocked 检查是否被屏蔽
func (r *BlockRepository) IsBlocked(userID, targetID string) (bool, error) {
	var count int64
	err := r.db.Model(&model.Block{}).
		Where("user_id = ? AND blocked_user_id = ?", userID, targetID).
		Count(&count).Error
	return count > 0, err
}

// IsBlockedByEither 检查双方是否有屏蔽关系
func (r *BlockRepository) IsBlockedByEither(userA, userB string) (bool, error) {
	var count int64
	err := r.db.Model(&model.Block{}).
		Where("(user_id = ? AND blocked_user_id = ?) OR (user_id = ? AND blocked_user_id = ?)",
			userA, userB, userB, userA).
		Count(&count).Error
	return count > 0, err
}
