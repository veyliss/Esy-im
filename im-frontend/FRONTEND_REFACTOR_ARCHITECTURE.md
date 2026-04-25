# 前端重构架构文档

本文档用于替代并升级 [`PAGE_REDESIGN_ARCHITECTURE.md`](im-frontend/PAGE_REDESIGN_ARCHITECTURE.md)，作为 [`im-frontend`](im-frontend) 当前唯一长期有效的前端重构架构说明。

## 1. 文档目标

本文件聚焦前端重构的长期规则，而不是某一次样式修补或阶段成果汇报。

覆盖范围：
- 页面信息架构
- 页面壳层规则
- 区块组件规则
- 页面迁移策略
- 实施约束与验收标准

不覆盖：
- 一次性 UI 修补记录
- 临时问题排查过程
- 版本性总结

---

## 2. 当前前端问题总结

当前前端的主要问题不在于“缺少组件”，而在于“组件、页面、文档没有形成稳定体系”：

1. 页面虽然已引入统一壳层，但内部组织方式仍不一致
2. 同样的列表、卡片、空状态、操作栏在不同页面重复实现
3. 页面级 JSX 过大，页面结构与业务逻辑耦合严重
4. 文档长期混合了架构说明、阶段总结、修补记录
5. 视觉规范虽然逐渐收敛，但还没有沉淀成明确规则

---

## 3. 前端目标架构

前端未来应稳定为三层结构：

```text
Page Layer
  └── 页面路由与数据装配
Workspace Layer
  └── 壳层、分栏、导航、区块容器
Business Component Layer
  └── 消息项、好友项、群成员项、动态项、表单项
```

对应当前基础：
- 页面层：[`app`](im-frontend/app)
- 壳层层：[`components/layout/workspace-shell.tsx`](im-frontend/components/layout/workspace-shell.tsx)
- 区块层：[`components/workspace/section.tsx`](im-frontend/components/workspace/section.tsx)
- 业务组件层：[`components/chat`](im-frontend/components/chat)、[`components/contacts`](im-frontend/components/contacts)、[`components/moments`](im-frontend/components/moments)

---

## 4. 页面壳层规范

统一壳层基于 [`WorkspaceShell`](im-frontend/components/layout/workspace-shell.tsx)。

### 4.1 Header 规则

顶部只负责：
- 主导航切换
- 当前页主操作
- 当前用户入口

顶部禁止：
- 堆叠多个图标按钮
- 放置复杂筛选器
- 放置页面内次级标签群

### 4.2 Sidebar 规则

左栏只负责：
- 搜索
- 筛选
- 一级列表
- 二级分组切换

左栏不负责：
- 大型详情
- 长表单
- 复杂说明文本

### 4.3 Main 规则

右侧主内容区负责：
- 详情页头部
- 内容流
- 表单主体
- 空状态
- 主操作区

---

## 5. 区块组件规范

当前统一区块组件位于 [`components/workspace/section.tsx`](im-frontend/components/workspace/section.tsx)。

建议将其作为通用语义组件层长期保留：

- [`SectionCard`](im-frontend/components/workspace/section.tsx:9)
  - 用于标准白色内容卡片
- [`SectionTitle`](im-frontend/components/workspace/section.tsx:24)
  - 用于统一标题和说明区域
- [`SidebarSection`](im-frontend/components/workspace/section.tsx:42)
  - 用于左栏分组区块
- [`EmptyPanel`](im-frontend/components/workspace/section.tsx:58)
  - 用于统一空状态承载容器
- [`ActionBar`](im-frontend/components/workspace/section.tsx:79)
  - 用于统一操作栏排列

后续若新增组件，必须满足以下条件：
1. 有跨页面复用价值
2. 有明确的语义边界
3. 不绑定某单一业务模型

---

## 6. 页面模式定义

## 6.1 聊天页模式

