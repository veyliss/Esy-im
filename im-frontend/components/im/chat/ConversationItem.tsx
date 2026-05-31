import { ImListItem } from "@/components/im/layout";
import { UserAvatar } from "@/components/ui/user-avatar";

interface ConversationItemProps {
  active?: boolean;
  type: "private" | "group";
  name: string;
  avatar?: string;
  lastMessage?: string;
  time?: string;
  unreadCount?: number;
  pinned?: boolean;
  muted?: boolean;
  onClick: () => void;
}

export function ConversationItem({
  active = false,
  type,
  name,
  avatar,
  lastMessage,
  time,
  unreadCount = 0,
  pinned = false,
  muted = false,
  onClick,
}: ConversationItemProps) {
  return (
    <ImListItem onClick={onClick} active={active} className="im3-conversation-item">
      <div className="relative">
        <UserAvatar src={avatar} name={name} size="md" shape={type === "group" ? "rounded" : "circle"} border />
        {type === "group" ? (
          <span className="absolute -bottom-1 -right-1 rounded bg-slate-700 px-1 text-[10px] font-semibold text-white dark:bg-slate-200 dark:text-slate-900">
            群
          </span>
        ) : null}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            {pinned ? <span className="chat-list-indicator material-symbols-outlined">keep</span> : null}
            {muted ? <span className="chat-list-indicator material-symbols-outlined">notifications_off</span> : null}
            <p className={`truncate text-sm ${active ? "font-semibold text-primary" : "font-semibold text-slate-900 dark:text-slate-100"}`}>
              {name}
            </p>
          </div>
          <p className="shrink-0 text-xs text-slate-500 dark:text-slate-400">{time}</p>
        </div>
        <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">{lastMessage || "暂无消息"}</p>
      </div>

      {unreadCount > 0 ? (
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold text-white ${muted ? "bg-slate-400" : "bg-primary"}`}>
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      ) : null}
    </ImListItem>
  );
}

export default ConversationItem;
