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
      <div className="space-y-4">
        <ErrorAlert error={error} onClose={() => setError(null)} />

        <div>
          <label htmlFor="join-group-keyword" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
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
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch();
                }}
                placeholder="输入群组关键词或群号"
                className="h-11 w-full rounded-lg border border-slate-300 bg-background-light px-4 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
              {keyword ? (
                <button
                  type="button"
                  className="absolute right-3 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
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
              className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {searching ? "搜索中" : "搜索"}
            </button>
          </div>
        </div>

        {searching ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <span className="material-symbols-outlined mb-3 animate-spin text-4xl text-slate-300 dark:text-slate-600">sync</span>
            <p className="text-sm text-slate-500 dark:text-slate-400">正在搜索群聊</p>
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-3">
            {results.map((group) => (
              <div
                key={group.group_id}
                className="rounded-lg border border-blue-100 bg-blue-50/50 p-3 dark:border-blue-900/30 dark:bg-blue-950/20"
              >
                <div className="flex items-center gap-3">
                  <UserAvatar
                    src={group.avatar || "/default-group-avatar.png"}
                    name={group.name}
                    size="md"
                    shape="rounded"
                    border
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{group.name}</p>
                    <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                      {group.member_count} 人 · 群号 {group.group_id}
                    </p>
                    {group.description ? (
                      <p className="mt-1 line-clamp-2 text-xs text-slate-400 dark:text-slate-500">{group.description}</p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleJoin(group.group_id)}
                    disabled={Boolean(joiningId)}
                    className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {joiningId === group.group_id ? "加入中" : "加入"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : searched ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <span className="material-symbols-outlined mb-3 text-4xl text-slate-300 dark:text-slate-600">group_search</span>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">没有找到匹配群聊</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">请尝试更换关键词或输入完整群号</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <span className="material-symbols-outlined mb-3 text-4xl text-slate-300 dark:text-slate-600">manage_search</span>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">输入关键词后按 Enter 搜索</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">找到群聊后即可加入</p>
          </div>
        )}
      </div>
    </CommandDialog>
  );
}
