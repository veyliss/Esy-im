# IM Backend API 文档

## 概述
本文档详细说明了即时通讯系统后端的好友系统和朋友圈功能的API接口。

## 基础信息
- **基础URL**: `http://localhost:8080/api/v1`
- **认证方式**: Bearer Token（在请求头中添加 `Authorization: Bearer <token>`）

---

## 一、好友系统 API

### 1.1 发送好友请求
**接口**: `POST /friends/send-request`

**需要认证**: 是

**请求体**:
```json
{
  "to_user_id": "目标用户ID",
  "message": "验证信息（可选）"
}
```

**响应示例**:
```json
{
  "code": 0,
  "msg": "success",
  "data": "好友请求已发送"
}
```

---

### 1.2 接受好友请求
**接口**: `POST /friends/accept-request`

**需要认证**: 是

**请求体**:
```json
{
  "request_id": 请求ID（整数）
}
```

**响应示例**:
```json
{
  "code": 0,
  "msg": "success",
  "data": "已接受好友请求"
}
```

---

### 1.3 拒绝好友请求
**接口**: `POST /friends/reject-request`

**需要认证**: 是

**请求体**:
```json
{
  "request_id": 请求ID（整数）
}
```

**响应示例**:
```json
{
  "code": 0,
  "msg": "success",
  "data": "已拒绝好友请求"
}
```

---

### 1.4 获取好友列表
**接口**: `GET /friends/list`

**需要认证**: 是

**响应示例**:
```json
{
  "code": 0,
  "msg": "success",
  "data": [
    {
      "id": 1,
      "user_id": "user123",
      "friend_id": "friend456",
      "remark": "备注名",
      "created_at": "2025-10-14T10:00:00Z",
      "friend_user": {
        "id": 2,
        "user_id": "friend456",
        "email": "friend@example.com",
        "nickname": "好友昵称",
        "avatar": "头像URL"
      }
    }
  ]
}
```

---

### 1.5 删除好友
**接口**: `DELETE /friends/{friend_id}`

**需要认证**: 是

**路径参数**:
- `friend_id`: 好友的用户ID

**响应示例**:
```json
{
  "code": 0,
  "msg": "success",
  "data": "已删除好友"
}
```

---

### 1.6 更新好友备注
**接口**: `PUT /friends/update-remark`

**需要认证**: 是

**请求体**:
```json
{
  "friend_id": "好友用户ID",
  "remark": "新备注名"
}
```

**响应示例**:
```json
{
  "code": 0,
  "msg": "success",
  "data": "备注已更新"
}
```

---

### 1.7 获取收到的好友请求
**接口**: `GET /friends/received-requests?status=0`

**需要认证**: 是

**查询参数**:
- `status`（可选）: 
  - `0`: 待处理
  - `1`: 已同意
  - `2`: 已拒绝
  - 不传或传`-1`: 全部

**响应示例**:
```json
{
  "code": 0,
  "msg": "success",
  "data": [
    {
      "id": 1,
      "from_user_id": "sender123",
      "to_user_id": "me456",
      "message": "我是XXX",
      "status": 0,
      "created_at": "2025-10-14T10:00:00Z",
      "from_user": {
        "user_id": "sender123",
        "nickname": "发送者昵称",
        "avatar": "头像URL"
      }
    }
  ]
}
```

---

### 1.8 获取发出的好友请求
**接口**: `GET /friends/sent-requests?status=0`

**需要认证**: 是

**查询参数**:
- `status`（可选）: 同上

**响应示例**: 同上

---

### 1.9 搜索好友
**接口**: `GET /friends/search?user_id=xxx`

**需要认证**: 是

**查询参数**:
- `user_id`: 要搜索的用户ID

