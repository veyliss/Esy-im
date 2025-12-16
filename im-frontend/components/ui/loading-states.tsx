/**
 * 加载状态组件集合
 * 提供各种加载状态的视觉反馈
 */

"use client";

import clsx from "clsx";

// 基础加载动画组件
export function LoadingSpinner({
  size = "md",
  color = "primary",
  className
}: {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  color?: "primary" | "white" | "gray";
  className?: string;
}) {
  const sizeClasses = {
    xs: "w-3 h-3",
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12"
  };

  const colorClasses = {
    primary: "text-primary",
    white: "text-white",
    gray: "text-gray-400"
  };

  return (
    <div className={clsx(
      "animate-spin rounded-full border-2 border-current border-t-transparent",
      sizeClasses[size],
      colorClasses[color],
      className
    )} />
  );
}

// 脉冲加载动画
export function LoadingPulse({
  size = "md",
  className
}: {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const sizeClasses = {
    xs: "w-2 h-2",
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-6 h-6",
    xl: "w-8 h-8"
  };

  return (
    <div className={clsx("flex items-center space-x-1", className)}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={clsx(
            "bg-primary rounded-full animate-pulse",
            sizeClasses[size]
          )}
          style={{
            animationDelay: `${i * 0.15}s`,
            animationDuration: "1s"
          }}
        />
      ))}
    </div>
  );
}

// 波浪加载动画
export function LoadingWave({
  size = "md",
  className
}: {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const sizeClasses = {
    xs: "h-2",
    sm: "h-3",
    md: "h-4",
    lg: "h-6",
    xl: "h-8"
  };

  return (
    <div className={clsx("flex items-end space-x-1", className)}>
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={clsx(
            "w-1 bg-primary rounded-full animate-bounce",
            sizeClasses[size]
          )}
          style={{
            animationDelay: `${i * 0.1}s`,
            animationDuration: "1.4s"
          }}
        />
      ))}
    </div>
  );
}

// 骨架屏组件
export function Skeleton({
  className,
  variant = "rectangular",
  animation = "pulse"
}: {
  className?: string;
  variant?: "text" | "rectangular" | "circular";
  animation?: "pulse" | "wave" | "none";
}) {
  const variantClasses = {
    text: "h-4 rounded",
    rectangular: "rounded-lg",
    circular: "rounded-full"
  };

  const animationClasses = {
    pulse: "animate-pulse",
    wave: "animate-shimmer",
    none: ""
  };

  return (
    <div className={clsx(
      "bg-gray-200 dark:bg-gray-700",
      variantClasses[variant],
      animationClasses[animation],
      className
    )} />
  );
}

// 消息骨架屏
export function MessageSkeleton({
  isMe = false,
  showAvatar = true
}: {
  isMe?: boolean;
  showAvatar?: boolean;
}) {
  if (isMe) {
    return (
      <div className="flex items-start gap-3 justify-end mb-4">
        <div className="flex flex-col items-end max-w-lg">
          <Skeleton className="w-48 h-12 mb-1" />
          <Skeleton className="w-16 h-3" variant="text" />
        </div>
        {showAvatar && <Skeleton className="w-10 h-10" variant="circular" />}
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 mb-4">
      {showAvatar && <Skeleton className="w-10 h-10" variant="circular" />}
      <div className="flex flex-col items-start max-w-lg">
        <Skeleton className="w-52 h-12 mb-1" />
        <Skeleton className="w-20 h-3" variant="text" />
      </div>
    </div>
  );
}

// 联系人列表骨架屏
export function ContactSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3">
      <Skeleton className="w-12 h-12" variant="circular" />
      <div className="flex-1">
        <Skeleton className="w-24 h-4 mb-2" variant="text" />
        <Skeleton className="w-32 h-3" variant="text" />
      </div>
      <Skeleton className="w-6 h-6" variant="circular" />
    </div>
  );
}

// 卡片骨架屏
export function CardSkeleton({
  showImage = true,
  lines = 3
}: {
  showImage?: boolean;
  lines?: number;
}) {
  return (
    <div className="p-4 space-y-3">
      {showImage && <Skeleton className="w-full h-48" />}
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            className={clsx(
              "h-4",
              i === lines - 1 ? "w-3/4" : "w-full"
            )}
            variant="text"
          />
        ))}
      </div>
    </div>
  );
}

// 页面加载组件
export function PageLoading({
  message = "加载中...",
  size = "lg"
}: {
  message?: string;
  size?: "sm" | "md" | "lg";
}) {
  const containerClasses = {
    sm: "py-8",
    md: "py-16",
    lg: "py-24"
  };

  return (
    <div className={clsx(
      "flex flex-col items-center justify-center space-y-4",
      containerClasses[size]
    )}>
      <LoadingSpinner size={size} />
      <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
    </div>
  );
}

// 按钮加载状态
export function ButtonLoading({
  children,
  loading = false,
  disabled = false,
  className,
  ...props
}: {
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={clsx(
        "relative inline-flex items-center justify-center gap-2 transition-all duration-200",
        (loading || disabled) && "cursor-not-allowed opacity-50",
        className
      )}
      disabled={loading || disabled}
      {...props}
    >
      {loading && (
        <LoadingSpinner size="sm" color="white" className="absolute" />
      )}
      <span className={clsx(loading && "opacity-0")}>
        {children}
      </span>
    </button>
  );
}

// 内容加载状态
export function ContentLoading({
  type = "list",
  count = 3
}: {
  type?: "list" | "grid" | "messages" | "contacts";
  count?: number;
}) {
  const renderSkeleton = () => {
    switch (type) {
      case "messages":
        return Array.from({ length: count }).map((_, i) => (
          <MessageSkeleton key={i} isMe={i % 2 === 0} />
        ));
      case "contacts":
        return Array.from({ length: count }).map((_, i) => (
          <ContactSkeleton key={i} />
        ));
      case "grid":
        return Array.from({ length: count }).map((_, i) => (
          <CardSkeleton key={i} />
        ));
      default:
        return Array.from({ length: count }).map((_, i) => (
          <div key={i} className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="w-8 h-8" variant="circular" />
              <Skeleton className="w-32 h-4" variant="text" />
            </div>
            <Skeleton className="w-full h-3" variant="text" />
            <Skeleton className="w-3/4 h-3" variant="text" />
          </div>
        ));
    }
  };

  return (
    <div className="space-y-4 animate-pulse">
      {renderSkeleton()}
    </div>
  );
}

export default {
  LoadingSpinner,
  LoadingPulse,
  LoadingWave,
  Skeleton,
  MessageSkeleton,
  ContactSkeleton,
  CardSkeleton,
  PageLoading,
  ButtonLoading,
  ContentLoading
};