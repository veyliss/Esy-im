# 消息管理系统 API 文档

## 概述

本文档详细说明了即时通讯系统消息管理功能的API接口，包括WebSocket实时通信和HTTP RESTful接口。

## 基础信息

- **基础URL**: `http://localhost:8080/api/v1`
- **WebSocket URL**: `ws://localhost:8080/api/v1/messages/ws`
- **认证方式**: Bearer Token（在请求头中添加 `Authorization: Bearer <token>`）

---

## 一、WebSocket 实时通信

### 1.1 建立WebSocket连接

**接口**: `GET /messages/ws`

**需要认证**: 是（通过查询参数或请求头传递Token）

**连接方式**:
```javascript
const token = "your_jwt_token";
const ws = new WebSocket(`ws://localhost:8080/api/v1/messages/ws`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

ws.onopen = function() {
  console.log('WebSocket连接已建立');
};

ws.onmessage = function(event) {
  const data = JSON.parse(event.data);
  console.log('收到消息:', data);
};

ws.onclose = function() {
  console.log('WebSocket连接已关闭');
};

ws.onerror = function(error) {
  console.error('WebSocket错误:', error);
};
```

### 1.2 WebSocket消息格式

#### 接收消息格式
```json
{
  "type": "message",
  "data": {
    "id": 1,
    "conversation_id": 1,
    "from_user_id": "user123",
    "to_user_id": "user456",
    "message_type": 1,
    "content": "你好！",
    "media_url": "",
    "is_read": false,
    "created_at": "2025-10-14T10:00:00Z",
    "from_user": {
      "user_id": "user123",
      "nickname": "发送者",
      "avatar": "头像URL"
    }
  },
  "timestamp": 1697270400
}
```

#### 发送心跳（客户端主动）
```json
{
  "type": "ping",
  "timestamp": 1697270400
}
```

#### 心跳响应（服务端返回）
```json
{
  "type": "pong",
  "timestamp": 1697270400
}
```

#### 正在输入状态
```json
{
  "type": "typing",
  "data": {
    "user_id": "user123",
    "conversation_id": 1
  },
  "timestamp": 1697270400
}
```

---

## 二、HTTP接口

### 2.1 发送消息

**接口**: `POST /messages/send`

**需要认证**: 是

**请求体**:
```json
{
  "to_user_id": "user456",
  "message_type": 1,
  "content": "你好，这是一条测试消息",
  "media_url": ""
}
```

**消息类型说明**:
- `1`: 文本消息
- `2`: 图片消息
- `3`: 语音消息
- `4`: 视频消息
- `5`: 文件消息

**响应示例**:
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "id": 1,
    "conversation_id": 1,
    "from_user_id": "user123",
    "to_user_id": "user456",
    "message_type": 1,
    "content": "你好，这是一条测试消息",
    "media_url": "",
    "is_read": false,
    "created_at": "2025-10-14T10:00:00Z",
    "from_user": {
      "user_id": "user123",
      "nickname": "发送者",
      "avatar": "头像URL"
    },
    "to_user": {
      "user_id": "user456",
      "nickname": "接收者",
      "avatar": "头像URL"
    }
  }
}
```

**说明**: 
- 发送成功后，如果接收方在线，消息会自动通过WebSocket推送给对方
- 只能给好友发送消息

---

### 2.2 获取会话列表

**接口**: `GET /messages/conversations?page=1&page_size=20`

**需要认证**: 是

**查询参数**:
- `page`: 页码，默认1
- `page_size`: 每页数量，默认20

**响应示例**:
```json
{
  "code": 0,
  "msg": "success",
  "data": [
    {
      "id": 1,
      "user1_id": "user123",
      "user2_id": "user456",
      "last_message_id": 100,
      "last_message_time": "2025-10-14T10:30:00Z",
      "user1_unread": 0,
      "user2_unread": 3,
      "created_at": "2025-10-14T08:00:00Z",
      "user1": {
        "user_id": "user123",
        "nickname": "用户1",
        "avatar": "头像URL1"
      },
      "user2": {
        "user_id": "user456",
        "nickname": "用户2",
        "avatar": "头像URL2"
      },
      "last_message": {
        "id": 100,
        "content": "最后一条消息内容",
        "message_type": 1,
        "created_at": "2025-10-14T10:30:00Z",
        "from_user": {
          "user_id": "user456",
          "nickname": "用户2",
          "avatar": "头像URL2"
        }
      }
    }
  ]
}
```

---

### 2.3 获取或创建会话

**接口**: `POST /messages/conversations/create`

**需要认证**: 是

**请求体**:
```json
{
  "friend_user_id": "user456"
}
```

