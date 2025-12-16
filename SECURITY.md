# 安全配置指南

## 环境变量配置

本项目使用环境变量来管理敏感配置信息。请按照以下步骤设置您的本地开发环境：

### 后端配置

1. 复制环境变量模板文件：
   ```bash
   cp im-backend/.env.example im-backend/.env
   ```

2. 编辑 `im-backend/.env` 文件，填入您的实际配置：
   - 数据库连接信息
   - Redis连接信息  
   - SMTP邮件服务配置
   - JWT密钥（请使用强密码）

### 前端配置

前端项目已经配置了 `.gitignore` 来忽略 `.env*` 文件。如果需要环境变量，请创建：
- `.env.local` - 本地开发环境
- `.env.development` - 开发环境
- `.env.production` - 生产环境

## 重要安全提醒

⚠️ **绝对不要将包含真实密码、密钥的 `.env` 文件提交到Git仓库！**

### 已被 .gitignore 忽略的文件类型：
- `.env` 及其变体文件
- 数据库配置文件
- SSL证书和私钥
- 日志文件
- 临时文件和缓存

### 如果意外提交了敏感信息：

1. 立即更改所有暴露的密码和密钥
2. 使用以下命令从Git历史中移除敏感文件：
   ```bash
   git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch path/to/sensitive/file' --prune-empty --tag-name-filter cat -- --all
   ```
3. 强制推送到远程仓库：
   ```bash
   git push origin --force --all
   ```

## 生产环境部署

在生产环境中：
1. 使用环境变量或安全的配置管理服务
2. 定期轮换密钥和密码
3. 使用强密码和复杂的JWT密钥
4. 启用HTTPS和其他安全措施

## 联系方式

如果发现安全问题，请及时联系项目维护者。