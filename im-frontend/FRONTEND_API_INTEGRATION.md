# 前端API对接文档

## 概述

本文档说明前端如何使用已封装的API模块与后端服务进行交互。

## 目录结构

```
lib/
├── api/
│   ├── index.ts          # HTTP客户端导出
│   ├── auth.ts          # 认证相关API
│   ├── user.ts          # 用户相关API
│   ├── friend.ts        # 好友系统API
│   ├── moment.ts        # 朋友圈API
│   └── message.ts       # 消息系统API
├── types/
│   └── api.ts           # API类型定义
├── utils/
│   └── errors.ts        # 错误处理工具
├── websocket/
│   └── client.ts        # WebSocket客户端
├── http.ts              # HTTP客户端配置
└── store.ts             # 状态管理
```

---

## 1. 环境配置

### 1.1 环境变量

在项目根目录创建 `.env.local` 文件：

```env
# API配置
NEXT_PUBLIC_API_BASE=http://localhost:8080/api/v1

# WebSocket配置
NEXT_PUBLIC_WS_URL=ws://localhost:8080/api/v1

# 应用配置
NEXT_PUBLIC_APP_NAME=Esy-IM
NEXT_PUBLIC_APP_VERSION=1.1.0
```

### 1.2 CORS配置

确保后端已配置CORS，允许前端域名访问。

---

## 2. 认证流程

### 2.1 密码登录

```typescript
import { AuthAPI } from '@/lib/api/auth';
import { useAuthStore } from '@/lib/store';
import { handleApiError } from '@/lib/utils/errors';

async function handleLogin(email: string, password: string) {
  try {
    const response = await AuthAPI.loginByPassword({ email, password });
    const { token, user } = response.data.data;
    
    // 保存Token
    useAuthStore.getState().setToken(token);
    
    // 保存用户信息到状态
    console.log('登录成功', user);
    
    // 跳转到主页
    router.push('/');
  } catch (error) {
    const apiError = handleApiError(error);
    console.error('登录失败', apiError.message);
    // 显示错误提示
  }
}
```

### 2.2 验证码登录

```typescript
// 1. 发送验证码
async function sendCode(email: string) {
  try {
    await AuthAPI.sendEmailCode(email);
    console.log('验证码已发送');
  } catch (error) {
    const apiError = handleApiError(error);
    console.error('发送失败', apiError.message);
  }
}

// 2. 使用验证码登录
async function loginWithCode(email: string, code: string) {
  try {
    const response = await AuthAPI.loginByCode({ email, code });
    const { token, user } = response.data.data;
    
    useAuthStore.getState().setToken(token);
    console.log('登录成功', user);
  } catch (error) {
    const apiError = handleApiError(error);
    console.error('登录失败', apiError.message);
  }
}
```

### 2.3 注册

```typescript
async function register(data: {
  email: string;
  code: string;
  user_id: string;
  nickname: string;
}) {
  try {
    await AuthAPI.registerByCode(data);
    console.log('注册成功，请登录');
    // 跳转到登录页
  } catch (error) {
    const apiError = handleApiError(error);
    console.error('注册失败', apiError.message);
  }
}
```

### 2.4 登出

```typescript
async function logout() {
  try {
    await AuthAPI.logout();
    useAuthStore.getState().clearToken();
    router.push('/login');
  } catch (error) {
    // 即使失败也清除本地Token
    useAuthStore.getState().clearToken();
    router.push('/login');
  }
}
```

---

## 3. 用户API

### 3.1 获取当前用户信息

```typescript
import { UserAPI } from '@/lib/api/user';

async function getCurrentUser() {
  try {
    const response = await UserAPI.getMe();
    const user = response.data.data;
    console.log('用户信息', user);
    return user;
  } catch (error) {
    const apiError = handleApiError(error);
    console.error('获取失败', apiError.message);
  }
}
```

### 3.2 更新用户信息

```typescript
async function updateProfile(nickname: string, avatar: string) {
  try {
    await UserAPI.updateProfile({ nickname, avatar });
    console.log('更新成功');
  } catch (error) {
    const apiError = handleApiError(error);
    console.error('更新失败', apiError.message);
  }
}
```

---

