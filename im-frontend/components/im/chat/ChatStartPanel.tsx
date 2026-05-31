interface ChatStartPanelProps {
  onOpenRecent?: () => void;
  onOpenContacts: () => void;
}

export function ChatStartPanel({ onOpenRecent, onOpenContacts }: ChatStartPanelProps) {
  return (
    <div className="workspace-empty-wrap">
      <div className="chat-start-panel">
        <span className="material-symbols-outlined">chat</span>
        <h2>选择一个聊天开始交流</h2>
        <p>会话、群聊和未读消息都在左侧统一管理，进入后可以继续查看资料和发送消息。</p>
        <div className="chat-start-actions">
          {onOpenRecent ? (
            <button type="button" onClick={onOpenRecent}>
              打开最近会话
            </button>
          ) : null}
          <button type="button" className="is-secondary" onClick={onOpenContacts}>
            去通讯录
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatStartPanel;
