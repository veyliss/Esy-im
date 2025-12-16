# API 快速参考手册

## 🚀 快速开始

### 1. 安装依赖并配置

```bash
# 复制环境变量文件
cp .env.example .env.local

# 编辑 .env.local，设置后端地址
# NEXT_PUBLIC_API_BASE=http://localhost:8080/api/v1
# NEXT_PUBLIC_WS_URL=ws://localhost:8080/api/v1

# 安装依赖
npm install
```

### 2. 基础导入

```typescript
// API模块
import { AuthAPI } from '@/lib/api/auth';
import { UserAPI } from '@/lib/api/user';
import { FriendAPI } from '@/lib/api/friend';
import { MomentAPI } from '@/lib/api/moment';
import { MessageAPI } from '@/lib/api/message';

// WebSocket
import { getWSClient } from '@/lib/websocket/client';

// 错误处理
import { handleApiError, ErrorCode } from '@/lib/utils/errors';

// 类型
import type { User, Friend, Message, Moment } from '@/lib/types/api';

// 状态管理
import { useAuthStore } from '@/lib/store';
```

---

## 📋 API速查表

### 认证相关 (AuthAPI)

| 方法 | 参数 | 说明 |
|------|------|------|
| `loginByPassword` | `{ email, password }` | 密码登录 |
| `loginByCode` | `{ email, code }` | 验证码登录 |
| `sendEmailCode` | `email` | 发送验证码 |
| `verifyCode` | `{ email, code }` | 验证验证码 |
| `registerByCode` | `{ email, code, user_id, nickname }` | 验证码注册 |
| `registerByPassword` | `{ email, user_id, nickname, password }` | 密码注册 |
| `setPassword` | `{ email, password }` | 设置/修改密码 |
| `logout` | - | 登出 |
| `getCurrentUser` | - | 获取当前用户 |

### 用户相关 (UserAPI)

| 方法 | 参数 | 说明 |
|------|------|------|
| `getMe` | - | 获取当前用户信息 |
| `updateProfile` | `{ nickname?, avatar? }` | 更新用户信息 |
| `searchUser` | `userId` | 搜索用户 |

### 好友系统 (FriendAPI)

| 方法 | 参数 | 说明 |
|------|------|------|
| `sendRequest` | `{ to_user_id, message? }` | 发送好友请求 |
| `acceptRequest` | `{ request_id }` | 接受好友请求 |
| `rejectRequest` | `{ request_id }` | 拒绝好友请求 |
| `getFriendList` | - | 获取好友列表 |
| `deleteFriend` | `friendId` | 删除好友 |
| `updateRemark` | `{ friend_id, remark }` | 更新备注 |
| `getReceivedRequests` | `status?` | 获取收到的请求 |
| `getSentRequests` | `status?` | 获取发出的请求 |
| `searchFriend` | `userId` | 搜索好友 |

### 朋友圈 (MomentAPI)

| 方法 | 参数 | 说明 |
|------|------|------|
| `createMoment` | `{ content, images?, location?, visible? }` | 发布动态 |
| `getMoment` | `id` | 获取动态详情 |
| `getMyMoments` | `{ page?, page_size? }` | 获取我的动态 |
| `getTimeline` | `{ page?, page_size? }` | 获取时间线 |
| `deleteMoment` | `id` | 删除动态 |
| `likeMoment` | `id` | 点赞 |
| `unlikeMoment` | `id` | 取消点赞 |
| `getLikeList` | `id` | 获取点赞列表 |
| `commentMoment` | `id, { content, reply_to_id? }` | 评论 |
| `getCommentList` | `id` | 获取评论列表 |
| `deleteComment` | `commentId` | 删除评论 |

### 消息系统 (MessageAPI)

| 方法 | 参数 | 说明 |
|------|------|------|
| `sendMessage` | `{ to_user_id, message_type, content, media_url? }` | 发送消息 |
| `getConversationList` | `{ page?, page_size? }` | 获取会话列表 |
| `getOrCreateConversation` | `{ friend_user_id }` | 获取/创建会话 |
| `getConversationMessages` | `conversationId, { page?, page_size? }` | 获取会话消息 |
| `markConversationAsRead` | `conversationId` | 标记已读 |
| `recallMessage` | `messageId` | 撤回消息 |
| `deleteMessage` | `messageId` | 删除消息 |
| `getUnreadCount` | - | 获取未读数 |

---

## 🔑 错误码速查

| 错误码 | 说明 | 处理建议 |
|--------|------|---------|
| 0 | 成功 | - |
| 4001 | 请求参数错误 | 检查参数格式 |
| 4002 | 未授权 | 重新登录 |
| 4104 | Token无效 | 重新登录 |
| 4105 | Token过期 | 重新登录 |
| 4101 | 用户不存在 | 提示用户 |
| 4102 | 用户已存在 | 提示更换用户名 |
| 4103 | 密码错误 | 提示重新输入 |
| 4106 | 验证码无效 | 重新发送 |
| 4107 | 验证码过期 | 重新发送 |
| 4201 | 好友不存在 | 提示用户 |
| 4202 | 已是好友 | 提示用户 |
| 5000 | 服务器错误 | 稍后重试 |

