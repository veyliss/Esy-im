# 前端文档索引

本文档是 [`im-frontend`](im-frontend) 目录的唯一文档导航入口，用于区分当前有效文档、实施文档与历史归档文档。

## 1. 当前有效文档

### 1.1 前端入口
- [`README.md`](im-frontend/README.md)
  - 前端启动方式
  - 目录结构说明
  - 指向核心文档

### 1.2 前端重构架构
- [`FRONTEND_REFACTOR_ARCHITECTURE.md`](im-frontend/FRONTEND_REFACTOR_ARCHITECTURE.md)
  - 页面壳层规范
  - 区块组件规范
  - 页面迁移原则
  - 视觉与交互统一规则

### 1.3 前端对接文档
- [`API_INTEGRATION_GUIDE.md`](im-frontend/API_INTEGRATION_GUIDE.md)
  - 当前有效 API 对接流程
  - 登录、鉴权、WebSocket、错误处理规则

### 1.4 API 速查文档
- [`API_QUICK_REFERENCE.md`](im-frontend/API_QUICK_REFERENCE.md)
  - 前端开发时的接口速查

---

## 2. 当前代码实现参考

以下文件不是文档，但在阅读文档时建议同时参考：
- [`app/chat/page.tsx`](im-frontend/app/chat/page.tsx)
- [`app/contacts/page.tsx`](im-frontend/app/contacts/page.tsx)
- [`app/groups/page.tsx`](im-frontend/app/groups/page.tsx)
- [`app/moments/page.tsx`](im-frontend/app/moments/page.tsx)
- [`app/me/page.tsx`](im-frontend/app/me/page.tsx)
- [`components/layout/workspace-shell.tsx`](im-frontend/components/layout/workspace-shell.tsx)
- [`components/workspace/section.tsx`](im-frontend/components/workspace/section.tsx)

---

## 3. 待迁移文档

以下文档仍存在，但应逐步收敛到新的体系：
- [`PAGE_REDESIGN_ARCHITECTURE.md`](im-frontend/PAGE_REDESIGN_ARCHITECTURE.md)
  - 应迁移并升级为 [`FRONTEND_REFACTOR_ARCHITECTURE.md`](im-frontend/FRONTEND_REFACTOR_ARCHITECTURE.md)
- [`FRONTEND_API_INTEGRATION.md`](im-frontend/FRONTEND_API_INTEGRATION.md)
  - 应整理并重命名为 [`API_INTEGRATION_GUIDE.md`](im-frontend/API_INTEGRATION_GUIDE.md)

---

## 4. 建议归档文档

以下文档主要是阶段性成果、专项修补或局部总结，不应继续作为主入口：
- [`UI_OPTIMIZATION_SUMMARY.md`](im-frontend/UI_OPTIMIZATION_SUMMARY.md)
- [`INTEGRATION_SUMMARY.md`](im-frontend/INTEGRATION_SUMMARY.md)
- [`CHAT_INTERFACE_BEST_PRACTICES.md`](im-frontend/CHAT_INTERFACE_BEST_PRACTICES.md)
- [`基于现有UI资产的响应式欢迎与登录页实现.md`](im-frontend/基于现有UI资产的响应式欢迎与登录页实现.md)

这些文档建议迁移到后续建立的归档目录：
- [`archive`](im-frontend/archive)

---

## 5. 文档治理规则

后续新增前端文档必须遵守：
1. 一个主题只保留一个主文档
2. 阶段性总结不放在主目录长期暴露
3. 架构文档使用 `*_ARCHITECTURE.md`
4. 接入说明使用 `*_GUIDE.md`
5. 速查手册使用 `*_REFERENCE.md`
6. 历史总结统一迁入 [`archive`](im-frontend/archive)

---

## 6. 下一步执行顺序

1. 创建 [`FRONTEND_REFACTOR_ARCHITECTURE.md`](im-frontend/FRONTEND_REFACTOR_ARCHITECTURE.md)
2. 创建 [`API_INTEGRATION_GUIDE.md`](im-frontend/API_INTEGRATION_GUIDE.md)
3. 建立 [`archive`](im-frontend/archive) 并迁移历史文档
4. 重写 [`README.md`](im-frontend/README.md) 使其指向本索引文档
