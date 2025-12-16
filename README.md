# Esy-IM

一个现代化的即时通讯应用，包含前端和后端完整实现。

## 项目结构

```
Esy-IM/
├── im-frontend/          # Next.js 前端应用
├── im-backend/           # Go 后端服务
├── .github/              # GitHub 配置
├── .gitignore           # Git 忽略文件
├── SECURITY.md          # 安全配置指南
└── docker-compose.yml   # Docker 编排文件
```

## 功能特性

- 🔐 用户注册和登录
- 💬 实时聊天消息
- 👥 好友管理系统
- 📱 响应式界面设计
- 🔒 安全的环境配置

## 快速开始

### 环境配置

1. 复制环境变量模板：
   ```bash
   cp im-backend/.env.example im-backend/.env
   ```

2. 编辑 `im-backend/.env` 文件，填入您的配置信息

### 运行项目

详细的运行说明请参考：
- 后端：[im-backend/README.md](im-backend/README.md)
- 前端：[im-frontend/README.md](im-frontend/README.md)

## 安全说明

⚠️ **重要**：请查看 [SECURITY.md](SECURITY.md) 了解如何正确配置敏感信息。

本项目已配置 `.gitignore` 来保护您的隐私配置文件，包括：
- 数据库密码
- SMTP 配置
- JWT 密钥
- 其他敏感信息

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License