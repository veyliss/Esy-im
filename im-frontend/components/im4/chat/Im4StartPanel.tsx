import { Im4Button } from "../common";

interface Im4StartPanelProps {
  onOpenRecent?: () => void;
  onOpenContacts: () => void;
}

export function Im4StartPanel({ onOpenRecent, onOpenContacts }: Im4StartPanelProps) {
  return (
    <div className="im4-start-panel">
      <div>
        <span className="material-symbols-outlined">forum</span>
        <h2>选择会话开始聊天</h2>
        <p>会话列表会展示私聊、群聊、未读、草稿和置顶状态。聊天区专注消息流，不做后台页面。</p>
        <div>
          {onOpenRecent ? <Im4Button tone="primary" onClick={onOpenRecent}>打开最近会话</Im4Button> : null}
          <Im4Button onClick={onOpenContacts}>去通讯录</Im4Button>
        </div>
      </div>
    </div>
  );
}

export default Im4StartPanel;

