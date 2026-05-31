import clsx from "clsx";
import { UserAvatar } from "@/components/ui/user-avatar";

interface Im4SessionItemProps {
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

export function Im4SessionItem({
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
}: Im4SessionItemProps) {
  return (
    <div className={clsx("im4-session-item", active && "is-active", unreadCount > 0 && "has-unread")}>
      <button type="button" className="im4-session-main" onClick={onClick}>
        <UserAvatar src={avatar} name={name} size="md" shape={type === "group" ? "rounded" : "circle"} border />
        <div className="im4-session-copy">
          <div>
            <strong>{name}</strong>
            <time>{time}</time>
          </div>
          <p>{lastMessage || (type === "group" ? "群聊暂无消息" : "暂无消息")}</p>
        </div>
        <div className="im4-session-flags">
          {pinned ? <span className="material-symbols-outlined">keep</span> : null}
          {muted ? <span className="material-symbols-outlined">notifications_off</span> : null}
          {unreadCount > 0 ? <em>{unreadCount > 99 ? "99+" : unreadCount}</em> : null}
        </div>
      </button>
      <div className="im4-session-actions">
        {onPin ? (
          <button type="button" onClick={onPin} aria-label={pinned ? "取消置顶" : "置顶会话"} title={pinned ? "取消置顶" : "置顶"}>
            <span className="material-symbols-outlined">{pinned ? "keep_off" : "keep"}</span>
          </button>
        ) : null}
        {onMute ? (
          <button type="button" onClick={onMute} aria-label={muted ? "取消免打扰" : "免打扰"} title={muted ? "取消免打扰" : "免打扰"}>
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

export default Im4SessionItem;

