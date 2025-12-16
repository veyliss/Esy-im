/**
 * 统一图标组件
 * 基于 Material Symbols 图标库，提供一致的图标使用体验
 */

"use client";

import clsx from "clsx";

// 常用图标名称映射
export const ICON_NAMES = {
  // 导航相关
  home: "home",
  chat: "chat",
  contacts: "contacts",
  moments: "photo_camera",
  person: "person",
  settings: "settings",
  menu: "menu",
  close: "close",
  back: "arrow_back",
  forward: "arrow_forward",

  // 消息相关
  send: "send",
  reply: "reply",
  copy: "content_copy",
  delete: "delete",
  edit: "edit",
  undo: "undo",
  attachment: "attach_file",
  emoji: "sentiment_satisfied",
  image: "image",
  file: "description",

  // 状态相关
  online: "circle",
  offline: "radio_button_unchecked",
  away: "schedule",
  busy: "do_not_disturb",
  check: "check",
  checkAll: "done_all",
  error: "error",
  warning: "warning",
  info: "info",
  success: "check_circle",

  // 操作相关
  add: "add",
  remove: "remove",
  search: "search",
  filter: "filter_list",
  sort: "sort",
  more: "more_vert",
  moreHoriz: "more_horiz",
  expand: "expand_more",
  collapse: "expand_less",
  refresh: "refresh",

  // 媒体相关
  play: "play_arrow",
  pause: "pause",
  stop: "stop",
  volume: "volume_up",
  volumeOff: "volume_off",
  fullscreen: "fullscreen",
  download: "download",
  upload: "upload",

  // 社交相关
  like: "favorite",
  unlike: "favorite_border",
  share: "share",
  comment: "comment",
  bookmark: "bookmark",
  bookmarkBorder: "bookmark_border",
  follow: "person_add",
  unfollow: "person_remove",

  // 系统相关
  notification: "notifications",
  notificationOff: "notifications_off",
  visibility: "visibility",
  visibilityOff: "visibility_off",
  lock: "lock",
  unlock: "lock_open",
  security: "security",
  help: "help",
  feedback: "feedback",

  // 箭头相关
  arrowUp: "keyboard_arrow_up",
  arrowDown: "keyboard_arrow_down",
  arrowLeft: "keyboard_arrow_left",
  arrowRight: "keyboard_arrow_right",
  chevronUp: "expand_less",
  chevronDown: "expand_more",
  chevronLeft: "chevron_left",
  chevronRight: "chevron_right",

  // 其他
  star: "star",
  starBorder: "star_border",
  heart: "favorite",
  heartBorder: "favorite_border",
  location: "location_on",
  time: "access_time",
  calendar: "calendar_today",
  phone: "phone",
  email: "email",
  link: "link",
  qrCode: "qr_code",
  camera: "photo_camera",
  gallery: "photo_library"
} as const;

export type IconName = keyof typeof ICON_NAMES | string;

interface IconProps {
  // 图标名称
  name: IconName;
  // 尺寸
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | number;
  // 颜色
  color?: "inherit" | "primary" | "secondary" | "success" | "warning" | "error" | "info" | "muted";
  // 是否填充
  filled?: boolean;
  // 权重
  weight?: 100 | 200 | 300 | 400 | 500 | 600 | 700;
  // 光学尺寸
  opticalSize?: 20 | 24 | 40 | 48;
  // 渐变
  grade?: -25 | 0 | 200;
  // 自定义类名
  className?: string;
  // 点击事件
  onClick?: () => void;
  // 是否可点击
  clickable?: boolean;
  // 旋转角度
  rotate?: 0 | 90 | 180 | 270;
  // 动画
  animation?: "spin" | "pulse" | "bounce" | "none";
}

