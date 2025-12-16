package repository

import (
	"im-backend/internal/model"
	"time"

	"gorm.io/gorm"
)

type GroupRepository struct {
	db *gorm.DB
}

func NewGroupRepository(db *gorm.DB) *GroupRepository {
	return &GroupRepository{db: db}
}

// ==================== Group 相关方法 ====================

// CreateGroup 创建群组
func (r *GroupRepository) CreateGroup(group *model.Group) error {
	return r.db.Create(group).Error
}

// GetGroupByID 根据群组ID获取群组信息
func (r *GroupRepository) GetGroupByID(groupID string) (*model.Group, error) {
	var group model.Group
	err := r.db.Where("group_id = ?", groupID).
		Preload("Owner").
		First(&group).Error
	if err != nil {
		return nil, err
	}
	return &group, nil
}

// GetGroupByIDWithMembers 根据群组ID获取群组信息（包含成员）
func (r *GroupRepository) GetGroupByIDWithMembers(groupID string) (*model.Group, error) {
	var group model.Group
	err := r.db.Where("group_id = ?", groupID).
		Preload("Owner").
		Preload("Members.User").
		First(&group).Error
	if err != nil {
		return nil, err
	}
	return &group, nil
}

// UpdateGroup 更新群组信息
func (r *GroupRepository) UpdateGroup(groupID string, updates map[string]interface{}) error {
	return r.db.Model(&model.Group{}).
		Where("group_id = ?", groupID).
		Updates(updates).Error
}

// DeleteGroup 删除群组（软删除）
func (r *GroupRepository) DeleteGroup(groupID string) error {
	return r.db.Where("group_id = ?", groupID).Delete(&model.Group{}).Error
}

// GetUserGroups 获取用户加入的群组列表
func (r *GroupRepository) GetUserGroups(userID string, page, pageSize int) ([]model.Group, error) {
	var groups []model.Group
	offset := (page - 1) * pageSize

	err := r.db.Table("groups").
		Select("groups.*").
		Joins("JOIN group_members ON groups.group_id = group_members.group_id").
		Where("group_members.user_id = ? AND group_members.deleted_at IS NULL", userID).
		Preload("Owner").
		Order("groups.updated_at DESC").
		Offset(offset).
		Limit(pageSize).
		Find(&groups).Error

	return groups, err
}

// SearchGroups 搜索公开群组
func (r *GroupRepository) SearchGroups(keyword string, page, pageSize int) ([]model.Group, error) {
	var groups []model.Group
	offset := (page - 1) * pageSize

	query := r.db.Where("is_public = ?", true)
	if keyword != "" {
		query = query.Where("name LIKE ? OR group_id LIKE ?", "%"+keyword+"%", "%"+keyword+"%")
	}

	err := query.Preload("Owner").
		Order("member_count DESC").
		Offset(offset).
		Limit(pageSize).
		Find(&groups).Error

	return groups, err
}

// UpdateMemberCount 更新群成员数量
func (r *GroupRepository) UpdateMemberCount(groupID string, delta int) error {
	return r.db.Model(&model.Group{}).
		Where("group_id = ?", groupID).
		UpdateColumn("member_count", gorm.Expr("member_count + ?", delta)).Error
}

// ==================== GroupMember 相关方法 ====================

// AddGroupMember 添加群成员
func (r *GroupRepository) AddGroupMember(member *model.GroupMember) error {
	return r.db.Create(member).Error
}

// GetGroupMember 获取群成员信息
func (r *GroupRepository) GetGroupMember(groupID, userID string) (*model.GroupMember, error) {
	var member model.GroupMember
	err := r.db.Where("group_id = ? AND user_id = ?", groupID, userID).
		Preload("User").
		First(&member).Error
	if err != nil {
		return nil, err
	}
	return &member, nil
}

// GetGroupMembers 获取群成员列表
func (r *GroupRepository) GetGroupMembers(groupID string, page, pageSize int) ([]model.GroupMember, error) {
	var members []model.GroupMember
	offset := (page - 1) * pageSize

	err := r.db.Where("group_id = ?", groupID).
		Preload("User").
		Order("role DESC, joined_at ASC").
		Offset(offset).
		Limit(pageSize).
		Find(&members).Error

	return members, err
}

// UpdateGroupMember 更新群成员信息
func (r *GroupRepository) UpdateGroupMember(groupID, userID string, updates map[string]interface{}) error {
	return r.db.Model(&model.GroupMember{}).
		Where("group_id = ? AND user_id = ?", groupID, userID).
		Updates(updates).Error
}

// RemoveGroupMember 移除群成员
func (r *GroupRepository) RemoveGroupMember(groupID, userID string) error {
	return r.db.Where("group_id = ? AND user_id = ?", groupID, userID).
		Delete(&model.GroupMember{}).Error
}

// IsGroupMember 检查用户是否为群成员
func (r *GroupRepository) IsGroupMember(groupID, userID string) (bool, error) {
	var count int64
	err := r.db.Model(&model.GroupMember{}).
		Where("group_id = ? AND user_id = ?", groupID, userID).
		Count(&count).Error
	return count > 0, err
}

// GetMemberRole 获取用户在群组中的角色
func (r *GroupRepository) GetMemberRole(groupID, userID string) (int, error) {
	var member model.GroupMember
	err := r.db.Select("role").
		Where("group_id = ? AND user_id = ?", groupID, userID).
		First(&member).Error
	if err != nil {
		return 0, err
	}
	return member.Role, nil
}

