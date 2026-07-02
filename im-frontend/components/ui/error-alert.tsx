import { Alert, Badge, Empty, Spin } from "antd";
import clsx from "clsx";

interface ErrorAlertProps {
  error: string | null;
  onClose?: () => void;
  type?: "error" | "warning" | "info";
  className?: string;
}

export function ErrorAlert({
  error,
  onClose,
  type = "error",
  className = "",
}: ErrorAlertProps) {
  if (!error) return null;

  return (
    <Alert
      className={clsx("app-alert ant-app-alert", className)}
      closable={Boolean(onClose)}
      message={type === "warning" ? "需要注意" : type === "info" ? "提示" : "操作未完成"}
      description={error}
      role={type === "info" ? "status" : "alert"}
      showIcon
      type={type}
      onClose={onClose}
    />
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
      <Badge color="#f59e0b" text="连接中..." />
    );
  }

  if (error) {
    return <Badge color="#ef4444" text="连接错误" />;
  }

  return <Badge color={connected ? "#10b981" : "#ef4444"} text={connected ? "已连接" : "未连接"} />;
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
    sm: 'small',
    md: 'default',
    lg: 'large'
  };

  return <Spin className={className} size={sizeClasses[size] as "small" | "default" | "large"} />;
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
  return (
    <Empty
      className="py-12"
      image={icon || Empty.PRESENTED_IMAGE_SIMPLE}
      description={
        <span>
          <strong className="block text-slate-900">{title}</strong>
          {description ? <small className="mt-1 block text-slate-500">{description}</small> : null}
        </span>
      }
    >
      {action}
    </Empty>
  );
}
