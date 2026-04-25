import clsx from "clsx";
import type { ReactNode } from "react";
import { NavTabs, type NavKey } from "@/components/ui/nav-tabs";

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
}

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
}: WorkspaceShellProps) {
  return (
    <div
      className={clsx(
        "min-h-screen bg-slate-50 font-display text-slate-800 dark:bg-background-dark dark:text-slate-200",
        shellClassName,
      )}
    >
      <div className="flex h-screen flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white/95 px-6 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
          <div className="min-w-0 flex-1">
            <NavTabs active={active} variant={navVariant} rightSlot={rightSlot} className="gap-6" showIcons={false} />
          </div>
        </header>

        <div className="flex-1 overflow-hidden">
          {headerDescription ? (
            <div className="border-b border-slate-200 bg-white/80 px-6 py-3 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-400">
              {headerDescription}
            </div>
          ) : null}

          <div
            className={clsx(
              "flex h-full overflow-hidden",
              headerDescription ? "h-[calc(100%-49px)]" : "h-full",
              frameClassName,
            )}
          >
            <aside
              className={clsx(
                "flex w-[380px] shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900",
                sidebarClassName,
              )}
            >
              {sidebar}
            </aside>

            <main
              className={clsx(
                "min-w-0 flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950/30",
                mainClassName,
              )}
            >
              {main}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WorkspaceShell;