**响应示例**:
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "id": 2,
    "user_id": "friend456",
    "email": "friend@example.com",
    "nickname": "用户昵称",
    "avatar": "头像URL"
  }
}
```

---

## 二、朋友圈 API

### 2.1 发布朋友圈动态
**接口**: `POST /moments/create`

**需要认证**: 是

**请求体**:
```json
{
  "content": "动态内容",
  "images": "[\"图片URL1\", \"图片URL2\"]",
  "location": "位置信息（可选）",
  "visible": 0
}
```

**visible 说明**:
- `0`: 所有人可见
- `1`: 仅好友可见
- `2`: 仅自己可见（私密）

**响应示例**:
```json
{
  "code": 0,
  "msg": "success",
  "data": "发布成功"
}
```

---

### 2.2 获取动态详情
**接口**: `GET /moments/{id}`

**需要认证**: 是

**路径参数**:
- `id`: 动态ID

**响应示例**:
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "id": 1,
    "user_id": "user123",
    "content": "动态内容",
    "images": "[\"url1\", \"url2\"]",
    "location": "北京",
    "visible": 0,
    "like_count": 10,
    "comment_count": 5,
    "created_at": "2025-10-14T10:00:00Z",
    "user": {
      "user_id": "user123",
      "nickname": "用户昵称",
      "avatar": "头像URL"
    },
    "likes": [...],
    "comments": [...]
  }
}
```

---

### 2.3 获取自己的朋友圈列表
**接口**: `GET /moments/my-list?page=1&page_size=20`

**需要认证**: 是

**查询参数**:
- `page`: 页码，默认1
- `page_size`: 每页数量，默认20

**响应示例**:
```json
{
  "code": 0,
  "msg": "success",
  "data": [...]
}
```

---

### 2.4 获取好友圈时间线
**接口**: `GET /moments/timeline?page=1&page_size=20`

**需要认证**: 是

**说明**: 返回自己和好友的动态（按时间倒序）

**查询参数**:
- `page`: 页码，默认1
- `page_size`: 每页数量，默认20

**响应示例**: 同上

---

### 2.5 删除动态
**接口**: `DELETE /moments/{id}`

**需要认证**: 是

**路径参数**:
- `id`: 动态ID

**响应示例**:
```json
{
  "code": 0,
  "msg": "success",
  "data": "删除成功"
}
```

---

### 2.6 点赞动态
**接口**: `POST /moments/{id}/like`

**需要认证**: 是

**路径参数**:
- `id`: 动态ID

**响应示例**:
```json
{
  "code": 0,
  "msg": "success",
  "data": "点赞成功"
}
```

---

### 2.7 取消点赞
**接口**: `DELETE /moments/{id}/unlike`

**需要认证**: 是

**路径参数**:
- `id`: 动态ID

**响应示例**:
```json
{
  "code": 0,
  "msg": "success",
  "data": "已取消点赞"
}
```

---

### 2.8 获取点赞列表
**接口**: `GET /moments/{id}/likes`

**需要认证**: 是

**路径参数**:
- `id`: 动态ID

**响应示例**:
```json
{
  "code": 0,
  "msg": "success",
  "data": [
    {
      "id": 1,
      "moment_id": 1,
      "user_id": "user123",
      "created_at": "2025-10-14T10:00:00Z",
      "user": {
        "user_id": "user123",
        "nickname": "点赞用户",
        "avatar": "头像URL"
      }
    }
  ]
}
```

---

### 2.9 评论动态
**接口**: `POST /moments/{id}/comment`

**需要认证**: 是

**路径参数**:
- `id`: 动态ID

**请求体**:
```json
{
  "content": "评论内容",
  "reply_to_id": null
}
```

**reply_to_id 说明**:
- `null`: 直接评论动态
- `整数`: 回复某条评论的ID

**响应示例**:
```json
{
  "code": 0,
  "msg": "success",
  "data": "评论成功"
}
```

---

### 2.10 获取评论列表
**接口**: `GET /moments/{id}/comments`

**需要认证**: 是

**路径参数**:
- `id`: 动态ID

