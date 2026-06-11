package repository

import (
	"im-backend/internal/model"

	"gorm.io/gorm"
)

type PinnedRepository struct {
	db *gorm.DB
}

func NewPinnedRepository(db *gorm.DB) *PinnedRepository {
	return &PinnedRepository{db: db}
}

// PinMessage 置顶消息
func (r *PinnedRepository) PinMessage(pin *model.GroupPinnedMessage) error {
	return r.db.Create(pin).Error
}

// UnpinMessage 取消置顶
func (r *PinnedRepository) UnpinMessage(groupID string, messageID uint) error {
	return r.db.Where("group_id = ? AND message_id = ?", groupID, messageID).
		Delete(&model.GroupPinnedMessage{}).Error
}

// GetGroupPinnedMessages 获取群置顶消息列表
func (r *PinnedRepository) GetGroupPinnedMessages(groupID string) ([]model.GroupPinnedMessage, error) {
	var pins []model.GroupPinnedMessage
	if err := r.db.Where("group_id = ?", groupID).
		Order("created_at DESC").
		Find(&pins).Error; err != nil {
		return nil, err
	}
	return pins, nil
}

// IsPinned 检查消息是否已置顶
func (r *PinnedRepository) IsPinned(groupID string, messageID uint) (bool, error) {
	var count int64
	err := r.db.Model(&model.GroupPinnedMessage{}).
		Where("group_id = ? AND message_id = ?", groupID, messageID).
		Count(&count).Error
	return count > 0, err
}
