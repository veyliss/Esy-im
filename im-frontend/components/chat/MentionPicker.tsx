"use client";

import { useState, useMemo } from "react";
import { List, Input, Avatar, Typography, Button } from "antd";
import { UserOutlined } from "@ant-design/icons";
import type { GroupMember } from "@/lib/types/api";

interface MentionPickerProps {
  members: GroupMember[];
  onSelect: (userId: string, nickname: string) => void;
  onClose: () => void;
}

export function MentionPicker({ members, onSelect, onClose }: MentionPickerProps) {
  const [keyword, setKeyword] = useState("");

  const filtered = useMemo(() => {
    if (!keyword) return members;
    const lower = keyword.toLowerCase();
    return members.filter(
      (m) =>
        m.nickname?.toLowerCase().includes(lower) ||
        m.user_id.toLowerCase().includes(lower) ||
        m.user?.nickname?.toLowerCase().includes(lower)
    );
  }, [members, keyword]);

  return (
    <div className="im4-mention-picker" style={{
      position: "absolute",
      bottom: "100%",
      left: 48,
      width: 240,
      maxHeight: 240,
      overflowY: "auto",
      background: "#fff",
      border: "1px solid #d9d9d9",
      borderRadius: 8,
      boxShadow: "0 2px 8px rgba(0,0,0,.15)",
      zIndex: 10,
      padding: 8,
    }}>
      <Input
        size="small"
        placeholder="搜索成员..."
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        style={{ marginBottom: 8 }}
        autoFocus
      />
      <List
        size="small"
        dataSource={filtered.slice(0, 20)}
        renderItem={(m) => (
          <List.Item
            key={m.user_id}
            style={{ cursor: "pointer", padding: "4px 8px" }}
            onClick={() => {
              onSelect(m.user_id, m.nickname || m.user?.nickname || m.user_id);
              onClose();
            }}
          >
            <Avatar size="small" icon={<UserOutlined />} src={m.user?.avatar} />
            <Typography.Text style={{ marginLeft: 8 }}>
              {m.nickname || m.user?.nickname || m.user_id}
            </Typography.Text>
          </List.Item>
        )}
      />
      <Button size="small" type="text" onClick={onClose} style={{ marginTop: 4 }}>关闭</Button>
    </div>
  );
}
