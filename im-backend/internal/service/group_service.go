package service

import (
	"errors"
	"fmt"
	"im-backend/internal/model"
	"im-backend/internal/repository"
	"math/rand"
	"time"
)

type GroupService struct {
	groupRepo  *repository.GroupRepository
	friendRepo *repository.FriendRepository
	userRepo   *repository.UserRepository
}

func NewGroupService(groupRepo *repository.GroupRepository, friendRepo *repository.FriendRepository, userRepo *repository.UserRepository) *GroupService {
	return &GroupService{
		groupRepo:  groupRepo,
		friendRepo: friendRepo,
		userRepo:   userRepo,
	}
}

// ==================== Group 管理 ====================

// CreateGroup 创建群组
func (s *GroupService) CreateGroup(ownerID, name, description, avatar string, maxMembers int, isPublic, joinApproval bool) (*model.Group, error) {
	// 验证群组名称
	if name == "" {
		return nil, errors.New("群组名称不能为空")
	}
	if len(name) > 100 {
		return nil, errors.New("群组名称不能超过100个字符")
	}

	// 生成群组ID
	groupID := generateGroupID()

	// 创建群组
	group := &model.Group{
		GroupID:      groupID,
		Name:         name,
		Description:  description,
		Avatar:       avatar,
		OwnerID:      ownerID,
		MaxMembers:   maxMembers,
		MemberCount:  1, // 群主算一个成员
		IsPublic:     isPublic,
		JoinApproval: joinApproval,
		CreatedAt:    time.Now(),
	}

	if err := s.groupRepo.CreateGroup(group); err != nil {
		return nil, err
	}

	// 添加群主为成员
	member := &model.GroupMember{
		GroupID:   groupID,
		UserID:    ownerID,
		Role:      model.GroupRoleOwner,
		JoinedAt:  time.Now(),
		CreatedAt: time.Now(),
	}

	if err := s.groupRepo.AddGroupMember(member); err != nil {
		return nil, err
	}

	// 重新加载群组信息（包含关联数据）
	return s.groupRepo.GetGroupByID(groupID)
}

// GetGroupInfo 获取群组信息
func (s *GroupService) GetGroupInfo(groupID, userID string) (*model.Group, error) {
	// 检查用户是否为群成员
	isMember, err := s.groupRepo.IsGroupMember(groupID, userID)
	if err != nil {
		return nil, err
	}
	if !isMember {
		return nil, errors.New("您不是该群组的成员")
	}

	return s.groupRepo.GetGroupByIDWithMembers(groupID)
}

// UpdateGroupInfo 更新群组信息
func (s *GroupService) UpdateGroupInfo(groupID, userID, name, description, avatar string) error {
	// 检查权限（只有群主和管理员可以修改）
	role, err := s.groupRepo.GetMemberRole(groupID, userID)
	if err != nil {
		return errors.New("您不是该群组的成员")
	}
	if role < model.GroupRoleAdmin {
		return errors.New("只有管理员和群主可以修改群组信息")
	}

	updates := make(map[string]interface{})
	if name != "" {
		if len(name) > 100 {
			return errors.New("群组名称不能超过100个字符")
		}
		updates["name"] = name
	}
	if description != "" {
		updates["description"] = description
	}
	if avatar != "" {
		updates["avatar"] = avatar
	}

	if len(updates) == 0 {
		return errors.New("没有需要更新的信息")
	}

	return s.groupRepo.UpdateGroup(groupID, updates)
}

// DeleteGroup 解散群组
func (s *GroupService) DeleteGroup(groupID, userID string) error {
	// 检查权限（只有群主可以解散群组）
	role, err := s.groupRepo.GetMemberRole(groupID, userID)
	if err != nil {
		return errors.New("您不是该群组的成员")
	}
	if role != model.GroupRoleOwner {
		return errors.New("只有群主可以解散群组")
	}

	return s.groupRepo.DeleteGroup(groupID)
}

