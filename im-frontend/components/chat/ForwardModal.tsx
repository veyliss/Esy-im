"use client";

import { useState, useMemo } from "react";
import { Modal, Checkbox, Input, Typography, Avatar, Empty } from "antd";
import { TeamOutlined, UserOutlined } from "@ant-design/icons";
import type { Conversation, Group, User, ForwardTarget, GroupMessage, Message } from "@/lib/types/api";

interface ForwardModalProps {
  message: Message | GroupMessage;
  conversations: Conversation[];
  groups: Group[];
  currentUser: User | null;
  onSubmit: (targets: ForwardTarget[]) => void;
  onClose: () => void;
}

export function ForwardModal({ message, conversations, groups, currentUser, onSubmit, onClose }: ForwardModalProps) {
  const [keyword, setKeyword] = useState("");
  const [selectedConversations, setSelectedConversations] = useState<number[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const filteredConversations = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return conversations;
    return conversations.filter((conv) => {
      const opponent = conv.user1_id === currentUser?.user_id ? conv.user2 : conv.user1;
      const name = opponent?.nickname || `用户${opponent?.user_id}`;
      return name.toLowerCase().includes(kw);
    });
  }, [conversations, keyword, currentUser]);

  const filteredGroups = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return groups;
    return groups.filter((g) => g.name.toLowerCase().includes(kw));
  }, [groups, keyword]);

  const toggleConversation = (id: number) => {
    setSelectedConversations((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleGroup = (groupId: string) => {
    setSelectedGroups((prev) =>
      prev.includes(groupId) ? prev.filter((x) => x !== groupId) : [...prev, groupId]
    );
  };

  const handleSubmit = async () => {
    const targets: ForwardTarget[] = [];
    selectedConversations.forEach((id) => targets.push({ conversation_id: id }));
    selectedGroups.forEach((id) => targets.push({ group_id: id }));
    if (targets.length === 0) return;

    setSubmitting(true);
    try {
      await onSubmit(targets);
    } finally {
      setSubmitting(false);
    }
  };

  const totalSelected = selectedConversations.length + selectedGroups.length;
  const getConvName = (conv: Conversation) => {
    const opponent = conv.user1_id === currentUser?.user_id ? conv.user2 : conv.user1;
    return opponent?.nickname || `用户${opponent?.user_id}`;
  };

  return (
    <Modal
      title="转发消息"
      open
      onCancel={onClose}
      onOk={handleSubmit}
      okText={`转发 (${totalSelected})`}
      okButtonProps={{ disabled: totalSelected === 0, loading: submitting }}
      cancelText="取消"
      width={480}
    >
      <div className="mb-3">
        <Typography.Paragraph type="secondary" className="mb-2">
          选择转发目标会话：
        </Typography.Paragraph>
        <div className="rounded-lg bg-gray-50 p-3 mb-3 border">
          <Typography.Text type="secondary" className="text-xs">
            {message.content.slice(0, 100)}{message.content.length > 100 ? "..." : ""}
          </Typography.Text>
        </div>
        <Input
          placeholder="搜索会话..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          allowClear
        />
      </div>

      <div className="max-h-[400px] overflow-y-auto">
        {filteredConversations.length > 0 && (
          <div className="mb-3">
            <Typography.Text type="secondary" className="text-xs font-medium uppercase tracking-wide">
              私聊 · {filteredConversations.length}
            </Typography.Text>
            {filteredConversations.map((conv) => (
              <div
                key={conv.id}
                className="flex items-center gap-2 py-2 px-1 cursor-pointer hover:bg-gray-50 rounded"
                onClick={() => toggleConversation(conv.id)}
              >
                <Checkbox checked={selectedConversations.includes(conv.id)} />
                <Avatar size="small" icon={<UserOutlined />} src={conv.user1_id === currentUser?.user_id ? conv.user2?.avatar : conv.user1?.avatar} />
                <span className="text-sm">{getConvName(conv)}</span>
              </div>
            ))}
          </div>
        )}

        {filteredGroups.length > 0 && (
          <div>
            <Typography.Text type="secondary" className="text-xs font-medium uppercase tracking-wide">
              群聊 · {filteredGroups.length}
            </Typography.Text>
            {filteredGroups.map((group) => (
              <div
                key={group.group_id}
                className="flex items-center gap-2 py-2 px-1 cursor-pointer hover:bg-gray-50 rounded"
                onClick={() => toggleGroup(group.group_id)}
              >
                <Checkbox checked={selectedGroups.includes(group.group_id)} />
                <Avatar size="small" icon={<TeamOutlined />} src={group.avatar} shape="square" />
                <span className="text-sm">{group.name}</span>
              </div>
            ))}
          </div>
        )}

        {filteredConversations.length === 0 && filteredGroups.length === 0 && (
          <Empty description="未找到匹配的会话" />
        )}
      </div>
    </Modal>
  );
}
