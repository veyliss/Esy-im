import clsx from "clsx";
import type { ReactNode } from "react";
import { NavTabs, type NavKey, type NavTabsProps } from "@/components/ui/nav-tabs";

interface AppShellProps {
  active: NavKey;
  children: ReactNode;
  rightSlot?: ReactNode;
  headerDescription?: ReactNode;
  navVariant?: NavTabsProps["variant"];
  className?: string;
  contentClassName?: string;
}

export function AppShell({
  active,
  children,
  rightSlot,
  headerDescription,
  navVariant = "modern",
  className,
  contentClassName,
}: AppShellProps) {
  return (
    <div
      className={clsx("min-h-screen bg-background-light font-display text-slate-800 dark:bg-background-dark dark:text-slate-200", className)}
    >
      <div className="flex min-h-screen flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-background-light px-6 dark:border-slate-800 dark:bg-background-dark">
          <div className="flex min-w-0 flex-1 items-center">
            <NavTabs active={active} variant={navVariant} showIcons={false} />
          </div>

          <div className="flex shrink-0 items-center justify-end">{rightSlot}</div>
        </header>

        {headerDescription ? (
          <div className="border-b border-slate-200 bg-white px-6 py-3 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            {headerDescription}
          </div>
        ) : null}

        <section className={clsx("min-h-0 flex-1", contentClassName)}>{children}</section>
      </div>
    </div>
  );
}

export default AppShell;
