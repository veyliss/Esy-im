import clsx from "clsx";
import type { ReactNode } from "react";
import { MobileBottomNav, NavTabs, type NavKey } from "@/components/ui/nav-tabs";

interface ImShellProps {
  active: NavKey;
  title: string;
  subtitle?: ReactNode;
  sidebar: ReactNode;
  children: ReactNode;
  rightSlot?: ReactNode;
  mobileDetailActive?: boolean;
  className?: string;
  sidebarClassName?: string;
  mainClassName?: string;
}

export function ImShell({
  active,
  title,
  subtitle,
  sidebar,
  children,
  rightSlot,
  mobileDetailActive = false,
  className,
  sidebarClassName,
  mainClassName,
}: ImShellProps) {
  return (
    <div className={clsx("im3-shell", className)}>
      <div className="im3-app">
        <header className="im3-topbar">
          <div className="im3-topbar-main">
            <div className="im3-desktop-heading">
              <strong>{title}</strong>
              {subtitle ? <span>{subtitle}</span> : null}
            </div>
            <div className="im3-mobile-heading">
              <strong>{title}</strong>
              {subtitle ? <span>{subtitle}</span> : null}
            </div>
            <NavTabs active={active} variant="modern" showIcons={false} />
          </div>
          <div className="im3-topbar-actions">{rightSlot}</div>
        </header>

        <div className={clsx("im3-workspace", mobileDetailActive && "is-detail-active")}>
          <aside className={clsx("im3-sidebar", sidebarClassName)}>{sidebar}</aside>
          <main className={clsx("im3-main", mainClassName)}>{children}</main>
        </div>
      </div>
      <MobileBottomNav active={active} />
    </div>
  );
}

export default ImShell;