## 4. 好友系统

### 4.1 搜索并添加好友

```typescript
import { FriendAPI } from '@/lib/api/friend';

// 1. 搜索好友
async function searchFriend(userId: string) {
  try {
    const response = await FriendAPI.searchFriend(userId);
    const friend = response.data.data;
    return friend;
  } catch (error) {
    const apiError = handleApiError(error);
    console.error('搜索失败', apiError.message);
  }
}

// 2. 发送好友请求
async function sendFriendRequest(toUserId: string, message: string) {
  try {
    await FriendAPI.sendRequest({
      to_user_id: toUserId,
      message,
    });
    console.log('请求已发送');
  } catch (error) {
    const apiError = handleApiError(error);
    console.error('发送失败', apiError.message);
  }
}
```

### 4.2 处理好友请求

```typescript
// 获取收到的请求
async function getReceivedRequests() {
  try {
    const response = await FriendAPI.getReceivedRequests(0); // 0-待处理
    const requests = response.data.data;
    return requests;
  } catch (error) {
    const apiError = handleApiError(error);
    console.error('获取失败', apiError.message);
  }
}

// 接受请求
async function acceptRequest(requestId: number) {
  try {
    await FriendAPI.acceptRequest({ request_id: requestId });
    console.log('已接受好友请求');
  } catch (error) {
    const apiError = handleApiError(error);
    console.error('操作失败', apiError.message);
  }
}

// 拒绝请求
async function rejectRequest(requestId: number) {
  try {
    await FriendAPI.rejectRequest({ request_id: requestId });
    console.log('已拒绝好友请求');
  } catch (error) {
    const apiError = handleApiError(error);
    console.error('操作失败', apiError.message);
  }
}
```

### 4.3 好友列表管理

```typescript
// 获取好友列表
async function getFriendList() {
  try {
    const response = await FriendAPI.getFriendList();
    const friends = response.data.data;
    return friends;
  } catch (error) {
    const apiError = handleApiError(error);
    console.error('获取失败', apiError.message);
  }
}

// 更新备注
async function updateRemark(friendId: string, remark: string) {
  try {
    await FriendAPI.updateRemark({ friend_id: friendId, remark });
    console.log('备注已更新');
  } catch (error) {
    const apiError = handleApiError(error);
    console.error('更新失败', apiError.message);
  }
}

// 删除好友
async function deleteFriend(friendId: string) {
  try {
    await FriendAPI.deleteFriend(friendId);
    console.log('已删除好友');
  } catch (error) {
    const apiError = handleApiError(error);
    console.error('删除失败', apiError.message);
  }
}
```

---

## 5. 朋友圈

### 5.1 发布动态

```typescript
import { MomentAPI } from '@/lib/api/moment';

async function createMoment(content: string, images: string[], location?: string) {
  try {
    await MomentAPI.createMoment({
      content,
      images: JSON.stringify(images), // 需要转为JSON字符串
      location,
      visible: 1, // 0-所有人 1-仅好友 2-私密
    });
    console.log('发布成功');
  } catch (error) {
    const apiError = handleApiError(error);
    console.error('发布失败', apiError.message);
  }
}
```

### 5.2 获取动态列表

```typescript
// 获取时间线（自己和好友的动态）
async function getTimeline(page: number = 1) {
  try {
    const response = await MomentAPI.getTimeline({ page, page_size: 20 });
    const moments = response.data.data;
    return moments;
  } catch (error) {
    const apiError = handleApiError(error);
    console.error('获取失败', apiError.message);
  }
}

// 获取自己的动态
async function getMyMoments(page: number = 1) {
  try {
    const response = await MomentAPI.getMyMoments({ page, page_size: 20 });
    const moments = response.data.data;
    return moments;
  } catch (error) {
    const apiError = handleApiError(error);
    console.error('获取失败', apiError.message);
  }
}
```

### 5.3 点赞和评论

