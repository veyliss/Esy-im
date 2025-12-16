package service

import (
	"errors"
	"im-backend/internal/model"
	"im-backend/internal/pkg"
	"im-backend/internal/repository"
	"time"
)

type FriendService struct {
	friendRepo *repository.FriendRepository
	userRepo   *repository.UserRepository
}

func NewFriendService(friendRepo *repository.FriendRepository, userRepo *repository.UserRepository) *FriendService {
	return &FriendService{
		friendRepo: friendRepo,
		userRepo:   userRepo,
	}
}

// SendFriendRequest 发送好友请求
func (s *FriendService) SendFriendRequest(fromUserID, toUserID, message string) error {
	// 不能添加自己为好友
	if fromUserID == toUserID {
		return errors.New("不能添加自己为好友")
	}

	// 检查目标用户是否存在
	toUser, err := s.userRepo.FindByUserID(toUserID)
	if err != nil || toUser == nil {
		return errors.New("目标用户不存在")
	}

	// 检查是否已经是好友
	isFriend, err := s.friendRepo.IsFriend(fromUserID, toUserID)
	if err != nil {
		return err
	}
	if isFriend {
		return errors.New("已经是好友关系")
	}

	// 检查是否存在待处理的请求（正向）
	existingReq, _ := s.friendRepo.FindPendingRequest(fromUserID, toUserID)
	if existingReq != nil {
		return errors.New("已发送过好友请求，请等待对方处理")
	}

	// 检查是否存在反向待处理请求：若存在则直接建立关系并更新该请求为已同意
	reverseReq, _ := s.friendRepo.FindPendingRequest(toUserID, fromUserID)
	if reverseReq != nil {
		// 将反向请求置为已同意
		if err := s.friendRepo.UpdateFriendRequestStatus(reverseReq.ID, 1); err != nil {
			return err
		}

		// 创建双向好友关系（避免重复）
		if !isFriend {
			friend1 := &model.Friend{
				UserID:    fromUserID,
				FriendID:  toUserID,
				CreatedAt: time.Now(),
			}
			friend2 := &model.Friend{
				UserID:    toUserID,
				FriendID:  fromUserID,
				CreatedAt: time.Now(),
			}
			if err := s.friendRepo.CreateFriend(friend1); err != nil {
				return err
			}
			if err := s.friendRepo.CreateFriend(friend2); err != nil {
				return err
			}
		}

		// 通过WebSocket通知双方（按Email标识）
		if pkg.GlobalHub != nil {
			fromUser, _ := s.userRepo.FindByUserID(fromUserID)
			toUserFull, _ := s.userRepo.FindByUserID(toUserID)
			if fromUser != nil && toUserFull != nil {
				// 通知反向请求的发起者（toUserID）：你的请求已被对方接受
				acceptNotification := map[string]interface{}{
					"request_id": reverseReq.ID,
					"friend": map[string]interface{}{
						"user_id":  fromUser.UserID,
						"nickname": fromUser.Nickname,
						"avatar":   fromUser.Avatar,
						"email":    fromUser.Email,
					},
				}
				pkg.GlobalHub.SendFriendAccepted(toUserFull.Email, acceptNotification)

				// 通知当前发起者（fromUserID）：双方已成为好友
				mutualNotification := map[string]interface{}{
					"friend": map[string]interface{}{
						"user_id":  toUserFull.UserID,
						"nickname": toUserFull.Nickname,
						"avatar":   toUserFull.Avatar,
						"email":    toUserFull.Email,
					},
				}
				pkg.GlobalHub.SendFriendAccepted(fromUser.Email, mutualNotification)
			}
		}
		return nil
	}

	// 创建好友请求（无反向待处理时）
	req := &model.FriendRequest{
		FromUserID: fromUserID,
		ToUserID:   toUserID,
		Message:    message,
		Status:     0, // 待处理
		CreatedAt:  time.Now(),
	}

	if err := s.friendRepo.CreateFriendRequest(req); err != nil {
		return err
	}

	// 通过WebSocket推送通知给接收方（按Email标识）
	if pkg.GlobalHub != nil {
		fromUser, _ := s.userRepo.FindByUserID(fromUserID)
		toUserFull, _ := s.userRepo.FindByUserID(toUserID)
		if fromUser != nil && toUserFull != nil {
			notificationData := map[string]interface{}{
				"id":           req.ID,
				"from_user_id": fromUserID,
				"to_user_id":   toUserID,
				"message":      message,
				"status":       0,
				"created_at":   req.CreatedAt,
				"from_user": map[string]interface{}{
					"user_id":  fromUser.UserID,
					"nickname": fromUser.Nickname,
					"avatar":   fromUser.Avatar,
					"email":    fromUser.Email,
				},
			}
			pkg.GlobalHub.SendFriendRequest(toUserFull.Email, notificationData)
		}
	}

	return nil
}

