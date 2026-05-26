import clsx from "clsx";
import type { HTMLAttributes, ReactNode } from "react";

interface SectionCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function SectionCard({ children, className, ...props }: SectionCardProps) {
  return (
    <div
      className={clsx(
        "rounded-lg border border-slate-200/80 bg-white/86 p-5 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/56",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface SectionTitleProps {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function SectionTitle({ title, description, action, className }: SectionTitleProps) {
  return (
    <div className={clsx("flex items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-100">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

interface SidebarSectionProps {
  title: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

export function SidebarSection({ title, children, className, bodyClassName }: SidebarSectionProps) {
  return (
    <section className={clsx("rounded-lg border border-slate-200/80 bg-white/70 p-3 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/44", className)}>
      <h3 className="px-1 pb-3 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">{title}</h3>
      <div className={clsx("space-y-2", bodyClassName)}>{children}</div>
    </section>
  );
}

interface EmptyPanelProps {
  title: string;
  description?: string;
  className?: string;
}

export function EmptyPanel({ title, description, className }: EmptyPanelProps) {
  return (
    <div
      className={clsx(
        "flex min-h-[240px] items-center justify-center rounded-lg border border-dashed border-slate-300/80 bg-white/58 px-6 py-10 text-center dark:border-slate-700 dark:bg-slate-950/42",
        className,
      )}
    >
      <div>
        <p className="text-base font-semibold text-slate-700 dark:text-slate-200">{title}</p>
        {description ? <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{description}</p> : null}
      </div>
    </div>
  );
}

interface ActionBarProps {
  children: ReactNode;
  className?: string;
}

export function ActionBar({ children, className }: ActionBarProps) {
  return <div className={clsx("flex items-center justify-end gap-3", className)}>{children}</div>;
}
