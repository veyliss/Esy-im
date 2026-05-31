import type { KeyboardEvent, Ref } from "react";

interface ChatComposerProps {
  value: string;
  placeholder: string;
  hint: string;
  replyPreview?: {
    author: string;
    content: string;
  } | null;
  quickReplies?: string[];
  sending?: boolean;
  inputRef?: Ref<HTMLTextAreaElement>;
  onChange: (value: string) => void;
  onSend: () => void;
  onAttach: () => void;
  onCancelReply?: () => void;
  onQuickReply?: (value: string) => void;
}

export function ChatComposer({
  value,
  placeholder,
  hint,
  replyPreview,
  quickReplies = [],
  sending = false,
  inputRef,
  onChange,
  onSend,
  onAttach,
  onCancelReply,
  onQuickReply,
}: ChatComposerProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!sending) onSend();
    }
  };

  return (
    <div className="chat-composer-shell">
      {replyPreview ? (
        <div className="chat-reply-preview">
          <span>
            回复 <strong>{replyPreview.author}</strong>
          </span>
          <p>{replyPreview.content}</p>
          {onCancelReply ? (
            <button type="button" onClick={onCancelReply} aria-label="取消回复" title="取消回复">
              <span className="material-symbols-outlined">close</span>
            </button>
          ) : null}
        </div>
      ) : null}
      {quickReplies.length > 0 ? (
        <div className="chat-quick-replies" aria-label="快捷回复">
          {quickReplies.map((item) => (
            <button key={item} type="button" onClick={() => onQuickReply?.(item)} disabled={sending}>
              {item}
            </button>
          ))}
        </div>
      ) : null}
      <div className="chat-composer">
        <button
          type="button"
          className="chat-composer-tool"
          onClick={onAttach}
          aria-label="添加附件"
          title="添加附件"
        >
          <span className="material-symbols-outlined">add</span>
        </button>
        <div className="chat-composer-input-wrap">
          <textarea
            ref={inputRef}
            className="chat-composer-input"
            placeholder={placeholder}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={handleKeyDown}
            disabled={sending}
            rows={1}
          />
          <div className="chat-composer-meta">
            <span>{hint}</span>
            <strong className={value.length > 900 ? "text-amber-500" : ""}>{value.length}/1000</strong>
          </div>
        </div>

        <button
          className="chat-send-button"
          onClick={onSend}
          disabled={sending || !value.trim()}
          aria-label="发送消息"
          title="发送消息"
        >
          <span className="material-symbols-outlined text-xl">{sending ? "sync" : "send"}</span>
        </button>
      </div>
    </div>
  );
}

export default ChatComposer;
