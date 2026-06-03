import type { KeyboardEvent, Ref } from "react";
import { Button, Input } from "antd";
import { CloseOutlined, PlusOutlined, SendOutlined, SyncOutlined } from "@ant-design/icons";
import type { TextAreaRef } from "antd/es/input/TextArea";

interface Im4ComposerProps {
  value: string;
  placeholder: string;
  hint: string;
  replyPreview?: { author: string; content: string } | null;
  quickReplies?: string[];
  sending?: boolean;
  inputRef?: Ref<TextAreaRef>;
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
            <Button
              aria-label="取消回复"
              icon={<CloseOutlined />}
              shape="circle"
              size="small"
              title="取消回复"
              type="text"
              onClick={onCancelReply}
            />
          ) : null}
        </div>
      ) : null}
      {quickReplies.length > 0 ? (
        <div className="im4-quick-replies" aria-label="快捷回复">
          {quickReplies.map((item) => (
            <Button key={item} size="small" onClick={() => onQuickReply?.(item)} disabled={sending}>
              {item}
            </Button>
          ))}
        </div>
      ) : null}
      <div className="im4-composer">
        <Button
          aria-label="添加附件"
          className="im4-compose-tool"
          icon={<PlusOutlined />}
          shape="circle"
          title="添加附件"
          type="text"
          onClick={onAttach}
        />
        <div className="im4-compose-input">
          <Input.TextArea
            ref={inputRef}
            rows={1}
            value={value}
            placeholder={placeholder}
            disabled={sending}
            autoSize={{ minRows: 1, maxRows: 5 }}
            variant="borderless"
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div>
            <span>{hint}</span>
            <strong>{value.length}/1000</strong>
          </div>
        </div>
        <Button
          className="im4-send-button"
          disabled={sending || !value.trim()}
          icon={sending ? <SyncOutlined /> : <SendOutlined />}
          loading={sending}
          shape="circle"
          type="primary"
          onClick={onSend}
        />
      </div>
    </div>
  );
}

export default Im4Composer;
