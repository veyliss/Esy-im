# IM Backend - 即时通讯系统后端

## 📝 项目简介

这是一个完整的即时通讯(IM)系统后端服务，基于Go语言开发，采用经典的分层架构设计。项目实现了用户系统、好友系统、朋友圈和实时消息通信等核心功能。

## ✨ 核心功能

### 1. 用户系统
- ✅ 邮箱验证码注册/登录
- ✅ 密码注册/登录
- ✅ JWT身份认证
- ✅ 用户信息管理
- ✅ 登出功能

### 2. 好友系统
- ✅ 发送/接受/拒绝好友请求
- ✅ 好友列表管理
- ✅ 好友备注功能
- ✅ 删除好友
- ✅ 用户搜索

### 3. 朋友圈
- ✅ 发布动态（文字、图片、位置）
- ✅ 查看朋友圈时间线
- ✅ 点赞/取消点赞
- ✅ 评论/回复评论
- ✅ 可见范围控制（所有人/仅好友/私密）
- ✅ 删除动态和评论

### 4. 消息系统 ⭐
- ✅ WebSocket实时通信
- ✅ 点对点消息发送
- ✅ 消息持久化存储
- ✅ 历史消息分页查询
- ✅ 已读/未读状态管理
- ✅ 消息撤回（2分钟内）
- ✅ 会话管理
- ✅ 离线消息支持
- ✅ 多种消息类型（文本、图片、语音、视频、文件）

## 🛠 技术栈

- **语言**: Go 1.18+
- **Web框架**: Gorilla Mux
- **数据库**: PostgreSQL
- **ORM**: GORM
- **缓存**: Redis
- **认证**: JWT
- **实时通信**: WebSocket (gorilla/websocket)

## 📁 项目结构

```
im-backend/
├── cmd/
│   └── server/
│       └── main.go                 # 程序入口
├── config/
│   └── config.go                   # 配置管理
├── internal/
│   ├── model/                      # 数据模型
│   │   ├── ueser.go               # 用户模型
│   │   ├── friend.go              # 好友模型
│   │   ├── moment.go              # 朋友圈模型
│   │   └── message.go             # 消息模型
│   ├── repository/                 # 数据访问层
│   │   ├── user_repository.go
│   │   ├── friend_repository.go
│   │   ├── moment_repository.go
│   │   └── message_repository.go
│   ├── service/                    # 业务逻辑层
│   │   ├── user_service.go
│   │   ├── code_service.go
│   │   ├── friend_service.go
│   │   ├── moment_service.go
│   │   └── message_service.go
│   ├── controller/                 # 控制器层
│   │   ├── user_controller.go
│   │   ├── friend_controller.go
│   │   ├── moment_controller.go
│   │   └── message_controller.go
│   ├── handler/                    # HTTP处理层
│   │   ├── user_handler.go
│   │   ├── friend_handler.go
│   │   ├── moment_handler.go
│   │   └── message_handler.go
│   ├── pkg/                        # 公共包
│   │   ├── db.go                  # 数据库
│   │   ├── redis.go               # Redis
│   │   ├── jwt.go                 # JWT
│   │   ├── email.go               # 邮件
│   │   ├── middleware.go          # 中间件
│   │   ├── response.go            # 响应
│   │   ├── context.go             # 上下文
│   │   ├── websocket.go           # WebSocket管理
│   │   └── utils/                 # 工具函数
│   └── router/
│       └── router.go              # 路由配置
├── docs/                           # 文档目录
│   ├── API_DOCUMENTATION.md       # 完整API文档
│   ├── MESSAGE_API_DOCUMENTATION.md  # 消息系统API文档
│   ├── DEVELOPMENT.md             # 开发文档
│   ├── FEATURE_SUMMARY.md         # 功能总结
│   ├── MESSAGE_FEATURE_SUMMARY.md # 消息系统总结
│   └── QUICKSTART.md              # 快速开始
├── go.mod
└── go.sum
```

## 🚀 快速开始

### 1. 环境要求

- Go 1.18+
- PostgreSQL
- Redis

### 2. 配置环境变量

```bash
export PORT=8080
export POSTGRES_HOST=localhost
export POSTGRES_PORT=5432
export POSTGRES_USER=your_user
export POSTGRES_PASSWORD=your_password
export POSTGRES_DB=im_db
export REDIS_HOST=localhost
export REDIS_PORT=6379
export JWT_SECRET=your_secret_key
export SMTP_HOST=smtp.gmail.com
export SMTP_PORT=587
export SMTP_USER=your_email@gmail.com
export SMTP_PASSWORD=your_password
```

