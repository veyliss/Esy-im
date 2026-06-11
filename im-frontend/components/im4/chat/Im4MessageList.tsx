import type { RefObject } from "react";
import { Button, Image, Typography } from "antd";
import { CheckCircleOutlined, ExclamationCircleOutlined, ForwardOutlined, LoadingOutlined, CheckOutlined, DownloadOutlined, StarOutlined, PushpinOutlined } from "@ant-design/icons";
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
  onForwardMessage?: (message: Im4RenderableMessage) => void;
  onFavoriteMessage?: (message: Im4RenderableMessage) => void;
  onPinMessage?: (message: Im4RenderableMessage) => void;
  onOpenInspector: () => void;
  hasMore?: boolean;
  loadingOlder?: boolean;
  onLoadOlder?: () => void;
}

function formatMessageTime(value?: string) {
  if (!value) return "";
  return new Date(value).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
}

function formatFileSize(bytes?: number) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function renderAtUsers(content: string, atUsersJson?: string) {
  if (!atUsersJson) return content;
  try {
    const ids: string[] = JSON.parse(atUsersJson);
    if (!ids.length) return content;
    // Highlight @mentions in content
    let result = content;
    for (const uid of ids) {
      result = result.replace(new RegExp(`@${uid}`, "g"), `<@${uid}>`);
    }
    return result;
  } catch {
    return content;
  }
}

export function Im4MessageList({
  entries,
  currentUser,
  showSender = false,
  endRef,
  onCopyMessage,
  onReplyMessage,
  onForwardMessage,
  onFavoriteMessage,
  onPinMessage,
  onOpenInspector,
  hasMore = false,
  loadingOlder = false,
  onLoadOlder,
}: Im4MessageListProps) {
  // Find last message sent by current user for read receipt display
  let lastMineMessageId: number | null = null;
  for (let i = entries.length - 1; i >= 0; i--) {
    const entry = entries[i];
    if (entry.type === "message" && entry.message.from_user_id === currentUser?.user_id) {
      lastMineMessageId = entry.message.id;
      break;
    }
  }

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
          const msgType = "message_type" in message ? message.message_type : 1;
          const isForward = msgType === 7;
          const isSystem = msgType === 6;
          const atUsersJson = "at_users" in message ? (message as GroupMessage).at_users : undefined;

          // Read receipt for last sent message
          const showReadReceipt = isMine && message.id === lastMineMessageId;
          const isRead = "is_read" in message && message.is_read;

          if (isSystem) {
            return (
              <div key={entry.id} className="im4-date-divider">
                <span>{message.content || "系统消息"}</span>
              </div>
            );
          }

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
                {isForward ? (
                  <div className="im4-message-bubble im4-forward-bubble">
                    <span className="im4-forward-tag">[转发消息]</span>
                    <span className="im4-forward-content">{message.content}</span>
                  </div>
                ) : msgType === 3 ? (
                  /* 语音消息 */
                  <div className="im4-message-bubble im4-audio-bubble">
                    {message.media_url ? (
                      <>
                        <audio controls src={message.media_url} className="im4-audio-player" />
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>语音消息</Typography.Text>
                      </>
                    ) : (
                      message.content
                    )}
                  </div>
                ) : msgType === 4 ? (
                  /* 视频消息 */
                  <div className="im4-message-bubble im4-video-bubble">
                    {message.media_url ? (
                      <video controls src={message.media_url} className="im4-video-player" style={{ maxWidth: 280, borderRadius: 8 }} />
                    ) : (
                      message.content
                    )}
                  </div>
                ) : msgType === 5 ? (
                  /* 文件消息 */
                  <div className="im4-message-bubble im4-file-bubble">
                    <div className="im4-file-card">
                      <Typography.Text strong ellipsis style={{ maxWidth: 180 }}>
                        {message.content || "文件"}
                      </Typography.Text>
                      {message.media_url && (
                        <a href={message.media_url} target="_blank" rel="noopener noreferrer">
                          <Button size="small" icon={<DownloadOutlined />} type="link">下载</Button>
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className={`im4-message-bubble ${message.media_url ? "has-media" : ""}`}>
                    {message.media_url ? (
                      <Image
                        alt={message.content || "聊天图片"}
                        className="im4-message-image"
                        src={message.media_url}
                        width={220}
                      />
                    ) : (
                      renderAtUsers(message.content || "", atUsersJson)
                    )}
                  </div>
                )}
                <div className="im4-message-meta">
                  <time>{formatMessageTime(message.created_at)}</time>
                  {isMine && "client_status" in message && message.client_status === "sending" ? (
                    <span className="im4-message-state is-sending"><LoadingOutlined /> 发送中</span>
                  ) : null}
                  {isMine && "client_status" in message && message.client_status === "failed" ? (
                    <span className="im4-message-state is-failed"><ExclamationCircleOutlined /> 发送失败</span>
                  ) : null}
                  {isMine && (!("client_status" in message) || message.client_status === "sent") ? <CheckCircleOutlined /> : null}
                  {showReadReceipt ? (
                    <span className={`im4-read-receipt ${isRead ? "is-read" : ""}`}>
                      <CheckOutlined /> {isRead ? "已读" : "未读"}
                    </span>
                  ) : null}
                  <Button size="small" type="link" onClick={() => onReplyMessage(message)}>回复</Button>
                  {onForwardMessage ? (
                    <Button size="small" type="link" icon={<ForwardOutlined />} onClick={() => onForwardMessage(message)}>转发</Button>
                  ) : null}
                  {onFavoriteMessage ? (
                    <Button size="small" type="link" icon={<StarOutlined />} onClick={() => onFavoriteMessage(message)}>收藏</Button>
                  ) : null}
                  {showSender && onPinMessage ? (
                    <Button size="small" type="link" icon={<PushpinOutlined />} onClick={() => onPinMessage(message)}>置顶</Button>
                  ) : null}
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
