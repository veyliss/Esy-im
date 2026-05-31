import { UserAvatar } from "@/components/ui/user-avatar";
import type { GroupMessage, Message, User } from "@/lib/types/api";

export type ChatRenderableMessage = Message | GroupMessage;

interface ChatMessageBubbleProps {
  message: ChatRenderableMessage;
  currentUser: User | null;
  showSender?: boolean;
  onCopy: (content: string) => void;
}

export function ChatMessageBubble({ message, currentUser, showSender = false, onCopy }: ChatMessageBubbleProps) {
  const isMyMessage = message.from_user_id === currentUser?.user_id;
  const messageUser = isMyMessage ? currentUser : message.from_user;
  const messageTime = message.created_at
    ? new Date(message.created_at).toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  if (isMyMessage) {
    return (
      <div className="chat-bubble-row is-me">
        <div className="chat-bubble-stack is-me">
          <div className="chat-bubble is-me">{message.content}</div>
          <div className="chat-message-actions">
            <button type="button" onClick={() => onCopy(message.content)}>
              复制
            </button>
          </div>
          <span className="chat-message-meta">
            {messageTime}
            <span className="material-symbols-outlined">done_all</span>
          </span>
        </div>
        <UserAvatar
          src={messageUser?.avatar}
          name={messageUser?.nickname || "我"}
          size="md"
          border
          className="chat-message-avatar"
        />
      </div>
    );
  }

  return (
    <div className="chat-bubble-row">
      <UserAvatar
        src={messageUser?.avatar}
        name={messageUser?.nickname || `用户${message.from_user_id}`}
        size="md"
        border
        className="chat-message-avatar"
      />
      <div className="chat-bubble-stack">
        {showSender ? (
          <p className="chat-message-sender">{messageUser?.nickname || `用户${message.from_user_id}`}</p>
        ) : null}
        <div className="chat-bubble">{message.content}</div>
        <div className="chat-message-actions">
          <button type="button" onClick={() => onCopy(message.content)}>
            复制
          </button>
        </div>
        {messageTime ? <span className="chat-message-meta">{messageTime}</span> : null}
      </div>
    </div>
  );
}

export default ChatMessageBubble;
