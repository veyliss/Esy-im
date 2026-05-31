import clsx from "clsx";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

interface Im4IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  label: string;
  icon: string;
}

export function Im4IconButton({
  active = false,
  label,
  icon,
  className,
  type = "button",
  ...props
}: Im4IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={clsx("im4-icon-button", active && "is-active", className)}
      {...props}
    >
      <span className="material-symbols-outlined">{icon}</span>
    </button>
  );
}

interface Im4SearchProps extends InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
}

export function Im4Search({ value, onClear, className, ...props }: Im4SearchProps) {
  const hasValue = typeof value === "string" && value.length > 0;

  return (
    <div className={clsx("im4-search", className)}>
      <span className="material-symbols-outlined" aria-hidden="true">search</span>
      <input {...props} value={value} />
      {hasValue && onClear ? (
        <button type="button" onClick={onClear} aria-label="清空搜索" title="清空搜索">
          <span className="material-symbols-outlined">close</span>
        </button>
      ) : null}
    </div>
  );
}

interface Im4SegmentedProps<T extends string> {
  active: T;
  items: Array<{ key: T; label: string; count?: number }>;
  onChange: (key: T) => void;
  label: string;
}

export function Im4Segmented<T extends string>({ active, items, onChange, label }: Im4SegmentedProps<T>) {
  return (
    <div className="im4-segmented" role="tablist" aria-label={label}>
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          role="tab"
          aria-selected={active === item.key}
          className={active === item.key ? "is-active" : undefined}
          onClick={() => onChange(item.key)}
        >
          <span>{item.label}</span>
          {typeof item.count === "number" ? <strong>{item.count}</strong> : null}
        </button>
      ))}
    </div>
  );
}

interface Im4EmptyProps {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function Im4Empty({ title, description, action, className }: Im4EmptyProps) {
  return (
    <div className={clsx("im4-empty", className)}>
      <div>
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
        {action ? <div className="im4-empty-actions">{action}</div> : null}
      </div>
    </div>
  );
}

interface Im4ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: "default" | "primary" | "danger";
  children: ReactNode;
}

export function Im4Button({
  tone = "default",
  className,
  children,
  type = "button",
  ...props
}: Im4ButtonProps) {
  return (
    <button type={type} className={clsx("im4-button", `is-${tone}`, className)} {...props}>
      {children}
    </button>
  );
}

interface Im4StatusProps {
  tone?: "online" | "warning" | "default" | "primary";
  children: ReactNode;
}

export function Im4Status({ tone = "default", children }: Im4StatusProps) {
  return <span className={clsx("im4-status", `is-${tone}`)}>{children}</span>;
}

