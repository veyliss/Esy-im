# 好友请求实时通知功能实现文档

## 📋 概述

已成功实现了基于WebSocket的好友请求实时推送功能,解决了用户无法实时接收好友请求的问题。

## ✨ 功能特性

### 1. 实时通知
- ✅ 当用户A发送好友请求给用户B时,用户B会立即收到WebSocket推送通知
- ✅ 当用户B接受好友请求后,用户A会立即收到WebSocket推送通知
- ✅ 前端自动刷新好友列表和好友请求列表

### 2. 通知类型
- **friend_request**: 收到新的好友请求
- **friend_accepted**: 好友请求被接受

## 🔧 技术实现

### 后端修改

#### 1. WebSocket Hub 扩展 ([`websocket.go`](file:///Users/xiaoxi/Documents/Project/Esy-IM/im-backend/internal/pkg/websocket.go))

新增两个方法用于推送好友相关通知:

```go
// SendFriendRequest 发送好友请求通知
func (h *Hub) SendFriendRequest(userID string, request interface{}) error

// SendFriendAccepted 发送好友请求被接受通知  
func (h *Hub) SendFriendAccepted(userID string, friend interface{}) error
```

#### 2. 好友服务修改 ([`friend_service.go`](file:///Users/xiaoxi/Documents/Project/Esy-IM/im-backend/internal/service/friend_service.go))

**发送好友请求时推送通知:**
```go
// SendFriendRequest 发送好友请求
func (s *FriendService) SendFriendRequest(fromUserID, toUserID, message string) error {
    // ... 创建好友请求 ...
    
    // 通过WebSocket推送通知给接收方
    if pkg.GlobalHub != nil {
        notificationData := map[string]interface{}{
            "id": req.ID,
            "from_user_id": fromUserID,
            "from_user": fromUser,
            // ...
        }
        pkg.GlobalHub.SendFriendRequest(toUserID, notificationData)
    }
}
```

**接受好友请求时推送通知:**
```go
// AcceptFriendRequest 接受好友请求
func (s *FriendService) AcceptFriendRequest(requestID uint, userID string) error {
    // ... 创建好友关系 ...
    
    // 通过WebSocket通知发送方请求已被接受
    if pkg.GlobalHub != nil {
        notificationData := map[string]interface{}{
            "request_id": requestID,
            "friend": acceptUser,
        }
        pkg.GlobalHub.SendFriendAccepted(req.FromUserID, notificationData)
    }
}
```

#### 3. 用户登录接口修复 ([`user_handler.go`](file:///Users/xiaoxi/Documents/Project/Esy-IM/im-backend/internal/handler/user_handler.go))

修复了登录接口字段不匹配的问题:
- 原来期望 `user_id` 字段
- 现在支持 `email` 字段(同时兼容 `user_id`)

### 前端修改

#### 1. WebSocket客户端扩展 ([`client.ts`](file:///Users/xiaoxi/Documents/Project/Esy-IM/im-frontend/lib/websocket/client.ts))

**新增事件处理器:**
```typescript
// 好友请求处理器
onFriendRequest(handler: FriendRequestHandler)
offFriendRequest(handler: FriendRequestHandler)

// 好友接受处理器
onFriendAccepted(handler: FriendAcceptedHandler)
offFriendAccepted(handler: FriendAcceptedHandler)
```

**消息类型处理:**
```typescript
case 'friend_request':
  console.log('📨 收到好友请求:', data.data);
  this.friendRequestHandlers.forEach(handler => handler(data.data));
  break;

case 'friend_accepted':
  console.log('✅ 好友请求已被接受:', data.data);
  this.friendAcceptedHandlers.forEach(handler => handler(data.data));
  break;
```

#### 2. 类型定义更新 ([`api.ts`](file:///Users/xiaoxi/Documents/Project/Esy-IM/im-frontend/lib/types/api.ts))

扩展WebSocket消息类型:
```typescript
export interface WSMessage<T = unknown> {
  type: 'message' | 'ping' | 'pong' | 'typing' | 'friend_request' | 'friend_accepted';
  data?: T;
  timestamp: number;
}
```

#### 3. 联系人页面集成 ([`contacts/page.tsx`](file:///Users/xiaoxi/Documents/Project/Esy-IM/im-frontend/app/contacts/page.tsx))

**WebSocket连接和事件监听:**
```typescript
useEffect(() => {
  if (token) {
    // 连接WebSocket
    wsClient.connect(token);
    
    // 监听好友请求
    const handleFriendRequest = (request: FriendRequest) => {
      loadReceivedRequests();  // 刷新请求列表
      alert(`收到来自 ${request.from_user?.nickname} 的好友请求`);
    };
    
    // 监听好友接受
    const handleFriendAccepted = (data: any) => {
      loadFriends();  // 刷新好友列表
      alert(`${data.friend.nickname} 已同意你的好友请求`);
    };
    
    wsClient.onFriendRequest(handleFriendRequest);
    wsClient.onFriendAccepted(handleFriendAccepted);
    
    // 清理
    return () => {
      wsClient.offFriendRequest(handleFriendRequest);
      wsClient.offFriendAccepted(handleFriendAccepted);
    };
  }
}, [token]);
```

