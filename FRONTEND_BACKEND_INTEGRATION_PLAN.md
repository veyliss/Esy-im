# 前后端接口对接完整方案

## 📊 当前状态分析

### 测试结果总结
- **总测试数**: 40
- **通过**: 27 (67.5%)
- **失败**: 13 (32.5%)

### 各模块状态
| 模块 | 通过率 | 状态 |
|------|--------|------|
| 用户管理 | 90.9% | ✅ 良好 |
| 好友关系 | 68.4% | ⚠️ 需优化 |
| 朋友圈 | 25.0% | ❌ 需修复 |
| 消息通信 | 40.0% | ❌ 需修复 |

---

## 🔧 需要修复的后端问题

### 问题1: 朋友圈ID序列化问题 🔴 P0
**现象**: 获取朋友圈列表返回"动态ID格式错误"

**影响范围**:
- `/moments/my-list` - 获取自己的朋友圈
- `/moments/timeline` - 获取朋友圈时间线

**根本原因**: 
Go的uint类型在JSON序列化时可能变成float64，前端期望string或整数

**修复方案**:
```go
// internal/model/moment.go
type Moment struct {
    ID        uint   `gorm:"primaryKey" json:"id,string"` // 序列化为字符串
    // 或者
    ID        int64  `gorm:"primaryKey" json:"id"` // 使用int64
    // ...
}
```

**验证方式**:
```bash
curl -H "Authorization: Bearer <token>" http://localhost:8080/api/v1/moments/my-list
# 检查返回的ID字段格式
```

---

### 问题2: 参数校验不严格 🟡 P1

**需要加强的校验**:

1. **好友请求**:
```go
// internal/service/friend_service.go
func (s *FriendService) SendRequest(fromUserID, toUserID, message string) error {
    // 添加: 不能给自己发请求
    if fromUserID == toUserID {
        return errors.New("不能给自己发送好友请求")
    }
}
```

2. **朋友圈发布**:
```go
// internal/service/moment_service.go
func (s *MomentService) Create(userID, content string, ...) error {
    // 添加: 内容不能为空
    if strings.TrimSpace(content) == "" {
        return errors.New("动态内容不能为空")
    }
}
```

3. **密码强度**:
```go
// internal/service/user_service.go
func (s *UserService) RegisterWithPassword(...) error {
    // 添加: 密码长度至少8位
    if len(password) < 8 {
        return errors.New("密码长度至少8位")
    }
}
```

---

## 🎨 前端页面需要对接的功能

### 1. 聊天页面 (`/chat`)

**需要实现的功能**:
- [ ] 从API获取会话列表
- [ ] 从API获取消息历史
- [ ] 实时发送消息
- [ ] WebSocket实时接收消息
- [ ] 未读消息计数
- [ ] 消息已读状态

**API调用示例**:
```typescript
// app/chat/page.tsx
import { MessageAPI } from "@/lib/api/message";
import { useEffect, useState } from "react";

const [conversations, setConversations] = useState([]);
const [messages, setMessages] = useState([]);

useEffect(() => {
  // 获取会话列表
  const fetchConversations = async () => {
    const res = await MessageAPI.getConversationList({ page: 1, page_size: 20 });
    setConversations(res.data.data);
  };
  fetchConversations();
}, []);
```

---

### 2. 联系人页面 (`/contacts`)

**需要实现的功能**:
- [ ] 显示好友列表
- [ ] 搜索好友
- [ ] 发送好友请求
- [ ] 处理好友请求（接受/拒绝）
- [ ] 查看好友请求列表
- [ ] 更新好友备注
- [ ] 删除好友

**UI参考**: `ui/contacts_screen/code.html`

**实现示例**:
```typescript
// app/contacts/page.tsx
import { FriendAPI } from "@/lib/api/friend";

const [friends, setFriends] = useState([]);
const [requests, setRequests] = useState([]);

// 获取好友列表
const fetchFriends = async () => {
  const res = await FriendAPI.getFriendList();
  setFriends(res.data.data);
};

// 获取好友请求
const fetchRequests = async () => {
  const res = await FriendAPI.getReceivedRequests(0); // 0=待处理
  setRequests(res.data.data);
};

// 接受好友请求
const handleAccept = async (requestId: number) => {
  await FriendAPI.acceptRequest({ request_id: requestId });
  fetchRequests(); // 刷新列表
  fetchFriends();  // 刷新好友列表
};
```

---

### 3. 朋友圈页面 (`/moments`)

**需要实现的功能**:
- [ ] 显示朋友圈时间线
- [ ] 发布朋友圈
- [ ] 上传图片
- [ ] 点赞/取消点赞
- [ ] 评论/回复
- [ ] 删除动态
- [ ] 删除评论

**UI参考**: `ui/moments_screen/code.html`

**实现示例**:
```typescript
// app/moments/page.tsx
import { MomentAPI } from "@/lib/api/moment";

const [moments, setMoments] = useState([]);

// 获取时间线
const fetchTimeline = async () => {
  const res = await MomentAPI.getTimeline({ page: 1, page_size: 20 });
  setMoments(res.data.data);
};

// 发布朋友圈
const handlePost = async (content: string, images?: string[]) => {
  await MomentAPI.createMoment({
    content,
    images: images ? JSON.stringify(images) : undefined,
    visible: 0, // 所有人可见
  });
  fetchTimeline(); // 刷新
};

// 点赞
const handleLike = async (momentId: number) => {
  await MomentAPI.likeMoment(momentId);
  fetchTimeline(); // 刷新
};

// 评论
const handleComment = async (momentId: number, content: string) => {
  await MomentAPI.commentMoment(momentId, { content });
  fetchTimeline(); // 刷新
};
```

