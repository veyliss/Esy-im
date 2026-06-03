import clsx from "clsx";
import { Button, Tooltip } from "antd";
import { BellOutlined, EyeInvisibleOutlined, MutedOutlined, PushpinFilled, PushpinOutlined } from "@ant-design/icons";
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
      <Button type="text" className="im4-session-main" onClick={onClick}>
        <UserAvatar src={avatar} name={name} size="md" shape={type === "group" ? "rounded" : "circle"} border />
        <div className="im4-session-copy">
          <div>
            <strong>{name}</strong>
            <time>{time}</time>
          </div>
          <p>{lastMessage || (type === "group" ? "群聊暂无消息" : "暂无消息")}</p>
        </div>
        <div className="im4-session-flags">
          {pinned ? <PushpinFilled /> : null}
          {muted ? <MutedOutlined /> : null}
          {unreadCount > 0 ? <em>{unreadCount > 99 ? "99+" : unreadCount}</em> : null}
        </div>
      </Button>
      <div className="im4-session-actions">
        {onPin ? (
          <Tooltip title={pinned ? "取消置顶" : "置顶"}>
            <Button
              aria-label={pinned ? "取消置顶" : "置顶会话"}
              icon={<PushpinOutlined />}
              shape="circle"
              size="small"
              type="text"
              onClick={onPin}
            />
          </Tooltip>
        ) : null}
        {onMute ? (
          <Tooltip title={muted ? "取消免打扰" : "免打扰"}>
            <Button
              aria-label={muted ? "取消免打扰" : "免打扰"}
              icon={muted ? <BellOutlined /> : <MutedOutlined />}
              shape="circle"
              size="small"
              type="text"
              onClick={onMute}
            />
          </Tooltip>
        ) : null}
        {onHide ? (
          <Tooltip title="隐藏">
            <Button
              aria-label="隐藏会话"
              icon={<EyeInvisibleOutlined />}
              shape="circle"
              size="small"
              type="text"
              onClick={onHide}
            />
          </Tooltip>
        ) : null}
      </div>
    </div>
  );
}

export default Im4SessionItem;
