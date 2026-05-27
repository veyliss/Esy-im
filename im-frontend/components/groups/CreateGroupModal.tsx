"use client";

import { useEffect, useRef, useState } from "react";
import { GroupAPI } from "@/lib/api/group";
import { handleApiError, createUserFriendlyErrorMessage } from "@/lib/utils/errors";
import { ErrorAlert } from "@/components/ui/error-alert";

export function CreateGroupModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    avatar: "",
    max_members: 500,
    is_public: true,
    join_approval: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!formData.name.trim()) {
      setError("群组名称不能为空");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await GroupAPI.createGroup(formData);
      if (res.data.code === 0) {
        onSuccess();
      }
    } catch (error) {
      console.error("创建群组失败:", error);
      const apiError = handleApiError(error);
      setError(createUserFriendlyErrorMessage(apiError));
    } finally {
      setLoading(false);
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
          aria-labelledby="create-group-title"
        >
          {/* Header */}
          <div className="p-6 pb-2">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-primary shrink-0">
                  <span className="material-symbols-outlined text-xl">add</span>
                </div>
                <div>
                  <h2 id="create-group-title" className="text-lg font-semibold text-slate-900 dark:text-white">创建群聊</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">设置群名称、成员上限和加入方式</p>
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
          <form onSubmit={handleSubmit}>
            <div className="p-6 pt-4 space-y-4">
              <ErrorAlert error={error} onClose={() => setError(null)} />

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="create-group-name">
                  群组名称 *
                </label>
                <input
                  ref={nameInputRef}
                  id="create-group-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="ui-input w-full rounded-lg px-3 py-2"
                  placeholder="请输入群组名称"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="create-group-description">
                  群组描述
                </label>
                <textarea
                  id="create-group-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="ui-textarea w-full rounded-lg px-3 py-2"
                  placeholder="请输入群组描述"
                  rows={3}
                  maxLength={500}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="create-group-max-members">
                  最大成员数
                </label>
                <input
                  id="create-group-max-members"
                  type="number"
                  value={formData.max_members}
                  onChange={(e) => setFormData({ ...formData, max_members: parseInt(e.target.value) || 500 })}
                  className="ui-input w-full rounded-lg px-3 py-2"
                  min={2}
                  max={2000}
                />
              </div>

              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_public}
                    onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                    className="mt-0.5 h-4 w-4 accent-primary shrink-0"
                  />
                  <span>
                    <strong className="text-sm font-semibold text-slate-900 dark:text-white">公开群聊</strong>
                    <small className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">允许其他用户搜索到该群</small>
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.join_approval}
                    onChange={(e) => setFormData({ ...formData, join_approval: e.target.checked })}
                    className="mt-0.5 h-4 w-4 accent-primary shrink-0"
                  />
                  <span>
                    <strong className="text-sm font-semibold text-slate-900 dark:text-white">加入审批</strong>
                    <small className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">新成员需要通过审批</small>
                  </span>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 pt-0 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg bg-slate-200 dark:bg-slate-800 px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "创建中" : "创建群聊"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
