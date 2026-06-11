package service

import (
	"errors"
	"im-backend/internal/model"
	"im-backend/internal/repository"
	"time"
)

type PinnedService struct {
	pinnedRepo *repository.PinnedRepository
	groupRepo  *repository.GroupRepository
}

func NewPinnedService(pinnedRepo *repository.PinnedRepository, groupRepo *repository.GroupRepository) *PinnedService {
	return &PinnedService{
		pinnedRepo: pinnedRepo,
		groupRepo:  groupRepo,
	}
}

// PinMessage 置顶群消息（仅管理员/群主可操作）
func (s *PinnedService) PinMessage(groupID, userID string, messageID uint) error {
	role, err := s.groupRepo.GetMemberRole(groupID, userID)
	if err != nil {
		return errors.New("您不是该群组的成员")
	}
	if role < model.GroupRoleAdmin {
		return errors.New("只有管理员和群主可以置顶消息")
	}

	already, _ := s.pinnedRepo.IsPinned(groupID, messageID)
	if already {
		return errors.New("消息已置顶")
	}

	pin := &model.GroupPinnedMessage{
		GroupID:   groupID,
		MessageID: messageID,
		PinnedBy:  userID,
		CreatedAt: time.Now(),
	}

	return s.pinnedRepo.PinMessage(pin)
}

// UnpinMessage 取消置顶
func (s *PinnedService) UnpinMessage(groupID, userID string, messageID uint) error {
	role, err := s.groupRepo.GetMemberRole(groupID, userID)
	if err != nil {
		return errors.New("您不是该群组的成员")
	}
	if role < model.GroupRoleAdmin {
		return errors.New("只有管理员和群主可以取消置顶")
	}

	return s.pinnedRepo.UnpinMessage(groupID, messageID)
}

// GetGroupPinnedMessages 获取群置顶消息列表
func (s *PinnedService) GetGroupPinnedMessages(groupID string) ([]model.GroupPinnedMessage, error) {
	return s.pinnedRepo.GetGroupPinnedMessages(groupID)
}
