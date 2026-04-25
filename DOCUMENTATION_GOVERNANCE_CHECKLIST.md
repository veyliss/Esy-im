# 文档治理结构复核清单

本文档用于在正式迁移历史 Markdown 文档之前，确认当前文档治理结构已经具备执行条件。

## 1. 顶层主文档

- [x] 已存在 [`README.md`](README.md) 作为顶层入口
- [x] 已存在 [`PROJECT_REFACTOR_MASTER_PLAN.md`](PROJECT_REFACTOR_MASTER_PLAN.md) 作为总主控文档
- [x] 顶层 [`README.md`](README.md) 已指向前后端索引与归档说明
- [ ] 根目录历史 Markdown 已实际迁移到 [`docs-archive/root`](docs-archive/root)

## 2. 前端文档体系

- [x] 已存在 [`im-frontend/DOCUMENTATION_INDEX.md`](im-frontend/DOCUMENTATION_INDEX.md)
- [x] 已存在 [`im-frontend/FRONTEND_REFACTOR_ARCHITECTURE.md`](im-frontend/FRONTEND_REFACTOR_ARCHITECTURE.md)
- [x] 已存在 [`im-frontend/API_INTEGRATION_GUIDE.md`](im-frontend/API_INTEGRATION_GUIDE.md)
- [x] 已存在 [`im-frontend/archive/README.md`](im-frontend/archive/README.md)
- [ ] [`im-frontend/PAGE_REDESIGN_ARCHITECTURE.md`](im-frontend/PAGE_REDESIGN_ARCHITECTURE.md) 是否已标记为历史文档或迁移完成
- [ ] [`im-frontend/FRONTEND_API_INTEGRATION.md`](im-frontend/FRONTEND_API_INTEGRATION.md) 是否已标记为历史文档或迁移完成
- [ ] 前端历史总结类文档是否已实际迁移到 [`im-frontend/archive`](im-frontend/archive)

## 3. 后端文档体系

- [x] 已存在 [`im-backend/DOCUMENTATION_INDEX.md`](im-backend/DOCUMENTATION_INDEX.md)
- [x] 已存在 [`im-backend/archive/README.md`](im-backend/archive/README.md)
- [x] 后端索引已明确长期有效文档与归档建议
- [ ] 后端历史总结类文档是否已实际迁移到 [`im-backend/archive`](im-backend/archive)
- [ ] [`im-backend/QUICKSTART.md`](im-backend/QUICKSTART.md) 与 [`im-backend/QUICKSTART_v1.1.md`](im-backend/QUICKSTART_v1.1.md) 是否已完成取舍

## 4. 归档规则

- [x] 已建立根目录归档说明 [`docs-archive/root/README.md`](docs-archive/root/README.md)
- [x] 已建立前端归档说明 [`im-frontend/archive/README.md`](im-frontend/archive/README.md)
- [x] 已建立后端归档说明 [`im-backend/archive/README.md`](im-backend/archive/README.md)
- [ ] 归档目录中是否已放入首批历史文档
- [ ] 顶层是否仍存在不应继续暴露的阶段性修补文档

## 5. 执行建议

建议按以下顺序完成最后治理动作：

1. 将根目录历史文档迁移到 [`docs-archive/root`](docs-archive/root)
2. 将前端历史文档迁移到 [`im-frontend/archive`](im-frontend/archive)
3. 将后端历史文档迁移到 [`im-backend/archive`](im-backend/archive)
4. 在旧文档中补充一句“已被新文档替代”或直接归档
5. 最后重新检查 [`README.md`](README.md)、[`im-frontend/DOCUMENTATION_INDEX.md`](im-frontend/DOCUMENTATION_INDEX.md)、[`im-backend/DOCUMENTATION_INDEX.md`](im-backend/DOCUMENTATION_INDEX.md) 三个入口是否一致

## 6. 当前结论

截至目前，文档治理的“结构设计”已经完成，当前剩余的主要工作不是再写新文档，而是按既定方案把旧 Markdown 实际迁移归档。