// ==================== GroupMessage 相关方法 ====================

// CreateGroupMessage 创建群消息
func (r *GroupRepository) CreateGroupMessage(message *model.GroupMessage) error {
	return r.db.Create(message).Error
}

// GetGroupMessageByID 根据ID获取群消息
func (r *GroupRepository) GetGroupMessageByID(messageID uint) (*model.GroupMessage, error) {
	var message model.GroupMessage
	err := r.db.Where("id = ?", messageID).
		Preload("FromUser").
		Preload("Group").
		First(&message).Error
	if err != nil {
		return nil, err
	}
	return &message, nil
}

// GetGroupMessages 获取群消息列表
func (r *GroupRepository) GetGroupMessages(groupID string, page, pageSize int) ([]model.GroupMessage, error) {
	var messages []model.GroupMessage
	offset := (page - 1) * pageSize

	err := r.db.Where("group_id = ?", groupID).
		Preload("FromUser").
		Order("created_at ASC").
		Offset(offset).
		Limit(pageSize).
		Find(&messages).Error

	return messages, err
}

// GetLatestGroupMessages 获取群组最新N条消息
func (r *GroupRepository) GetLatestGroupMessages(groupID string, limit int) ([]model.GroupMessage, error) {
	var messages []model.GroupMessage

	err := r.db.Where("group_id = ?", groupID).
		Preload("FromUser").
		Order("created_at DESC").
		Limit(limit).
		Find(&messages).Error

	// 反转顺序，让最新的消息在最后
	for i, j := 0, len(messages)-1; i < j; i, j = i+1, j-1 {
		messages[i], messages[j] = messages[j], messages[i]
	}

	return messages, err
}

// RecallGroupMessage 撤回群消息
func (r *GroupRepository) RecallGroupMessage(messageID uint) error {
	now := time.Now()
	return r.db.Model(&model.GroupMessage{}).
		Where("id = ?", messageID).
		Updates(map[string]interface{}{
			"is_recalled": true,
			"recalled_at": now,
		}).Error
}

// DeleteGroupMessage 删除群消息（软删除）
func (r *GroupRepository) DeleteGroupMessage(messageID uint) error {
	return r.db.Delete(&model.GroupMessage{}, messageID).Error
}

// ==================== GroupMessageRead 相关方法 ====================

// MarkGroupMessageAsRead 标记群消息为已读
func (r *GroupRepository) MarkGroupMessageAsRead(messageID uint, userID string) error {
	read := &model.GroupMessageRead{
		MessageID: messageID,
		UserID:    userID,
		ReadAt:    time.Now(),
		CreatedAt: time.Now(),
	}

	// 使用 ON CONFLICT DO NOTHING 避免重复插入
	return r.db.Create(read).Error
}

// GetGroupMessageReadUsers 获取已读群消息的用户列表
func (r *GroupRepository) GetGroupMessageReadUsers(messageID uint) ([]model.GroupMessageRead, error) {
	var reads []model.GroupMessageRead
	err := r.db.Where("message_id = ?", messageID).
		Preload("User").
		Order("read_at ASC").
		Find(&reads).Error
	return reads, err
}

// GetUserUnreadGroupMessages 获取用户在群组中的未读消息数
func (r *GroupRepository) GetUserUnreadGroupMessages(groupID, userID string) (int64, error) {
	var count int64

	// 获取用户加入群组的时间
	var member model.GroupMember
	err := r.db.Select("joined_at").
		Where("group_id = ? AND user_id = ?", groupID, userID).
		First(&member).Error
	if err != nil {
		return 0, err
	}

	// 统计加入时间之后的消息中，用户未读的消息数
	err = r.db.Table("group_messages").
		Where("group_id = ? AND created_at > ? AND from_user_id != ?", groupID, member.JoinedAt, userID).
		Where("id NOT IN (?)",
			r.db.Table("group_message_reads").
				Select("message_id").
				Where("user_id = ?", userID),
		).
		Count(&count).Error

	return count, err
}

// BatchMarkGroupMessagesAsRead 批量标记群消息为已读
func (r *GroupRepository) BatchMarkGroupMessagesAsRead(groupID, userID string, beforeTime time.Time) error {
	// 获取用户加入群组的时间
	var member model.GroupMember
	err := r.db.Select("joined_at").
		Where("group_id = ? AND user_id = ?", groupID, userID).
		First(&member).Error
	if err != nil {
		return err
	}

	// 获取需要标记为已读的消息ID列表
	var messageIDs []uint
	err = r.db.Table("group_messages").
		Select("id").
		Where("group_id = ? AND created_at > ? AND created_at <= ? AND from_user_id != ?",
			groupID, member.JoinedAt, beforeTime, userID).
		Where("id NOT IN (?)",
			r.db.Table("group_message_reads").
				Select("message_id").
				Where("user_id = ?", userID),
		).
		Pluck("id", &messageIDs).Error

	if err != nil || len(messageIDs) == 0 {
		return err
	}

	// 批量插入已读记录
	var reads []model.GroupMessageRead
	now := time.Now()
	for _, messageID := range messageIDs {
		reads = append(reads, model.GroupMessageRead{
			MessageID: messageID,
			UserID:    userID,
			ReadAt:    now,
			CreatedAt: now,
		})
	}

	return r.db.CreateInBatches(reads, 100).Error
}
