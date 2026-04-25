# Esy-IM

Esy-IM 是一个包含 [`Next.js`](im-frontend/package.json) 前端与 [`Go`](im-backend/go.mod) 后端的即时通讯项目。

当前项目已经进入“文档治理 + 整体重构”阶段，后续所有整理与重构工作都应围绕统一文档体系推进，而不是继续增加零散总结文档。

## 1. 文档入口

### 1.1 项目总方案
- [`PROJECT_REFACTOR_MASTER_PLAN.md`](PROJECT_REFACTOR_MASTER_PLAN.md)
  - 项目文档治理与整体重构唯一主控文档

### 1.2 前端文档入口
- [`im-frontend/DOCUMENTATION_INDEX.md`](im-frontend/DOCUMENTATION_INDEX.md)
  - 前端文档总索引
- [`im-frontend/FRONTEND_REFACTOR_ARCHITECTURE.md`](im-frontend/FRONTEND_REFACTOR_ARCHITECTURE.md)
  - 前端重构架构文档
- [`im-frontend/API_INTEGRATION_GUIDE.md`](im-frontend/API_INTEGRATION_GUIDE.md)
  - 前端 API 接入指南

### 1.3 后端文档入口
- [`im-backend/DOCUMENTATION_INDEX.md`](im-backend/DOCUMENTATION_INDEX.md)
  - 后端文档总索引
- [`im-backend/API_DOCUMENTATION.md`](im-backend/API_DOCUMENTATION.md)
  - 后端 API 主文档
- [`im-backend/MESSAGE_API_DOCUMENTATION.md`](im-backend/MESSAGE_API_DOCUMENTATION.md)
  - 消息域接口文档
- [`im-backend/DEVELOPMENT.md`](im-backend/DEVELOPMENT.md)
  - 后端开发文档

### 1.4 历史归档入口
- [`docs-archive/root/README.md`](docs-archive/root/README.md)
  - 根目录历史文档归档说明
- [`im-frontend/archive/README.md`](im-frontend/archive/README.md)
  - 前端历史文档归档说明
- [`im-backend/archive/README.md`](im-backend/archive/README.md)
  - 后端历史文档归档说明

---

## 2. 项目结构

```text
Esy-IM/
├── README.md
├── PROJECT_REFACTOR_MASTER_PLAN.md
├── docs-archive/
│   └── root/
├── im-frontend/
│   ├── DOCUMENTATION_INDEX.md
│   ├── FRONTEND_REFACTOR_ARCHITECTURE.md
│   ├── API_INTEGRATION_GUIDE.md
│   └── app/
└── im-backend/
    ├── DOCUMENTATION_INDEX.md
    ├── API_DOCUMENTATION.md
    ├── DEVELOPMENT.md
    └── internal/
```

---

## 3. 开发入口

### 3.1 前端
- 前端说明见 [`im-frontend/README.md`](im-frontend/README.md)
- 当前前端架构说明见 [`im-frontend/FRONTEND_REFACTOR_ARCHITECTURE.md`](im-frontend/FRONTEND_REFACTOR_ARCHITECTURE.md)

### 3.2 后端
- 后端说明见 [`im-backend/README.md`](im-backend/README.md)
- 当前后端开发说明见 [`im-backend/DEVELOPMENT.md`](im-backend/DEVELOPMENT.md)

---

## 4. 当前治理规则

1. 顶层只保留长期有效入口文档
2. 一次性修补总结不再作为主导航文档
3. 前端、后端分别通过各自索引文档维护导航
4. 历史阶段性文档统一进入归档目录
5. 后续重构必须优先更新主文档，而不是新增散落 markdown

---

## 5. 安全说明

敏感信息配置规则见 [`SECURITY.md`](SECURITY.md)。