**响应示例**:
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "id": 1,
    "user1_id": "user123",
    "user2_id": "user456",
    "last_message_id": null,
    "last_message_time": null,
    "user1_unread": 0,
    "user2_unread": 0,
    "created_at": "2025-10-14T10:00:00Z",
    "user1": {
      "user_id": "user123",
      "nickname": "用户1",
      "avatar": "头像URL1"
    },
    "user2": {
      "user_id": "user456",
      "nickname": "用户2",
      "avatar": "头像URL2"
    }
  }
}
```

**说明**: 如果会话已存在则返回现有会话，否则创建新会话

---

### 2.4 获取会话消息历史

**接口**: `GET /messages/conversations/{conversation_id}/messages?page=1&page_size=50`

**需要认证**: 是

**路径参数**:
- `conversation_id`: 会话ID

**查询参数**:
- `page`: 页码，默认1
- `page_size`: 每页数量，默认50

**响应示例**:
```json
{
  "code": 0,
  "msg": "success",
  "data": [
    {
      "id": 1,
      "conversation_id": 1,
      "from_user_id": "user123",
      "to_user_id": "user456",
      "message_type": 1,
      "content": "你好！",
      "media_url": "",
      "is_read": true,
      "read_at": "2025-10-14T10:05:00Z",
      "is_recalled": false,
      "created_at": "2025-10-14T10:00:00Z",
      "from_user": {
        "user_id": "user123",
        "nickname": "用户1",
        "avatar": "头像URL1"
      }
    },
    {
      "id": 2,
      "conversation_id": 1,
      "from_user_id": "user456",
      "to_user_id": "user123",
      "message_type": 1,
      "content": "你好，很高兴认识你！",
      "media_url": "",
      "is_read": false,
      "created_at": "2025-10-14T10:02:00Z",
      "from_user": {
        "user_id": "user456",
        "nickname": "用户2",
        "avatar": "头像URL2"
      }
    }
  ]
}
```

**说明**: 消息按时间正序排列（从旧到新）

---

### 2.5 标记会话为已读

**接口**: `PUT /messages/conversations/{conversation_id}/read`

**需要认证**: 是

**路径参数**:
- `conversation_id`: 会话ID

**响应示例**:
```json
{
  "code": 0,
  "msg": "success",
  "data": "已标记为已读"
}
```

**说明**: 
- 将会话中所有未读消息标记为已读
- 清空当前用户在该会话的未读计数

---

### 2.6 撤回消息

**接口**: `PUT /messages/{message_id}/recall`

**需要认证**: 是

**路径参数**:
- `message_id`: 消息ID

**响应示例**:
```json
{
  "code": 0,
  "msg": "success",
  "data": "消息已撤回"
}
```

**限制**:
- 只能撤回自己发送的消息
- 只能撤回2分钟内的消息

---

### 2.7 删除消息

**接口**: `DELETE /messages/{message_id}`

**需要认证**: 是

**路径参数**:
- `message_id`: 消息ID

**响应示例**:
```json
{
  "code": 0,
  "msg": "success",
  "data": "消息已删除"
}
```

**说明**: 
- 发送方和接收方都可以删除消息
- 删除是软删除，不影响对方

---

### 2.8 获取未读消息总数

**接口**: `GET /messages/unread-count`

**需要认证**: 是

**响应示例**:
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "count": 15
  }
}
```

**说明**: 返回当前用户所有会话的未读消息总数

---

## 三、数据库表结构

### 3.1 会话表 (conversations)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uint | 主键 |
| user1_id | string | 用户1的ID（字母序较小） |
| user2_id | string | 用户2的ID（字母序较大） |
| last_message_id | uint | 最后一条消息ID |
| last_message_time | timestamp | 最后消息时间 |
| user1_unread | int | 用户1未读数 |
| user2_unread | int | 用户2未读数 |
| created_at | timestamp | 创建时间 |
| updated_at | timestamp | 更新时间 |
| deleted_at | timestamp | 删除时间（软删除） |

**索引**:
- `idx_users`: (user1_id, user2_id)
- `last_message_id`

### 3.2 消息表 (messages)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uint | 主键 |
| conversation_id | uint | 会话ID |
| from_user_id | string | 发送者用户ID |
| to_user_id | string | 接收者用户ID |
| message_type | int | 消息类型 |
| content | text | 消息内容 |
| media_url | string | 媒体文件URL |
| is_read | boolean | 是否已读 |
| read_at | timestamp | 读取时间 |
| is_recalled | boolean | 是否撤回 |
| recalled_at | timestamp | 撤回时间 |
| created_at | timestamp | 创建时间 |
| updated_at | timestamp | 更新时间 |
| deleted_at | timestamp | 删除时间（软删除） |

**索引**:
- `conversation_id`
- `from_user_id`
- `to_user_id`
- `is_read`
- `created_at`

---

## 四、完整使用流程示例

### 4.1 发送消息的完整流程