**响应示例**:
```json
{
  "code": 0,
  "msg": "success",
  "data": [
    {
      "id": 1,
      "moment_id": 1,
      "user_id": "user123",
      "reply_to_id": null,
      "content": "评论内容",
      "created_at": "2025-10-14T10:00:00Z",
      "user": {
        "user_id": "user123",
        "nickname": "评论者",
        "avatar": "头像URL"
      }
    }
  ]
}
```

---

### 2.11 删除评论
**接口**: `DELETE /moments/comments/{comment_id}`

**需要认证**: 是

**路径参数**:
- `comment_id`: 评论ID

**响应示例**:
```json
{
  "code": 0,
  "msg": "success",
  "data": "删除成功"
}
```

---

## 三、消息管理系统 API

> 详细文档请查看 [MESSAGE_API_DOCUMENTATION.md](MESSAGE_API_DOCUMENTATION.md)

### 3.1 WebSocket实时通信

**接口**: `GET /messages/ws`

**需要认证**: 是

**说明**: 建立WebSocket连接，用于实时消息推送

---

### 3.2 发送消息

**接口**: `POST /messages/send`

**需要认证**: 是

**请求体**:
```json
{
  "to_user_id": "目标用户ID",
  "message_type": 1,
  "content": "消息内容",
  "media_url": ""
}
```

**消息类型**:
- `1`: 文本消息
- `2`: 图片消息
- `3`: 语音消息
- `4`: 视频消息
- `5`: 文件消息

---

### 3.3 获取会话列表

**接口**: `GET /messages/conversations?page=1&page_size=20`

**需要认证**: 是

**说明**: 获取当前用户的所有会话列表，按最后消息时间排序

---

### 3.4 获取会话消息历史

**接口**: `GET /messages/conversations/{conversation_id}/messages?page=1&page_size=50`

**需要认证**: 是

**说明**: 分页获取会话的历史消息

---

### 3.5 标记会话为已读

**接口**: `PUT /messages/conversations/{conversation_id}/read`

**需要认证**: 是

**说明**: 将会话中所有未读消息标记为已读

---

### 3.6 撤回消息

**接口**: `PUT /messages/{message_id}/recall`

**需要认证**: 是

**限制**: 只能撤回2分钟内的消息

---

### 3.7 删除消息

**接口**: `DELETE /messages/{message_id}`

**需要认证**: 是

---

### 3.8 获取未读消息总数

**接口**: `GET /messages/unread-count`

**需要认证**: 是

---

### 3.9 获取或创建会话

**接口**: `POST /messages/conversations/create`

**需要认证**: 是

**请求体**:
```json
{
  "friend_user_id": "好友ID"
}
```

---

## 四、数据库模型说明

### 3.1 好友请求表 (friend_requests)
- `id`: 主键
- `from_user_id`: 发起请求的用户ID
- `to_user_id`: 接收请求的用户ID
- `message`: 验证信息
- `status`: 状态（0-待处理，1-已同意，2-已拒绝）
- `created_at`: 创建时间
- `updated_at`: 更新时间

### 3.2 好友关系表 (friends)
- `id`: 主键
- `user_id`: 用户ID
- `friend_id`: 好友ID
- `remark`: 备注名
- `created_at`: 创建时间
- `updated_at`: 更新时间

**说明**: 好友关系是双向的，接受好友请求时会创建两条记录

### 3.3 朋友圈动态表 (moments)
- `id`: 主键
- `user_id`: 发布者用户ID
- `content`: 动态内容
- `images`: 图片列表（JSON字符串）
- `location`: 位置信息
- `visible`: 可见范围
- `like_count`: 点赞数
- `comment_count`: 评论数
- `created_at`: 创建时间
- `updated_at`: 更新时间

### 3.4 朋友圈点赞表 (moment_likes)
- `id`: 主键
- `moment_id`: 动态ID
- `user_id`: 点赞用户ID
- `created_at`: 创建时间

