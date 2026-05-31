import type { RefObject } from "react";
import type { User } from "@/lib/types/api";
import { ChatMessageBubble, type ChatRenderableMessage } from "./ChatMessageBubble";

export type ChatTimelineEntry =
  | { type: "date"; id: string; label: string }
  | { type: "message"; id: string; message: ChatRenderableMessage };

interface ChatMessageListProps {
  entries: ChatTimelineEntry[];
  currentUser: User | null;
  showSender?: boolean;
  endRef: RefObject<HTMLDivElement | null>;
  onCopyMessage: (content: string) => void;
  onOpenInspector: () => void;
}

export function ChatMessageList({
  entries,
  currentUser,
  showSender = false,
  endRef,
  onCopyMessage,
  onOpenInspector,
}: ChatMessageListProps) {
  return (
    <div className="chat-message-list flex-1 space-y-6 overflow-y-auto">
      {entries.length === 0 ? (
        <div className="chat-empty-state">
          <span className="material-symbols-outlined">forum</span>
          <strong>还没有消息</strong>
          <p>发一条简短消息，让这个会话开始流动起来。</p>
          <button type="button" className="im-secondary-button mt-5" onClick={onOpenInspector}>
            查看资料
          </button>
        </div>
      ) : (
        entries.map((entry) => {
          if (entry.type === "date") {
            return (
              <div key={entry.id} className="chat-date-divider">
                <span>{entry.label}</span>
              </div>
            );
          }

          return (
            <ChatMessageBubble
              key={entry.id}
              message={entry.message}
              currentUser={currentUser}
              showSender={showSender}
              onCopy={onCopyMessage}
            />
          );
        })
      )}
      <div ref={endRef} />
    </div>
  );
}

export default ChatMessageList;
