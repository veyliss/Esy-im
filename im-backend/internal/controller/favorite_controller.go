package controller

import (
	"im-backend/internal/model"
	"im-backend/internal/service"
)

type FavoriteController struct {
	favService    *service.FavoriteService
	pinnedService *service.PinnedService
}

func NewFavoriteController(favService *service.FavoriteService, pinnedService *service.PinnedService) *FavoriteController {
	return &FavoriteController{
		favService:    favService,
		pinnedService: pinnedService,
	}
}

// ==================== 收藏 ====================

func (c *FavoriteController) AddFavorite(userID string, messageID uint) error {
	return c.favService.AddFavorite(userID, messageID)
}

func (c *FavoriteController) RemoveFavorite(userID string, messageID uint) error {
	return c.favService.RemoveFavorite(userID, messageID)
}

func (c *FavoriteController) GetUserFavorites(userID string, page, pageSize int) ([]model.MessageFavorite, int64, error) {
	return c.favService.GetUserFavorites(userID, page, pageSize)
}

// ==================== 群置顶 ====================

func (c *FavoriteController) PinMessage(groupID, userID string, messageID uint) error {
	return c.pinnedService.PinMessage(groupID, userID, messageID)
}

func (c *FavoriteController) UnpinMessage(groupID, userID string, messageID uint) error {
	return c.pinnedService.UnpinMessage(groupID, userID, messageID)
}

func (c *FavoriteController) GetGroupPinnedMessages(groupID string) ([]model.GroupPinnedMessage, error) {
	return c.pinnedService.GetGroupPinnedMessages(groupID)
}
