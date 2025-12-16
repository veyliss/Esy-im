/**
 * 响应式布局组件
 * 提供统一的响应式布局解决方案
 */

"use client";

import { useState, useEffect } from "react";
import clsx from "clsx";

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  className?: string;
  // 侧边栏内容
  sidebar?: React.ReactNode;
  // 顶部导航
  header?: React.ReactNode;
  // 底部内容
  footer?: React.ReactNode;
  // 是否显示侧边栏
  showSidebar?: boolean;
  // 侧边栏宽度
  sidebarWidth?: "sm" | "md" | "lg";
  // 布局模式
  layout?: "default" | "chat" | "full";
}

export function ResponsiveLayout({
  children,
  className,
  sidebar,
  header,
  footer,
  showSidebar = true,
  sidebarWidth = "md",
  layout = "default"
}: ResponsiveLayoutProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const sidebarWidthClasses = {
    sm: "w-64",
    md: "w-80",
    lg: "w-96"
  };

  const layoutClasses = {
    default: "min-h-screen bg-slate-50 dark:bg-slate-900",
    chat: "h-screen bg-white dark:bg-slate-900 overflow-hidden",
    full: "min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900"
  };

  return (
    <div className={clsx(layoutClasses[layout], className)}>
      {/* 移动端遮罩 */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden animate-fade-in-scale"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 顶部导航 */}
      {header && (
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border-b border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-center justify-between px-4 py-3">
            {/* 移动端菜单按钮 */}
            {isMobile && showSidebar && (
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors md:hidden"
              >
                <span className="material-symbols-outlined text-xl">
                  {sidebarOpen ? "close" : "menu"}
                </span>
              </button>
            )}

            <div className="flex-1">
              {header}
            </div>
          </div>
        </header>
      )}

      <div className="flex flex-1">
        {/* 侧边栏 */}
        {showSidebar && sidebar && (
          <aside className={clsx(
            "bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-all duration-300",
            sidebarWidthClasses[sidebarWidth],
            // 桌面端样式
            "hidden md:flex md:flex-col",
            // 移动端样式
            isMobile && [
              "fixed inset-y-0 left-0 z-50 flex flex-col",
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            ]
          )}>
            {/* 侧边栏头部 */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 md:hidden">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">菜单</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* 侧边栏内容 */}
            <div className="flex-1 overflow-y-auto">
              {sidebar}
            </div>
          </aside>
        )}

        {/* 主内容区域 */}
        <main className={clsx(
          "flex-1 flex flex-col",
          layout === "chat" ? "h-full overflow-hidden" : "min-h-0"
        )}>
          {children}
        </main>
      </div>

      {/* 底部内容 */}
      {footer && (
        <footer className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
          {footer}
        </footer>
      )}
    </div>
  );
}

// 移动端优化的容器组件
export function MobileContainer({
  children,
  className,
  padding = "default"
}: {
  children: React.ReactNode;
  className?: string;
  padding?: "none" | "sm" | "default" | "lg";
}) {
  const paddingClasses = {
    none: "",
    sm: "p-2",
    default: "p-4",
    lg: "p-6"
  };

  return (
    <div className={clsx(
      "w-full max-w-full overflow-x-hidden",
      paddingClasses[padding],
      className
    )}>
      {children}
    </div>
  );
}

// 响应式网格组件
export function ResponsiveGrid({
  children,
  className,
  cols = { sm: 1, md: 2, lg: 3, xl: 4 },
  gap = "default"
}: {
  children: React.ReactNode;
  className?: string;
  cols?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: "none" | "sm" | "default" | "lg";
}) {
  const gapClasses = {
    none: "gap-0",
    sm: "gap-2",
    default: "gap-4",
    lg: "gap-6"
  };

  const colClasses: Record<number, string> = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
    5: "grid-cols-5",
    6: "grid-cols-6"
  };

  return (
    <div className={clsx(
      "grid",
      gapClasses[gap],
      cols.sm && colClasses[cols.sm],
      cols.md && `md:${colClasses[cols.md]}`,
      cols.lg && `lg:${colClasses[cols.lg]}`,
      cols.xl && `xl:${colClasses[cols.xl]}`,
      className
    )}>
      {children}
    </div>
  );
}

// 响应式卡片组件
export function ResponsiveCard({
  children,
  className,
  variant = "default",
  hover = true
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "glass" | "bordered" | "elevated";
  hover?: boolean;
}) {
  const variantClasses = {
    default: "bg-white dark:bg-slate-800 shadow-sm",
    glass: "bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/20",
    bordered: "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700",
    elevated: "bg-white dark:bg-slate-800 shadow-lg"
  };

  return (
    <div className={clsx(
      "rounded-xl p-4 transition-all duration-200",
      variantClasses[variant],
      hover && "hover:shadow-md hover:-translate-y-1",
      className
    )}>
      {children}
    </div>
  );
}

export default ResponsiveLayout;