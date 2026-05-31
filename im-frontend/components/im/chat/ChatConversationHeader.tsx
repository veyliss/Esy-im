import type { ReactNode } from "react";
import { UserAvatar } from "@/components/ui/user-avatar";

interface ChatConversationHeaderProps {
  avatar?: string;
  name: string;
  meta: string;
  shape?: "circle" | "rounded";
  onBack?: () => void;
  actions?: ReactNode;
}

export function ChatConversationHeader({
  avatar,
  name,
  meta,
  shape = "circle",
  onBack,
  actions,
}: ChatConversationHeaderProps) {
  return (
    <div className="im3-chat-header">
      <div className="im3-chat-title-group">
        {onBack ? (
          <button type="button" className="im3-icon-button im3-chat-back" onClick={onBack} aria-label="返回会话列表" title="返回">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
        ) : null}
        <UserAvatar src={avatar} name={name} size="md" shape={shape} border />
        <div className="im3-chat-title-copy">
          <h2>{name}</h2>
          <p>{meta}</p>
        </div>
      </div>
      <div className="im3-chat-header-actions">{actions}</div>
    </div>
  );
}

export default ChatConversationHeader;
