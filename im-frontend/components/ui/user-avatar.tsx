/**
 * 用户头像组件
 * 支持在线状态、徽章、悬停效果等功能
 */

"use client";

import { useState } from "react";
import clsx from "clsx";

interface UserAvatarProps {
  // 头像URL
  src?: string;
  // 用户名（用于生成默认头像）
  name?: string;
  // 尺寸
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  // 形状
  shape?: "circle" | "rounded" | "square";
  // 在线状态
  status?: "online" | "offline" | "away" | "busy" | "invisible";
  // 是否显示状态指示器
  showStatus?: boolean;
  // 徽章数量
  badge?: number;
  // 是否可点击
  clickable?: boolean;
  // 点击事件
  onClick?: () => void;
  // 悬停效果
  hover?: boolean;
  // 边框
  border?: boolean;
  // 自定义类名
  className?: string;
  // 占位符图标
  fallbackIcon?: string;
}

export function UserAvatar({
  src,
  name = "",
  size = "md",
  shape = "circle",
  status,
  showStatus = false,
  badge,
  clickable = false,
  onClick,
  hover = true,
  border = false,
  className,
  fallbackIcon = "person"
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // 尺寸映射
  const sizeClasses = {
    xs: "w-6 h-6 text-xs",
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-base",
    lg: "w-12 h-12 text-lg",
    xl: "w-16 h-16 text-xl",
    "2xl": "w-20 h-20 text-2xl"
  };

  // 形状映射
  const shapeClasses = {
    circle: "rounded-full",
    rounded: "rounded-lg",
    square: "rounded-none"
  };

  // 状态颜色映射
  const statusColors = {
    online: "bg-green-500",
    offline: "bg-gray-400",
    away: "bg-yellow-500",
    busy: "bg-red-500",
    invisible: "bg-gray-300"
  };

  // 状态指示器尺寸
  const statusSizes = {
    xs: "w-2 h-2",
    sm: "w-2.5 h-2.5",
    md: "w-3 h-3",
    lg: "w-3.5 h-3.5",
    xl: "w-4 h-4",
    "2xl": "w-5 h-5"
  };

  // 生成用户名首字母
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(word => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // 生成背景颜色（基于用户名）
  const getBackgroundColor = (name: string) => {
    const colors = [
      "bg-red-500", "bg-orange-500", "bg-amber-500", "bg-yellow-500",
      "bg-lime-500", "bg-green-500", "bg-emerald-500", "bg-teal-500",
      "bg-cyan-500", "bg-sky-500", "bg-blue-500", "bg-indigo-500",
      "bg-violet-500", "bg-purple-500", "bg-fuchsia-500", "bg-pink-500"
    ];

    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
  };

  const shouldShowImage = src && !imageError;
  const initials = getInitials(name);
  const backgroundColor = getBackgroundColor(name);

  return (
    <div
      className={clsx(
        "relative inline-flex items-center justify-center shrink-0 select-none transition-all duration-200",
        sizeClasses[size],
        shapeClasses[shape],
        border && "ring-2 ring-white dark:ring-slate-700",
        clickable && "cursor-pointer",
        hover && clickable && "hover:scale-110 hover:shadow-lg",
        className
      )}
      onClick={clickable ? onClick : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 头像内容 */}
      <div className={clsx(
        "w-full h-full flex items-center justify-center overflow-hidden",
        shapeClasses[shape],
        shouldShowImage ? "bg-gray-100 dark:bg-gray-800" : `${backgroundColor} text-white`
      )}>
        {shouldShowImage ? (
          <img
            src={src}
            alt={name}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : initials ? (
          <span className="font-semibold">{initials}</span>
        ) : (
          <span className="material-symbols-outlined opacity-70">
            {fallbackIcon}
          </span>
        )}
      </div>

      {/* 在线状态指示器 */}
      {showStatus && status && (
        <div className={clsx(
          "absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-white dark:border-slate-800",
          statusSizes[size],
          statusColors[status]
        )} />
      )}

      {/* 徽章 */}
      {badge && badge > 0 && (
        <div className={clsx(
          "absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium animate-fade-in-scale",
          size === "xs" && "min-w-[14px] h-[14px] text-[10px]",
          size === "sm" && "min-w-[16px] h-[16px] text-[11px]"
        )}>
          {badge > 99 ? "99+" : badge}
        </div>
      )}

      {/* 悬停效果 */}
      {hover && isHovered && clickable && (
        <div className="absolute inset-0 bg-black/10 rounded-full animate-fade-in-scale" />
      )}
    </div>
  );
}

// 头像组合组件（用于显示多个用户）
export function AvatarGroup({
  users,
  max = 3,
  size = "md",
  className
}: {
  users: Array<{
    src?: string;
    name: string;
    status?: "online" | "offline" | "away" | "busy" | "invisible";
  }>;
  max?: number;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
}) {
  const displayUsers = users.slice(0, max);
  const remainingCount = users.length - max;

  const spacingClasses = {
    xs: "-space-x-1",
    sm: "-space-x-1.5",
    md: "-space-x-2",
    lg: "-space-x-2.5",
    xl: "-space-x-3",
    "2xl": "-space-x-4"
  };

  return (
    <div className={clsx("flex items-center", spacingClasses[size], className)}>
      {displayUsers.map((user, index) => (
        <UserAvatar
          key={index}
          src={user.src}
          name={user.name}
          size={size}
          status={user.status}
          showStatus={index === 0} // 只在第一个头像显示状态
          border={true}
          className="relative z-10"
        />
      ))}

      {remainingCount > 0 && (
        <div className={clsx(
          "relative flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full border-2 border-white dark:border-slate-700 font-medium",
          {
            xs: "w-6 h-6 text-xs",
            sm: "w-8 h-8 text-sm",
            md: "w-10 h-10 text-base",
            lg: "w-12 h-12 text-lg",
            xl: "w-16 h-16 text-xl",
            "2xl": "w-20 h-20 text-2xl"
          }[size]
        )}>
          +{remainingCount}
        </div>
      )}
    </div>
  );
}

export default UserAvatar;