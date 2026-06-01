"use client";

import { useEffect, useRef, useState } from "react";
import { FriendAPI } from "@/lib/api/friend";
import { handleApiError, createUserFriendlyErrorMessage } from "@/lib/utils/errors";
import type { FriendRelationshipStatus, FriendSearchResult } from "@/lib/types/api";
import { UserAvatar } from "@/components/ui/user-avatar";
import { ErrorAlert } from "@/components/ui/error-alert";
import { CommandDialog } from "@/components/ui/command-dialog";
import { useAppInteractions } from "@/components/ui/app-interactions";

const relationshipCopy: Record<FriendRelationshipStatus, { label: string; action: string; disabled: boolean }> = {
  self: { label: "这是你自己", action: "不能添加", disabled: true },
  friend: { label: "已是好友", action: "已添加", disabled: true },
  pending_sent: { label: "申请待处理", action: "已发送", disabled: true },
  pending_received: { label: "对方已申请你", action: "去新的朋友处理", disabled: true },
  none: { label: "可添加", action: "发送申请", disabled: false },
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
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useAppInteractions();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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

  return (
    <CommandDialog
      title="添加好友"
      description="通过账号、手机号或邮箱查找用户"
      icon="person_add"
      labelledBy="add-friend-title"
      onClose={onClose}
    >
          <div className="command-flow">
            <ErrorAlert error={error} type="warning" onClose={() => setError(null)} className="command-inline-alert" />

            {/* Search section */}
            <div className="command-field">
              <label htmlFor="add-friend-keyword">
                搜索用户
              </label>
              <div className="command-search-row">
                <div className="command-input-wrap">
                  <input
                    ref={inputRef}
                    id="add-friend-keyword"
                    type="text"
                    value={searchInput}
                    onChange={(e) => handleKeywordChange(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                    placeholder="输入用户账号、手机号或邮箱"
                    className="command-input"
                  />
                  {searchInput ? (
                    <button
                      type="button"
                      className="command-clear-button"
                      onClick={() => handleKeywordChange("")}
                      aria-label="清空搜索"
                      title="清空搜索"
                    >
                      <span className="material-symbols-outlined text-base">close</span>
                    </button>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={handleSearch}
                  disabled={searching}
                  className="im-primary-button shrink-0"
                >
                  {searching ? "搜索中" : "搜索"}
                </button>
              </div>
            </div>

            {/* Results / States */}
            {searching ? (
              <div className="command-state">
                <span className="material-symbols-outlined command-state-icon is-spinning">sync</span>
                <p>正在查找用户</p>
              </div>
            ) : searchResult ? (
              <div className="command-result-card">
                <div className="command-result-row">
                  <UserAvatar
                    src={searchResult.avatar}
                    name={searchResult.nickname}
                    size="lg"
                    border
                  />
                  <div className="command-result-copy">
                    <div>
                      <p>{searchResult.nickname || "未设置昵称"}</p>
                      <span className="command-pill">
                        {relationshipCopy[searchResult.relationship_status].label}
                      </span>
                    </div>
                    <small>用户 ID：{searchResult.user_id}</small>
                    {searchResult.email ? (
                      <small>{searchResult.email}</small>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={handleSendRequest}
                    disabled={sending || relationshipCopy[searchResult.relationship_status].disabled}
                    className="im-primary-button command-result-action"
                  >
                    {sending ? "发送中" : relationshipCopy[searchResult.relationship_status].action}
                  </button>
                </div>
                {searchResult.relationship_status === "pending_received" ? (
                  <p className="command-note">
                    对方已经向你发送好友申请，可以在“新的朋友”里处理。
                  </p>
                ) : null}
              </div>
            ) : searched ? (
              <div className="command-state">
                <span className="material-symbols-outlined command-state-icon">person_search</span>
                <p>没有找到匹配用户</p>
                <small>请检查账号、手机号或邮箱是否正确</small>
              </div>
            ) : (
              <div className="command-state">
                <span className="material-symbols-outlined command-state-icon">manage_search</span>
                <p>输入关键词后按 Enter 搜索</p>
                <small>找到用户后即可发送好友申请</small>
              </div>
            )}
          </div>
    </CommandDialog>
  );
}
