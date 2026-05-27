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
    <div className="contact-command-overlay" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <div className="contact-command-dialog contact-command-dialog-wide" role="dialog" aria-modal="true" aria-labelledby="create-group-title">
        <div className="contact-command-head">
          <div className="contact-command-title">
            <span className="contact-command-icon">
              <span className="material-symbols-outlined text-xl">add</span>
            </span>
            <span>
              <h2 id="create-group-title">创建群聊</h2>
              <p>设置群名称、成员上限和加入方式</p>
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

        <form onSubmit={handleSubmit} className="contact-command-form">
          <div>
            <label className="contact-command-field-label" htmlFor="create-group-name">
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
            <label className="contact-command-field-label" htmlFor="create-group-description">
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

          <div className="grid gap-4 sm:grid-cols-[1fr_1fr]">
            <div>
              <label className="contact-command-field-label" htmlFor="create-group-max-members">
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
          </div>

          <div className="contact-command-option-grid">
            <label className="contact-command-option">
              <input
                type="checkbox"
                checked={formData.is_public}
                onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                className="h-4 w-4 accent-primary"
              />
              <span>
                <strong>公开群聊</strong>
                <small>允许其他用户搜索到该群</small>
              </span>
            </label>

            <label className="contact-command-option">
              <input
                type="checkbox"
                checked={formData.join_approval}
                onChange={(e) => setFormData({ ...formData, join_approval: e.target.checked })}
                className="h-4 w-4 accent-primary"
              />
              <span>
                <strong>加入审批</strong>
                <small>新成员需要通过审批</small>
              </span>
            </label>
          </div>

          <div className="contact-command-actions">
            <button
              type="button"
              onClick={onClose}
              className="contact-command-secondary"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="contact-command-primary"
            >
              {loading ? "创建中" : "创建群聊"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
