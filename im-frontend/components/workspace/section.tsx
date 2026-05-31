import clsx from "clsx";
import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

interface SectionCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function SectionCard({ children, className, ...props }: SectionCardProps) {
  return (
    <div
      className={clsx(
        "im-panel rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950",
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
    <div className={clsx("im-section-title flex items-start justify-between gap-4", className)}>
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
    <section className={clsx("border-b border-slate-200 px-6 py-6 last:border-b-0 dark:border-slate-800", className)}>
      <h3 className="px-1 pb-4 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">{title}</h3>
      <div className={clsx("space-y-3", bodyClassName)}>{children}</div>
    </section>
  );
}

interface WorkspaceSidebarProps {
  children: ReactNode;
  className?: string;
}

export function WorkspaceSidebar({ children, className }: WorkspaceSidebarProps) {
  return <div className={clsx("workspace-sidebar flex h-full flex-col overflow-hidden", className)}>{children}</div>;
}

interface WorkspaceSidebarHeaderProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function WorkspaceSidebarHeader({
  eyebrow,
  title,
  description,
  action,
  className,
}: WorkspaceSidebarHeaderProps) {
  return (
    <div className={clsx("workspace-sidebar-header", className)}>
      <div className="min-w-0">
        {eyebrow ? <span className="workspace-sidebar-eyebrow">{eyebrow}</span> : null}
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {action ? <div className="workspace-sidebar-header-action">{action}</div> : null}
    </div>
  );
}

interface SidebarToolbarProps {
  children: ReactNode;
  className?: string;
}

export function SidebarToolbar({ children, className }: SidebarToolbarProps) {
  return (
    <div className={clsx("workspace-sidebar-toolbar border-b border-slate-200 px-8 py-8 dark:border-slate-800", className)}>
      {children}
    </div>
  );
}

interface SidebarSearchProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: string;
}

export function SidebarSearch({ icon = "search", className, ...props }: SidebarSearchProps) {
  return (
    <div className="workspace-search relative">
      <span className="workspace-search-icon" aria-hidden="true" data-icon={icon} />
      <input
        {...props}
        className={clsx("workspace-search-input ui-input h-11 w-full rounded-full py-2.5 pl-14 pr-5 text-sm shadow-none", className)}
      />
    </div>
  );
}

interface SidebarScrollAreaProps {
  children: ReactNode;
  className?: string;
}

export function SidebarScrollArea({ children, className }: SidebarScrollAreaProps) {
  return <div className={clsx("workspace-sidebar-scroll flex-1 overflow-y-auto", className)}>{children}</div>;
}

interface SidebarItemProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "title"> {
  active?: boolean;
  leading?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  trailing?: ReactNode;
  children?: ReactNode;
}

export function SidebarItem({
  active = false,
  leading,
  title,
  description,
  trailing,
  children,
  className,
  type = "button",
  ...props
}: SidebarItemProps) {
  return (
    <button
      type={type}
      aria-current={active ? "true" : undefined}
      className={clsx(
        "workspace-sidebar-item flex w-full items-center gap-3 rounded-lg px-4 py-3.5 text-left text-slate-700 transition-colors hover:bg-slate-100 active:scale-[0.98] dark:text-slate-300 dark:hover:bg-slate-800",
        active && "is-active bg-primary/10 text-primary dark:bg-primary/20",
        className,
      )}
      {...props}
    >
      {children ? (
        children
      ) : (
        <>
          {leading ? <span className="shrink-0">{leading}</span> : null}
          <span className="min-w-0 flex-1">
            {title ? (
              <span className={clsx("block truncate text-sm", active ? "font-semibold text-primary" : "font-semibold text-slate-900 dark:text-slate-100")}>
                {title}
              </span>
            ) : null}
            {description ? (
              <span className="mt-0.5 block truncate text-xs font-normal text-slate-500 dark:text-slate-400">{description}</span>
            ) : null}
          </span>
          {trailing ? <span className="shrink-0">{trailing}</span> : null}
        </>
      )}
    </button>
  );
}

interface EmptyPanelProps {
  title: string;
  description?: string;
  className?: string;
  icon?: string;
  action?: ReactNode;
}

export function EmptyPanel({ title, description, className, icon, action }: EmptyPanelProps) {
  return (
    <div
      className={clsx(
        "workspace-empty-panel flex min-h-[240px] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white px-6 py-10 text-center dark:border-slate-700 dark:bg-slate-950",
        className,
      )}
    >
      <div>
        {icon ? (
          <span className="workspace-empty-icon material-symbols-outlined" aria-hidden="true">
            {icon}
          </span>
        ) : null}
        <p className="text-base font-semibold text-slate-700 dark:text-slate-200">{title}</p>
        {description ? <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{description}</p> : null}
        {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
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