```typescript
// 点赞
async function likeMoment(momentId: number) {
  try {
    await MomentAPI.likeMoment(momentId);
    console.log('点赞成功');
  } catch (error) {
    const apiError = handleApiError(error);
    console.error('点赞失败', apiError.message);
  }
}

// 取消点赞
async function unlikeMoment(momentId: number) {
  try {
    await MomentAPI.unlikeMoment(momentId);
    console.log('已取消点赞');
  } catch (error) {
    const apiError = handleApiError(error);
    console.error('操作失败', apiError.message);
  }
}

// 评论
async function commentMoment(momentId: number, content: string, replyToId?: number) {
  try {
    await MomentAPI.commentMoment(momentId, {
      content,
      reply_to_id: replyToId || null,
    });
    console.log('评论成功');
  } catch (error) {
    const apiError = handleApiError(error);
    console.error('评论失败', apiError.message);
  }
}
```

---

## 6. 消息系统

### 6.1 发送消息

```typescript
import { MessageAPI } from '@/lib/api/message';
import { MessageType } from '@/lib/types/api';

async function sendMessage(toUserId: string, content: string) {
  try {
    const response = await MessageAPI.sendMessage({
      to_user_id: toUserId,
      message_type: MessageType.TEXT,
      content,
    });
    const message = response.data.data;
    return message;
  } catch (error) {
    const apiError = handleApiError(error);
    console.error('发送失败', apiError.message);
  }
}
```

### 6.2 会话管理

```typescript
// 获取会话列表
async function getConversations() {
  try {
    const response = await MessageAPI.getConversationList();
    const conversations = response.data.data;
    return conversations;
  } catch (error) {
    const apiError = handleApiError(error);
    console.error('获取失败', apiError.message);
  }
}

// 获取或创建会话
async function getOrCreateConversation(friendUserId: string) {
  try {
    const response = await MessageAPI.getOrCreateConversation({
      friend_user_id: friendUserId,
    });
    const conversation = response.data.data;
    return conversation;
  } catch (error) {
    const apiError = handleApiError(error);
    console.error('操作失败', apiError.message);
  }
}

// 获取会话消息
async function getConversationMessages(conversationId: number, page: number = 1) {
  try {
    const response = await MessageAPI.getConversationMessages(conversationId, {
      page,
      page_size: 50,
    });
    const messages = response.data.data;
    return messages;
  } catch (error) {
    const apiError = handleApiError(error);
    console.error('获取失败', apiError.message);
  }
}

// 标记为已读
async function markAsRead(conversationId: number) {
  try {
    await MessageAPI.markConversationAsRead(conversationId);
  } catch (error) {
    console.error('标记失败', error);
  }
}
```

### 6.3 未读消息

```typescript
async function getUnreadCount() {
  try {
    const response = await MessageAPI.getUnreadCount();
    const { count } = response.data.data;
    return count;
  } catch (error) {
    console.error('获取失败', error);
    return 0;
  }
}
```

---

## 7. WebSocket实时通信

### 7.1 基本使用

```typescript
import { getWSClient } from '@/lib/websocket/client';
import { useAuthStore } from '@/lib/store';

// 在组件中使用
function ChatComponent() {
  const { token } = useAuthStore();
  const wsClient = getWSClient({ debug: true });

  useEffect(() => {
    if (token) {
      // 连接WebSocket
      wsClient.connect(token);

      // 监听新消息
      wsClient.on('message', (data) => {
        console.log('收到新消息', data);
        // 更新UI显示新消息
      });

      // 监听连接状态
      wsClient.on('open', () => {
        console.log('WebSocket已连接');
      });

      wsClient.on('close', () => {
        console.log('WebSocket已断开');
      });

      wsClient.on('error', (error) => {
        console.error('WebSocket错误', error);
      });

      wsClient.on('reconnect', ({ attempt }) => {
        console.log(`正在重连 (${attempt}次)`);
      });

      // 组件卸载时断开连接
      return () => {
        wsClient.disconnect();
      };
    }
  }, [token]);

  return <div>聊天界面</div>;
}
```

### 7.2 高级用法

