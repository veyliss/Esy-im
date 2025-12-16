package controller

import (
	"im-backend/internal/service"
)

type FriendController struct {
	friendService *service.FriendService
}

func NewFriendController(friendService *service.FriendService) *FriendController {
	return &FriendController{friendService: friendService}
}

// SendRequest 发送好友请求
func (c *FriendController) SendRequest(fromUserID, toUserID, message string) error {
	return c.friendService.SendFriendRequest(fromUserID, toUserID, message)
}

// AcceptRequest 接受好友请求
func (c *FriendController) AcceptRequest(requestID uint, userID string) error {
	return c.friendService.AcceptFriendRequest(requestID, userID)
}

// RejectRequest 拒绝好友请求
func (c *FriendController) RejectRequest(requestID uint, userID string) error {
	return c.friendService.RejectFriendRequest(requestID, userID)
}

// GetFriendList 获取好友列表
func (c *FriendController) GetFriendList(userID string) (interface{}, error) {
	return c.friendService.GetFriendList(userID)
}

// DeleteFriend 删除好友
func (c *FriendController) DeleteFriend(userID, friendID string) error {
	return c.friendService.DeleteFriend(userID, friendID)
}

// UpdateRemark 更新好友备注
func (c *FriendController) UpdateRemark(userID, friendID, remark string) error {
	return c.friendService.UpdateFriendRemark(userID, friendID, remark)
}

// GetReceivedRequests 获取收到的好友请求
func (c *FriendController) GetReceivedRequests(userID string, status int) (interface{}, error) {
	return c.friendService.GetReceivedRequests(userID, status)
}

// GetSentRequests 获取发出的好友请求
func (c *FriendController) GetSentRequests(userID string, status int) (interface{}, error) {
	return c.friendService.GetSentRequests(userID, status)
}

// SearchFriend 搜索好友
func (c *FriendController) SearchFriend(userID string) (interface{}, error) {
	return c.friendService.SearchFriend(userID)
}