## 🧪 测试方法

### 方式一:使用前端界面测试

1. **启动后端服务**
```bash
cd im-backend
go run cmd/server/main.go
```

2. **启动前端服务**
```bash
cd im-frontend
npm run dev
```

3. **测试步骤:**
   - 打开两个浏览器窗口(或使用无痕模式)
   - 窗口1:登录用户A
   - 窗口2:登录用户B
   - 窗口1:搜索并添加用户B为好友
   - 窗口2:应该**立即**收到好友请求通知(无需刷新页面)
   - 窗口2:接受好友请求
   - 窗口1:应该**立即**收到好友请求被接受的通知

### 方式二:使用测试脚本

已提供测试脚本来创建测试用户:

```bash
# 创建测试用户 (alice, bob, charlie, david, emma)
./create_test_users.sh

# 测试好友请求功能
./test_friend_request_new_users.sh
```

**注意:** 目前测试脚本中的登录功能由于密码哈希问题可能失败,建议使用前端界面测试。

## 📊 数据流程

### 发送好友请求流程

```
用户A                后端服务              用户B
  |                    |                   |
  |-- 发送好友请求 --> |                   |
  |                    |-- 保存到数据库 --> |
  |                    |                   |
  |                    |-- WebSocket推送 -> |
  |<-- 返回成功 ---    |                   |
  |                    |                   |
                                     ↓
                              显示通知 & 刷新列表
```

### 接受好友请求流程

```
用户B                后端服务              用户A
  |                    |                   |
  |-- 接受好友请求 --> |                   |
  |                    |-- 创建好友关系 --> |
  |                    |                   |
  |                    |-- WebSocket推送 -> |
  |<-- 返回成功 ---    |                   |
  |                    |                   |
  ↓                                  ↓
刷新好友列表                  显示通知 & 刷新列表
```

## 🔍 调试技巧

### 后端日志
查看后端控制台,会看到以下日志:
```
✅ 用户 alice 已连接 WebSocket
📨 发送好友请求通知给用户 bob
✅ 发送好友请求接受通知给用户 alice
```

### 前端日志
打开浏览器开发者工具Console,会看到:
```
✅ WebSocket已连接
📨 收到好友请求: {id: 1, from_user_id: "alice", ...}
✅ 好友请求已被接受: {request_id: 1, friend: {...}}
```

### WebSocket连接检查
在浏览器开发者工具的Network标签:
1. 筛选WS (WebSocket)
2. 查看 `messages/ws?token=xxx` 连接状态
3. 查看Messages选项卡中的实时消息

## ⚠️ 注意事项

1. **WebSocket连接要求:**
   - 用户必须已登录并获取有效token
   - WebSocket会在页面加载时自动连接
   - 连接断开会自动重连(最多5次)

2. **离线用户:**
   - 如果接收方不在线,不会收到实时通知
   - 但请求已保存到数据库
   - 下次登录时查询接口会获取到请求

3. **通知方式:**
   - 目前使用alert弹窗通知
   - 建议后续替换为更优雅的toast通知组件

## 🚀 未来优化建议

1. **UI优化:**
   - 使用Toast组件替代alert
   - 添加未读好友请求徽章提示
   - 添加桌面通知(Notification API)

2. **功能增强:**
   - 添加声音提示
   - 支持批量操作好友请求
   - 添加好友请求撤回功能

3. **性能优化:**
   - 实现消息队列,避免频繁刷新
   - 使用增量更新而非全量刷新列表
   - 添加请求去重机制

## 📝 相关文件

### 后端
- `/im-backend/internal/pkg/websocket.go` - WebSocket核心实现
- `/im-backend/internal/service/friend_service.go` - 好友服务
- `/im-backend/internal/handler/user_handler.go` - 用户登录接口

### 前端
- `/im-frontend/lib/websocket/client.ts` - WebSocket客户端
- `/im-frontend/lib/types/api.ts` - 类型定义
- `/im-frontend/app/contacts/page.tsx` - 联系人页面

## ✅ 完成状态

- ✅ 后端WebSocket推送实现
- ✅ 前端WebSocket监听实现
- ✅ 好友请求实时通知
- ✅ 好友接受实时通知
- ✅ 自动刷新列表
- ✅ 用户登录接口修复
- ✅ 类型定义完善

---

**实现完成时间:** 2025-12-05

**功能状态:** ✅ 已完成并可用

现在用户可以实时接收好友请求,无需手动刷新页面! 🎉