参考文件：[`app/chat/page.tsx`](im-frontend/app/chat/page.tsx)

结构：
- 左侧会话列表
- 右侧消息流和输入区

它是当前最适合作为样板页的页面。

## 6.2 通讯录页模式

参考文件：[`app/contacts/page.tsx`](im-frontend/app/contacts/page.tsx)

结构：
- 左侧好友与群聊列表
- 右侧详情和请求页签

它是当前联系人类页面的参考基线。

## 6.3 群聊页模式

参考文件：[`app/groups/page.tsx`](im-frontend/app/groups/page.tsx)

结构：
- 左侧群组列表和搜索结果
- 右侧群详情和成员列表

它应与通讯录中的群详情体验统一，而不是独立生长为另一种视觉体系。

## 6.4 朋友圈页模式

参考文件：[`app/moments/page.tsx`](im-frontend/app/moments/page.tsx)

结构：
- 左侧视图切换
- 右侧发布区和动态流

## 6.5 我的页面模式

参考文件：[`app/me/page.tsx`](im-frontend/app/me/page.tsx)

结构：
- 左侧设置导航
- 右侧资料与账号设置表单

---

## 7. 视觉与交互规则

### 7.1 视觉原则
- 文字优先
- 结构优先
- 少图标
- 少装饰
- 强调信息层级而非视觉花样

### 7.2 组件风格
- 页面卡片圆角统一在 `28px` 左右
- 列表项圆角统一在 `16px` ~ `20px`
- 按钮统一分为主按钮、次按钮、危险按钮
- 输入框统一使用大圆角、浅边框、低噪音风格

### 7.3 空状态原则
- 所有空状态必须使用统一容器
- 空状态必须包含标题
- 只有在必要时才补充说明文案

---

## 8. 页面迁移顺序

建议按以下顺序迁移：

1. [`app/chat/page.tsx`](im-frontend/app/chat/page.tsx)
2. [`app/groups/page.tsx`](im-frontend/app/groups/page.tsx)
3. [`app/moments/page.tsx`](im-frontend/app/moments/page.tsx)
4. [`app/me/page.tsx`](im-frontend/app/me/page.tsx)
5. [`app/contacts/page.tsx`](im-frontend/app/contacts/page.tsx) 最后做统一回看和校准

理由：
- 聊天页结构最完整，适合沉淀样板
- 其余页面可以按样板逐步替换区块
- 通讯录页应作为最终统一校准页面，而不是反复局部修补

---

## 9. 工程约束

重构实施过程中必须遵守：

1. 优先抽区块，再做页面替换
2. 避免大块 JSX 一次性改写
3. 不在视觉重构阶段同时重写 API 层
4. 不在视觉重构阶段同时大改 store 结构
5. 每一页迁移后都需要执行 [`npm run build`](im-frontend/package.json)

---

## 10. 验收标准

当以下条件全部成立时，可认为前端重构架构落地完成：

- 主页面都建立在统一壳层之上
- 区块组件被跨页面复用
- 页面级 JSX 体积明显下降
- 页面导航、列表、详情、表单组织方式统一
- 图标不再成为主要交互表达方式
- 构建通过，且没有新增阻断性错误

---

## 11. 与其他文档的关系

- 总方案：[`PROJECT_REFACTOR_MASTER_PLAN.md`](PROJECT_REFACTOR_MASTER_PLAN.md)
- 前端文档索引：[`DOCUMENTATION_INDEX.md`](im-frontend/DOCUMENTATION_INDEX.md)
- API 接入指南：[`API_INTEGRATION_GUIDE.md`](im-frontend/API_INTEGRATION_GUIDE.md)
- 历史页面设计文档：[`PAGE_REDESIGN_ARCHITECTURE.md`](im-frontend/PAGE_REDESIGN_ARCHITECTURE.md)

本文件优先级高于历史页面设计文档，后续应以本文件作为当前前端重构唯一架构依据。
