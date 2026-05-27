"use client";

import { useEffect, useRef, useState } from "react";
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
  const [searched, setSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState(false);
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
          aria-labelledby="add-friend-title"
        >
          {/* Header */}
          <div className="p-6 pb-2">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-primary shrink-0">
                  <span className="material-symbols-outlined text-xl">person_add</span>
                </div>
                <div>
                  <h2 id="add-friend-title" className="text-lg font-semibold text-slate-900 dark:text-white">添加好友</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">通过账号、手机号或邮箱查找用户</p>
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
              <label htmlFor="add-friend-keyword" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                搜索用户
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    ref={inputRef}
                    id="add-friend-keyword"
                    type="text"
                    value={searchInput}
                    onChange={(e) => handleKeywordChange(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                    placeholder="输入用户账号、手机号或邮箱"
                    className="w-full h-11 rounded-lg border border-slate-300 dark:border-slate-700 bg-background-light dark:bg-slate-800 px-4 text-sm text-slate-900 dark:text-slate-200 placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/50 focus:outline-none transition-colors"
                  />
                  {searchInput ? (
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
                <p className="text-sm text-slate-500 dark:text-slate-400">正在查找用户</p>
              </div>
            ) : searchResult ? (
              <div className="flex items-center gap-3 rounded-lg border border-blue-100 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-950/20 p-3">
                <UserAvatar
                  src={searchResult.avatar}
                  name={searchResult.nickname}
                  size="lg"
                  border
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{searchResult.nickname || "未设置昵称"}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">用户 ID：{searchResult.user_id}</p>
                </div>
                <button
                  type="button"
                  onClick={handleSendRequest}
                  disabled={sending}
                  className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {sending ? "发送中" : "发送申请"}
                </button>
              </div>
            ) : searched ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600 mb-3">person_search</span>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">没有找到匹配用户</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">请检查账号、手机号或邮箱是否正确</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600 mb-3">manage_search</span>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">输入关键词后按 Enter 搜索</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">找到用户后即可发送好友申请</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
