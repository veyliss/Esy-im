"use client";

import { useEffect, useRef, useState } from "react";
import { GroupAPI } from "@/lib/api/group";
import { handleApiError, createUserFriendlyErrorMessage } from "@/lib/utils/errors";
import type { Group } from "@/lib/types/api";
import { UserAvatar } from "@/components/ui/user-avatar";
import { ErrorAlert } from "@/components/ui/error-alert";

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

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

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
    <div className="contact-command-overlay" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <div className="contact-command-dialog contact-command-dialog-wide" role="dialog" aria-modal="true" aria-labelledby="join-group-title">
        <div className="contact-command-head">
          <div className="contact-command-title">
            <span className="contact-command-icon">
              <span className="material-symbols-outlined text-xl">group_add</span>
            </span>
            <span>
              <h2 id="join-group-title">加入群聊</h2>
              <p>搜索群号或关键词，找到后加入公开群聊</p>
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="contact-command-close"
            aria-label="关闭"
            title="关闭"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <ErrorAlert error={error} onClose={() => setError(null)} className="mb-4" />

        <div className="contact-command-search">
          <label htmlFor="join-group-keyword">搜索群聊</label>
          <div className="contact-command-search-row">
            <div className="contact-command-input-wrap">
              <span className="contact-command-search-icon" aria-hidden="true" />
              <input
                ref={inputRef}
                id="join-group-keyword"
                type="text"
                value={keyword}
                onChange={(e) => handleKeywordChange(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                placeholder="输入群组关键词或群号"
                className="contact-command-input"
              />
              {keyword ? (
                <button
                  type="button"
                  className="contact-command-clear"
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
              className="contact-command-primary"
            >
              {searching ? "搜索中" : "搜索"}
            </button>
          </div>
        </div>

        <div className="contact-command-body">
          {searching ? (
            <div className="contact-command-empty">
              <span className="material-symbols-outlined contact-command-spinner">sync</span>
              <p>正在搜索群聊</p>
            </div>
          ) : results.length > 0 ? (
            <div className="contact-command-result-list">
              {results.map((group) => (
                <div
                  key={group.group_id}
                  className="contact-command-result"
                >
                  <UserAvatar
                    src={group.avatar || "/default-group-avatar.png"}
                    name={group.name}
                    size="md"
                    shape="rounded"
                    border
                  />
                  <div className="contact-command-result-main">
                    <strong>{group.name}</strong>
                    <span>{group.member_count} 人 · 群号 {group.group_id}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleJoin(group.group_id)}
                    disabled={Boolean(joiningId)}
                    className="contact-command-submit"
                  >
                    {joiningId === group.group_id ? "加入中" : "加入"}
                  </button>
                </div>
              ))}
            </div>
          ) : searched ? (
            <div className="contact-command-empty">
              <span className="material-symbols-outlined">group_search</span>
              <p>没有找到匹配群聊</p>
              <small>请尝试更换关键词或输入完整群号</small>
            </div>
          ) : (
            <div className="contact-command-empty">
              <span className="material-symbols-outlined">manage_search</span>
              <p>输入关键词后按 Enter 搜索</p>
              <small>找到群聊后即可加入</small>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
