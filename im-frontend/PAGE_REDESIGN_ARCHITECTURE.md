# 页面重构架构文档

## 1. 目标

本次重构不再基于“局部修样式”，而是重新定义整个 IM 前端的页面设计体系，使 [`聊天`](im-frontend/app/chat/page.tsx)、[`通讯录`](im-frontend/app/contacts/page.tsx)、[`群聊`](im-frontend/app/groups/page.tsx)、[`朋友圈`](im-frontend/app/moments/page.tsx)、[`我的`](im-frontend/app/me/page.tsx) 共享同一套信息架构、布局规则和组件语言。

核心目标：
- 同一产品内所有主页面保持统一骨架
- 去装饰化，减少无意义图标和视觉噪音
- 强化“列表区 / 内容区 / 操作区”的层级关系
- 保留现有接口与状态管理，不先动业务链路
- 为后续逐页重构提供可执行规范

---

## 2. 现状问题

### 2.1 结构问题

当前页面虽然已引入 [`WorkspaceShell`](im-frontend/components/layout/workspace-shell.tsx)，但不同页面内部仍存在以下不一致：
- 顶部右侧操作区风格不统一
- 左侧导航有的偏菜单，有的偏卡片，有的偏列表
- 主内容区卡片密度、圆角、留白标准不统一
- 空状态文案和布局语言不统一
- 局部仍有“图标优先”的设计残留

### 2.2 体验问题

- 用户难以感知哪些区域是“主操作”与“辅助信息”
- 页面视觉层次过多，导致信息优先级模糊
- 相同功能在不同页面使用不同组件表达
- 页面虽然统一了壳层，但没有统一“内容组织方式”

### 2.3 工程问题

- 页面级 JSX 过大，结构和视觉耦合严重
- 共享布局层与页面内容层职责边界不够清晰
- 组件复用还停留在壳层级别，未进入区块级别

---

## 3. 新架构原则

### 3.1 统一原则

所有主页面统一遵循：
- 顶部：纯文字主导航 + 少量文字按钮
- 左栏：列表、过滤、二级切换
- 右栏：详情、表单、时间流、空状态
- 操作按钮统一为文字按钮，不依赖图标表达

### 3.2 精简原则

- 无必要不使用图标
- 无必要不使用浮层按钮
- 无必要不新增视觉层级
- 同类信息只使用一种视觉表达

### 3.3 稳定原则

- 保留现有 API 调用与 store 结构
- 优先重构布局和组件拆分
- 尽量避免在视觉重构阶段改动接口协议

### 3.4 可扩展原则

后续新增页面或模块时，必须能够复用：
- 页面壳层
- 区块标题
- 列表项
- 空状态
- 表单操作栏
- 详情页头部

---

## 4. 目标信息架构

## 4.1 全局页面骨架

统一骨架：
1. 顶部全局导航栏
2. 主体双栏工作区
3. 左侧为导航/筛选/会话列表
4. 右侧为详情内容区

建议结构：
- Global Header
- Workspace Sidebar
- Workspace Main

对应实现基础：[`WorkspaceShell`](im-frontend/components/layout/workspace-shell.tsx)

### 4.1.1 Header 规范

Header 只承担：
- 主导航切换
- 当前页单个主操作按钮
- 用户头像或账号入口

Header 禁止承载：
- 多个图标按钮并列
- 次级筛选器
- 页面级复杂状态提示

### 4.1.2 Sidebar 规范

Sidebar 只承担：
- 搜索 / 筛选
- 一级列表
- 二级分组切换

Sidebar 不承担：
- 大型详情卡片
- 复杂表单
- 多层嵌套操作

### 4.1.3 Main 规范

Main 负责：
- 当前实体详情
- 主要编辑行为
- 内容流展示
- 空状态反馈

---

## 5. 页面级目标设计

## 5.1 [`聊天`](im-frontend/app/chat/page.tsx)

### 目标角色
- 左侧：会话列表
- 右侧：当前会话内容

### 结构定义
- Sidebar
  - 搜索框
  - 会话列表
  - 未读数字标签
- Main
  - 会话标题
  - 消息流
  - 输入区

### 重构要求
- 会话项统一为纯文字信息 + 头像
- 去除无必要功能图标
- 输入区保留最少操作，仅保留输入和发送
- 历史、附件、表情等作为后续能力，不作为首屏核心视觉

---

## 5.2 [`通讯录`](im-frontend/app/contacts/page.tsx)

### 目标角色
- 左侧：好友 / 群聊列表
- 右侧：联系人详情 / 请求列表

### 结构定义
- Header
  - 主导航
  - 添加好友
  - 添加/加入群聊
- Sidebar
  - 群聊分组
  - 好友分组
- Main
  - 详情
  - 请求列表

### 说明
通讯录页当前是可接受参考基线，后续其他页面需要向它的“信息组织”对齐，而不是仅复制样式。

---

## 5.3 [`群聊`](im-frontend/app/groups/page.tsx)

### 目标角色
- 左侧：我的群组 / 搜索结果
- 右侧：群详情 / 成员列表

### 结构定义
- Sidebar
  - 搜索框
  - 我的群组列表
  - 搜索结果列表
- Main
  - 群名称与描述
  - 成员区
  - 操作区

### 重构要求
- 群组页应成为通讯录内“群详情”的增强版，而不是独立视觉体系
- 主操作只保留一个：创建群聊
- 成员列表区改为标准资料块布局

---

## 5.4 [`朋友圈`](im-frontend/app/moments/page.tsx)

### 目标角色
- 左侧：时间流视图切换
- 右侧：发布区 + 动态列表