### 3.5 朋友圈评论表 (moment_comments)
- `id`: 主键
- `moment_id`: 动态ID
- `user_id`: 评论用户ID
- `reply_to_id`: 回复的评论ID（可为空）
- `content`: 评论内容
- `created_at`: 创建时间
- `updated_at`: 更新时间

---

## 四、错误码说明

- `0`: 成功
- `400`: 请求参数错误
- `4001`: 未提供Token
- `4002`: Token无效或过期
- `500`: 服务器内部错误（错误详情会在msg中说明）

---

## 五、使用示例

### 5.1 完整的好友添加流程

1. **用户A搜索用户B**
```bash
curl -X GET "http://localhost:8080/api/v1/friends/search?user_id=userB" \
  -H "Authorization: Bearer <token>"
```

2. **用户A发送好友请求给用户B**
```bash
curl -X POST "http://localhost:8080/api/v1/friends/send-request" \
  -H "Authorization: Bearer <tokenA>" \
  -H "Content-Type: application/json" \
  -d '{
    "to_user_id": "userB",
    "message": "你好，我想加你为好友"
  }'
```

3. **用户B查看收到的好友请求**
```bash
curl -X GET "http://localhost:8080/api/v1/friends/received-requests?status=0" \
  -H "Authorization: Bearer <tokenB>"
```

4. **用户B接受好友请求**
```bash
curl -X POST "http://localhost:8080/api/v1/friends/accept-request" \
  -H "Authorization: Bearer <tokenB>" \
  -H "Content-Type: application/json" \
  -d '{
    "request_id": 1
  }'
```

5. **查看好友列表**
```bash
curl -X GET "http://localhost:8080/api/v1/friends/list" \
  -H "Authorization: Bearer <token>"
```

### 5.2 完整的朋友圈流程

1. **发布朋友圈**
```bash
curl -X POST "http://localhost:8080/api/v1/moments/create" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "今天天气不错！",
    "images": "[\"https://example.com/image1.jpg\"]",
    "location": "北京",
    "visible": 1
  }'
```

2. **查看朋友圈时间线**
```bash
curl -X GET "http://localhost:8080/api/v1/moments/timeline?page=1&page_size=20" \
  -H "Authorization: Bearer <token>"
```

3. **点赞朋友圈**
```bash
curl -X POST "http://localhost:8080/api/v1/moments/1/like" \
  -H "Authorization: Bearer <token>"
```

4. **评论朋友圈**
```bash
curl -X POST "http://localhost:8080/api/v1/moments/1/comment" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "太棒了！"
  }'
```

5. **回复评论**
```bash
curl -X POST "http://localhost:8080/api/v1/moments/1/comment" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "谢谢！",
    "reply_to_id": 1
  }'
```

---

## 六、注意事项

1. 所有需要认证的接口都必须在请求头中携带有效的Token
2. Token在登录或注册成功后获得
3. 好友关系是双向的，删除好友会同时删除双方的好友关系
4. 朋友圈的可见范围会影响谁能看到动态
5. 只能删除自己发布的动态和评论
6. 分页参数page从1开始
7. 图片字段images需要传入JSON数组字符串格式

---

## 七、项目结构

```
internal/
├── model/              # 数据模型
│   ├── ueser.go       # 用户模型
│   ├── friend.go      # 好友系统模型
│   └── moment.go      # 朋友圈模型
├── repository/        # 数据访问层
│   ├── user_repository.go
│   ├── friend_repository.go
│   └── moment_repository.go
├── service/           # 业务逻辑层
│   ├── user_service.go
│   ├── friend_service.go
│   └── moment_service.go
├── controller/        # 控制器层
│   ├── user_controller.go
│   ├── friend_controller.go
│   └── moment_controller.go
├── handler/           # HTTP处理层
│   ├── user_handler.go
│   ├── friend_handler.go
│   └── moment_handler.go
└── router/            # 路由配置
    └── router.go
```
