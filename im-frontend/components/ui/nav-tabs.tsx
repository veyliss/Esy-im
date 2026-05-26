"use client";

import Link from "next/link";
import clsx from "clsx";
import type { ReactNode } from "react";

export type NavKey = "chat" | "contacts" | "groups" | "moments" | "me";

export interface NavTabsProps {
  active: NavKey;
  className?: string;
  // 视觉风格：light 更醒目；muted 更低对比度；modern 现代化风格
  variant?: "light" | "muted" | "classic" | "modern";
  // 右侧插槽（头像、图标按钮等）
  rightSlot?: ReactNode;
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
    description: "即时消息和对话",
  },
  {
    key: "contacts",
    label: "通讯录",
    href: "/contacts",
    icon: "contacts",
    description: "管理联系人和好友",
  },
  {
    key: "groups",
    label: "群聊",
    href: "/groups",
    icon: "groups",
    description: "发现和管理群聊",
  },
  {
    key: "moments",
    label: "朋友圈",
    href: "/moments",
    icon: "photo_camera",
    description: "分享生活动态",
  },
  {
    key: "me",
    label: "我的",
    href: "/me",
    icon: "person",
    description: "个人资料和设置",
  },
];

export function NavTabs({
  active,
  className,
  variant = "modern",
  rightSlot,
  showIcons = true,
  showBadges = false,
  badges = {},
}: NavTabsProps) {
  const styles = {
    light: {
      container:
        "rounded-lg border border-slate-200/80 bg-white/92 p-1 shadow-sm dark:border-slate-800 dark:bg-slate-950/80",
      link: "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-slate-100",
      active: "bg-primary text-white shadow-sm dark:bg-primary",
    },
    muted: {
      container:
        "rounded-lg border border-slate-200/70 bg-slate-50/85 p-1 dark:border-slate-800 dark:bg-slate-950/60",
      link: "text-slate-500 hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-200",
      active: "bg-white text-primary shadow-sm dark:bg-slate-900 dark:text-primary-light",
    },
    classic: {
      container:
        "rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-950",
      link: "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200",
      active: "border-b-2 border-primary text-primary",
    },
    modern: {
      container: "bg-transparent p-0",
      link: "text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-primary-light",
      active: "text-primary dark:text-primary-light",
    },
  } as const;

  const tone = styles[variant] ?? styles.modern;

  return (
    <div className={clsx("flex w-full items-center gap-3", className)}>
      <nav aria-label="主导航" className={clsx("min-w-0 flex-1 overflow-x-auto", tone.container)}>
        <ul className={clsx("flex items-center whitespace-nowrap", variant === "modern" ? "gap-1" : "gap-2")}>
          {items.map((item) => {
            const isActive = item.key === active;
            const badgeCount = badges[item.key] || 0;

            return (
              <li key={item.key} className="relative">
                <Link
                  href={item.href}
                  title={item.description}
                  aria-current={isActive ? "page" : undefined}
                  className={clsx(
                    "relative inline-flex items-center justify-center gap-1.5 px-1 py-2 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                    tone.link,
                    isActive && tone.active,
                    variant === "classic" && "rounded-b-none border-b-2 border-transparent",
                    variant === "modern" && "min-w-[64px]",
                  )}
                >
                  {showIcons ? (
                    <span
                      className={clsx(
                        "material-symbols-outlined text-[18px] transition-transform duration-200",
                        isActive && variant === "modern" && "scale-105",
                      )}
                    >
                      {item.icon}
                    </span>
                  ) : null}

                  <span className={clsx(showIcons ? "text-[13px] sm:text-sm" : "text-sm", isActive && "font-semibold")}>
                    {item.label}
                  </span>

                  {variant === "modern" && isActive ? (
                    <span className="absolute inset-x-1 -bottom-0.5 h-0.5 rounded-full bg-primary" />
                  ) : null}
                </Link>

                {showBadges && badgeCount > 0 ? (
                  <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white">
                    {badgeCount > 99 ? "99+" : badgeCount}
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      </nav>

      {rightSlot ? <div className="flex shrink-0 items-center gap-2 sm:gap-3">{rightSlot}</div> : null}
    </div>
  );
}

export default NavTabs;
