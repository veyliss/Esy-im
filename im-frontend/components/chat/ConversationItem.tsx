/**
 * 会话列表项组件
 */

import type { Conversation } from "@/lib/types/api";
import { formatConversationTime } from "@/lib/utils/time";

interface ConversationItemProps {
  conversation: Conversation;
  currentUserId: string;
  isActive: boolean;
  onClick: () => void;
}

export function ConversationItem({
  conversation,
  currentUserId,
  isActive,
  onClick,
}: ConversationItemProps) {
  // 获取对方用户信息
  const otherUser =
    conversation.user1_id === currentUserId
      ? conversation.user2
      : conversation.user1;
  
  // 获取未读数
  const unreadCount =
    conversation.user1_id === currentUserId
      ? conversation.user1_unread
      : conversation.user2_unread;

  // 最后一条消息
  const lastMessage = conversation.last_message;
  const lastMessageText = lastMessage
    ? lastMessage.content || "[媒体消息]"
    : "暂无消息";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-colors ${
        isActive ? "bg-[#e8f0ff]" : "hover:bg-white"
      }`}
    >
      <div
        className="h-12 w-12 shrink-0 rounded-full bg-cover bg-center"
        style={{
          backgroundImage: otherUser?.avatar
            ? `url(${otherUser.avatar})`
            : 'url("/default-avatar.png")',
        }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
          <span className="truncate">{otherUser?.nickname || "未知用户"}</span>
          <span className="text-xs font-normal text-slate-400">
            {formatConversationTime(conversation.last_message_time)}
          </span>
        </div>
        <p className="mt-1 truncate text-sm text-slate-500">{lastMessageText}</p>
      </div>
      {unreadCount > 0 && (
        <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-white">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </button>
  );
}
