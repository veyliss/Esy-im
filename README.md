# Esy-IM

Esy-IM 是一个即时通讯项目，包含 Next.js 前端和 Go 后端。当前功能覆盖用户账号、好友关系、单聊消息、群聊消息、朋友圈和 WebSocket 实时通信。

## 技术栈

| 模块 | 技术 |
| --- | --- |
| 前端 | Next.js 15, React 19, TypeScript, Ant Design, Zustand, Axios |
| 后端 | Go 1.25, Gorilla Mux, GORM, PostgreSQL, Redis, JWT, WebSocket |
| 数据 | PostgreSQL 负责业务数据，Redis 负责验证码、登录态等缓存数据 |

## 目录结构

```text
Esy-IM/
├── README.md
├── SECURITY.md
├── im-frontend/
│   ├── app/                 # Next.js App Router 页面
│   ├── components/          # 业务组件与通用 UI
│   ├── design-reference/    # 页面设计参考图与 HTML 原稿
│   ├── lib/                 # API、状态、工具函数、WebSocket 客户端
│   ├── public/
│   └── package.json
└── im-backend/
    ├── cmd/server/          # 服务启动入口
    ├── config/              # 环境配置读取
    ├── internal/
    │   ├── controller/      # 控制器层
    │   ├── handler/         # HTTP/WebSocket 处理层
    │   ├── model/           # GORM 数据模型
    │   ├── repository/      # 数据访问层
    │   ├── service/         # 业务逻辑层
    │   ├── pkg/             # 数据库、Redis、JWT、中间件、响应工具
    │   └── router/          # 路由注册
    ├── migrations/
    └── go.mod
```

## 功能模块

- 用户：注册、登录、验证码、密码登录、个人资料、退出登录。
- 好友：搜索用户、发送好友请求、同意/拒绝请求、好友列表、备注、删除好友。
- 消息：会话创建、消息发送、历史消息、未读数、已读、撤回、删除、WebSocket 推送。
- 群聊：创建群、加入/退出群、成员管理、群消息、群未读数。
- 朋友圈：发布动态、时间线、点赞、评论、删除动态和评论。

## 本地启动

### 1. 准备依赖

本地需要安装：

- Node.js
- npm
- Go 1.25+
- PostgreSQL
- Redis

### 2. 配置后端环境

```bash
cd im-backend
cp .env.example .env
```

按本地环境修改 `im-backend/.env`：

```env
APP_PORT=8080
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=your_postgres_user
POSTGRES_PASSWORD=your_postgres_password
POSTGRES_DB=your_database_name
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASS=your_email_password_or_app_password
JWT_SECRET=your-jwt-secret-key-minimum-32-characters-long
JWT_EXPIRATION=8
```

启动后端：

```bash
go run ./cmd/server
```

服务默认运行在 `http://localhost:8080`，API 前缀为 `/api/v1`。启动时会通过 GORM 自动迁移数据表。

### 3. 配置前端环境

```bash
cd im-frontend
cp .env.example .env.local
npm install
```

确认 `im-frontend/.env.local`：

```env
NEXT_PUBLIC_API_BASE=http://localhost:8080/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:8080/api/v1
NEXT_PUBLIC_APP_NAME=Esy-IM
NEXT_PUBLIC_APP_VERSION=1.1.0
```

启动前端：

```bash
npm run dev
```

前端默认运行在 `http://localhost:3000`。

## 常用接口分组

后端接口统一挂载在 `/api/v1`：

- `GET /ping`
- `/users/*`
- `/friends/*`
- `/messages/*`
- `/groups/*`
- `/moments/*`

WebSocket 入口：

```text
GET /api/v1/messages/ws
```

具体请求参数以 `im-backend/internal/router/router.go` 和对应 handler/controller 实现为准。

## 开发约定

- 业务文档统一维护在根目录 `README.md`。
- 安全和环境变量规则维护在 `SECURITY.md`。
- 不再新增散落的阶段总结、修复记录、临时测试报告。
- `.env`、`.env.local`、日志、缓存、构建产物和依赖目录不提交到 Git。
- `im-frontend/design-reference/` 只放设计参考资产，不参与运行时代码引用。

## 安全

敏感配置不要提交到仓库。环境变量、密钥轮换和泄露处理规则见 `SECURITY.md`。
