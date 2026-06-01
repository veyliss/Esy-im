"use client";

import { useEffect, useRef, useState } from "react";
import { GroupAPI } from "@/lib/api/group";
import { handleApiError, createUserFriendlyErrorMessage } from "@/lib/utils/errors";
import type { Group } from "@/lib/types/api";
import { UserAvatar } from "@/components/ui/user-avatar";
import { ErrorAlert } from "@/components/ui/error-alert";
import { CommandDialog } from "@/components/ui/command-dialog";
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
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useAppInteractions();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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
    <CommandDialog
      title="加入群聊"
      description="搜索群号或关键词，找到后加入公开群聊"
      icon="group_add"
      labelledBy="join-group-title"
      onClose={onClose}
    >
      <div className="command-flow">
        <ErrorAlert error={error} type="warning" onClose={() => setError(null)} className="command-inline-alert" />

        <div className="command-field">
          <label htmlFor="join-group-keyword">
            搜索群聊
          </label>
          <div className="command-search-row">
            <div className="command-input-wrap">
              <input
                ref={inputRef}
                id="join-group-keyword"
                type="text"
                value={keyword}
                onChange={(e) => handleKeywordChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch();
                }}
                placeholder="输入群组关键词或群号"
                className="command-input"
              />
              {keyword ? (
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

        {searching ? (
          <div className="command-state">
            <span className="material-symbols-outlined command-state-icon is-spinning">sync</span>
            <p>正在搜索群聊</p>
          </div>
        ) : results.length > 0 ? (
          <div className="command-result-list">
            {results.map((group) => (
              <div
                key={group.group_id}
                className="command-result-card"
              >
                <div className="command-result-row">
                  <UserAvatar
                    src={group.avatar || "/default-group-avatar.png"}
                    name={group.name}
                    size="md"
                    shape="rounded"
                    border
                  />
                  <div className="command-result-copy">
                    <p>{group.name}</p>
                    <small>
                      {group.member_count} 人 · 群号 {group.group_id}
                    </small>
                    {group.description ? (
                      <small>{group.description}</small>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleJoin(group.group_id)}
                    disabled={Boolean(joiningId)}
                    className="im-primary-button command-result-action"
                  >
                    {joiningId === group.group_id ? "加入中" : "加入"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : searched ? (
          <div className="command-state">
            <span className="material-symbols-outlined command-state-icon">group_search</span>
            <p>没有找到匹配群聊</p>
            <small>请尝试更换关键词或输入完整群号</small>
          </div>
        ) : (
          <div className="command-state">
            <span className="material-symbols-outlined command-state-icon">manage_search</span>
            <p>输入关键词后按 Enter 搜索</p>
            <small>找到群聊后即可加入</small>
          </div>
        )}
      </div>
    </CommandDialog>
  );
}
