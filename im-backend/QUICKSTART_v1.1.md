# Esy-IM v1.1.0 快速开始指南

## 🚀 快速开始

### 环境要求

- Go 1.20+
- PostgreSQL 12+
- Redis 6+

### 1. 克隆项目

```bash
git clone <repository-url>
cd Esy-IM/im-backend
```

### 2. 配置环境变量

复制并编辑 `.env` 文件：

```bash
cp .env.example .env  # 如果有示例文件
# 或直接编辑 .env
```

**重要配置项**:

```env
# 应用端口
APP_PORT=8080

# PostgreSQL数据库配置
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
POSTGRES_DB=imdb

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# 邮件服务配置（用于验证码）
SMTP_HOST=smtp.qq.com
SMTP_PORT=587
SMTP_USER=your_email@qq.com
SMTP_PASS=your_smtp_password

# 🔒 JWT配置（必须配置）
JWT_SECRET=your-strong-secret-key-at-least-32-characters-long
JWT_EXPIRATION=8
```

⚠️ **安全提示**: 
- 生产环境必须使用强密码
- JWT_SECRET建议使用随机生成的32位以上字符串
- 不要将 `.env` 文件提交到版本控制

### 3. 安装依赖

```bash
go mod download
```

### 4. 初始化数据库

确保PostgreSQL和Redis服务已启动：

```bash
# 检查PostgreSQL
psql -U postgres -c "SELECT version();"

# 检查Redis
redis-cli ping
```

创建数据库：

```bash
psql -U postgres -c "CREATE DATABASE imdb;"
```

### 5. 启动应用

```bash
go run cmd/server/main.go
```

或编译后运行：

```bash
go build -o bin/server cmd/server/main.go
./bin/server
```

### 6. 验证安装

应用启动后，访问健康检查接口：

```bash
curl http://localhost:8080/api/v1/ping
```

预期响应：

```json
{
    "code": 0,
    "msg": "success",
    "data": "pong"
}
```

## 📝 API测试

### 注册用户（邮箱验证码方式）

1. **发送验证码**

```bash
curl -X POST http://localhost:8080/api/v1/users/send-code \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

2. **注册**

```bash
curl -X POST http://localhost:8080/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "code": "123456",
    "user_id": "test_user_001",
    "nickname": "测试用户"
  }'
```

### 注册用户（密码方式）

```bash
curl -X POST http://localhost:8080/api/v1/users/register-pwd \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "user_id": "test_user_001",
    "nickname": "测试用户",
    "password": "password123"
  }'
```

### 登录

```bash
curl -X POST http://localhost:8080/api/v1/users/login-pwd \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

响应示例：

```json
{
    "code": 0,
    "msg": "success",
    "data": {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "user": {
            "id": 1,
            "user_id": "test_user_001",
            "email": "test@example.com",
            "nickname": "测试用户"
        }
    }
}
```

### 获取用户信息（需要认证）

```bash
curl -X GET http://localhost:8080/api/v1/users/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🔧 开发模式

### 热重载开发

安装air进行热重载开发：

```bash
# 安装air
go install github.com/cosmtrek/air@latest

# 使用air启动
air
```

### 查看日志

应用日志会输出到控制台，包括：
- 请求日志（方法、路径、耗时、状态码）
- 错误日志
- 数据库操作日志

示例：
```
2025/10/20 10:00:00 ✅ 配置加载完成
2025/10/20 10:00:00 ✅ PostgreSQL 连接成功
2025/10/20 10:00:00 ✅ Redis 连接成功
2025/10/20 10:00:00 ✅ WebSocket Hub 初始化完成
2025/10/20 10:00:00 🚀 服务器启动在 :8080
```

## 📊 数据库管理

### 查看数据库表

```bash
psql -U postgres -d imdb -c "\dt"
```

### 查看索引

```bash
psql -U postgres -d imdb -c "
SELECT tablename, indexname FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;
"
```

### 数据库迁移

应用启动时会自动执行数据库迁移（AutoMigrate），包括：
- 创建表
- 更新表结构
- 创建索引

详见 [`DATABASE_MIGRATION.md`](DATABASE_MIGRATION.md)

## 🐛 故障排查

### 问题1: JWT_SECRET未配置

**错误信息**:
```
⚠️ JWT_SECRET 未配置，请在.env文件中设置JWT_SECRET
```

**解决方法**:
在 `.env` 文件中添加：
```env
JWT_SECRET=your-strong-secret-key-at-least-32-characters
```

### 问题2: 数据库连接失败

**错误信息**:
```
❌ PostgreSQL 连接失败: connection refused
```

**解决方法**:
1. 确认PostgreSQL服务已启动
2. 检查 `.env` 中的数据库配置
3. 确认数据库已创建

```bash
# 启动PostgreSQL（macOS）
brew services start postgresql

# 启动PostgreSQL（Linux）
sudo systemctl start postgresql

# 检查连接
psql -U postgres -d imdb
```

### 问题3: Redis连接失败

**错误信息**:
```
❌ Redis 连接失败: connection refused
```

**解决方法**:
```bash
# 启动Redis（macOS）
brew services start redis

# 启动Redis（Linux）
sudo systemctl start redis

# 检查连接
redis-cli ping
```

### 问题4: 邮件发送失败

**错误信息**:
```
邮件发送失败
```

**解决方法**:
1. 确认SMTP配置正确
2. 对于QQ邮箱，需要使用授权码而非密码
3. 检查网络连接和防火墙设置

## 📚 更多文档

- [架构改进文档](ARCHITECTURE_IMPROVEMENT.md) - 详细的架构设计和改进说明
- [错误处理指南](ERROR_HANDLING_GUIDE.md) - 统一错误处理机制使用指南
- [数据库迁移指南](DATABASE_MIGRATION.md) - 数据库迁移和索引优化
- [更新日志](CHANGELOG.md) - 版本更新记录
- [API文档](API_DOCUMENTATION.md) - 完整的API接口文档

## 🤝 贡献

欢迎贡献代码！请遵循以下步骤：

1. Fork项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

## 📄 许可证

[MIT License](LICENSE)

## 🙋 获取帮助

如有问题，请：
1. 查看文档
2. 搜索已有Issues
3. 创建新Issue

---

**祝使用愉快！** 🎉
