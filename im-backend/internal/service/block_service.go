package service

import (
	"errors"
	"im-backend/internal/model"
	"im-backend/internal/repository"
	"time"
)

type BlockService struct {
	blockRepo *repository.BlockRepository
	userRepo  *repository.UserRepository
}

func NewBlockService(blockRepo *repository.BlockRepository, userRepo *repository.UserRepository) *BlockService {
	return &BlockService{
		blockRepo: blockRepo,
		userRepo:  userRepo,
	}
}

// BlockUser 屏蔽用户
func (s *BlockService) BlockUser(userID, blockedUserID string) error {
	if userID == blockedUserID {
		return errors.New("不能屏蔽自己")
	}

	// 检查目标用户是否存在
	targetUser, err := s.userRepo.FindByUserID(blockedUserID)
	if err != nil || targetUser == nil {
		return errors.New("目标用户不存在")
	}

	// 检查是否已屏蔽
	alreadyBlocked, err := s.blockRepo.IsBlocked(userID, blockedUserID)
	if err != nil {
		return err
	}
	if alreadyBlocked {
		return errors.New("已屏蔽该用户")
	}

	block := &model.Block{
		UserID:        userID,
		BlockedUserID: blockedUserID,
		CreatedAt:     time.Now(),
	}
	return s.blockRepo.CreateBlock(block)
}

// UnblockUser 取消屏蔽
func (s *BlockService) UnblockUser(userID, blockedUserID string) error {
	alreadyBlocked, err := s.blockRepo.IsBlocked(userID, blockedUserID)
	if err != nil {
		return err
	}
	if !alreadyBlocked {
		return errors.New("屏蔽关系不存在")
	}

	return s.blockRepo.DeleteBlock(userID, blockedUserID)
}

// GetBlockedList 获取屏蔽列表
func (s *BlockService) GetBlockedList(userID string) ([]model.Block, error) {
	return s.blockRepo.GetBlockedList(userID)
}

// IsBlocked 检查是否被屏蔽
func (s *BlockService) IsBlocked(userID, targetID string) (bool, error) {
	return s.blockRepo.IsBlockedByEither(userID, targetID)
}
