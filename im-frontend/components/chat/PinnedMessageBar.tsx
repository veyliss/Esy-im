"use client";

import { Typography, Button, Space } from "antd";
import { PushpinOutlined, CloseOutlined } from "@ant-design/icons";
import type { GroupPinnedMessage } from "@/lib/types/api";

interface PinnedMessageBarProps {
  pinnedMessages: GroupPinnedMessage[];
  onDismiss?: () => void;
}

export function PinnedMessageBar({ pinnedMessages, onDismiss }: PinnedMessageBarProps) {
  if (!pinnedMessages.length) return null;

  const latest = pinnedMessages[0];

  return (
    <div className="im4-pinned-bar" style={{
      padding: "6px 16px",
      background: "#fffbe6",
      borderBottom: "1px solid #ffe58f",
      display: "flex",
      alignItems: "center",
      gap: 8,
      fontSize: 13,
    }}>
      <PushpinOutlined style={{ color: "#d48806" }} />
      <Typography.Text ellipsis style={{ flex: 1 }}>
        {pinnedMessages.length > 1
          ? `${pinnedMessages.length} 条置顶消息`
          : `置顶: ${latest.content || "[媒体消息]"}`}
      </Typography.Text>
      {onDismiss ? (
        <Button size="small" type="text" icon={<CloseOutlined />} onClick={onDismiss} />
      ) : null}
    </div>
  );
}
