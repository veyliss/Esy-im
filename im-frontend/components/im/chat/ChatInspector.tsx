import { UserAvatar } from "@/components/ui/user-avatar";

interface ChatInspectorProps {
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

export function ChatInspector({
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
}: ChatInspectorProps) {
  return (
    <aside className="chat-inspector">
      <div className="chat-inspector-head">
        <strong>{type === "group" ? "群聊资料" : "联系人资料"}</strong>
        <button type="button" className="workspace-icon-button" onClick={onClose} aria-label="关闭资料" title="关闭">
          <span className="material-symbols-outlined text-xl">close</span>
        </button>
      </div>
      <div className="chat-inspector-profile">
        <UserAvatar src={avatar} name={name} size="2xl" shape={type === "group" ? "rounded" : "circle"} border />
        <h3>{name}</h3>
        <p>{type === "group" && groupId ? `群号：${groupId}` : "私聊会话"}</p>
      </div>
      <div className="chat-inspector-list">
        <div>
          <span>类型</span>
          <strong>{type === "group" ? "群聊" : "私聊"}</strong>
        </div>
        <div>
          <span>未读</span>
          <strong>{unreadCount > 0 ? unreadCount : "无"}</strong>
        </div>
        <div>
          <span>消息</span>
          <strong>{messageCount} 条</strong>
        </div>
        {type === "group" && typeof memberCount === "number" ? (
          <div>
            <span>成员</span>
            <strong>{memberCount} 人</strong>
          </div>
        ) : null}
      </div>
      <div className="chat-inspector-actions">
        <button type="button" className="im-secondary-button" onClick={onTogglePinned}>
          {pinned ? "取消置顶" : "置顶会话"}
        </button>
        <button type="button" className="im-secondary-button" onClick={onToggleMuted}>
          {muted ? "取消免打扰" : "免打扰"}
        </button>
        <button type="button" className="im-secondary-button" onClick={onOpenDetail}>
          {type === "group" ? "群聊详情" : "联系人详情"}
        </button>
        <button type="button" className="im-danger-button" onClick={onHideConversation}>
          隐藏会话
        </button>
      </div>
    </aside>
  );
}

export default ChatInspector;
