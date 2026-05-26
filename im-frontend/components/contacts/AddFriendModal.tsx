"use client";

import { useState } from "react";
import { FriendAPI } from "@/lib/api/friend";
import { handleApiError, createUserFriendlyErrorMessage } from "@/lib/utils/errors";
import type { User } from "@/lib/types/api";
import { UserAvatar } from "@/components/ui/user-avatar";
import { ErrorAlert } from "@/components/ui/error-alert";

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
  const [searchResult, setSearchResult] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchInput.trim()) return;
    try {
      setError(null);
      const res = await FriendAPI.searchFriend(searchInput.trim());
      if (res.data.code === 0) {
        setSearchResult(res.data.data);
      }
    } catch (e) {
      const apiError = handleApiError(e);
      setError(createUserFriendlyErrorMessage(apiError));
    }
  };

  const handleSendRequest = async () => {
    if (!searchResult) return;
    try {
      setError(null);
      const res = await FriendAPI.sendRequest({
        to_user_id: searchResult.user_id,
        message: "我是 " + (currentUserNickname || "用户"),
      });
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
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-2xl dark:bg-slate-900">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined rounded-full bg-primary/10 p-2 text-primary">person_add</span>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">添加好友</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <ErrorAlert error={error} onClose={() => setError(null)} className="mb-4" />

        <div className="mb-6 space-y-2">
          <label className="text-sm font-medium text-slate-600 dark:text-slate-400">搜索用户</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                search
              </span>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                placeholder="输入用户ID或手机号"
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
        </div>

        {searchResult ? (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 dark:bg-primary/10">
            <div className="flex items-center gap-4">
              <UserAvatar
                src={searchResult.avatar}
                name={searchResult.nickname}
                size="lg"
                border
              />
              <div className="min-w-0 flex-1">
                <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">{searchResult.nickname}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">ID: {searchResult.user_id}</p>
              </div>
              <button
                onClick={handleSendRequest}
                className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white"
              >
                添加
              </button>
            </div>
          </div>
        ) : searchInput ? (
          <p className="py-6 text-center text-sm text-slate-400">点击搜索按钮查找用户</p>
        ) : (
          <p className="py-6 text-center text-sm text-slate-400">输入信息开始搜索</p>
        )}
      </div>
    </div>
  );
}