### 结构定义
- Sidebar
  - 我的朋友圈
  - 朋友动态
- Main
  - 发表动态
  - 动态流

### 重构要求
- 发布区采用标准表单卡片
- 图片上传使用文字操作
- 动态流卡片统一间距、标题、操作区布局
- 删除、评论、点赞采用文字优先策略

---

## 5.5 [`我的`](im-frontend/app/me/page.tsx)

### 目标角色
- 左侧：个人设置导航
- 右侧：资料编辑与账号设置

### 结构定义
- Sidebar
  - 我的资料
  - 账号安全
  - 隐私设置
  - 通用设置
  - 关于我们
  - 退出登录
- Main
  - 头像区
  - 基础信息表单
  - 密码修改表单
  - 保存操作区

### 重构要求
- 以“设置页”而不是“个人名片页”为主
- 删除不必要的英文文案和图标说明
- 强化表单可读性与分组层级

---

## 6. 组件分层规划

## 6.1 壳层组件

- [`WorkspaceShell`](im-frontend/components/layout/workspace-shell.tsx)
  - 负责全局头部与左右栏布局
- [`NavTabs`](im-frontend/components/ui/nav-tabs.tsx)
  - 负责纯文字主导航

## 6.2 页面区块组件

建议新增：
- `SectionCard`
- `SectionTitle`
- `SidebarSection`
- `SidebarListItem`
- `DetailHeader`
- `EmptyPanel`
- `ActionBar`

建议目录：
- `im-frontend/components/workspace/`
- `im-frontend/components/sections/`

## 6.3 业务展示组件

保留并逐步整理：
- [`MomentItem`](im-frontend/components/moments/MomentItem.tsx)
- 通讯录请求项、好友项、群成员项
- 聊天消息项、会话项

目标：业务组件只关心数据展示，不负责页面级布局。

---

## 7. 设计规范

## 7.1 视觉层级

- 页面底色：浅灰
- 左栏：白底
- 主内容区：浅灰底上的白色卡片
- 仅主按钮使用品牌色
- 禁止同屏存在多个高饱和色抢焦点

## 7.2 圆角规范

- 页面卡片：`28px` ~ `32px`
- 列表项：`16px` ~ `20px`
- 表单输入框：`16px` ~ `20px`
- 按钮：`12px` ~ `16px`

## 7.3 间距规范

- 页面主内容内边距：`24px` ~ `32px`
- 卡片内边距：`20px` ~ `24px`
- 区块间距：`24px`
- 列表项间距：`8px` ~ `12px`

## 7.4 文本规范

- 页面标题：`text-xl / text-2xl`
- 分区标题：`text-base / text-lg`
- 正文：`text-sm`
- 辅助文案：`text-xs / text-sm`

## 7.5 按钮规范

按钮分三类：
- 主按钮：品牌色底
- 次按钮：浅灰底
- 危险按钮：浅红底 + 红字

禁止：
- 仅靠图标表示操作
- 同一区域出现超过 2 个主按钮

---

## 8. 工程实施方案

## 第一阶段：壳层稳定

目标：
- 固定 [`WorkspaceShell`](im-frontend/components/layout/workspace-shell.tsx) 最终结构
- 固定 [`NavTabs`](im-frontend/components/ui/nav-tabs.tsx) 的文字导航模式

产出：
- 页面级统一头部
- 页面级统一左右栏容器

## 第二阶段：区块抽象

目标：
- 从 [`chat/page.tsx`](im-frontend/app/chat/page.tsx)、[`groups/page.tsx`](im-frontend/app/groups/page.tsx)、[`moments/page.tsx`](im-frontend/app/moments/page.tsx)、[`me/page.tsx`](im-frontend/app/me/page.tsx) 中抽出重复区块

产出：
- 通用区块组件
- 通用空状态组件
- 通用详情头部组件

## 第三阶段：逐页重构

顺序建议：
1. [`聊天`](im-frontend/app/chat/page.tsx)
2. [`群聊`](im-frontend/app/groups/page.tsx)
3. [`朋友圈`](im-frontend/app/moments/page.tsx)
4. [`我的`](im-frontend/app/me/page.tsx)
5. 最后回看 [`通讯录`](im-frontend/app/contacts/page.tsx) 做一次统一校准

## 第四阶段：视觉与交互统一验收

重点检查：
- 页面间切换是否“像同一产品”
- 所有按钮是否文字优先
- 空状态是否统一
- 表单样式是否统一
- 列表项是否统一

---

## 9. 验收标准

满足以下条件才算完成：
- 所有主页面使用同一壳层
- 顶部导航为纯文字主导航
- 左栏与右栏职责清晰
- 无多余图标按钮堆积
- 同类卡片、按钮、输入框样式统一
- 页面切换时用户能明显感知为同一设计系统
- [`npm run build`](im-frontend/package.json) 能通过

---

## 10. 风险与注意事项

- 当前多个页面 JSX 体积较大，直接大范围改动容易再次出现标签结构损坏
- 建议后续重构优先采用“抽组件 + 小步替换”
- 不建议在视觉重构阶段同步修改 API、store、WebSocket 行为
- 需要避免把“简洁”做成“留白很多但信息松散”，仍需保证信息密度

---

## 11. 下一步建议

下一步不直接全量改页面，而是先做两件事：
1. 定义区块级通用组件清单
2. 选择一个页面作为完整重构样板页

推荐样板页：[`im-frontend/app/chat/page.tsx`](im-frontend/app/chat/page.tsx)

原因：
- 结构最完整
- 左右栏关系最清晰
- 最适合作为整个产品的信息架构模板