// AcceptFriendRequest 接受好友请求
func (s *FriendService) AcceptFriendRequest(requestID uint, userID string) error {
	// 查询好友请求
	req, err := s.friendRepo.FindFriendRequestByID(requestID)
	if err != nil {
		return errors.New("好友请求不存在")
	}

	// 验证是否是发给当前用户的请求
	if req.ToUserID != userID {
		return errors.New("无权处理该请求")
	}

	// 若已处理直接返回
	if req.Status != 0 {
		return errors.New("该请求已被处理")
	}

	// 检查是否已是好友（可能由反向请求自动建立）
	isFriend, err := s.friendRepo.IsFriend(req.FromUserID, req.ToUserID)
	if err != nil {
		return err
	}

	// 更新当前请求状态为已同意
	if err := s.friendRepo.UpdateFriendRequestStatus(requestID, 1); err != nil {
		return err
	}

	// 同步反向待处理请求为已同意（若存在）
	if reversePending, _ := s.friendRepo.FindPendingRequest(req.ToUserID, req.FromUserID); reversePending != nil {
		_ = s.friendRepo.UpdateFriendRequestStatus(reversePending.ID, 1)
	}

	// 如果尚未成为好友，则创建双向好友关系
	if !isFriend {
		friend1 := &model.Friend{
			UserID:    req.ToUserID,
			FriendID:  req.FromUserID,
			CreatedAt: time.Now(),
		}
		friend2 := &model.Friend{
			UserID:    req.FromUserID,
			FriendID:  req.ToUserID,
			CreatedAt: time.Now(),
		}

		if err := s.friendRepo.CreateFriend(friend1); err != nil {
			return err
		}
		if err := s.friendRepo.CreateFriend(friend2); err != nil {
			return err
		}
	}

	// 通过WebSocket通知发送方请求已被接受（按Email标识）
	if pkg.GlobalHub != nil {
		acceptUser, _ := s.userRepo.FindByUserID(userID)
		fromUser, _ := s.userRepo.FindByUserID(req.FromUserID)
		if acceptUser != nil && fromUser != nil {
			notificationData := map[string]interface{}{
				"request_id": requestID,
				"friend": map[string]interface{}{
					"user_id":  acceptUser.UserID,
					"nickname": acceptUser.Nickname,
					"avatar":   acceptUser.Avatar,
					"email":    acceptUser.Email,
				},
			}
			pkg.GlobalHub.SendFriendAccepted(fromUser.Email, notificationData)
		}
	}

	return nil
}

// RejectFriendRequest 拒绝好友请求
func (s *FriendService) RejectFriendRequest(requestID uint, userID string) error {
	// 查询好友请求
	req, err := s.friendRepo.FindFriendRequestByID(requestID)
	if err != nil {
		return errors.New("好友请求不存在")
	}

	// 验证是否是发给当前用户的请求
	if req.ToUserID != userID {
		return errors.New("无权处理该请求")
	}

	// 检查请求状态
	if req.Status != 0 {
		return errors.New("该请求已被处理")
	}

	// 更新请求状态为已拒绝
	return s.friendRepo.UpdateFriendRequestStatus(requestID, 2)
}

// GetFriendList 获取好友列表
func (s *FriendService) GetFriendList(userID string) ([]model.Friend, error) {
	return s.friendRepo.GetFriendList(userID)
}

// DeleteFriend 删除好友
func (s *FriendService) DeleteFriend(userID, friendID string) error {
	// 检查是否为好友关系
	isFriend, err := s.friendRepo.IsFriend(userID, friendID)
	if err != nil {
		return err
	}
	if !isFriend {
		return errors.New("不是好友关系")
	}

	// 删除双向好友关系
	if err := s.friendRepo.DeleteFriend(userID, friendID); err != nil {
		return err
	}
	if err := s.friendRepo.DeleteFriend(friendID, userID); err != nil {
		return err
	}

	return nil
}

// UpdateFriendRemark 更新好友备注
func (s *FriendService) UpdateFriendRemark(userID, friendID, remark string) error {
	// 检查是否为好友关系
	isFriend, err := s.friendRepo.IsFriend(userID, friendID)
	if err != nil {
		return err
	}
	if !isFriend {
		return errors.New("不是好友关系")
	}

	return s.friendRepo.UpdateFriendRemark(userID, friendID, remark)
}

// GetReceivedRequests 获取收到的好友请求
func (s *FriendService) GetReceivedRequests(userID string, status int) ([]model.FriendRequest, error) {
	return s.friendRepo.GetReceivedRequests(userID, status)
}

// GetSentRequests 获取发出的好友请求
func (s *FriendService) GetSentRequests(userID string, status int) ([]model.FriendRequest, error) {
	return s.friendRepo.GetSentRequests(userID, status)
}

// SearchFriend 搜索好友（根据用户ID或昵称）
func (s *FriendService) SearchFriend(userID string) (*model.User, error) {
	user, err := s.userRepo.FindByUserID(userID)
	if err != nil {
		return nil, errors.New("用户不存在")
	}
	return user, nil
}
