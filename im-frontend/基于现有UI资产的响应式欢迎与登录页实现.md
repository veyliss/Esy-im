# 基于现有UI资产的响应式欢迎与登录页实现

## Core Features

- 欢迎页主视觉（隐藏导航，仅保留醒目登录按钮，视觉细节优化）

- 登录页（两种方式Tab：账号/密码、邮箱/验证码）

- 注册模块（账号+邮箱+验证码）

- 统一可复用组件：NavTabs（props/插槽/类型完整）

- 统一的主应用骨架（头部、侧栏、内容、底部）

- 响应式适配与移动优化、错误提示与加载态

- 路由权限控制（未登录仅公共页、登录后重定向 /chat）

- 身份验证与拦截器策略（access+refresh、队列刷新、重试/失败登出）

- 路由配置重构（常量与权限分组，统一 /chat）

## Tech Stack

{
  "Web": {
    "arch": "react",
    "component": null
  },
  "iOS": null,
  "Android": null
}

## Design

统一导航视觉与交互；通过组件 props 提供可配置性与插槽，降低页面重复度。

## Plan

Note: 

- [ ] is holding
- [/] is doing
- [X] is done

---

[X] 抽离 NavTabs 组件与文档

[/] 在 chat/contacts/moments/me 四页落地替换

[X] 修复构建错误（安装 clsx）

[ ] 后续抽离 PageShell/Sidebar/SectionCard 等
