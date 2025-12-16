"use client";

import Link from "next/link";
import clsx from "clsx";
import React, { useState } from "react";

export type NavKey = "chat" | "contacts" | "moments" | "me";

export interface NavTabsProps {
  active: NavKey;
  className?: string;
  // 视觉风格：light 更醒目；muted 更低对比度；modern 现代化风格
  variant?: "light" | "muted" | "classic" | "modern";
  // 右侧插槽（头像、图标按钮等）
  rightSlot?: React.ReactNode;
  // 是否显示图标
  showIcons?: boolean;
  // 是否显示未读数量
  showBadges?: boolean;
  // 未读数量数据
  badges?: Partial<Record<NavKey, number>>;
}

const items: Array<{
  key: NavKey;
  label: string;
  href: string;
  icon: string;
  description: string;
}> = [
  {
    key: "chat",
    label: "聊天",
    href: "/chat",
    icon: "chat",
    description: "即时消息和对话"
  },
  {
    key: "contacts",
    label: "通讯录",
    href: "/contacts",
    icon: "contacts",
    description: "管理联系人和好友"
  },
  {
    key: "moments",
    label: "朋友圈",
    href: "/moments",
    icon: "photo_camera",
    description: "分享生活动态"
  },
  {
    key: "me",
    label: "我的",
    href: "/me",
    icon: "person",
    description: "个人资料和设置"
  },
];

export function NavTabs({
  active,
  className,
  variant = "modern",
  rightSlot,
  showIcons = true,
  showBadges = false,
  badges = {}
}: NavTabsProps) {
  const [hoveredItem, setHoveredItem] = useState<NavKey | null>(null);

  const styles = {
    light: {
      container: "bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-slate-200/50 dark:border-slate-700/50",
      link: "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors duration-200",
      active: "text-primary border-b-2 border-primary pb-2 font-semibold",
    },
    muted: {
      container: "bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm",
      link: "text-slate-600 dark:text-slate-400 hover:text-primary transition-colors duration-200",
      active: "text-primary border-b-2 border-primary pb-1",
    },
    classic: {
      container: "bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700",
      link: "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors text-base font-semibold pb-4 border-b-2 border-transparent",
      active: "text-[#0d5adb] border-[#0d5adb]",
    },
    modern: {
      container: "bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border-b border-slate-200/30 dark:border-slate-700/30 shadow-sm",
      link: "relative flex items-center gap-2 px-4 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary hover:bg-primary/5 dark:hover:bg-primary/10 transition-all duration-300 group",
      active: "text-primary bg-primary/10 dark:bg-primary/20 shadow-sm",
    },
  } as const;

  const tone = styles[variant] ?? styles.modern;

  return (
    <div className={clsx("flex items-center justify-between w-full px-4 py-2", tone.container, className)}>
      <nav className={clsx(
        "flex items-center",
        variant === "modern" ? "gap-2" : "gap-6"
      )}>
        {items.map((item) => {
          const isActive = item.key === active;
          const isHovered = hoveredItem === item.key;
          const badgeCount = badges[item.key] || 0;

          return (
            <div key={item.key} className="relative">
              <Link
                href={item.href}
                className={clsx(
                  tone.link,
                  isActive && tone.active,
                  variant === "modern" && "min-w-[80px] justify-center"
                )}
                onMouseEnter={() => setHoveredItem(item.key)}
                onMouseLeave={() => setHoveredItem(null)}
                title={item.description}
              >
                {/* 图标 */}
                {showIcons && (
                  <span className={clsx(
                    "material-symbols-outlined text-xl transition-transform duration-200",
                    isActive && "scale-110",
                    isHovered && !isActive && "scale-105"
                  )}>
                    {item.icon}
                  </span>
                )}

                {/* 标签文本 */}
                <span className={clsx(
                  "transition-all duration-200",
                  variant === "modern" && showIcons ? "text-sm" : "text-base",
                  isActive && "font-semibold"
                )}>
                  {item.label}
                </span>

                {/* 现代风格的活跃指示器 */}
                {variant === "modern" && isActive && (
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full" />
                )}

                {/* 悬停效果 */}
                {variant === "modern" && isHovered && !isActive && (
                  <div className="absolute inset-0 bg-primary/5 dark:bg-primary/10 rounded-xl -z-10 animate-fade-in-scale" />
                )}
              </Link>

              {/* 未读数量徽章 */}
              {showBadges && badgeCount > 0 && (
                <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium animate-fade-in-scale">
                  {badgeCount > 99 ? "99+" : badgeCount}
                </div>
              )}

              {/* 悬停提示 */}
              {variant === "modern" && isHovered && (
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-black/80 text-white text-xs rounded whitespace-nowrap opacity-0 animate-slide-in-down pointer-events-none z-50">
                  {item.description}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* 右侧插槽 */}
      {rightSlot && (
        <div className="flex items-center gap-3">
          {rightSlot}
        </div>
      )}
    </div>
  );
}

export default NavTabs;
