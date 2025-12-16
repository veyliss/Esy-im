# 组件库说明

本目录存放抽离的可复用组件，遵循高内聚、低耦合与类型完备的原则。组件具备必要的可配置项与插槽，适应不同场景复用。

## NavTabs 顶部导航标签

- 路径：components/ui/nav-tabs.tsx
- 用途：在 chat / contacts / moments / me 页面统一导航样式与交互
- Props:
  - active: "chat" | "contacts" | "moments" | "me" 当前激活项
  - variant?: "light" | "muted" 视觉风格（默认 light）
  - className?: string 自定义类名
  - rightSlot?: React.ReactNode 右侧插槽（头像、操作按钮等）

### 使用示例

```tsx
import { NavTabs } from "@/components/ui/nav-tabs";

export default function Page() {
  return (
    <header className="flex h-16 items-center border-b border-slate-200 dark:border-slate-800 px-6 bg-white dark:bg-background-dark">
      <NavTabs
        active="chat"
        variant="light"
        rightSlot={<div className="size-10 rounded-full bg-cover bg-center" />}
      />
    </header>
  );
}
```

后续建议继续抽离：
- PageShell（通用页面容器）
- Sidebar（宽度、分组、选中态可配置）
- SectionCard（圆角卡片，阴影与边框可配置）
- UserAvatar（在线态徽标、尺寸可配置）
- FormField（表单控件统一焦点态与错误提示）