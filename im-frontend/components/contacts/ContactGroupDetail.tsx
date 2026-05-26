"use client";

import { useEffect, useState } from "react";
import { useGroupStore } from "@/lib/store/group";
import { GroupAPI } from "@/lib/api/group";
import { handleApiError, createUserFriendlyErrorMessage } from "@/lib/utils/errors";
import type { Group } from "@/lib/types/api";
import { ActionBar, EmptyPanel, SectionCard, SectionTitle } from "@/components/workspace/section";
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
    <SectionCard className="flex min-h-[520px] flex-col p-0">
      <div className="border-b border-slate-200/70 px-6 py-5 dark:border-slate-800">
        <SectionTitle
          title={group.name}
          description={`${group.member_count} 人 · 群号：${group.group_id}`}
          action={
            <UserAvatar
              src={group.avatar || "/default-group-avatar.png"}
              name={group.name}
              size="xl"
              shape="rounded"
              border
            />
          }
        />
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{group.description || "暂无群描述"}</p>
        <ActionBar className="mt-4 justify-start">
          <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90">
            发消息
          </button>
          <button
            onClick={handleLeave}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            退出群组
          </button>
        </ActionBar>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <SectionTitle title="群成员" className="mb-4" />
        {loading ? (
          <PageLoading message="加载群成员中..." size="sm" />
        ) : members.length === 0 ? (
          <EmptyPanel title="暂无成员信息" description="稍后刷新再试" className="min-h-[220px]" />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {members.map((member) => (
              <div
                key={member.user_id}
                className="flex items-center gap-3 rounded-lg border border-slate-200/80 bg-white/80 p-3 dark:border-slate-700 dark:bg-slate-800/70"
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
    </SectionCard>
  );
}
