# 快速启动指南

## 前置条件

1. **Go环境**: Go 1.18+
2. **PostgreSQL**: 已安装并运行
3. **Redis**: 已安装并运行

## 一、环境配置

### 1. 创建数据库

```sql
CREATE DATABASE im_db;
```

### 2. 配置环境变量

创建 `.env` 文件或设置以下环境变量：

```bash
# 服务器配置
export PORT=8080

# PostgreSQL配置
export POSTGRES_HOST=localhost
export POSTGRES_PORT=5432
export POSTGRES_USER=your_username
export POSTGRES_PASSWORD=your_password
export POSTGRES_DB=im_db

# Redis配置
export REDIS_HOST=localhost
export REDIS_PORT=6379
export REDIS_PASSWORD=

# JWT密钥
export JWT_SECRET=your_secret_key_here

# 邮件配置（用于验证码）
export SMTP_HOST=smtp.gmail.com
export SMTP_PORT=587
export SMTP_USER=your_email@gmail.com
export SMTP_PASSWORD=your_app_password
```

## 二、安装依赖

```bash
cd /Users/xiaoxi/Documents/Project/Esy-IM/im-backend
go mod download
```

## 三、编译项目

```bash
go build -o bin/server ./cmd/server
```

## 四、运行项目

```bash
./bin/server
```

或直接运行：

```bash
go run cmd/server/main.go
```

## 五、验证运行

### 1. 健康检查

```bash
curl http://localhost:8080/api/v1/ping
```

预期返回：
```json
{
  "code": 0,
  "msg": "success",
  "data": "pong"
}
```

### 2. 注册用户

```bash
curl -X POST http://localhost:8080/api/v1/users/register-pwd \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "user_id": "test001",
    "nickname": "测试用户",
    "password": "password123"
  }'
```

### 3. 登录获取Token

```bash
curl -X POST http://localhost:8080/api/v1/users/login-pwd \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

返回示例：
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "user_id": "test001",
      "email": "test@example.com",
      "nickname": "测试用户",
      "avatar": ""
    }
  }
}
```

### 4. 测试好友系统

注册第二个用户，然后：

```bash
# 保存token到变量
TOKEN="你的token"

# 搜索用户
curl -X GET "http://localhost:8080/api/v1/friends/search?user_id=test002" \
  -H "Authorization: Bearer $TOKEN"

# 发送好友请求
curl -X POST http://localhost:8080/api/v1/friends/send-request \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to_user_id": "test002",
    "message": "你好，我想加你为好友"
  }'

# 查看好友列表
curl -X GET http://localhost:8080/api/v1/friends/list \
  -H "Authorization: Bearer $TOKEN"
```

### 5. 测试朋友圈

```bash
# 发布朋友圈
curl -X POST http://localhost:8080/api/v1/moments/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "第一条朋友圈！",
    "visible": 1
  }'

# 查看朋友圈时间线
curl -X GET "http://localhost:8080/api/v1/moments/timeline?page=1&page_size=20" \
  -H "Authorization: Bearer $TOKEN"

# 点赞
curl -X POST http://localhost:8080/api/v1/moments/1/like \
  -H "Authorization: Bearer $TOKEN"

# 评论
curl -X POST http://localhost:8080/api/v1/moments/1/comment \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "很棒！"
  }'
```

## 六、数据库自动迁移

项目启动时会自动创建所有需要的数据库表，包括：

- users（用户表）
- friends（好友关系表）
- friend_requests（好友请求表）
- moments（朋友圈动态表）
- moment_likes（点赞表）
- moment_comments（评论表）

无需手动创建表结构！

## 七、常见问题

### Q1: 连接数据库失败

**解决方案**：
- 检查PostgreSQL是否正在运行
- 验证数据库连接信息是否正确
- 确保数据库已创建

### Q2: Redis连接失败

**解决方案**：
- 检查Redis是否正在运行
- 验证Redis连接信息是否正确

### Q3: 编译失败

**解决方案**：
- 确保Go版本 >= 1.18
- 运行 `go mod tidy` 清理依赖
- 删除 `go.sum` 后重新 `go mod download`

### Q4: Token过期

**解决方案**：
- 重新登录获取新的Token
- Token默认有效期可在JWT配置中调整

## 八、开发模式

开发时推荐使用热重载工具：

```bash
# 安装air（可选）
go install github.com/cosmtrek/air@latest

# 使用air运行（需要配置.air.toml）
air
```

或使用简单的监听重启脚本。

## 九、生产部署建议

1. **使用环境变量管理配置**
2. **启用HTTPS**
3. **配置反向代理（Nginx）**
4. **设置日志级别**
5. **配置数据库连接池**
6. **启用Redis持久化**
7. **配置监控和告警**

## 十、完整文档

- **API文档**: `API_DOCUMENTATION.md`
- **开发文档**: `DEVELOPMENT.md`
- **功能总结**: `FEATURE_SUMMARY.md`

## 十一、项目结构

```
im-backend/
├── cmd/
│   └── server/
│       └── main.go           # 程序入口
├── config/
│   └── config.go             # 配置管理
├── internal/
│   ├── app/
│   │   └── server.go         # 服务器设置
│   ├── controller/           # 控制器层
│   ├── handler/              # HTTP处理层
│   ├── model/                # 数据模型
│   ├── pkg/                  # 公共包
│   ├── repository/           # 数据访问层
│   ├── router/               # 路由配置
│   └── service/              # 业务逻辑层
├── bin/                      # 编译输出
├── API_DOCUMENTATION.md      # API文档
├── DEVELOPMENT.md            # 开发文档
├── FEATURE_SUMMARY.md        # 功能总结
├── QUICKSTART.md             # 本文档
├── go.mod
└── go.sum
```

## 十二、下一步

1. 阅读 `API_DOCUMENTATION.md` 了解所有API接口
2. 阅读 `DEVELOPMENT.md` 了解开发规范
3. 开始开发新功能或测试现有功能

---

**祝你使用愉快！** 🎉

如有问题，请参考完整文档或提交Issue。