// GetUserGroups 获取用户加入的群组列表
func (s *GroupService) GetUserGroups(userID string, page, pageSize int) ([]model.Group, error) {
	return s.groupRepo.GetUserGroups(userID, page, pageSize)
}

// SearchGroups 搜索群组
func (s *GroupService) SearchGroups(keyword string, page, pageSize int) ([]model.Group, error) {
	return s.groupRepo.SearchGroups(keyword, page, pageSize)
}

// ==================== Group Member 管理 ====================

// JoinGroup 加入群组
func (s *GroupService) JoinGroup(groupID, userID string) (*model.Group, error) {
	// 检查群组是否存在
	group, err := s.groupRepo.GetGroupByID(groupID)
	if err != nil {
		return nil, errors.New("群组不存在")
	}

	// 检查是否已经是成员
	isMember, err := s.groupRepo.IsGroupMember(groupID, userID)
	if err != nil {
		return nil, err
	}
	if isMember {
		return nil, errors.New("您已经是该群组的成员")
	}

	// 检查群组是否已满
	if group.MemberCount >= group.MaxMembers {
		return nil, errors.New("群组人数已满")
	}

	// 如果是私有群组且需要审批，这里应该创建加入申请而不是直接加入
	if !group.IsPublic || group.JoinApproval {
		return nil, errors.New("该群组需要审批才能加入")
	}

	// 添加成员
	member := &model.GroupMember{
		GroupID:   groupID,
		UserID:    userID,
		Role:      model.GroupRoleMember,
		JoinedAt:  time.Now(),
		CreatedAt: time.Now(),
	}

	if err := s.groupRepo.AddGroupMember(member); err != nil {
		return nil, err
	}

	// 更新群成员数量
	if err := s.groupRepo.UpdateMemberCount(groupID, 1); err != nil {
		return nil, err
	}

	return s.groupRepo.GetGroupByID(groupID)
}

// LeaveGroup 退出群组
func (s *GroupService) LeaveGroup(groupID, userID string) error {
	// 检查是否为群成员
	role, err := s.groupRepo.GetMemberRole(groupID, userID)
	if err != nil {
		return errors.New("您不是该群组的成员")
	}

	// 群主不能直接退出，需要先转让群主
	if role == model.GroupRoleOwner {
		return errors.New("群主不能直接退出群组，请先转让群主身份")
	}

	// 移除成员
	if err := s.groupRepo.RemoveGroupMember(groupID, userID); err != nil {
		return err
	}

	// 更新群成员数量
	return s.groupRepo.UpdateMemberCount(groupID, -1)
}

// KickMember 踢出成员
func (s *GroupService) KickMember(groupID, operatorID, targetUserID string) error {
	// 检查操作者权限
	operatorRole, err := s.groupRepo.GetMemberRole(groupID, operatorID)
	if err != nil {
		return errors.New("您不是该群组的成员")
	}
	if operatorRole < model.GroupRoleAdmin {
		return errors.New("只有管理员和群主可以踢出成员")
	}

	// 检查目标用户是否为群成员
	targetRole, err := s.groupRepo.GetMemberRole(groupID, targetUserID)
	if err != nil {
		return errors.New("目标用户不是该群组的成员")
	}

	// 不能踢出群主
	if targetRole == model.GroupRoleOwner {
		return errors.New("不能踢出群主")
	}

	// 管理员不能踢出其他管理员，只有群主可以
	if operatorRole == model.GroupRoleAdmin && targetRole == model.GroupRoleAdmin {
		return errors.New("管理员不能踢出其他管理员")
	}

	// 移除成员
	if err := s.groupRepo.RemoveGroupMember(groupID, targetUserID); err != nil {
		return err
	}

	// 更新群成员数量
	return s.groupRepo.UpdateMemberCount(groupID, -1)
}