export function Icon({
  name,
  size = "md",
  color = "inherit",
  filled = false,
  weight = 400,
  opticalSize = 24,
  grade = 0,
  className,
  onClick,
  clickable = false,
  rotate = 0,
  animation = "none"
}: IconProps) {
  // 尺寸映射
  const sizeClasses = {
    xs: "text-xs",
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl",
    "2xl": "text-2xl"
  };

  // 颜色映射
  const colorClasses = {
    inherit: "text-inherit",
    primary: "text-primary",
    secondary: "text-secondary",
    success: "text-green-500",
    warning: "text-amber-500",
    error: "text-red-500",
    info: "text-blue-500",
    muted: "text-slate-500 dark:text-slate-400"
  };

  // 动画映射
  const animationClasses = {
    spin: "animate-spin",
    pulse: "animate-pulse",
    bounce: "animate-bounce",
    none: ""
  };

  // 旋转映射
  const rotateClasses = {
    0: "",
    90: "rotate-90",
    180: "rotate-180",
    270: "rotate-270"
  };

  // 获取图标名称
  const iconName = ICON_NAMES[name as keyof typeof ICON_NAMES] || name;

  // 构建样式
  const fontVariationSettings = `
    'FILL' ${filled ? 1 : 0},
    'wght' ${weight},
    'GRAD' ${grade},
    'opsz' ${opticalSize}
  `;

  return (
    <span
      className={clsx(
        "material-symbols-outlined select-none transition-all duration-200",
        typeof size === "string" ? sizeClasses[size] : "",
        colorClasses[color],
        animationClasses[animation],
        rotateClasses[rotate],
        clickable && "cursor-pointer hover:scale-110",
        onClick && "cursor-pointer",
        className
      )}
      style={{
        fontVariationSettings,
        fontSize: typeof size === "number" ? `${size}px` : undefined
      }}
      onClick={onClick}
    >
      {iconName}
    </span>
  );
}

// 图标按钮组件
export function IconButton({
  icon,
  size = "md",
  variant = "ghost",
  color = "inherit",
  disabled = false,
  loading = false,
  className,
  children,
  ...props
}: {
  icon: IconName;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  variant?: "solid" | "outline" | "ghost";
  color?: "inherit" | "primary" | "secondary" | "success" | "warning" | "error";
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  children?: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const sizeClasses = {
    xs: "p-1",
    sm: "p-1.5",
    md: "p-2",
    lg: "p-2.5",
    xl: "p-3"
  };

  const variantClasses = {
    solid: {
      inherit: "bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600",
      primary: "bg-primary hover:bg-primary-dark text-white",
      secondary: "bg-secondary hover:bg-secondary/80 text-white",
      success: "bg-green-500 hover:bg-green-600 text-white",
      warning: "bg-amber-500 hover:bg-amber-600 text-white",
      error: "bg-red-500 hover:bg-red-600 text-white"
    },
    outline: {
      inherit: "border border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800",
      primary: "border border-primary text-primary hover:bg-primary hover:text-white",
      secondary: "border border-secondary text-secondary hover:bg-secondary hover:text-white",
      success: "border border-green-500 text-green-500 hover:bg-green-500 hover:text-white",
      warning: "border border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-white",
      error: "border border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
    },
    ghost: {
      inherit: "hover:bg-slate-100 dark:hover:bg-slate-700",
      primary: "text-primary hover:bg-primary/10",
      secondary: "text-secondary hover:bg-secondary/10",
      success: "text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20",
      warning: "text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20",
      error: "text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
    }
  };

  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50",
        sizeClasses[size],
        variantClasses[variant][color],
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Icon name="refresh" animation="spin" size={size} />
      ) : (
        <Icon name={icon} size={size} />
      )}
      {children}
    </button>
  );
}

// 状态图标组件
export function StatusIcon({
  status,
  size = "sm",
  className
}: {
  status: "online" | "offline" | "away" | "busy" | "invisible";
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}) {
  const statusConfig = {
    online: { icon: "circle", color: "text-green-500" },
    offline: { icon: "radio_button_unchecked", color: "text-gray-400" },
    away: { icon: "schedule", color: "text-yellow-500" },
    busy: { icon: "do_not_disturb", color: "text-red-500" },
    invisible: { icon: "visibility_off", color: "text-gray-300" }
  };

  const config = statusConfig[status];

  return (
    <Icon
      name={config.icon}
      size={size}
      className={clsx(config.color, className)}
    />
  );
}

export default Icon;