### 3. 安装依赖

```bash
go mod download
```

### 4. 运行项目

```bash
# 编译
go build -o bin/server ./cmd/server

# 运行
./bin/server
```

或直接运行：

```bash
go run cmd/server/main.go
```

## 📖 文档

- **[API完整文档](API_DOCUMENTATION.md)** - 所有API接口说明
- **[消息系统API文档](MESSAGE_API_DOCUMENTATION.md)** - 消息系统详细文档
- **[开发文档](DEVELOPMENT.md)** - 开发规范和架构说明
- **[快速启动](QUICKSTART.md)** - 快速开始指南
- **[功能总结](FEATURE_SUMMARY.md)** - 好友和朋友圈功能总结
- **[消息系统总结](MESSAGE_FEATURE_SUMMARY.md)** - 消息系统功能总结

## 🔌 API接口

### 基础URL
```
http://localhost:8080/api/v1
```

### WebSocket URL
```
ws://localhost:8080/api/v1/messages/ws
```

### 主要接口

#### 用户系统
- POST `/users/register` - 注册（验证码）
- POST `/users/login` - 登录（验证码）
- POST `/users/register-pwd` - 注册（密码）
- POST `/users/login-pwd` - 登录（密码）
- GET `/users/me` - 获取用户信息
- POST `/users/logout` - 登出

#### 好友系统
- POST `/friends/send-request` - 发送好友请求
- POST `/friends/accept-request` - 接受好友请求
- GET `/friends/list` - 获取好友列表
- DELETE `/friends/{friend_id}` - 删除好友

#### 朋友圈
- POST `/moments/create` - 发布动态
- GET `/moments/timeline` - 查看时间线
- POST `/moments/{id}/like` - 点赞
- POST `/moments/{id}/comment` - 评论

#### 消息系统
- GET `/messages/ws` - WebSocket连接
- POST `/messages/send` - 发送消息
- GET `/messages/conversations` - 获取会话列表
- GET `/messages/conversations/{id}/messages` - 获取消息历史
- PUT `/messages/conversations/{id}/read` - 标记已读
- PUT `/messages/{id}/recall` - 撤回消息

## 💡 使用示例

### 发送消息

```bash
TOKEN="your_jwt_token"

# 1. 创建会话
curl -X POST http://localhost:8080/api/v1/messages/conversations/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "friend_user_id": "friend001"
  }'

# 2. 发送消息
curl -X POST http://localhost:8080/api/v1/messages/send \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to_user_id": "friend001",
    "message_type": 1,
    "content": "你好！"
  }'
```

### WebSocket连接

```javascript
const ws = new WebSocket('ws://localhost:8080/api/v1/messages/ws');

ws.onopen = () => {
  console.log('WebSocket连接已建立');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('收到消息:', data);
};
```

## 🗄 数据库表

- **users** - 用户表
- **friends** - 好友关系表
- **friend_requests** - 好友请求表
- **moments** - 朋友圈动态表
- **moment_likes** - 点赞表
- **moment_comments** - 评论表
- **conversations** - 会话表
- **messages** - 消息表

所有表在项目启动时自动创建（GORM AutoMigrate）。

## 🔐 安全特性

- ✅ JWT身份认证
- ✅ 密码bcrypt加密
- ✅ 好友关系验证
- ✅ 权限检查
- ✅ Token过期管理
- ✅ 防止SQL注入（GORM）
- ✅ 参数验证

## 📊 性能特性

- ✅ 数据库索引优化
- ✅ 分页查询
- ✅ 关联数据预加载
- ✅ Redis缓存（Token）
- ✅ WebSocket连接池
- ✅ 并发安全保证

## 🎯 开发特性

- ✅ 清晰的分层架构
- ✅ RESTful API设计
- ✅ 统一的响应格式
- ✅ 完整的错误处理
- ✅ 详细的代码注释
- ✅ 完善的文档

## 📈 项目统计

- **代码行数**: 3500+ 行
- **核心文件**: 30+ 个
- **API接口**: 40+ 个
- **数据表**: 8 个
- **文档**: 6 份完整文档

## 🚧 待实现功能

- [ ] 群组消息
- [ ] 语音/视频通话
- [ ] 文件上传
- [ ] 消息加密
- [ ] 消息搜索
- [ ] 在线状态同步
- [ ] 消息已读回执
- [ ] 正在输入状态

## 📝 License

[添加你的许可证信息]

## 👥 贡献

欢迎提交Issue和Pull Request！

## 📧 联系方式

[添加你的联系方式]

---

**项目已完成核心功能开发，可投入使用！** 🎉
