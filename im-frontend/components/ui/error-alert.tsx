import clsx from "clsx";

interface ErrorAlertProps {
  error: string | null;
  onClose?: () => void;
  type?: "error" | "warning" | "info";
  className?: string;
}

const alertMeta = {
  error: {
    icon: "error",
    title: "操作未完成",
  },
  warning: {
    icon: "warning",
    title: "需要注意",
  },
  info: {
    icon: "info",
    title: "提示",
  },
};

export function ErrorAlert({
  error,
  onClose,
  type = "error",
  className = "",
}: ErrorAlertProps) {
  if (!error) return null;

  const meta = alertMeta[type];

  return (
    <div className={clsx("app-alert", `is-${type}`, className)} role={type === "info" ? "status" : "alert"}>
      <span className="material-symbols-outlined app-alert-icon" aria-hidden="true">
        {meta.icon}
      </span>
      <div className="app-alert-copy">
        <strong>{meta.title}</strong>
        <p>{error}</p>
      </div>
      {onClose ? (
        <button type="button" onClick={onClose} className="app-alert-close" aria-label="关闭提示" title="关闭">
          <span className="material-symbols-outlined">close</span>
        </button>
      ) : null}
    </div>
  );
}

/**
 * 连接状态指示器组件
 */
interface ConnectionStatusProps {
  connected: boolean;
  connecting?: boolean;
  error?: string | null;
}

export function ConnectionStatus({ connected, connecting = false, error }: ConnectionStatusProps) {
  if (connecting) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
        <span className="text-xs text-slate-500 dark:text-slate-400">连接中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-red-500" />
        <span className="text-xs text-red-500">连接错误</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${connected ? "bg-green-500" : "bg-red-500"}`} />
      <span className="text-xs text-slate-500 dark:text-slate-400">
        {connected ? "已连接" : "未连接"}
      </span>
    </div>
  );
}

/**
 * 加载状态组件
 */
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-primary ${sizeClasses[size]} ${className}`} />
  );
}

/**
 * 空状态组件
 */
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  const defaultIcon = (
    <svg
      className="w-12 h-12 text-gray-400 mx-auto mb-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
      />
    </svg>
  );

  return (
    <div className="text-center py-12">
      {icon || defaultIcon}
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
