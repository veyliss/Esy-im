# IM Backend 开发说明

## 项目概述

本项目是一个即时通讯(IM)系统的后端服务，基于Go语言开发，采用经典的分层架构设计。

## 技术栈

- **语言**: Go 1.x
- **Web框架**: Gorilla Mux
- **数据库**: PostgreSQL
- **ORM**: GORM
- **缓存**: Redis
- **认证**: JWT

## 项目架构

项目采用经典的分层架构，从上到下依次为：

```
Handler (HTTP处理层)
    ↓
Controller (控制器层)
    ↓
Service (业务逻辑层)
    ↓
Repository (数据访问层)
    ↓
Model (数据模型层)
```

### 各层职责说明

1. **Model层** (`internal/model/`)
   - 定义数据模型和数据库表结构
   - 使用GORM标签定义字段映射和约束
   - 定义关联关系

2. **Repository层** (`internal/repository/`)
   - 封装数据库操作
   - 提供基础的CRUD方法
   - 处理数据查询和持久化

3. **Service层** (`internal/service/`)
   - 实现核心业务逻辑
   - 调用Repository层进行数据操作
   - 处理业务规则和验证

4. **Controller层** (`internal/controller/`)
   - 接收Service层返回的数据
   - 简单的参数传递和结果返回
   - 不包含具体的HTTP处理

5. **Handler层** (`internal/handler/`)
   - 处理HTTP请求和响应
   - 解析请求参数
   - 调用Controller层方法
   - 返回统一格式的JSON响应

## 已实现功能

### 1. 用户系统
- ✅ 用户注册（邮箱验证码/密码）
- ✅ 用户登录（邮箱验证码/密码）
- ✅ 用户登出
- ✅ 获取用户信息
- ✅ 设置密码
- ✅ 发送验证码

### 2. 好友系统
- ✅ 发送好友请求
- ✅ 接受/拒绝好友请求
- ✅ 查看收到/发出的好友请求
- ✅ 获取好友列表
- ✅ 删除好友
- ✅ 更新好友备注
- ✅ 搜索用户

### 3. 朋友圈功能
- ✅ 发布朋友圈动态
- ✅ 查看动态详情
- ✅ 查看自己的朋友圈列表
- ✅ 查看好友圈时间线
- ✅ 删除动态
- ✅ 点赞/取消点赞
- ✅ 评论/回复评论
- ✅ 查看点赞列表
- ✅ 查看评论列表
- ✅ 删除评论
- ✅ 朋友圈可见范围控制

## 数据库设计

### 核心表结构

1. **users** - 用户表
2. **friends** - 好友关系表（双向关系）
3. **friend_requests** - 好友请求表
4. **moments** - 朋友圈动态表
5. **moment_likes** - 朋友圈点赞表
6. **moment_comments** - 朋友圈评论表

详细的字段说明请参考 `API_DOCUMENTATION.md`

## 开发规范

### 1. 命名规范

- **文件命名**: 使用下划线分隔，如 `user_service.go`
- **结构体命名**: 使用大驼峰，如 `UserService`
- **方法命名**: 使用大驼峰（公开）或小驼峰（私有）
- **变量命名**: 使用小驼峰

### 2. 代码组织

每个功能模块应包含以下文件：
```
internal/
├── model/
│   └── {feature}.go          # 数据模型
├── repository/
│   └── {feature}_repository.go  # 数据访问
├── service/
│   └── {feature}_service.go     # 业务逻辑
├── controller/
│   └── {feature}_controller.go  # 控制器
└── handler/
    └── {feature}_handler.go     # HTTP处理
```

### 3. 错误处理

- 使用 `errors.New()` 创建错误信息
- 在Service层进行业务逻辑验证
- 在Handler层统一返回错误响应
- 使用统一的响应格式（通过`pkg.Success`和`pkg.Error`）

### 4. 响应格式

所有API响应使用统一格式：
```json
{
  "code": 0,           // 0表示成功，非0表示失败
  "msg": "success",    // 提示信息
  "data": {}          // 返回数据
}
```

### 5. 认证机制

- 使用JWT作为认证方式
- Token存储在Redis中，支持主动登出
- 需要认证的接口使用`AuthMiddleware`中间件
- 从Context中获取当前用户信息

## 开发流程

### 添加新功能的步骤

1. **定义数据模型** (`internal/model/`)
   ```go
   type YourModel struct {
       ID        uint           `gorm:"primaryKey" json:"id"`
       // ... 其他字段
       CreatedAt time.Time      `json:"created_at"`
       UpdatedAt time.Time      `json:"updated_at"`
       DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
   }
   ```

2. **实现Repository层** (`internal/repository/`)
   ```go
   type YourRepository struct {
       db *gorm.DB
   }
   
   func NewYourRepository(db *gorm.DB) *YourRepository {
       return &YourRepository{db: db}
   }
   
   // 实现CRUD方法
   ```

3. **实现Service层** (`internal/service/`)
   ```go
   type YourService struct {
       repo *repository.YourRepository
   }
   
   func NewYourService(repo *repository.YourRepository) *YourService {
       return &YourService{repo: repo}
   }
   
   // 实现业务逻辑方法
   ```

