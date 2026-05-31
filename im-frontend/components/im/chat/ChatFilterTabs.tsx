interface ChatFilterTabsProps<T extends string> {
  active: T;
  items: Array<{
    key: T;
    label: string;
    count: number;
  }>;
  onChange: (key: T) => void;
}

export function ChatFilterTabs<T extends string>({ active, items, onChange }: ChatFilterTabsProps<T>) {
  return (
    <div className="chat-filter-row" role="tablist" aria-label="会话筛选">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          role="tab"
          aria-selected={active === item.key}
          className={`chat-filter-chip ${active === item.key ? "is-active" : ""}`}
          onClick={() => onChange(item.key)}
        >
          <span>{item.label}</span>
          <strong>{item.count}</strong>
        </button>
      ))}
    </div>
  );
}

export default ChatFilterTabs;