// SetMemberRole 设置成员角色
func (s *GroupService) SetMemberRole(groupID, operatorID, targetUserID string, newRole int) error {
	// 检查操作者权限（只有群主可以设置角色）
	operatorRole, err := s.groupRepo.GetMemberRole(groupID, operatorID)
	if err != nil {
		return errors.New("您不是该群组的成员")
	}
	if operatorRole != model.GroupRoleOwner {
		return errors.New("只有群主可以设置成员角色")
	}

	// 检查目标用户是否为群成员
	_, err = s.groupRepo.GetMemberRole(groupID, targetUserID)
	if err != nil {
		return errors.New("目标用户不是该群组的成员")
	}

	// 不能设置自己的角色
	if operatorID == targetUserID {
		return errors.New("不能设置自己的角色")
	}

	// 验证角色值
	if newRole < model.GroupRoleMember || newRole > model.GroupRoleAdmin {
		return errors.New("无效的角色值")
	}

	updates := map[string]interface{}{
		"role": newRole,
	}

	return s.groupRepo.UpdateGroupMember(groupID, targetUserID, updates)
}

// GetGroupMembers 获取群成员列表
func (s *GroupService) GetGroupMembers(groupID, userID string, page, pageSize int) ([]model.GroupMember, error) {
	// 检查用户是否为群成员
	isMember, err := s.groupRepo.IsGroupMember(groupID, userID)
	if err != nil {
		return nil, err
	}
	if !isMember {
		return nil, errors.New("您不是该群组的成员")
	}

	return s.groupRepo.GetGroupMembers(groupID, page, pageSize)
}

// ==================== Group Message 管理 ====================

// SendGroupMessage 发送群消息
func (s *GroupService) SendGroupMessage(groupID, fromUserID string, messageType int, content, mediaURL, atUsers string) (*model.GroupMessage, error) {
	// 检查用户是否为群成员
	member, err := s.groupRepo.GetGroupMember(groupID, fromUserID)
	if err != nil {
		return nil, errors.New("您不是该群组的成员")
	}

	// 检查是否被禁言
	if member.IsMuted {
		if member.MutedUntil != nil && time.Now().Before(*member.MutedUntil) {
			return nil, errors.New("您已被禁言，无法发送消息")
		}
		// 如果禁言时间已过，自动解除禁言
		if member.MutedUntil != nil && time.Now().After(*member.MutedUntil) {
			updates := map[string]interface{}{
				"is_muted":    false,
				"muted_until": nil,
			}
			s.groupRepo.UpdateGroupMember(groupID, fromUserID, updates)
		}
	}

	// 创建消息
	message := &model.GroupMessage{
		GroupID:     groupID,
		FromUserID:  fromUserID,
		MessageType: messageType,
		Content:     content,
		MediaURL:    mediaURL,
		AtUsers:     atUsers,
		CreatedAt:   time.Now(),
	}

	if err := s.groupRepo.CreateGroupMessage(message); err != nil {
		return nil, err
	}

	// 重新加载消息（包含关联数据）
	return s.groupRepo.GetGroupMessageByID(message.ID)
}

// GetGroupMessages 获取群消息历史
func (s *GroupService) GetGroupMessages(groupID, userID string, page, pageSize int) ([]model.GroupMessage, error) {
	// 检查用户是否为群成员
	isMember, err := s.groupRepo.IsGroupMember(groupID, userID)
	if err != nil {
		return nil, err
	}
	if !isMember {
		return nil, errors.New("您不是该群组的成员")
	}

	return s.groupRepo.GetGroupMessages(groupID, page, pageSize)
}

// RecallGroupMessage 撤回群消息
func (s *GroupService) RecallGroupMessage(messageID uint, userID string) error {
	// 获取消息
	message, err := s.groupRepo.GetGroupMessageByID(messageID)
	if err != nil {
		return errors.New("消息不存在")
	}

	// 检查权限（发送者或管理员可以撤回）
	if message.FromUserID != userID {
		role, err := s.groupRepo.GetMemberRole(message.GroupID, userID)
		if err != nil {
			return errors.New("您不是该群组的成员")
		}
		if role < model.GroupRoleAdmin {
			return errors.New("只能撤回自己发送的消息，或管理员可以撤回任何消息")
		}
	}

	// 检查消息是否已经撤回
	if message.IsRecalled {
		return errors.New("消息已被撤回")
	}

	// 检查时间限制（普通成员只能撤回2分钟内的消息，管理员无时间限制）
	if message.FromUserID == userID && time.Since(message.CreatedAt) > 2*time.Minute {
		return errors.New("只能撤回2分钟内的消息")
	}

	return s.groupRepo.RecallGroupMessage(messageID)
}

