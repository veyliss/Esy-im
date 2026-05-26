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
        "flex min-h-screen w-full items-center justify-center bg-[linear-gradient(180deg,#fbfcfb_0%,#f1f5f3_100%)] px-4 py-5 font-display text-[#16211f] dark:bg-[linear-gradient(180deg,#0d1412_0%,#090f0e_100%)] dark:text-slate-200 sm:px-6 sm:py-6 lg:px-8",
        className,
      )}
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 lg:gap-6">
        <header className="rounded-lg border border-slate-200/80 bg-white/82 px-4 py-3 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/70 sm:px-5 sm:py-4">
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
