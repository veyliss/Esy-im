import { UserAvatar } from "@/components/ui/user-avatar";
import { Im4Button, Im4IconButton } from "../common";

interface Im4InspectorProps {
  name: string;
  avatar?: string;
  type: "private" | "group";
  unreadCount: number;
  messageCount: number;
  pinned?: boolean;
  muted?: boolean;
  groupId?: string;
  memberCount?: number;
  onClose: () => void;
  onTogglePinned: () => void;
  onToggleMuted: () => void;
  onOpenDetail: () => void;
  onHideConversation: () => void;
}

export function Im4Inspector({
  name,
  avatar,
  type,
  unreadCount,
  messageCount,
  pinned = false,
  muted = false,
  groupId,
  memberCount,
  onClose,
  onTogglePinned,
  onToggleMuted,
  onOpenDetail,
  onHideConversation,
}: Im4InspectorProps) {
  return (
    <div className="im4-inspector">
      <div className="im4-inspector-head">
        <strong>{type === "group" ? "群聊上下文" : "联系人上下文"}</strong>
        <Im4IconButton icon="close" label="关闭资料" onClick={onClose} />
      </div>
      <div className="im4-inspector-profile">
        <UserAvatar src={avatar} name={name} size="2xl" shape={type === "group" ? "rounded" : "circle"} border />
        <h3>{name}</h3>
        <p>{type === "group" && groupId ? `群号：${groupId}` : "私聊会话"}</p>
      </div>
      <div className="im4-inspector-stats">
        <div>
          <span>未读</span>
          <strong>{unreadCount || "无"}</strong>
        </div>
        <div>
          <span>消息</span>
          <strong>{messageCount}</strong>
        </div>
        {typeof memberCount === "number" ? (
          <div>
            <span>成员</span>
            <strong>{memberCount}</strong>
          </div>
        ) : null}
      </div>
      <div className="im4-inspector-actions">
        <Im4Button onClick={onTogglePinned}>{pinned ? "取消置顶" : "置顶会话"}</Im4Button>
        <Im4Button onClick={onToggleMuted}>{muted ? "取消免打扰" : "免打扰"}</Im4Button>
        <Im4Button onClick={onOpenDetail}>{type === "group" ? "群聊详情" : "联系人详情"}</Im4Button>
        <Im4Button tone="danger" onClick={onHideConversation}>隐藏会话</Im4Button>
      </div>
    </div>
  );
}

export default Im4Inspector;

