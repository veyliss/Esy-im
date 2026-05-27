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
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Dialog */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-fade-in-scale"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="join-group-title"
        >
          {/* Header */}
          <div className="p-6 pb-2">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-primary shrink-0">
                  <span className="material-symbols-outlined text-xl">group_add</span>
                </div>
                <div>
                  <h2 id="join-group-title" className="text-lg font-semibold text-slate-900 dark:text-white">加入群聊</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">搜索群号或关键词，找到后加入公开群聊</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex items-center justify-center w-8 h-8 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 transition-colors shrink-0"
                aria-label="关闭"
                title="关闭"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 pt-4 space-y-4">
            <ErrorAlert error={error} onClose={() => setError(null)} />

            {/* Search section */}
            <div>
              <label htmlFor="join-group-keyword" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                搜索群聊
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    ref={inputRef}
                    id="join-group-keyword"
                    type="text"
                    value={keyword}
                    onChange={(e) => handleKeywordChange(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                    placeholder="输入群组关键词或群号"
                    className="w-full h-11 rounded-lg border border-slate-300 dark:border-slate-700 bg-background-light dark:bg-slate-800 px-4 text-sm text-slate-900 dark:text-slate-200 placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/50 focus:outline-none transition-colors"
                  />
                  {keyword ? (
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 rounded-full text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
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
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
                >
                  {searching ? "搜索中" : "搜索"}
                </button>
              </div>
            </div>

            {/* Results / States */}
            {searching ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600 animate-spin mb-3">sync</span>
                <p className="text-sm text-slate-500 dark:text-slate-400">正在搜索群聊</p>
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-3">
                {results.map((group) => (
                  <div
                    key={group.group_id}
                    className="flex items-center gap-3 rounded-lg border border-blue-100 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-950/20 p-3"
                  >
                    <UserAvatar
                      src={group.avatar || "/default-group-avatar.png"}
                      name={group.name}
                      size="md"
                      shape="rounded"
                      border
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{group.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{group.member_count} 人 · 群号 {group.group_id}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleJoin(group.group_id)}
                      disabled={Boolean(joiningId)}
                      className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {joiningId === group.group_id ? "加入中" : "加入"}
                    </button>
                  </div>
                ))}
              </div>
            ) : searched ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600 mb-3">group_search</span>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">没有找到匹配群聊</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">请尝试更换关键词或输入完整群号</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600 mb-3">manage_search</span>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">输入关键词后按 Enter 搜索</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">找到群聊后即可加入</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