4. **实现Controller层** (`internal/controller/`)
   ```go
   type YourController struct {
       service *service.YourService
   }
   
   func NewYourController(service *service.YourService) *YourController {
       return &YourController{service: service}
   }
   
   // 实现控制器方法
   ```

5. **实现Handler层** (`internal/handler/`)
   ```go
   type YourHandler struct {
       controller *controller.YourController
   }
   
   func NewYourHandler(controller *controller.YourController) *YourHandler {
       return &YourHandler{controller: controller}
   }
   
   // 实现HTTP处理方法
   ```

6. **注册路由** (`internal/router/router.go`)
   ```go
   // 在InitRouter函数中初始化
   yourRepo := repository.NewYourRepository(pkg.DB)
   yourService := service.NewYourService(yourRepo)
   yourController := controller.NewYourController(yourService)
   yourHandler := handler.NewYourHandler(yourController)
   
   // 注册路由
   api.HandleFunc("/your-path", yourHandler.YourMethod).Methods("GET")
   ```

7. **更新数据库迁移** (`internal/pkg/db.go`)
   ```go
   if err := DB.AutoMigrate(
       &model.User{},
       &model.YourModel{}, // 添加新模型
   ); err != nil {
       log.Fatalf("❌ 自动迁移失败: %v", err)
   }
   ```

## 环境配置

### 必需的环境变量

```bash
# 服务器配置
PORT=8080

# PostgreSQL配置
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=your_user
POSTGRES_PASSWORD=your_password
POSTGRES_DB=im_db

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT配置
JWT_SECRET=your_jwt_secret

# 邮件配置（用于验证码）
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASSWORD=your_password
```

## 运行项目

### 1. 安装依赖
```bash
go mod download
```

### 2. 启动PostgreSQL和Redis
```bash
# 使用Docker Compose（如果有的话）
docker-compose up -d

# 或手动启动
```

### 3. 配置环境变量
创建 `.env` 文件或设置环境变量

### 4. 运行项目
```bash
# 开发模式
go run cmd/server/main.go

# 编译后运行
go build -o bin/server ./cmd/server
./bin/server
```

### 5. 测试API
```bash
# 健康检查
curl http://localhost:8080/api/v1/ping

# 其他API测试参考 API_DOCUMENTATION.md
```

## 数据库迁移

项目使用GORM的AutoMigrate功能自动创建和更新表结构。

每次添加新模型后，需要在 `internal/pkg/db.go` 中的 `AutoMigrate` 方法中添加：

```go
if err := DB.AutoMigrate(
    &model.User{},
    &model.Friend{},
    &model.FriendRequest{},
    &model.Moment{},
    &model.MomentLike{},
    &model.MomentComment{},
    // 添加新模型...
); err != nil {
    log.Fatalf("❌ 自动迁移失败: %v", err)
}
```

## 常见问题

### 1. 如何调试？

使用Go的标准log包：
```go
log.Printf("Debug info: %v", variable)
```

或使用调试器（如Delve）。

### 2. 如何处理关联查询？

使用GORM的Preload：
```go
db.Preload("User").Preload("Comments").Find(&moments)
```

### 3. 如何处理事务？

```go
err := r.db.Transaction(func(tx *gorm.DB) error {
    // 在事务中执行多个操作
    if err := tx.Create(&record1).Error; err != nil {
        return err
    }
    if err := tx.Create(&record2).Error; err != nil {
        return err
    }
    return nil
})
```

### 4. 如何添加中间件？

在 `internal/pkg/middleware.go` 中定义中间件，然后在路由中使用：
```go
api.Use(pkg.LoggingMiddleware)
api.Use(pkg.RecoverMiddleware)
```

## 待开发功能

- [ ] 消息系统（WebSocket实时通信）
- [ ] 群组功能
- [ ] 文件上传
- [ ] 用户资料完善
- [ ] 好友分组
- [ ] 朋友圈权限细化（标签、可见/不可见特定人）
- [ ] 消息已读/未读状态
- [ ] 在线状态
- [ ] 消息推送

## 性能优化建议

1. **数据库优化**
   - 为常用查询字段添加索引
   - 使用分页避免一次性加载大量数据
   - 合理使用预加载减少N+1查询

2. **缓存策略**
   - 用户信息缓存（Redis）
   - 好友列表缓存
   - 朋友圈时间线缓存

3. **并发控制**
   - 使用Go的goroutine处理异步任务
   - 合理使用channel进行通信
   - 注意数据库连接池配置

4. **日志和监控**
   - 使用结构化日志
   - 添加请求追踪ID
   - 监控关键指标（QPS、响应时间等）

## 安全建议

1. **输入验证**
   - 验证所有用户输入
   - 使用白名单而非黑名单
   - 防止SQL注入（GORM已提供保护）

2. **认证授权**
   - Token定期刷新
   - 敏感操作二次验证
   - 限制登录尝试次数

3. **数据保护**
   - 密码使用bcrypt加密
   - 敏感信息不返回给前端
   - HTTPS传输（生产环境）

## 贡献指南

1. Fork项目
2. 创建特性分支
3. 提交代码
4. 推送到分支
5. 创建Pull Request

## 许可证

[添加你的许可证信息]

## 联系方式

[添加你的联系方式]