---

### 4. 我的页面 (`/me`)

**需要实现的功能**:
- [ ] 显示个人信息
- [ ] 修改个人资料
- [ ] 修改密码
- [ ] 退出登录
- [ ] 设置（主题切换等）

**UI参考**: `ui/my_profile_screen/code.html`

**实现示例**:
```typescript
// app/me/page.tsx
import { AuthAPI } from "@/lib/api/auth";
import { useAuthStore } from "@/lib/store";

const [user, setUser] = useState(null);
const { clearToken } = useAuthStore();

// 获取用户信息
useEffect(() => {
  const fetchUser = async () => {
    const res = await AuthAPI.getCurrentUser();
    setUser(res.data.data);
  };
  fetchUser();
}, []);

// 退出登录
const handleLogout = async () => {
  await AuthAPI.logout();
  clearToken();
  router.push("/login");
};
```

---

## 🔌 WebSocket 实时通信对接

### 客户端实现

```typescript
// lib/websocket/client.ts
import { useAuthStore } from "@/lib/store";
import type { WSMessage, Message } from "@/lib/types/api";

class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private messageHandlers: Array<(message: Message) => void> = [];

  constructor(baseURL: string) {
    // 将 http:// 转换为 ws://
    this.url = baseURL.replace(/^http/, 'ws') + '/messages/ws';
  }

  connect(token: string) {
    if (this.ws) {
      this.disconnect();
    }

    this.ws = new WebSocket(this.url);
    
    this.ws.onopen = () => {
      console.log('✅ WebSocket已连接');
      this.startHeartbeat();
    };

    this.ws.onmessage = (event) => {
      try {
        const data: WSMessage = JSON.parse(event.data);
        
        if (data.type === 'message' && data.data) {
          // 通知所有消息处理器
          this.messageHandlers.forEach(handler => handler(data.data as Message));
        } else if (data.type === 'pong') {
          console.log('❤️ 心跳响应');
        }
      } catch (error) {
        console.error('WebSocket消息解析失败:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('❌ WebSocket已断开');
      this.stopHeartbeat();
      this.scheduleReconnect(token);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket错误:', error);
    };
  }

  disconnect() {
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'ping',
          timestamp: Date.now()
        }));
      }
    }, 30000); // 30秒心跳
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect(token: string) {
    this.reconnectTimer = setTimeout(() => {
      console.log('🔄 尝试重新连接...');
      this.connect(token);
    }, 3000);
  }

  onMessage(handler: (message: Message) => void) {
    this.messageHandlers.push(handler);
  }

  offMessage(handler: (message: Message) => void) {
    this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
  }
}

export const wsClient = new WebSocketClient(
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080/api/v1"
);
```

### 在聊天页面使用WebSocket

```typescript
// app/chat/page.tsx
import { wsClient } from "@/lib/websocket/client";
import { useAuthStore } from "@/lib/store";

const { token } = useAuthStore();

useEffect(() => {
  if (token) {
    // 连接WebSocket
    wsClient.connect(token);

    // 监听新消息
    const handleNewMessage = (message: Message) => {
      console.log('收到新消息:', message);
      // 更新消息列表
      setMessages(prev => [...prev, message]);
      // 播放提示音等
    };

    wsClient.onMessage(handleNewMessage);

    return () => {
      wsClient.offMessage(handleNewMessage);
      wsClient.disconnect();
    };
  }
}, [token]);
```

---

## 📝 实施步骤

### 第一阶段：后端修复 (1-2小时)

1. ✅ 修复朋友圈ID序列化问题
2. ✅ 加强参数校验
3. ✅ 测试验证修复效果

### 第二阶段：前端基础对接 (2-3小时)

1. ✅ 完善错误处理机制
2. ✅ 创建WebSocket客户端
3. ✅ 实现聊天页面基本功能
4. ✅ 实现联系人页面

### 第三阶段：高级功能实现 (3-4小时)

1. ✅ 实现朋友圈完整功能
2. ✅ 实现个人中心页面
3. ✅ 添加图片上传功能
4. ✅ 优化用户体验

### 第四阶段：测试和优化 (2-3小时)

1. ✅ 端到端测试
2. ✅ 性能优化
3. ✅ 错误处理完善
4. ✅ UI/UX调整

---

## 🎯 验收标准

### 功能完整性
- [ ] 所有API端点都有前端调用
- [ ] 所有页面都能正常加载数据
- [ ] WebSocket实时通信正常

### 用户体验
- [ ] 加载状态显示
- [ ] 错误提示友好
- [ ] 操作反馈及时
- [ ] 界面响应流畅

### 代码质量
- [ ] TypeScript类型完整
- [ ] 错误处理完善
- [ ] 代码结构清晰
- [ ] 注释充分

---

## 📚 相关文档

- API文档: `im-backend/API_DOCUMENTATION.md`
- 消息API文档: `im-backend/MESSAGE_API_DOCUMENTATION.md`
- 测试报告: `im-backend/COMPREHENSIVE_API_TEST_SUMMARY.md`
- UI设计: `ui/*/code.html`

---

**创建时间**: 2025-10-23  
**预计完成时间**: 2-3个工作日  
**优先级**: 🔴 高
