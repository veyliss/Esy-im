"use client";

import { Alert, Button, Empty, Input, Modal, Space, Spin, Tag } from "antd";
import { useState } from "react";
import { FriendAPI } from "@/lib/api/friend";
import { handleApiError, createUserFriendlyErrorMessage } from "@/lib/utils/errors";
import type { FriendRelationshipStatus, FriendSearchResult } from "@/lib/types/api";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useAppInteractions } from "@/components/ui/app-interactions";

const relationshipCopy: Record<FriendRelationshipStatus, { label: string; action: string; disabled: boolean; color: string }> = {
  self: { label: "这是你自己", action: "不能添加", disabled: true, color: "default" },
  friend: { label: "已是好友", action: "已添加", disabled: true, color: "success" },
  pending_sent: { label: "申请待处理", action: "已发送", disabled: true, color: "processing" },
  pending_received: { label: "对方已申请你", action: "去新的朋友处理", disabled: true, color: "warning" },
  none: { label: "可添加", action: "发送申请", disabled: false, color: "blue" },
};

export function AddFriendModal({
  onClose,
  onSuccess,
  currentUserNickname,
}: {
  onClose: () => void;
  onSuccess: () => void;
  currentUserNickname?: string;
}) {
  const [searchInput, setSearchInput] = useState("");
  const [searchResult, setSearchResult] = useState<FriendSearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState(false);
  const { toast } = useAppInteractions();

  const handleKeywordChange = (value: string) => {
    setSearchInput(value);
    setSearchResult(null);
    setSearched(false);
    setError(null);
  };

  const handleSearch = async () => {
    if (searching) return;

    const keyword = searchInput.trim();
    if (!keyword) {
      setError("请输入用户账号、手机号或邮箱");
      return;
    }

    try {
      setError(null);
      setSearching(true);
      setSearched(true);
      const res = await FriendAPI.searchFriend(keyword);
      if (res.data.code === 0) {
        setSearchResult(res.data.data || null);
      }
    } catch (e) {
      const apiError = handleApiError(e);
      setError(createUserFriendlyErrorMessage(apiError));
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async () => {
    if (!searchResult || sending) return;
    try {
      setError(null);
      setSending(true);
      const res = await FriendAPI.sendRequest({
        to_user_id: searchResult.user_id,
        message: "我是 " + (currentUserNickname || "用户"),
      });
      if (res.data.code === 0) {
        toast("好友申请已发送", { tone: "success" });
        onSuccess();
      }
    } catch (e) {
      const apiError = handleApiError(e);
      setError(createUserFriendlyErrorMessage(apiError));
    } finally {
      setSending(false);
    }
  };

  const relation = searchResult ? relationshipCopy[searchResult.relationship_status] : null;

  return (
    <Modal
      className="ant-app-modal"
      footer={null}
      open
      title="添加好友"
      width={560}
      onCancel={onClose}
    >
      <div className="ant-app-modal-stack">
        {error ? <Alert closable message={error} showIcon type="warning" onClose={() => setError(null)} /> : null}

        <Space.Compact className="w-full">
          <Input
            autoFocus
            placeholder="输入用户账号、手机号或邮箱"
            size="large"
            value={searchInput}
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
            <span>正在查找用户</span>
          </div>
        ) : searchResult && relation ? (
          <div className="ant-app-result">
            <UserAvatar src={searchResult.avatar} name={searchResult.nickname} size="lg" border />
            <div className="ant-app-result-main">
              <div className="ant-app-result-title">
                <strong>{searchResult.nickname || "未设置昵称"}</strong>
                <Tag color={relation.color}>{relation.label}</Tag>
              </div>
              <span>用户 ID：{searchResult.user_id}</span>
              {searchResult.email ? <span>{searchResult.email}</span> : null}
              {searchResult.relationship_status === "pending_received" ? (
                <small>对方已经向你发送好友申请，可以在“新的朋友”里处理。</small>
              ) : null}
            </div>
            <Button
              disabled={sending || relation.disabled}
              loading={sending}
              type="primary"
              onClick={handleSendRequest}
            >
              {relation.action}
            </Button>
          </div>
        ) : searched ? (
          <Empty description="没有找到匹配用户" />
        ) : (
          <Empty description="输入关键词后按 Enter 搜索" />
        )}
      </div>
    </Modal>
  );
}
