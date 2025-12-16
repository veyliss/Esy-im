IM 架构



im-backend/
├── cmd/                    # 启动程序入口 (main.go)
│   └── server/
│       └── main.go
├── config/                 # 配置文件/加载器
│   └── config.go
├── internal/               # 内部模块 (核心业务逻辑，不暴露给外部)
│   ├── app/                # 应用层 (服务组装)
│   │   └── server.go
│   ├── controller/         # 控制器层 (类似 Java 的 controller)
│   │   └── user_controller.go
│   ├── service/            # 服务层 (业务逻辑)
│   │   └── user_service.go
│   ├── repository/         # 数据访问层 (操作数据库/redis)
│   │   └── user_repository.go
│   ├── model/              # 数据模型 (struct 定义)
│   │   └── user.go
│   └── pkg/                # 公共工具库 (utils、日志、常量)
│       ├── db.go
│       ├── redis.go
│       └── logger.go
├── migrations/             # 数据库迁移 (SQL 脚本)
│   └── 001_init.sql
├── go.mod
└── go.sum



🔹 路由分层规划
1. 用户模块 /users
方法	路径	描述
POST	/api/v1/users/register	用户注册（邮箱 + 昵称 + 密码）
POST	/api/v1/users/login	用户登录（邮箱 + 密码 或 验证码）
GET	/api/v1/users/me	获取当前用户信息（需 token）
PUT	/api/v1/users/me	修改当前用户信息（昵称、头像）
POST	/api/v1/users/send-code	发送邮箱验证码（用于登录/注册）
2. 好友模块 /friends
方法	路径	描述
POST	/api/v1/friends/add	添加好友（发送好友请求）
POST	/api/v1/friends/accept	接受好友请求
GET	/api/v1/friends/list	获取好友列表
DELETE	/api/v1/friends/{id}	删除好友
3. 消息模块 /messages
方法	路径	描述
POST	/api/v1/messages/send	发送消息（文本/图片/语音）
GET	/api/v1/messages/history?userId=xxx	获取与某个用户的聊天记录
WS	/api/v1/messages/ws	建立 WebSocket 连接，实现即时通讯
4. 朋友圈模块 /moments
方法	路径	描述
POST	/api/v1/moments/create	发表朋友圈
GET	/api/v1/moments/list	获取朋友圈动态（好友的发布内容）
POST	/api/v1/moments/{id}/like	点赞
POST	/api/v1/moments/{id}/comment	评论
DELETE	/api/v1/moments/{id}	删除自己的动态
5. 系统 & 公共接口 /system
方法	路径	描述
GET	/api/v1/ping	健康检查
GET	/api/v1/version	获取系统版本号
🔹 路由层次结构示例
/api/v1
 ├── users
 │    ├── register
 │    ├── login
 │    ├── me
 │    └── send-code
 │
 ├── friends
 │    ├── add
 │    ├── accept
 │    ├── list
 │    └── {id}
 │
 ├── messages
 │    ├── send
 │    ├── history
 │    └── ws
 │
 ├── moments
 │    ├── create
 │    ├── list
 │    ├── {id}/like
 │    ├── {id}/comment
 │    └── {id}
 │
 └── system
      ├── ping
      └── version


用户系统：登录注册、获取信息

好友系统：关系链管理

消息系统：即时通讯（支持 WebSocket）

朋友圈：社交动态

系统公共：健康检查





internal/
  handler/      # HTTP 层，处理请求输入/输出
    user_handler.go
  controller/   # 控制器层，业务入口，调度 service
    user_controller.go
  service/      # 业务逻辑层
    user_service.go
  repository/   # 数据层
    user_repository.go
  model/        # 实体
    user.go
  pkg/          # 公共工具 (DB, Redis, Response, Mail)




前端
im-frontend/
├─ app/                        # Next.js App Router
│  ├─ (auth)/                  # 登录 / 注册模块
│  │  ├─ login/page.tsx
│  │  └─ register/page.tsx     # 如果登录即注册，可以省略
│  │
│  ├─ (main)/                  # 主功能区（需要登录）
│  │  ├─ layout.tsx            # 主布局（含底部导航 / 头部）
│  │  ├─ messages/page.tsx     # 信息列表页
│  │  ├─ contacts/page.tsx     # 通讯录页
│  │  ├─ moments/page.tsx      # 朋友圈页
│  │  └─ me/page.tsx           # 我的页面
│  │
│  ├─ globals.css              # Tailwind 全局样式
│  ├─ layout.tsx               # 根布局
│  └─ page.tsx                 # 入口（可跳转到 login 或 main）
│
├─ components/                 # 可复用组件
│  ├─ layout/                  # 布局类组件
│  │  ├─ BottomNav.tsx         # 底部导航（移动端）
│  │  └─ Header.tsx            # 顶部栏
│  ├─ chat/                    # 聊天相关组件
│  │  ├─ ChatList.tsx
│  │  ├─ ChatItem.tsx
│  │  └─ ChatInput.tsx
│  ├─ contacts/                # 通讯录相关
│  │  └─ ContactList.tsx
│  └─ common/                  # 通用小组件（按钮、卡片等二次封装）
│     └─ Avatar.tsx
│
├─ lib/                        # 工具函数与全局逻辑
│  ├─ api.ts                   # axios 实例
│  ├─ auth.ts                  # 登录 / 注册逻辑
│  ├─ storage.ts               # 本地存储封装
│  └─ store.ts                 # 状态管理（Zustand）
│
├─ styles/                     # 额外样式
│  └─ antd.css                 # antd 自定义主题
│
├─ types/                      # TypeScript 类型定义
│  ├─ auth.ts
│  ├─ user.ts
│  └─ message.ts
│
├─ public/                     # 静态资源
│
├─ .eslintrc.json
├─ tailwind.config.ts
├─ tsconfig.json
└─ package.json
