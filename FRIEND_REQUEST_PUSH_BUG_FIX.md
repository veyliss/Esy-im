# 好友请求推送Bug修复记录

## 🐛 问题描述

用户反馈"依旧接收不到好友请求",即使实现了WebSocket推送功能。

## 🔍 问题分析

经过排查,发现了**关键问题**:

### WebSocket连接标识不匹配

1. **WebSocket Hub的客户端管理**
   - Hub使用 `Email` 作为客户端的唯一标识
   - 在 `message_handler.go` 中,WebSocket连接时:
     ```go
     userID = claims.Email  // 使用Email作为UserID
     client := &pkg.Client{
         UserID: userID,  // 这里的UserID实际是Email
         // ...
     }
     ```

2. **好友请求推送使用了错误的标识**
   - 在 `friend_service.go` 中,推送通知时使用的是 `user_id` 字段:
     ```go
     pkg.GlobalHub.SendFriendRequest(toUserID, notificationData)
     // toUserID是用户的user_id字段,而不是email
     ```

3. **结果**
   - Hub中没有以 `user_id` 为键的客户端连接
   - 推送失败,用户收不到通知

## ✅ 解决方案

### 修改推送时的用户标识查询

在发送WebSocket推送前,需要先查询目标用户的Email,然后使用Email来推送:

```go
// 修改前
toUser, _ := s.userRepo.FindByUserID(toUserID)
pkg.GlobalHub.SendFriendRequest(toUserID, notificationData)  // ❌ 错误

// 修改后  
toUser, _ := s.userRepo.FindByUserID(toUserID)
pkg.GlobalHub.SendFriendRequest(toUser.Email, notificationData)  // ✅ 正确
```

### 修改的位置

**文件: `/im-backend/internal/service/friend_service.go`**

#### 1. SendFriendRequest 方法
```go
// 通过WebSocket推送通知给接收方
if pkg.GlobalHub != nil {
    // 查询发送方和接收方的用户信息
    fromUser, _ := s.userRepo.FindByUserID(fromUserID)
    toUser, _ := s.userRepo.FindByUserID(toUserID)
    if fromUser != nil && toUser != nil {
        // 构造通知数据
        notificationData := map[string]interface{}{
            // ...
        }
        // 重要:WebSocket连接使用Email作为标识,不是user_id
        pkg.GlobalHub.SendFriendRequest(toUser.Email, notificationData)
    }
}
```

#### 2. AcceptFriendRequest 方法
```go
// 通过WebSocket通知发送方请求已被接受
if pkg.GlobalHub != nil {
    // 查询接受方和发送方的用户信息
    acceptUser, _ := s.userRepo.FindByUserID(userID)
    fromUser, _ := s.userRepo.FindByUserID(req.FromUserID)
    if acceptUser != nil && fromUser != nil {
        // 构造通知数据
        notificationData := map[string]interface{}{
            // ...
        }
        // 重要:WebSocket连接使用Email作为标识,不是user_id
        pkg.GlobalHub.SendFriendAccepted(fromUser.Email, notificationData)
    }
}
```

## 🧪 验证方法

### 1. 查看后端日志

启动后端后,应该能看到:
```
✅ 用户 alice@test.com 已连接 WebSocket
📨 发送好友请求通知给用户 bob@test.com
✅ 发送好友请求接受通知给用户 alice@test.com
```

注意:现在显示的是Email地址,而不是user_id

### 2. 测试流程

**重要:必须重启后端服务才能生效!**

```bash
# 停止旧的后端进程
# 启动新的后端
cd im-backend
go run cmd/server/main.go
```

**测试步骤:**
1. 用户A登录 (alice@test.com / alice)
2. 用户B登录 (bob@test.com / bob)
3. 用户A发送好友请求给用户B
4. 用户B **立即收到**好友请求通知 ✅
5. 用户B接受好友请求
6. 用户A **立即收到**接受通知 ✅

## 📊 技术细节

### Hub客户端管理机制

```go
// Hub.Clients 的数据结构
type Hub struct {
    Clients map[string]*Client  // key是Email,不是user_id
}

// 注册客户端时
client := &Client{
    UserID: claims.Email,  // 使用Email
}
hub.Clients[client.UserID] = client  // Email作为key

// 推送消息时
client := hub.Clients[userEmail]  // 必须用Email查找
```

### 为什么使用Email作为标识?

1. **JWT Token中包含Email**
   - Token的claims中存储的是Email
   - 验证Token后直接得到Email

2. **Email是唯一标识**
   - 每个用户的Email是唯一的
   - 可以直接用于WebSocket连接管理

3. **统一性**
   - 避免在不同地方使用不同的标识符
   - 减少混淆

## ⚠️ 重要提醒

### 1. 系统中的两种用户标识

**User ID (user_id):**
- 用户自定义的ID (如 "alice", "bob")
- 用于好友系统、消息系统的业务逻辑
- 数据库中的标识

**Email:**
- 用户注册时的邮箱
- 用于认证和WebSocket连接标识
- JWT Token中的标识

### 2. 推送规则

**推送WebSocket消息时,必须使用Email:**
```go
// ✅ 正确
user, _ := userRepo.FindByUserID(userID)
hub.SendToUser(user.Email, message)

// ❌ 错误
hub.SendToUser(userID, message)
```

### 3. 其他可能需要修改的地方

检查所有使用 `GlobalHub.SendToUser`、`SendFriendRequest`、`SendFriendAccepted` 的地方,确保传入的是Email而不是user_id。

## 📝 相关文件

- `/im-backend/internal/service/friend_service.go` - ✅ 已修复
- `/im-backend/internal/handler/message_handler.go` - WebSocket连接处理
- `/im-backend/internal/pkg/websocket.go` - Hub实现
- `/im-backend/internal/pkg/middleware.go` - JWT认证

## ✅ 修复状态

- ✅ 好友请求推送 - 已修复
- ✅ 好友接受推送 - 已修复
- ✅ 用户标识统一 - 已确认

---

**修复时间:** 2025-12-05  
**问题等级:** 🔴 Critical (核心功能无法使用)  
**修复状态:** ✅ 已完成

现在好友请求推送应该可以正常工作了! 🎉
