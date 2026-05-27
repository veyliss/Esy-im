import clsx from "clsx";
import type { ReactNode } from "react";
import { UserAvatar } from "@/components/ui/user-avatar";

interface TopBarActionsProps {
  children?: ReactNode;
  avatarSrc?: string;
  avatarName?: string;
  avatarStatus?: "online" | "offline" | "away" | "busy" | "invisible";
  showAvatarStatus?: boolean;
  className?: string;
}

export function TopBarActions({
  children,
  avatarSrc,
  avatarName = "我",
  avatarStatus,
  showAvatarStatus = false,
  className,
}: TopBarActionsProps) {
  return (
    <div className={clsx("flex items-center gap-2", className)}>
      {children}
      <UserAvatar
        src={avatarSrc}
        name={avatarName}
        size="sm"
        border
        showStatus={showAvatarStatus}
        status={avatarStatus}
      />
    </div>
  );
}

interface TopIconButtonProps {
  icon: string;
  label: string;
  onClick?: () => void;
  tone?: "default" | "primary" | "danger";
  badge?: number;
  disabled?: boolean;
}

export function TopIconButton({
  icon,
  label,
  onClick,
  tone = "default",
  badge,
  disabled = false,
}: TopIconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={clsx(
        "relative flex size-8 items-center justify-center rounded-lg text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50",
        tone === "default" &&
          "text-slate-500 hover:bg-black/5 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-100",
        tone === "primary" && "bg-primary text-white shadow-sm hover:bg-primary/90",
        tone === "danger" &&
          "text-red-500 hover:bg-red-50 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-950/40",
      )}
    >
      <span className="material-symbols-outlined text-xl">{icon}</span>
      {badge && badge > 0 ? (
        <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white">
          {badge > 99 ? "99+" : badge}
        </span>
      ) : null}
    </button>
  );
}

interface TopStatusPillProps {
  children: ReactNode;
  tone?: "online" | "muted" | "primary" | "warning";
}

export function TopStatusPill({ children, tone = "muted" }: TopStatusPillProps) {
  return (
    <span
      className={clsx(
        "top-status-pill inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold",
        tone === "online" && "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
        tone === "muted" && "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
        tone === "primary" && "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light",
        tone === "warning" && "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
      )}
    >
      {children}
    </span>
  );
}
