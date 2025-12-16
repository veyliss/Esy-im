/**
 * 增强的聊天消息组件
 */

import type { Message, User } from "@/lib/types/api";
import { formatTime } from "@/lib/utils/time";
import { useState } from "react";
import clsx from "clsx";

interface MessageItemProps {
  message: Message;
  currentUser: User | null;
  showAvatar?: boolean;
  showTime?: boolean;
  isGrouped?: boolean; // 是否与上一条消息分组显示
  onMessageAction?: (action: 'copy' | 'reply' | 'delete', message: Message) => void;
}

export function MessageItem({
  message,
  currentUser,
  showAvatar = true,
  showTime = true,
  isGrouped = false,
  onMessageAction
}: MessageItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const isMe = currentUser?.user_id === message.from_user_id;
  const displayUser = message.from_user || message.to_user;

  // 消息撤回显示
  if (message.is_recalled) {
    return (
      <div className="flex justify-center my-3">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-100/80 dark:bg-slate-800/80 px-4 py-2 rounded-full backdrop-blur-sm">
          <span className="material-symbols-outlined text-sm">undo</span>
          <span>{isMe ? "你撤回了一条消息" : `${displayUser?.nickname}撤回了一条消息`}</span>
        </div>
      </div>
    );
  }

  if (isMe) {
    // 发送的消息(右侧) - 增强版
    return (
      <div
        className={clsx(
          "flex items-start gap-3 justify-end group transition-all duration-200",
          isGrouped ? "mb-1" : "mb-4"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* 消息操作按钮 */}
        {isHovered && onMessageAction && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 mr-2">
            <button
              onClick={() => onMessageAction('copy', message)}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title="复制消息"
            >
              <span className="material-symbols-outlined text-sm text-slate-500">content_copy</span>
            </button>
            <button
              onClick={() => onMessageAction('reply', message)}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title="回复消息"
            >
              <span className="material-symbols-outlined text-sm text-slate-500">reply</span>
            </button>
            <button
              onClick={() => onMessageAction('delete', message)}
              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              title="删除消息"
            >
              <span className="material-symbols-outlined text-sm text-red-500">delete</span>
            </button>
          </div>
        )}

        <div className="flex flex-col items-end max-w-lg">
          {/* 消息气泡 */}
          <div className={clsx(
            "relative bg-gradient-to-br from-primary to-primary-light text-white rounded-2xl px-4 py-3 shadow-sm hover:shadow-md transition-all duration-200",
            isMe ? "rounded-tr-md" : "rounded-tl-md",
            isHovered && "scale-[1.02]"
          )}>
            {/* 气泡尾巴 */}
            <div className="absolute top-0 right-0 w-4 h-4 bg-gradient-to-br from-primary to-primary-light transform rotate-45 translate-x-2 -translate-y-2 rounded-sm" />

            <p className="text-sm break-words relative z-10 leading-relaxed">{message.content}</p>

            {/* 消息状态指示器 */}
            <div className="flex items-center justify-end gap-1 mt-1">
              <span className="text-xs text-white/70">
                {showTime && formatTime(message.created_at)}
              </span>
              <span className="material-symbols-outlined text-xs text-white/70">done_all</span>
            </div>
          </div>
        </div>

        {/* 头像 */}
        {showAvatar && !isGrouped && currentUser?.avatar && (
          <div className="relative group/avatar">
            <div
              className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-10 h-10 shrink-0 ring-2 ring-white dark:ring-slate-700 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-110"
              style={{ backgroundImage: `url(${currentUser.avatar})` }}
            />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-800" />
          </div>
        )}
      </div>
    );
  }

  // 接收的消息(左侧) - 增强版
  return (
    <div
      className={clsx(
        "flex items-start gap-3 group transition-all duration-200",
        isGrouped ? "mb-1" : "mb-4"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 头像 */}
      {showAvatar && !isGrouped && displayUser?.avatar && (
        <div className="relative group/avatar">
          <div
            className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-10 h-10 shrink-0 ring-2 ring-white dark:ring-slate-700 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-110"
            style={{ backgroundImage: `url(${displayUser.avatar})` }}
          />
          {/* 在线状态指示器 */}
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-800" />
        </div>
      )}

      <div className="flex flex-col items-start max-w-lg flex-1">
        {/* 用户名 (仅在群聊或首条消息时显示) */}
        {!isGrouped && displayUser?.nickname && (
          <span className="text-xs text-slate-500 dark:text-slate-400 mb-1 ml-1">
            {displayUser.nickname}
          </span>
        )}

        {/* 消息气泡 */}
        <div className={clsx(
          "relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 shadow-sm hover:shadow-md transition-all duration-200",
          "rounded-tl-md",
          isHovered && "scale-[1.02] border-primary/20 dark:border-primary/30"
        )}>
          {/* 气泡尾巴 */}
          <div className="absolute top-0 left-0 w-4 h-4 bg-white dark:bg-slate-800 border-l border-t border-slate-200 dark:border-slate-700 transform rotate-45 -translate-x-2 -translate-y-2 rounded-sm" />

          <p className="text-sm text-slate-800 dark:text-slate-200 break-words relative z-10 leading-relaxed">
            {message.content}
          </p>

          {/* 时间戳 */}
          {showTime && (
            <div className="flex items-center justify-start mt-1">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {formatTime(message.created_at)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 消息操作按钮 */}
      {isHovered && onMessageAction && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ml-2">
          <button
            onClick={() => onMessageAction('copy', message)}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title="复制消息"
          >
            <span className="material-symbols-outlined text-sm text-slate-500">content_copy</span>
          </button>
          <button
            onClick={() => onMessageAction('reply', message)}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title="回复消息"
          >
            <span className="material-symbols-outlined text-sm text-slate-500">reply</span>
          </button>
        </div>
      )}
    </div>
  );
}
