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
      className={clsx(
        "flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-100/45 px-4 py-5 font-display text-slate-800 dark:from-[#0b1118] dark:via-[#132130] dark:to-[#0b121a] dark:text-slate-200 sm:px-6 sm:py-6 lg:px-8",
        className,
      )}
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 lg:gap-6">
        <header className="rounded-3xl border border-white/70 bg-white/85 px-4 py-3 shadow-xl shadow-slate-200/40 backdrop-blur dark:border-slate-700/70 dark:bg-slate-900/80 dark:shadow-black/30 sm:px-5 sm:py-4">
          <NavTabs active={active} variant={navVariant} rightSlot={rightSlot} />
          {headerDescription ? (
            <div className="mt-3 px-1 text-sm text-slate-500 dark:text-slate-400">{headerDescription}</div>
          ) : null}
        </header>

        <section className={clsx("min-h-0", contentClassName)}>{children}</section>
      </div>
    </div>
  );
}

export default AppShell;
