"use client";

import { useEffect, useRef, useState } from "react";
import { GroupAPI } from "@/lib/api/group";
import { handleApiError, createUserFriendlyErrorMessage } from "@/lib/utils/errors";
import { ErrorAlert } from "@/components/ui/error-alert";
import { CommandDialog } from "@/components/ui/command-dialog";
import { useAppInteractions } from "@/components/ui/app-interactions";

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
  const { toast } = useAppInteractions();

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

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
        toast("群聊已创建", { tone: "success" });
        onSuccess();
      }
    } catch (error) {
      const apiError = handleApiError(error);
      setError(createUserFriendlyErrorMessage(apiError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <CommandDialog
      title="创建群聊"
      description="设置群名称、成员上限和加入方式"
      icon="add"
      labelledBy="create-group-title"
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="im-secondary-button"
          >
            取消
          </button>
          <button
            type="submit"
            form="create-group-form"
            disabled={loading}
            className="im-primary-button"
          >
            {loading ? "创建中" : "创建群聊"}
          </button>
        </>
      }
    >
      <form id="create-group-form" onSubmit={handleSubmit} className="space-y-4">
        <ErrorAlert error={error} onClose={() => setError(null)} />

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="create-group-name">
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
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="create-group-description">
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
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="create-group-max-members">
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

        <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/40">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={formData.is_public}
              onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
              className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
            />
            <span>
              <strong className="text-sm font-semibold text-slate-900 dark:text-white">公开群聊</strong>
              <small className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">允许其他用户搜索到该群</small>
            </span>
          </label>

          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={formData.join_approval}
              onChange={(e) => setFormData({ ...formData, join_approval: e.target.checked })}
              className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
            />
            <span>
              <strong className="text-sm font-semibold text-slate-900 dark:text-white">加入审批</strong>
              <small className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">新成员需要通过审批</small>
            </span>
          </label>
        </div>
      </form>
    </CommandDialog>
  );
}
