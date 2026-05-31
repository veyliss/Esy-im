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
  onPin?: () => void;
  onMute?: () => void;
  onHide?: () => void;
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
  onPin,
  onMute,
  onHide,
}: ConversationItemProps) {
  return (
    <div className={`im3-list-item im3-conversation-item ${active ? "is-active" : ""}`}>
      <button type="button" className="im3-conversation-main" onClick={onClick}>
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
      </button>

      <div className="im3-conversation-actions">
        {onPin ? (
          <button type="button" onClick={onPin} aria-label={pinned ? "取消置顶" : "置顶会话"} title={pinned ? "取消置顶" : "置顶"}>
            <span className="material-symbols-outlined">{pinned ? "keep_off" : "keep"}</span>
          </button>
        ) : null}
        {onMute ? (
          <button type="button" onClick={onMute} aria-label={muted ? "取消免打扰" : "设为免打扰"} title={muted ? "取消免打扰" : "免打扰"}>
            <span className="material-symbols-outlined">{muted ? "notifications" : "notifications_off"}</span>
          </button>
        ) : null}
        {onHide ? (
          <button type="button" onClick={onHide} aria-label="隐藏会话" title="隐藏">
            <span className="material-symbols-outlined">visibility_off</span>
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default ConversationItem;
