import type { KeyboardEvent, Ref } from "react";

interface ChatComposerProps {
  value: string;
  placeholder: string;
  hint: string;
  sending?: boolean;
  inputRef?: Ref<HTMLTextAreaElement>;
  onChange: (value: string) => void;
  onSend: () => void;
  onAttach: () => void;
}

export function ChatComposer({
  value,
  placeholder,
  hint,
  sending = false,
  inputRef,
  onChange,
  onSend,
  onAttach,
}: ChatComposerProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!sending) onSend();
    }
  };

  return (
    <div className="chat-composer-shell">
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
