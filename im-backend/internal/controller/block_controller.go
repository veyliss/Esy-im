package controller

import (
	"im-backend/internal/service"
)

type BlockController struct {
	blockService *service.BlockService
}

func NewBlockController(blockService *service.BlockService) *BlockController {
	return &BlockController{blockService: blockService}
}

// BlockUser 屏蔽用户
func (c *BlockController) BlockUser(userID, blockedUserID string) error {
	return c.blockService.BlockUser(userID, blockedUserID)
}

// UnblockUser 取消屏蔽
func (c *BlockController) UnblockUser(userID, blockedUserID string) error {
	return c.blockService.UnblockUser(userID, blockedUserID)
}

// GetBlockedList 获取屏蔽列表
func (c *BlockController) GetBlockedList(userID string) (interface{}, error) {
	return c.blockService.GetBlockedList(userID)
}