```bash
# 1. 用户登录获取Token
TOKEN="your_jwt_token"

# 2. 创建或获取会话
curl -X POST http://localhost:8080/api/v1/messages/conversations/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "friend_user_id": "friend001"
  }'

# 3. 发送文本消息
curl -X POST http://localhost:8080/api/v1/messages/send \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to_user_id": "friend001",
    "message_type": 1,
    "content": "你好，这是一条测试消息"
  }'

# 4. 查看会话列表
curl -X GET "http://localhost:8080/api/v1/messages/conversations?page=1&page_size=20" \
  -H "Authorization: Bearer $TOKEN"

# 5. 查看会话消息历史
curl -X GET "http://localhost:8080/api/v1/messages/conversations/1/messages?page=1&page_size=50" \
  -H "Authorization: Bearer $TOKEN"

# 6. 标记会话为已读
curl -X PUT http://localhost:8080/api/v1/messages/conversations/1/read \
  -H "Authorization: Bearer $TOKEN"

# 7. 获取未读消息总数
curl -X GET http://localhost:8080/api/v1/messages/unread-count \
  -H "Authorization: Bearer $TOKEN"
```

### 4.2 WebSocket实时通信示例

```javascript
// 前端代码示例
class IMClient {
  constructor(token) {
    this.token = token;
    this.ws = null;
    this.heartbeatTimer = null;
  }

  connect() {
    // 建立WebSocket连接
    this.ws = new WebSocket(`ws://localhost:8080/api/v1/messages/ws`);
    
    // 连接建立后的处理
    this.ws.onopen = () => {
      console.log('✅ WebSocket连接已建立');
      this.startHeartbeat();
    };

    // 接收消息
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch(data.type) {
        case 'message':
          // 收到新消息
          this.handleNewMessage(data.data);
          break;
        case 'pong':
          // 心跳响应
          console.log('收到心跳响应');
          break;
        default:
          console.log('未知消息类型:', data);
      }
    };

    // 连接关闭
    this.ws.onclose = () => {
      console.log('❌ WebSocket连接已关闭');
      this.stopHeartbeat();
      // 可以实现重连逻辑
      setTimeout(() => this.connect(), 3000);
    };

    // 连接错误
    this.ws.onerror = (error) => {
      console.error('WebSocket错误:', error);
    };
  }

  // 发送心跳
  startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'ping',
          timestamp: Date.now()
        }));
      }
    }, 30000); // 每30秒发送一次心跳
  }

  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // 处理新消息
  handleNewMessage(message) {
    console.log('收到新消息:', message);
    // 更新UI，显示新消息
    // 播放提示音等
  }

  // 断开连接
  disconnect() {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
    }
  }
}

// 使用示例
const token = localStorage.getItem('token');
const client = new IMClient(token);
client.connect();
```

---

## 五、错误码说明

| 错误码 | 说明 |
|--------|------|
| 0 | 成功 |
| 400 | 请求参数错误 |
| 4001 | 未提供Token |
| 4002 | Token无效或过期 |
| 500 | 服务器内部错误 |

常见错误消息：
- "只能给好友发送消息"
- "文本消息内容不能为空"
- "无效的消息类型"
- "会话不存在"
- "无权访问该会话"
- "只能撤回自己发送的消息"
- "只能撤回2分钟内的消息"
- "消息已被撤回"

---

## 六、性能优化建议

### 6.1 消息分页加载
- 建议每页加载20-50条消息
- 使用下拉加载更多的方式
- 缓存已加载的消息

### 6.2 WebSocket心跳
- 建议每30-60秒发送一次心跳
- 检测连接状态，自动重连

### 6.3 未读消息
- 进入会话时自动标记为已读
- 定期同步未读消息数

### 6.4 离线消息
- 用户上线后，通过HTTP接口拉取离线消息
- 可以通过会话列表查看未读消息数

---

## 七、安全建议

1. **WebSocket认证**
   - 建立连接时必须携带有效Token
   - 定期刷新Token

2. **消息权限**
   - 只能给好友发送消息
   - 只能访问自己的会话

3. **消息撤回**
   - 限制撤回时间（2分钟）
   - 只能撤回自己发送的消息

4. **防刷**
   - 限制发送频率
   - 检测异常行为

---

## 八、后续扩展

### 待实现功能
- [ ] 消息已读回执（对方已读通知）
- [ ] 正在输入状态实时显示
- [ ] 消息转发
- [ ] 群组消息
- [ ] @提醒功能
- [ ] 消息搜索
- [ ] 文件传输进度
- [ ] 语音/视频通话
- [ ] 消息加密

---

## 九、注意事项

1. **WebSocket连接管理**
   - 页面切换时注意断开和重连
   - 网络异常时自动重连
   - 避免重复连接

2. **消息持久化**
   - 所有消息都会持久化到数据库
   - 支持历史消息查询
   - 软删除保证数据安全

3. **实时性**
   - 在线用户消息实时推送
   - 离线用户下次上线时通过HTTP拉取

4. **会话管理**
   - 会话自动创建
   - user1_id始终小于user2_id（字母序）
   - 便于查询和去重

---

**祝你使用愉快！** 🎉
