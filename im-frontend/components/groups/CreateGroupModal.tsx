"use client";

import { useState } from "react";
import { GroupAPI } from "@/lib/api/group";
import { handleApiError, createUserFriendlyErrorMessage } from "@/lib/utils/errors";

export function CreateGroupModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    avatar: '',
    max_members: 500,
    is_public: true,
    join_approval: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('群组名称不能为空');
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">创建群组</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              群组名称 *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="ui-input w-full rounded-lg px-3 py-2"
              placeholder="请输入群组名称"
              maxLength={100}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              群组描述
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="ui-textarea w-full rounded-lg px-3 py-2"
              placeholder="请输入群组描述"
              rows={3}
              maxLength={500}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              最大成员数
            </label>
            <input
              type="number"
              value={formData.max_members}
              onChange={(e) => setFormData({ ...formData, max_members: parseInt(e.target.value) || 500 })}
              className="ui-input w-full rounded-lg px-3 py-2"
              min={2}
              max={2000}
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_public}
                onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                className="mr-2 h-4 w-4 accent-primary"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">公开群组</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.join_approval}
                onChange={(e) => setFormData({ ...formData, join_approval: e.target.checked })}
                className="mr-2 h-4 w-4 accent-primary"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">需要审批</span>
            </label>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg disabled:opacity-50"
            >
              {loading ? '创建中...' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