```typescript
// 创建自定义Hook
function useWebSocket() {
  const { token } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!token) return;

    const ws = getWSClient({
      heartbeatInterval: 30000,
      reconnectInterval: 3000,
      maxReconnectAttempts: 5,
      debug: process.env.NODE_ENV === 'development',
    });

    ws.connect(token);

    const handleMessage = (data: WSMessageData) => {
      setMessages(prev => [...prev, data]);
    };

    const handleOpen = () => setIsConnected(true);
    const handleClose = () => setIsConnected(false);

    ws.on('message', handleMessage);
    ws.on('open', handleOpen);
    ws.on('close', handleClose);

    return () => {
      ws.off('message', handleMessage);
      ws.off('open', handleOpen);
      ws.off('close', handleClose);
      ws.disconnect();
    };
  }, [token]);

  return { messages, isConnected };
}

// 在组件中使用
function Chat() {
  const { messages, isConnected } = useWebSocket();

  return (
    <div>
      <div>连接状态: {isConnected ? '已连接' : '未连接'}</div>
      <div>
        {messages.map(msg => (
          <div key={msg.id}>{msg.content}</div>
        ))}
      </div>
    </div>
  );
}
```

---

## 8. 错误处理

### 8.1 统一错误处理

```typescript
import { handleApiError, shouldRelogin, ErrorCode } from '@/lib/utils/errors';

async function someApiCall() {
  try {
    const response = await SomeAPI.someMethod();
    return response.data.data;
  } catch (error) {
    const apiError = handleApiError(error);
    
    // 根据错误码进行处理
    if (shouldRelogin(apiError.code)) {
      // 需要重新登录
      router.push('/login');
    } else if (apiError.code === ErrorCode.FRIEND_EXISTS) {
      // 特定业务错误处理
      console.log('已经是好友了');
    } else {
      // 通用错误提示
      toast.error(apiError.message);
    }
    
    throw apiError;
  }
}
```

### 8.2 全局错误拦截

HTTP客户端已经配置了全局错误拦截器，会自动处理：
- 401未授权 -> 清除Token并跳转登录
- 业务错误码 -> 自动转换为ApiError
- 网络错误 -> 统一错误提示

---

## 9. 最佳实践

### 9.1 使用React Query (推荐)

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FriendAPI } from '@/lib/api/friend';

// 获取好友列表
function useFriendList() {
  return useQuery({
    queryKey: ['friends'],
    queryFn: async () => {
      const response = await FriendAPI.getFriendList();
      return response.data.data;
    },
  });
}

// 发送好友请求
function useSendFriendRequest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { to_user_id: string; message: string }) =>
      FriendAPI.sendRequest(data),
    onSuccess: () => {
      // 刷新好友列表
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
  });
}

// 在组件中使用
function FriendList() {
  const { data: friends, isLoading } = useFriendList();
  const sendRequest = useSendFriendRequest();

  const handleAddFriend = (userId: string) => {
    sendRequest.mutate({
      to_user_id: userId,
      message: '你好',
    });
  };

  if (isLoading) return <div>加载中...</div>;

  return (
    <div>
      {friends?.map(friend => (
        <div key={friend.id}>{friend.friend_user?.nickname}</div>
      ))}
    </div>
  );
}
```

### 9.2 类型安全

所有API都有完整的TypeScript类型定义，充分利用类型提示：

```typescript
import type { Friend, User, Message } from '@/lib/types/api';

const friend: Friend = {
  id: 1,
  user_id: 'user1',
  friend_id: 'user2',
  remark: '好友',
  created_at: '2025-10-20',
  updated_at: '2025-10-20',
};
```

---

## 10. 常见问题

### Q1: Token过期怎么办？

A: HTTP客户端会自动处理401错误，清除Token并跳转登录页。

### Q2: WebSocket断线重连？

A: WebSocket客户端内置了自动重连机制，最多尝试5次。

### Q3: 如何处理分页？

A: 使用PaginationParams类型，传入page和page_size参数。

### Q4: 图片上传怎么处理？

A: 先上传图片到文件服务器获取URL，再将URL保存到数据库。

### Q5: 如何调试API调用？

A: 
1. 检查浏览器开发工具的Network标签
2. 开启WebSocket的debug模式
3. 查看控制台错误日志

---

## 11. 更新日志

### v1.1.0 (2025-10-20)
- ✅ 完成所有API模块封装
- ✅ 实现WebSocket客户端
- ✅ 添加统一错误处理
- ✅ 完善TypeScript类型定义

---

**祝开发顺利！** 🎉
