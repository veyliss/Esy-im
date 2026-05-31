import type { KeyboardEvent, Ref } from "react";

interface Im4ComposerProps {
  value: string;
  placeholder: string;
  hint: string;
  replyPreview?: { author: string; content: string } | null;
  quickReplies?: string[];
  sending?: boolean;
  inputRef?: Ref<HTMLTextAreaElement>;
  onChange: (value: string) => void;
  onSend: () => void;
  onAttach: () => void;
  onCancelReply?: () => void;
  onQuickReply?: (value: string) => void;
}

export function Im4Composer({
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
}: Im4ComposerProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!sending) onSend();
    }
  };

  return (
    <div className="im4-composer-shell">
      {replyPreview ? (
        <div className="im4-reply-preview">
          <div>
            <span>回复 {replyPreview.author}</span>
            <p>{replyPreview.content}</p>
          </div>
          {onCancelReply ? (
            <button type="button" onClick={onCancelReply} aria-label="取消回复" title="取消回复">
              <span className="material-symbols-outlined">close</span>
            </button>
          ) : null}
        </div>
      ) : null}
      {quickReplies.length > 0 ? (
        <div className="im4-quick-replies" aria-label="快捷回复">
          {quickReplies.map((item) => (
            <button key={item} type="button" onClick={() => onQuickReply?.(item)} disabled={sending}>
              {item}
            </button>
          ))}
        </div>
      ) : null}
      <div className="im4-composer">
        <button type="button" className="im4-compose-tool" onClick={onAttach} aria-label="添加附件" title="添加附件">
          <span className="material-symbols-outlined">add</span>
        </button>
        <div className="im4-compose-input">
          <textarea
            ref={inputRef}
            rows={1}
            value={value}
            placeholder={placeholder}
            disabled={sending}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div>
            <span>{hint}</span>
            <strong>{value.length}/1000</strong>
          </div>
        </div>
        <button type="button" className="im4-send-button" onClick={onSend} disabled={sending || !value.trim()}>
          <span className="material-symbols-outlined">{sending ? "sync" : "send"}</span>
        </button>
      </div>
    </div>
  );
}

export default Im4Composer;