// MarkGroupMessagesAsRead 标记群消息为已读
func (s *GroupService) MarkGroupMessagesAsRead(groupID, userID string) error {
	// 检查用户是否为群成员
	isMember, err := s.groupRepo.IsGroupMember(groupID, userID)
	if err != nil {
		return err
	}
	if !isMember {
		return errors.New("您不是该群组的成员")
	}

	// 批量标记消息为已读（标记当前时间之前的所有未读消息）
	return s.groupRepo.BatchMarkGroupMessagesAsRead(groupID, userID, time.Now())
}

// GetUserUnreadGroupMessages 获取用户在群组中的未读消息数
func (s *GroupService) GetUserUnreadGroupMessages(groupID, userID string) (int64, error) {
	// 检查用户是否为群成员
	isMember, err := s.groupRepo.IsGroupMember(groupID, userID)
	if err != nil {
		return 0, err
	}
	if !isMember {
		return 0, errors.New("您不是该群组的成员")
	}

	return s.groupRepo.GetUserUnreadGroupMessages(groupID, userID)
}

// ==================== 群邀请 ====================

// InviteToGroup 邀请用户入群
func (s *GroupService) InviteToGroup(groupID, inviterID, inviteeID string) (*model.GroupInvitation, error) {
	// 检查邀请者权限（Admin+）
	role, err := s.groupRepo.GetMemberRole(groupID, inviterID)
	if err != nil {
		return nil, errors.New("您不是该群组的成员")
	}
	if role < model.GroupRoleAdmin {
		return nil, errors.New("只有管理员和群主可以邀请成员")
	}

	// 检查被邀请者是否已是成员
	isMember, _ := s.groupRepo.IsGroupMember(groupID, inviteeID)
	if isMember {
		return nil, errors.New("该用户已是群成员")
	}

	// 检查是否好友关系
	isFriend, _ := s.friendRepo.IsFriend(inviterID, inviteeID)
	if !isFriend {
		return nil, errors.New("只能邀请好友入群")
	}

	// 检查是否已有待处理邀请
	existing, _ := s.groupRepo.FindPendingInvitation(groupID, inviterID, inviteeID)
	if existing != nil {
		return nil, errors.New("已发送过邀请，请等待对方处理")
	}

	inv := &model.GroupInvitation{
		GroupID:       groupID,
		InviterUserID: inviterID,
		InviteeUserID: inviteeID,
		Status:        0,
		CreatedAt:     time.Now(),
	}
	if err := s.groupRepo.CreateGroupInvitation(inv); err != nil {
		return nil, err
	}

	return s.groupRepo.GetGroupInvitationByID(inv.ID)
}

// AcceptGroupInvitation 接受群邀请
func (s *GroupService) AcceptGroupInvitation(invitationID uint, userID string) error {
	inv, err := s.groupRepo.GetGroupInvitationByID(invitationID)
	if err != nil {
		return errors.New("邀请不存在")
	}
	if inv.InviteeUserID != userID {
		return errors.New("无权处理该邀请")
	}
	if inv.Status != 0 {
		return errors.New("该邀请已被处理")
	}

	// 更新状态
	if err := s.groupRepo.UpdateGroupInvitationStatus(invitationID, 1); err != nil {
		return err
	}

	// 加入群组
	member := &model.GroupMember{
		GroupID:   inv.GroupID,
		UserID:    userID,
		Role:      model.GroupRoleMember,
		JoinedAt:  time.Now(),
		CreatedAt: time.Now(),
	}
	if err := s.groupRepo.AddGroupMember(member); err != nil {
		return err
	}
	return s.groupRepo.UpdateMemberCount(inv.GroupID, 1)
}

