# 后端文档索引

本文档是 [`im-backend`](im-backend) 目录的唯一后端文档导航入口，用于区分当前有效文档、开发文档、API 文档与历史归档文档。

## 1. 当前有效文档

### 1.1 后端入口
- [`README.md`](im-backend/README.md)
  - 后端启动方式
  - 环境要求
  - 指向核心文档

### 1.2 开发文档
- [`DEVELOPMENT.md`](im-backend/DEVELOPMENT.md)
  - 开发规范
  - 项目结构
  - 本地调试方式

### 1.3 API 文档
- [`API_DOCUMENTATION.md`](im-backend/API_DOCUMENTATION.md)
  - 通用接口说明
- [`MESSAGE_API_DOCUMENTATION.md`](im-backend/MESSAGE_API_DOCUMENTATION.md)
  - 消息与会话相关接口说明

### 1.4 快速测试文档
- [`API_TEST_QUICKSTART.md`](im-backend/API_TEST_QUICKSTART.md)
  - 接口测试快速入口

---

## 2. 当前代码实现参考

以下文件不是文档，但阅读文档时建议同时参考：
- [`cmd/server/main.go`](im-backend/cmd/server/main.go)
- [`internal/router/router.go`](im-backend/internal/router/router.go)
- [`internal/pkg/middleware.go`](im-backend/internal/pkg/middleware.go)
- [`internal/pkg/jwt.go`](im-backend/internal/pkg/jwt.go)
- [`internal/service`](im-backend/internal/service)
- [`internal/controller`](im-backend/internal/controller)
- [`internal/handler`](im-backend/internal/handler)

---

## 3. 待收敛文档

以下文档包含有价值内容，但不适合作为长期主入口：
- [`ARCHITECTURE_IMPROVEMENT.md`](im-backend/ARCHITECTURE_IMPROVEMENT.md)
  - 应保留为历史架构演进参考，不作为当前执行主线
- [`QUICKSTART.md`](im-backend/QUICKSTART.md)
- [`QUICKSTART_v1.1.md`](im-backend/QUICKSTART_v1.1.md)
  - 应二选一，避免多个快速开始并存

---

## 4. 建议归档文档

以下文档应迁移到后续建立的归档目录：
- [`FEATURE_SUMMARY.md`](im-backend/FEATURE_SUMMARY.md)
- [`MESSAGE_FEATURE_SUMMARY.md`](im-backend/MESSAGE_FEATURE_SUMMARY.md)
- [`COMPREHENSIVE_API_TEST_SUMMARY.md`](im-backend/COMPREHENSIVE_API_TEST_SUMMARY.md)
- [`CHANGELOG.md`](im-backend/CHANGELOG.md)
- [`ERROR_HANDLING_GUIDE.md`](im-backend/ERROR_HANDLING_GUIDE.md)
- [`DATABASE_MIGRATION.md`](im-backend/DATABASE_MIGRATION.md)
- [`ARCHITECTURE_IMPROVEMENT.md`](im-backend/ARCHITECTURE_IMPROVEMENT.md)

建议归档目录：
- [`archive`](im-backend/archive)

---

## 5. 文档治理规则

后续新增后端文档必须遵守：
1. 入口文档只保留一个 [`README.md`](im-backend/README.md)
2. API 说明集中在 API 文档体系中
3. 架构讨论文档不能与当前执行文档混放
4. 阶段性测试报告、功能总结统一进入 [`archive`](im-backend/archive)
5. 不再继续新增 `*_SUMMARY.md` 作为主入口文档

---

## 6. 下一步执行顺序

1. 建立 [`archive`](im-backend/archive)
2. 决定保留 [`QUICKSTART.md`](im-backend/QUICKSTART.md) 还是 [`QUICKSTART_v1.1.md`](im-backend/QUICKSTART_v1.1.md)
3. 迁移历史总结类文档到归档区
4. 重写 [`README.md`](im-backend/README.md) 使其指向本索引文档
