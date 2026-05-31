import clsx from "clsx";
import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

interface ImSidebarProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

export function ImSidebar({ children, className, ...props }: ImSidebarProps) {
  return (
    <div className={clsx("im3-sidebar-panel", className)} {...props}>
      {children}
    </div>
  );
}

interface ImSidebarHeaderProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function ImSidebarHeader({
  eyebrow,
  title,
  description,
  action,
  className,
}: ImSidebarHeaderProps) {
  return (
    <div className={clsx("im3-sidebar-header", className)}>
      <div className="im3-sidebar-header-copy">
        {eyebrow ? <span className="im3-sidebar-eyebrow">{eyebrow}</span> : null}
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {action ? <div className="im3-sidebar-header-action">{action}</div> : null}
    </div>
  );
}

interface ImSidebarToolbarProps {
  children: ReactNode;
  className?: string;
}

export function ImSidebarToolbar({ children, className }: ImSidebarToolbarProps) {
  return <div className={clsx("im3-sidebar-toolbar", className)}>{children}</div>;
}

interface ImSearchBoxProps extends InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
}

export function ImSearchBox({ className, value, onClear, ...props }: ImSearchBoxProps) {
  const hasValue = typeof value === "string" && value.length > 0;

  return (
    <div className="im3-search">
      <span className="im3-search-mark" aria-hidden="true" />
      <input
        {...props}
        value={value}
        className={clsx("im3-search-input", hasValue && onClear && "has-clear", className)}
      />
      {hasValue && onClear ? (
        <button type="button" className="im3-search-clear" onClick={onClear} aria-label="清空搜索" title="清空搜索">
          <span aria-hidden="true">×</span>
        </button>
      ) : null}
    </div>
  );
}

interface ImSidebarSectionProps {
  title?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

export function ImSidebarSection({ title, children, className, bodyClassName }: ImSidebarSectionProps) {
  return (
    <section className={clsx("im3-sidebar-section", className)}>
      {title ? <h3>{title}</h3> : null}
      <div className={clsx("im3-sidebar-section-body", bodyClassName)}>{children}</div>
    </section>
  );
}

interface ImSidebarScrollProps {
  children: ReactNode;
  className?: string;
}

export function ImSidebarScroll({ children, className }: ImSidebarScrollProps) {
  return <div className={clsx("im3-sidebar-scroll", className)}>{children}</div>;
}

interface ImListItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  children: ReactNode;
}

export function ImListItem({ active = false, children, className, type = "button", ...props }: ImListItemProps) {
  return (
    <button
      type={type}
      aria-current={active ? "true" : undefined}
      className={clsx("im3-list-item", active && "is-active", className)}
      {...props}
    >
      {children}
    </button>
  );
}

interface ImActionStripProps {
  children: ReactNode;
  className?: string;
}

export function ImActionStrip({ children, className }: ImActionStripProps) {
  return <div className={clsx("im3-action-strip", className)}>{children}</div>;
}

interface ImActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  tone?: "default" | "primary";
}

export function ImActionButton({
  children,
  tone = "default",
  className,
  type = "button",
  ...props
}: ImActionButtonProps) {
  return (
    <button
      type={type}
      className={clsx("im3-action-button", tone === "primary" && "is-primary", className)}
      {...props}
    >
      {children}
    </button>
  );
}

interface ImCountBadgeProps {
  children: ReactNode;
}

export function ImCountBadge({ children }: ImCountBadgeProps) {
  return <span className="im3-count-badge">{children}</span>;
}

interface ImEmptyStateProps {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function ImEmptyState({ title, description, action, className }: ImEmptyStateProps) {
  return (
    <div className={clsx("im3-empty-state", className)}>
      <div>
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
        {action ? <div className="im3-empty-actions">{action}</div> : null}
      </div>
    </div>
  );
}
