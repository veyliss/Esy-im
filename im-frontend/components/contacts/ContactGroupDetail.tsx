"use client";

import { useEffect, useState } from "react";
import { useGroupStore } from "@/lib/store/group";
import { GroupAPI } from "@/lib/api/group";
import { handleApiError, createUserFriendlyErrorMessage } from "@/lib/utils/errors";
import type { Group } from "@/lib/types/api";
import { ActionBar, EmptyPanel, SectionTitle } from "@/components/workspace/section";
import { UserAvatar } from "@/components/ui/user-avatar";
import { ErrorAlert } from "@/components/ui/error-alert";
import { PageLoading } from "@/components/ui/loading-states";

export function ContactGroupDetail({ group, onLeave }: { group: Group; onLeave?: () => void }) {
  const { groupMembers, setGroupMembers } = useGroupStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const members = groupMembers[group.group_id] || [];

  const loadMembers = async () => {
    try {
      setLoading(true);
      const res = await GroupAPI.getGroupMembers(group.group_id);
      if (res.data.code === 0) {
        setGroupMembers(group.group_id, res.data.data);
      }
      setError(null);
    } catch (e) {
      const apiError = handleApiError(e);
      setError(createUserFriendlyErrorMessage(apiError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
    // Member list refreshes when the selected group changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group.group_id]);

  const handleLeave = async () => {
    if (!confirm("确定要退出该群聊吗？")) return;
    try {
      const res = await GroupAPI.leaveGroup(group.group_id);
      if (res.data.code === 0) {
        onLeave?.();
      }
    } catch (e) {
      const apiError = handleApiError(e);
      setError(createUserFriendlyErrorMessage(apiError));
    }
  };

  return (
    <div className="flex min-h-[520px] flex-col bg-white dark:bg-slate-900">
      <div className="border-b border-slate-200 px-8 py-8 dark:border-slate-800">
        <div className="flex items-start gap-5">
          <UserAvatar
            src={group.avatar || "/default-group-avatar.png"}
            name={group.name}
            size="2xl"
            shape="rounded"
            border
          />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-3xl font-bold text-slate-900 dark:text-white">{group.name}</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {group.member_count} 人 · 群号：{group.group_id}
            </p>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">{group.description || "暂无群描述"}</p>
          </div>
        </div>

        <ActionBar className="mt-8 justify-start">
          <button type="button" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90">
            发消息
          </button>
          <button
            type="button"
            onClick={handleLeave}
            className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            退出群组
          </button>
        </ActionBar>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        <SectionTitle title="群成员" className="mb-5 border-b border-slate-200 pb-3 dark:border-slate-800" />
        {loading ? (
          <PageLoading message="加载群成员中..." size="sm" />
        ) : members.length === 0 ? (
          <EmptyPanel title="暂无成员信息" description="稍后刷新再试" className="min-h-[220px] border-0 bg-transparent" />
        ) : (
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-3">
            {members.map((member) => (
              <div
                key={member.user_id}
                className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <UserAvatar
                  src={member.user?.avatar || "/default-avatar.png"}
                  name={member.nickname || member.user?.nickname || `用户${member.user_id}`}
                  size="md"
                  border
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {member.nickname || member.user?.nickname || `用户${member.user_id}`}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {member.role === 3 ? "群主" : member.role === 2 ? "管理员" : "成员"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ErrorAlert error={error} onClose={() => setError(null)} className="mx-6 mb-4" />
    </div>
  );
}
