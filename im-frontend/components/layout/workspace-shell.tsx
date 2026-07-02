import clsx from "clsx";
import type { ReactNode } from "react";
import { MobileBottomNav, NavTabs, type NavKey } from "@/components/ui/nav-tabs";

interface WorkspaceShellProps {
  active: NavKey;
  headerDescription?: ReactNode;
  rightSlot?: ReactNode;
  sidebar: ReactNode;
  main: ReactNode;
  navVariant?: "light" | "muted" | "classic" | "modern";
  shellClassName?: string;
  frameClassName?: string;
  sidebarClassName?: string;
  mainClassName?: string;
  mobileDetailActive?: boolean;
}

const activeLabels: Record<NavKey, string> = {
  chat: "聊天",
  contacts: "通讯录",
  groups: "群聊",
  moments: "朋友圈",
  me: "我的",
};

export function WorkspaceShell({
  active,
  headerDescription,
  rightSlot,
  sidebar,
  main,
  navVariant = "modern",
  shellClassName,
  frameClassName,
  sidebarClassName,
  mainClassName,
  mobileDetailActive = false,
}: WorkspaceShellProps) {
  return (
    <div
      className={clsx(
        "im-shell min-h-screen bg-background-light font-display text-slate-800",
        shellClassName,
      )}
    >
      <div className="flex flex-col" style={{ height: "100svh" }}>
        <header className="im-topbar flex shrink-0 items-center justify-between border-b border-slate-200 bg-background-light px-6 sm:px-8">
          <div className="flex min-w-0 flex-1 items-center">
            <div className="im-mobile-title">{activeLabels[active]}</div>
            <NavTabs active={active} variant={navVariant} showIcons={false} />
          </div>

          <div className="flex shrink-0 items-center justify-end gap-3 pl-6">{rightSlot}</div>
        </header>

        <div className="im-shell-body flex-1 overflow-hidden bg-white">
          {headerDescription && (
            <div className="border-b border-slate-200 bg-white px-6 py-3 text-sm text-slate-500">
              {headerDescription}
            </div>
          )}

          <div
            className={clsx(
              "im-workspace-frame flex h-full overflow-hidden",
              headerDescription ? "h-[calc(100%-49px)]" : "h-full",
              mobileDetailActive && "is-mobile-detail-active",
              frameClassName,
            )}
          >
            <aside
              className={clsx(
                "im-workspace-sidebar flex w-[352px] shrink-0 flex-col border-r border-slate-200 bg-background-light",
                sidebarClassName,
              )}
            >
              {sidebar}
            </aside>

            <main
              className={clsx(
                "im-workspace-main min-w-0 flex-1 overflow-y-auto bg-white",
                mainClassName,
              )}
            >
              {main}
            </main>
          </div>
        </div>
      </div>
      <MobileBottomNav active={active} />
    </div>
  );
}

export default WorkspaceShell;