---

## 💡 代码片段

### 1. 完整登录流程

```typescript
const handleLogin = async (email: string, password: string) => {
  try {
    const res = await AuthAPI.loginByPassword({ email, password });
    const { token, user } = res.data.data;
    useAuthStore.getState().setToken(token);
    router.push('/');
  } catch (error) {
    const err = handleApiError(error);
    toast.error(err.message);
  }
};
```

### 2. 发送消息

```typescript
const sendMsg = async (toUserId: string, content: string) => {
  try {
    await MessageAPI.sendMessage({
      to_user_id: toUserId,
      message_type: MessageType.TEXT,
      content,
    });
  } catch (error) {
    console.error(handleApiError(error));
  }
};
```

### 3. WebSocket连接

```typescript
useEffect(() => {
  const ws = getWSClient();
  ws.connect(token);
  
  ws.on('message', (data) => {
    console.log('新消息', data);
  });
  
  return () => ws.disconnect();
}, [token]);
```

### 4. 获取好友列表

```typescript
const { data: friends } = useQuery({
  queryKey: ['friends'],
  queryFn: async () => {
    const res = await FriendAPI.getFriendList();
    return res.data.data;
  },
});
```

### 5. 发布朋友圈

```typescript
const publishMoment = async (content: string, images: string[]) => {
  try {
    await MomentAPI.createMoment({
      content,
      images: JSON.stringify(images),
      visible: 1,
    });
    toast.success('发布成功');
  } catch (error) {
    toast.error(handleApiError(error).message);
  }
};
```

---

## 🎯 常用Hook示例

### useAuth

```typescript
function useAuth() {
  const { token, setToken, clearToken } = useAuthStore();
  
  const login = async (email: string, password: string) => {
    const res = await AuthAPI.loginByPassword({ email, password });
    setToken(res.data.data.token);
    return res.data.data.user;
  };
  
  const logout = () => {
    AuthAPI.logout().finally(() => clearToken());
  };
  
  return { token, login, logout };
}
```

### useMessages

```typescript
function useMessages(conversationId: number) {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      const res = await MessageAPI.getConversationMessages(conversationId);
      return res.data.data;
    },
  });
}
```

### useFriends

```typescript
function useFriends() {
  const queryClient = useQueryClient();
  
  const { data: friends } = useQuery({
    queryKey: ['friends'],
    queryFn: async () => {
      const res = await FriendAPI.getFriendList();
      return res.data.data;
    },
  });
  
  const addFriend = useMutation({
    mutationFn: (data: { to_user_id: string; message: string }) =>
      FriendAPI.sendRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
  });
  
  return { friends, addFriend };
}
```

---

## ⚙️ 配置选项

### HTTP客户端配置

```typescript
// lib/http.ts
export const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### WebSocket配置

```typescript
const ws = getWSClient({
  url: 'ws://localhost:8080/api/v1',
  heartbeatInterval: 30000,      // 30秒心跳
  reconnectInterval: 3000,        // 3秒重连
  maxReconnectAttempts: 5,        // 最多5次
  debug: true,                    // 开启调试
});
```

---

## 📝 TypeScript类型

### 主要类型定义

```typescript
interface User {
  id: number;
  user_id: string;
  email: string;
  nickname: string;
  avatar: string;
}

interface Friend {
  id: number;
  user_id: string;
  friend_id: string;
  remark: string;
  friend_user?: User;
}

interface Message {
  id: number;
  conversation_id: number;
  from_user_id: string;
  to_user_id: string;
  message_type: MessageType;
  content: string;
  is_read: boolean;
  from_user?: User;
}

interface Moment {
  id: number;
  user_id: string;
  content: string;
  images: string; // JSON字符串
  visible: 0 | 1 | 2;
  like_count: number;
  comment_count: number;
  user?: User;
}

enum MessageType {
  TEXT = 1,
  IMAGE = 2,
  AUDIO = 3,
  VIDEO = 4,
  FILE = 5,
}
```

---

## 🔍 调试技巧

### 1. 查看网络请求

浏览器 DevTools → Network → XHR/Fetch

### 2. WebSocket调试

```typescript
const ws = getWSClient({ debug: true });
// 会在控制台输出详细日志
```

### 3. 错误追踪

```typescript
try {
  await SomeAPI.method();
} catch (error) {
  const apiError = handleApiError(error);
  console.log('错误码:', apiError.code);
  console.log('错误信息:', apiError.message);
  console.log('详细信息:', apiError.detail);
}
```

### 4. 响应拦截器

HTTP客户端已配置响应拦截器，自动处理：
- ✅ 401自动跳转登录
- ✅ 业务错误自动转换
- ✅ 错误日志自动记录

---

## 📚 更多资源

- [完整API文档](./FRONTEND_API_INTEGRATION.md)
- [后端API文档](../im-backend/API_DOCUMENTATION.md)
- [后端消息API文档](../im-backend/MESSAGE_API_DOCUMENTATION.md)

---

**快速开发，事半功倍！** ⚡
