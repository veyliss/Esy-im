"use client";

import { useState } from "react";
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

  const handleSearch = async () => {
    if (!keyword.trim()) {
      setResults([]);
      return;
    }
    try {
      setError(null);
      const res = await GroupAPI.searchGroups(keyword.trim());
      if (res.data.code === 0) {
        setResults(res.data.data);
      }
    } catch (e) {
      const apiError = handleApiError(e);
      setError(createUserFriendlyErrorMessage(apiError));
    }
  };

  const handleJoin = async (groupId: string) => {
    try {
      setError(null);
      const res = await GroupAPI.joinGroup({ group_id: groupId });
      if (res.data.code === 0) {
        onSuccess();
      }
    } catch (e) {
      const apiError = handleApiError(e);
      setError(createUserFriendlyErrorMessage(apiError));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-2xl dark:bg-slate-900">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined rounded-full bg-primary/10 p-2 text-primary">group_add</span>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">搜索并加入群聊</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <ErrorAlert error={error} onClose={() => setError(null)} className="mb-4" />

        <div className="mb-4 flex gap-2">
          <div className="relative flex-1">
            <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              search
            </span>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
              placeholder="输入群组关键词或群号"
              className="w-full rounded-lg border border-slate-300 bg-slate-50 py-2 pl-10 pr-3 text-sm focus:border-primary focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
          <button
            onClick={handleSearch}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
          >
            搜索
          </button>
        </div>

        <div className="max-h-80 space-y-2 overflow-y-auto">
          {results.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-400">输入关键词后搜索群聊</p>
          ) : (
            results.map((group) => (
              <div
                key={group.group_id}
                className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <UserAvatar
                  src={group.avatar || "/default-group-avatar.png"}
                  name={group.name}
                  size="md"
                  shape="rounded"
                  border
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{group.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{group.member_count} 人 · 群号 {group.group_id}</p>
                </div>
                <button
                  onClick={() => handleJoin(group.group_id)}
                  className="rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-white hover:bg-primary/90"
                >
                  加入
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
