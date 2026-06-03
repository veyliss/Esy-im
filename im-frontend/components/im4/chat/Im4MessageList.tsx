import type { RefObject } from "react";
import { Button, Image } from "antd";
import { CheckCircleOutlined, ExclamationCircleOutlined, LoadingOutlined } from "@ant-design/icons";
import { UserAvatar } from "@/components/ui/user-avatar";
import type { GroupMessage, Message, User } from "@/lib/types/api";
import { Im4Button } from "../common";

export type Im4RenderableMessage = Message | GroupMessage;
export type Im4TimelineEntry =
  | { type: "date"; id: string; label: string }
  | { type: "message"; id: string; message: Im4RenderableMessage };

interface Im4MessageListProps {
  entries: Im4TimelineEntry[];
  currentUser: User | null;
  showSender?: boolean;
  endRef: RefObject<HTMLDivElement | null>;
  onCopyMessage: (content: string) => void;
  onReplyMessage: (message: Im4RenderableMessage) => void;
  onOpenInspector: () => void;
  hasMore?: boolean;
  loadingOlder?: boolean;
  onLoadOlder?: () => void;
}

function formatMessageTime(value?: string) {
  if (!value) return "";
  return new Date(value).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
}

export function Im4MessageList({
  entries,
  currentUser,
  showSender = false,
  endRef,
  onCopyMessage,
  onReplyMessage,
  onOpenInspector,
  hasMore = false,
  loadingOlder = false,
  onLoadOlder,
}: Im4MessageListProps) {
  return (
    <div className="im4-message-list">
      {hasMore ? (
        <div className="im4-load-older">
          <Button loading={loadingOlder} size="small" onClick={onLoadOlder}>
            加载更早消息
          </Button>
        </div>
      ) : null}
      {entries.length === 0 ? (
        <div className="im4-chat-empty">
          <h2>还没有消息</h2>
          <p>发送第一条消息，或者先查看对方资料。</p>
          <Im4Button onClick={onOpenInspector}>查看资料</Im4Button>
        </div>
      ) : (
        entries.map((entry) => {
          if (entry.type === "date") {
            return (
              <div key={entry.id} className="im4-date-divider">
                <span>{entry.label}</span>
              </div>
            );
          }

          const message = entry.message;
          const isMine = message.from_user_id === currentUser?.user_id;
          const messageUser = isMine ? currentUser : message.from_user;

          return (
            <div key={entry.id} className={`im4-message-row ${isMine ? "is-me" : ""}`}>
              {!isMine ? (
                <UserAvatar
                  src={messageUser?.avatar}
                  name={messageUser?.nickname || `用户${message.from_user_id}`}
                  size="sm"
                  border
                />
              ) : null}
              <div className="im4-message-stack">
                {!isMine && showSender ? (
                  <strong className="im4-message-sender">{messageUser?.nickname || `用户${message.from_user_id}`}</strong>
                ) : null}
                <div className={`im4-message-bubble ${message.media_url ? "has-media" : ""}`}>
                  {message.media_url ? (
                    <Image
                      alt={message.content || "聊天图片"}
                      className="im4-message-image"
                      src={message.media_url}
                      width={220}
                    />
                  ) : (
                    message.content
                  )}
                </div>
                <div className="im4-message-meta">
                  <time>{formatMessageTime(message.created_at)}</time>
                  {isMine && "client_status" in message && message.client_status === "sending" ? (
                    <span className="im4-message-state is-sending"><LoadingOutlined /> 发送中</span>
                  ) : null}
                  {isMine && "client_status" in message && message.client_status === "failed" ? (
                    <span className="im4-message-state is-failed"><ExclamationCircleOutlined /> 发送失败</span>
                  ) : null}
                  {isMine && (!("client_status" in message) || message.client_status === "sent") ? <CheckCircleOutlined /> : null}
                  <Button size="small" type="link" onClick={() => onReplyMessage(message)}>回复</Button>
                  <Button size="small" type="link" onClick={() => onCopyMessage(message.content)}>复制</Button>
                </div>
              </div>
              {isMine ? (
                <UserAvatar src={messageUser?.avatar} name={messageUser?.nickname || "我"} size="sm" border />
              ) : null}
            </div>
          );
        })
      )}
      <div ref={endRef} />
    </div>
  );
}

export default Im4MessageList;
