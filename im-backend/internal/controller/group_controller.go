package controller

import (
	"im-backend/internal/service"
)

type GroupController struct {
	groupService *service.GroupService
}

func NewGroupController(groupService *service.GroupService) *GroupController {
	return &GroupController{groupService: groupService}
}

// ==================== Group 管理 ====================

// CreateGroup 创建群组
func (c *GroupController) CreateGroup(ownerID, name, description, avatar string, maxMembers int, isPublic, joinApproval bool) (interface{}, error) {
	return c.groupService.CreateGroup(ownerID, name, description, avatar, maxMembers, isPublic, joinApproval)
}

// GetGroupInfo 获取群组信息
func (c *GroupController) GetGroupInfo(groupID, userID string) (interface{}, error) {
	return c.groupService.GetGroupInfo(groupID, userID)
}

// UpdateGroupInfo 更新群组信息
func (c *GroupController) UpdateGroupInfo(groupID, userID, name, description, avatar string) error {
	return c.groupService.UpdateGroupInfo(groupID, userID, name, description, avatar)
}

// DeleteGroup 解散群组
func (c *GroupController) DeleteGroup(groupID, userID string) error {
	return c.groupService.DeleteGroup(groupID, userID)
}

// GetUserGroups 获取用户加入的群组列表
func (c *GroupController) GetUserGroups(userID string, page, pageSize int) (interface{}, error) {
	return c.groupService.GetUserGroups(userID, page, pageSize)
}

// SearchGroups 搜索群组
func (c *GroupController) SearchGroups(keyword string, page, pageSize int) (interface{}, error) {
	return c.groupService.SearchGroups(keyword, page, pageSize)
}

// ==================== Group Member 管理 ====================

// JoinGroup 加入群组
func (c *GroupController) JoinGroup(groupID, userID string) error {
	return c.groupService.JoinGroup(groupID, userID)
}

// LeaveGroup 退出群组
func (c *GroupController) LeaveGroup(groupID, userID string) error {
	return c.groupService.LeaveGroup(groupID, userID)
}

// KickMember 踢出成员
func (c *GroupController) KickMember(groupID, operatorID, targetUserID string) error {
	return c.groupService.KickMember(groupID, operatorID, targetUserID)
}

// SetMemberRole 设置成员角色
func (c *GroupController) SetMemberRole(groupID, operatorID, targetUserID string, newRole int) error {
	return c.groupService.SetMemberRole(groupID, operatorID, targetUserID, newRole)
}

// GetGroupMembers 获取群成员列表
func (c *GroupController) GetGroupMembers(groupID, userID string, page, pageSize int) (interface{}, error) {
	return c.groupService.GetGroupMembers(groupID, userID, page, pageSize)
}

// ==================== Group Message 管理 ====================

// SendGroupMessage 发送群消息
func (c *GroupController) SendGroupMessage(groupID, fromUserID string, messageType int, content, mediaURL, atUsers string) (interface{}, error) {
	return c.groupService.SendGroupMessage(groupID, fromUserID, messageType, content, mediaURL, atUsers)
}

// GetGroupMessages 获取群消息历史
func (c *GroupController) GetGroupMessages(groupID, userID string, page, pageSize int) (interface{}, error) {
	return c.groupService.GetGroupMessages(groupID, userID, page, pageSize)
}

// RecallGroupMessage 撤回群消息
func (c *GroupController) RecallGroupMessage(messageID uint, userID string) error {
	return c.groupService.RecallGroupMessage(messageID, userID)
}

// MarkGroupMessagesAsRead 标记群消息为已读
func (c *GroupController) MarkGroupMessagesAsRead(groupID, userID string) error {
	return c.groupService.MarkGroupMessagesAsRead(groupID, userID)
}

// GetUserUnreadGroupMessages 获取用户在群组中的未读消息数
func (c *GroupController) GetUserUnreadGroupMessages(groupID, userID string) (interface{}, error) {
	return c.groupService.GetUserUnreadGroupMessages(groupID, userID)
}
