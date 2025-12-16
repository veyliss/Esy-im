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
}

export function AppShell({
  active,
  children,
  rightSlot,
  headerDescription,
  navVariant = "light",
  className,
}: AppShellProps) {
  return (
    <div
      className={clsx(
        "min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-100/40 px-4 py-6 font-display dark:from-background-dark dark:via-[#182430] dark:to-[#0b121a] sm:px-6 lg:px-10",
        className,
      )}
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="rounded-2xl border border-white/60 bg-white/85 px-6 py-4 shadow-xl backdrop-blur dark:border-slate-800/60 dark:bg-slate-900/80">
          <NavTabs active={active} variant={navVariant} rightSlot={rightSlot} />
          {headerDescription ? (
            <div className="mt-3 text-sm text-slate-500 dark:text-slate-400">{headerDescription}</div>
          ) : null}
        </header>
        {children}
      </div>
    </div>
  );
}

export default AppShell;
