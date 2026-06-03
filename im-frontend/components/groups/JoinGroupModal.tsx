"use client";

import { Alert, Button, Empty, Input, List, Modal, Space, Spin } from "antd";
import { useState } from "react";
import { GroupAPI } from "@/lib/api/group";
import { handleApiError, createUserFriendlyErrorMessage } from "@/lib/utils/errors";
import type { Group } from "@/lib/types/api";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useAppInteractions } from "@/components/ui/app-interactions";

export function JoinGroupModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<Group[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const { toast } = useAppInteractions();

  const handleKeywordChange = (value: string) => {
    setKeyword(value);
    setResults([]);
    setSearched(false);
    setError(null);
  };

  const handleSearch = async () => {
    if (searching) return;

    const query = keyword.trim();
    if (!query) {
      setResults([]);
      setError("请输入群组关键词或群号");
      return;
    }

    try {
      setError(null);
      setSearching(true);
      setSearched(true);
      const res = await GroupAPI.searchGroups(query);
      if (res.data.code === 0) {
        setResults(res.data.data);
      }
    } catch (e) {
      const apiError = handleApiError(e);
      setError(createUserFriendlyErrorMessage(apiError));
    } finally {
      setSearching(false);
    }
  };

  const handleJoin = async (groupId: string) => {
    if (joiningId) return;
    try {
      setError(null);
      setJoiningId(groupId);
      const res = await GroupAPI.joinGroup({ group_id: groupId });
      if (res.data.code === 0) {
        toast(`已加入 ${res.data.data?.name || "群聊"}`, { tone: "success" });
        onSuccess();
      }
    } catch (e) {
      const apiError = handleApiError(e);
      setError(createUserFriendlyErrorMessage(apiError));
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <Modal
      className="ant-app-modal"
      footer={null}
      open
      title="加入群聊"
      width={620}
      onCancel={onClose}
    >
      <div className="ant-app-modal-stack">
        {error ? <Alert closable message={error} showIcon type="warning" onClose={() => setError(null)} /> : null}

        <Space.Compact className="w-full">
          <Input
            autoFocus
            placeholder="输入群组关键词或群号"
            size="large"
            value={keyword}
            onChange={(event) => handleKeywordChange(event.target.value)}
            onPressEnter={handleSearch}
          />
          <Button loading={searching} size="large" type="primary" onClick={handleSearch}>
            搜索
          </Button>
        </Space.Compact>

        {searching ? (
          <div className="ant-app-modal-state">
            <Spin />
            <span>正在搜索群聊</span>
          </div>
        ) : results.length > 0 ? (
          <List
            className="ant-app-result-list"
            dataSource={results}
            renderItem={(group) => (
              <List.Item
                actions={[
                  <Button
                    key="join"
                    disabled={Boolean(joiningId)}
                    loading={joiningId === group.group_id}
                    type="primary"
                    onClick={() => handleJoin(group.group_id)}
                  >
                    加入
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <UserAvatar
                      src={group.avatar || "/default-group-avatar.png"}
                      name={group.name}
                      size="md"
                      shape="rounded"
                      border
                    />
                  }
                  description={
                    <span className="ant-app-list-description">
                      <span>{group.member_count} 人 · 群号 {group.group_id}</span>
                      {group.description ? <small>{group.description}</small> : null}
                    </span>
                  }
                  title={group.name}
                />
              </List.Item>
            )}
          />
        ) : searched ? (
          <Empty description="没有找到匹配群聊" />
        ) : (
          <Empty description="输入关键词后按 Enter 搜索" />
        )}
      </div>
    </Modal>
  );
}
