/**
 * 增强的聊天输入组件
 */

"use client";

import { useState, useRef, useEffect } from "react";
import clsx from "clsx";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
  showEmojiPicker?: boolean;
  showAttachment?: boolean;
  className?: string;
}

export function ChatInput({
  onSendMessage,
  placeholder = "输入消息...",
  disabled = false,
  maxLength = 1000,
  showEmojiPicker = true,
  showAttachment = true,
  className
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [showEmojiPanel, setShowEmojiPanel] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 常用表情
  const commonEmojis = [
    "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣",
    "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰",
    "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜",
    "🤪", "🤨", "🧐", "🤓", "😎", "🤩", "🥳", "😏",
    "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣",
    "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠",
    "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨",
    "😰", "😥", "😓", "🤗", "🤔", "🤭", "🤫", "🤥",
    "😶", "😐", "😑", "😬", "🙄", "😯", "😦", "😧",
    "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "🤐"
  ];

  // 自动调整文本框高度
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && !disabled) {
      onSendMessage(trimmedMessage);
      setMessage("");
      setShowEmojiPanel(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newMessage = message.slice(0, start) + emoji + message.slice(end);
      setMessage(newMessage);

      // 恢复光标位置
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + emoji.length, start + emoji.length);
      }, 0);
    }
  };

  const messageLength = message.length;
  const isNearLimit = messageLength > maxLength * 0.8;
  const isOverLimit = messageLength > maxLength;

  return (
    <div className={clsx("relative", className)}>
      {/* 表情面板 */}
      {showEmojiPanel && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-4 animate-slide-in-up">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">选择表情</h3>
            <button
              onClick={() => setShowEmojiPanel(false)}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <span className="material-symbols-outlined text-sm text-slate-500">close</span>
            </button>
          </div>
          <div className="grid grid-cols-8 gap-2 max-h-32 overflow-y-auto">
            {commonEmojis.map((emoji, index) => (
              <button
                key={index}
                onClick={() => insertEmoji(emoji)}
                className="p-2 text-lg hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors hover:scale-110 transform"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 输入区域 */}
      <div className={clsx(
        "flex items-end gap-3 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl transition-all duration-200",
        isFocused && "border-primary dark:border-primary shadow-lg shadow-primary/10",
        disabled && "opacity-50 cursor-not-allowed"
      )}>
        {/* 附件按钮 */}
        {showAttachment && (
          <button
            disabled={disabled}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:cursor-not-allowed"
            title="发送附件"
          >
            <span className="material-symbols-outlined text-xl text-slate-500">attach_file</span>
          </button>
        )}

        {/* 文本输入区域 */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            disabled={disabled}
            maxLength={maxLength}
            className={clsx(
              "w-full resize-none border-none outline-none bg-transparent text-slate-800 dark:text-slate-200 placeholder-slate-500 dark:placeholder-slate-400",
              "min-h-[24px] max-h-[120px] leading-6 text-sm",
              disabled && "cursor-not-allowed"
            )}
            style={{ height: "24px" }}
          />

          {/* 字数统计 */}
          {(isNearLimit || isOverLimit) && (
            <div className={clsx(
              "absolute -top-6 right-0 text-xs",
              isOverLimit ? "text-red-500" : "text-amber-500"
            )}>
              {messageLength}/{maxLength}
            </div>
          )}
        </div>

        {/* 表情按钮 */}
        {showEmojiPicker && (
          <button
            disabled={disabled}
            onClick={() => setShowEmojiPanel(!showEmojiPanel)}
            className={clsx(
              "p-2 rounded-xl transition-colors disabled:cursor-not-allowed",
              showEmojiPanel
                ? "bg-primary/10 text-primary"
                : "hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"
            )}
            title="选择表情"
          >
            <span className="material-symbols-outlined text-xl">sentiment_satisfied</span>
          </button>
        )}

        {/* 发送按钮 */}
        <button
          onClick={handleSend}
          disabled={disabled || !message.trim() || isOverLimit}
          className={clsx(
            "p-2 rounded-xl transition-all duration-200 disabled:cursor-not-allowed",
            message.trim() && !isOverLimit && !disabled
              ? "bg-primary text-white hover:bg-primary-dark shadow-lg hover:shadow-xl hover:scale-105"
              : "bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500"
          )}
          title="发送消息 (Enter)"
        >
          <span className="material-symbols-outlined text-xl">send</span>
        </button>
      </div>

      {/* 快捷提示 */}
      {isFocused && !disabled && (
        <div className="absolute -top-8 left-4 text-xs text-slate-500 dark:text-slate-400 animate-fade-in-scale">
          按 Enter 发送，Shift + Enter 换行
        </div>
      )}
    </div>
  );
}

export default ChatInput;