// RejectGroupInvitation 拒绝群邀请
func (s *GroupService) RejectGroupInvitation(invitationID uint, userID string) error {
	inv, err := s.groupRepo.GetGroupInvitationByID(invitationID)
	if err != nil {
		return errors.New("邀请不存在")
	}
	if inv.InviteeUserID != userID {
		return errors.New("无权处理该邀请")
	}
	if inv.Status != 0 {
		return errors.New("该邀请已被处理")
	}
	return s.groupRepo.UpdateGroupInvitationStatus(invitationID, 2)
}

// GetReceivedInvitations 获取收到的群邀请
func (s *GroupService) GetReceivedInvitations(userID string, status int) ([]model.GroupInvitation, error) {
	return s.groupRepo.GetReceivedInvitations(userID, status)
}

// ==================== 群公告 ====================

// CreateAnnouncement 创建群公告
func (s *GroupService) CreateAnnouncement(groupID, publisherID, content string, isPinned bool) (*model.GroupAnnouncement, error) {
	role, err := s.groupRepo.GetMemberRole(groupID, publisherID)
	if err != nil {
		return nil, errors.New("您不是该群组的成员")
	}
	if role < model.GroupRoleAdmin {
		return nil, errors.New("只有管理员和群主可以发布公告")
	}

	ann := &model.GroupAnnouncement{
		GroupID:     groupID,
		PublisherID: publisherID,
		Content:     content,
		IsPinned:    isPinned,
		CreatedAt:   time.Now(),
	}
	if err := s.groupRepo.CreateAnnouncement(ann); err != nil {
		return nil, err
	}
	return s.groupRepo.GetAnnouncementByID(ann.ID)
}

// GetGroupAnnouncements 获取群公告列表
func (s *GroupService) GetGroupAnnouncements(groupID, userID string, page, pageSize int) ([]model.GroupAnnouncement, error) {
	isMember, err := s.groupRepo.IsGroupMember(groupID, userID)
	if err != nil || !isMember {
		return nil, errors.New("您不是该群组的成员")
	}
	return s.groupRepo.GetGroupAnnouncements(groupID, page, pageSize)
}

// UpdateAnnouncement 更新群公告
func (s *GroupService) UpdateAnnouncement(announcementID uint, userID string, updates map[string]interface{}) error {
	ann, err := s.groupRepo.GetAnnouncementByID(announcementID)
	if err != nil {
		return errors.New("公告不存在")
	}
	role, err := s.groupRepo.GetMemberRole(ann.GroupID, userID)
	if err != nil || role < model.GroupRoleAdmin {
		return errors.New("无权操作公告")
	}
	return s.groupRepo.UpdateAnnouncement(announcementID, updates)
}

// DeleteAnnouncement 删除群公告
func (s *GroupService) DeleteAnnouncement(announcementID uint, userID string) error {
	ann, err := s.groupRepo.GetAnnouncementByID(announcementID)
	if err != nil {
		return errors.New("公告不存在")
	}
	role, err := s.groupRepo.GetMemberRole(ann.GroupID, userID)
	if err != nil || role < model.GroupRoleAdmin {
		return errors.New("无权操作公告")
	}
	return s.groupRepo.DeleteAnnouncement(announcementID)
}

// ==================== 群 Typing ====================

// GetGroupOnlineMembers 获取群在线成员列表（用于 typing 推送）
func (s *GroupService) GetGroupOnlineMembers(groupID string) ([]model.GroupMember, error) {
	return s.groupRepo.GetGroupMembers(groupID, 1, 1000)
}

// ==================== 辅助方法 ====================

// generateGroupID 生成群组ID
func generateGroupID() string {
	// 使用时间戳 + 随机数生成群组ID
	timestamp := time.Now().Unix()
	rand.Seed(time.Now().UnixNano())
	randomNum := rand.Intn(99999999)
	return fmt.Sprintf("G%d%08d", timestamp, randomNum)
}
