import type { ReactNode } from "react";
import { UserAvatar } from "@/components/ui/user-avatar";

interface Im4ConversationHeaderProps {
  avatar?: string;
  name: string;
  meta: string;
  shape?: "circle" | "rounded";
  onBack?: () => void;
  actions?: ReactNode;
}

export function Im4ConversationHeader({
  avatar,
  name,
  meta,
  shape = "circle",
  onBack,
  actions,
}: Im4ConversationHeaderProps) {
  return (
    <div className="im4-chat-head">
      <div className="im4-chat-identity">
        {onBack ? (
          <button type="button" className="im4-back-button" onClick={onBack} aria-label="返回会话列表" title="返回">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
        ) : null}
        <UserAvatar src={avatar} name={name} size="md" shape={shape} showStatus={shape === "circle"} status="online" border />
        <div>
          <h2>{name}</h2>
          <p>{meta}</p>
        </div>
      </div>
      <div className="im4-chat-actions">{actions}</div>
    </div>
  );
}

export default Im4ConversationHeader;

