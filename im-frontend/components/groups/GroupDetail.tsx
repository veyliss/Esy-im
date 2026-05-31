"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useGroupStore } from "@/lib/store/group";
import { GroupAPI } from "@/lib/api/group";
import { handleApiError, createUserFriendlyErrorMessage } from "@/lib/utils/errors";
import type { Group } from "@/lib/types/api";
import { ActionBar, EmptyPanel, SectionTitle } from "@/components/workspace/section";
import { MobileDetailHeader } from "@/components/workspace/mobile-detail-header";
import { UserAvatar } from "@/components/ui/user-avatar";
import { ErrorAlert } from "@/components/ui/error-alert";
import { PageLoading } from "@/components/ui/loading-states";
import { useAppInteractions } from "@/components/ui/app-interactions";

export function GroupDetail({ group, onLeave, onBack }: { group: Group; onLeave?: () => void; onBack?: () => void }) {
  const { confirm, toast } = useAppInteractions();
  const router = useRouter();
  const { groupMembers, setGroupMembers } = useGroupStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [memberKeyword, setMemberKeyword] = useState("");

  const members = useMemo(() => groupMembers[group.group_id] || [], [groupMembers, group.group_id]);
  const filteredMembers = useMemo(() => {
    const keyword = memberKeyword.trim().toLowerCase();
    if (!keyword) return members;
    return members.filter((member) => {
      const displayName = member.nickname || member.user?.nickname || `用户${member.user_id}`;
      return displayName.toLowerCase().includes(keyword) || member.user_id.toLowerCase().includes(keyword);
    });
  }, [memberKeyword, members]);

  const loadGroupMembers = async () => {
    try {
      setLoading(true);
      const res = await GroupAPI.getGroupMembers(group.group_id);
      if (res.data.code === 0) {
        setGroupMembers(group.group_id, res.data.data);
      }
      setError(null);
    } catch (error) {
      console.error("加载群成员失败:", error);
      const apiError = handleApiError(error);
      setError(createUserFriendlyErrorMessage(apiError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroupMembers();
    // Member list refreshes when the selected group changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group.group_id]);

  const handleLeave = async () => {
    const confirmed = await confirm({
      title: "退出群聊",
      message: "退出后你将不再接收该群的新消息，需要重新加入才能恢复。",
      confirmText: "退出",
      tone: "danger",
    });
    if (!confirmed) return;

    try {
      const res = await GroupAPI.leaveGroup(group.group_id);
      if (res.data.code === 0) {
        onLeave?.();
        toast("已退出群聊", { tone: "success" });
      }
    } catch (error) {
      const apiError = handleApiError(error);
      setError(createUserFriendlyErrorMessage(apiError));
    }
  };

  const handleSendMessage = () => {
    toast("正在打开群聊", { tone: "info" });
    router.push("/chat");
  };

  const handleCopyGroupId = async () => {
    try {
      await navigator.clipboard.writeText(group.group_id);
      toast("群号已复制", { tone: "success" });
    } catch {
      setError("复制失败，请手动复制群号");
    }
  };

  return (
    <div className="im-detail-page flex min-h-[520px] flex-col">
      <div className="im-detail-inner">
        {onBack ? (
          <MobileDetailHeader
            title={group.name}
            description={`群号：${group.group_id}`}
            onBack={onBack}
          />
        ) : null}
        <div className="im-detail-hero">
          <UserAvatar
            src={group.avatar || "/default-group-avatar.png"}
            name={group.name}
            size="2xl"
            shape="rounded"
            border
          />
          <div className="min-w-0 flex-1">
            <h2 className="im-detail-title">{group.name}</h2>
            <p className="im-detail-subtitle">
              {group.member_count} 人 · 群号：{group.group_id}
            </p>
            <p className="im-detail-subtitle max-w-2xl">{group.description || "暂无群描述"}</p>
          </div>
        </div>

        <div className="im-detail-stats">
          <div>
            <span>成员</span>
            <strong>{group.member_count}</strong>
          </div>
          <div>
            <span>容量</span>
            <strong>{group.max_members}</strong>
          </div>
          <div>
            <span>加入方式</span>
            <strong>{group.join_approval ? "需要审核" : "直接加入"}</strong>
          </div>
          <div>
            <span>可见性</span>
            <strong>{group.is_public ? "公开" : "私密"}</strong>
          </div>
        </div>

        <ActionBar className="mt-8 justify-start">
          <button type="button" onClick={handleSendMessage} className="im-primary-button">
            发消息
          </button>
          <button type="button" onClick={handleCopyGroupId} className="im-secondary-button">
            复制群号
          </button>
          <button
            type="button"
            onClick={handleLeave}
            className="im-secondary-button"
          >
            退出群聊
          </button>
        </ActionBar>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        <section className="group-settings-panel">
          <SectionTitle title="群公告" description="群聊说明会作为当前群公告展示。" />
          <p>{group.description || "暂无群公告"}</p>
          <div className="group-settings-grid">
            <div>
              <span>入群审核</span>
              <strong>{group.join_approval ? "已开启" : "未开启"}</strong>
            </div>
            <div>
              <span>公开搜索</span>
              <strong>{group.is_public ? "允许" : "不允许"}</strong>
            </div>
            <div>
              <span>群容量</span>
              <strong>
                {group.member_count}/{group.max_members}
              </strong>
            </div>
          </div>
        </section>

        <SectionTitle
          title={`群成员 · ${filteredMembers.length}`}
          description="成员角色和群内昵称会显示在这里。"
          className="mb-5 border-b border-slate-200 pb-3 dark:border-slate-800"
        />
        <div className="group-member-search">
          <span className="material-symbols-outlined">search</span>
          <input
            value={memberKeyword}
            onChange={(event) => setMemberKeyword(event.target.value)}
            placeholder="搜索成员昵称或用户 ID"
          />
          {memberKeyword ? (
            <button type="button" onClick={() => setMemberKeyword("")} aria-label="清空成员搜索" title="清空搜索">
              <span className="material-symbols-outlined">close</span>
            </button>
          ) : null}
        </div>
        {loading ? (
          <PageLoading message="加载群成员中..." size="sm" />
        ) : filteredMembers.length === 0 ? (
          <EmptyPanel
            title={memberKeyword.trim() ? "未找到相关成员" : "暂无成员信息"}
            description={memberKeyword.trim() ? "试试其他昵称或用户 ID" : "稍后刷新再试"}
            className="min-h-[220px] border-0 bg-transparent"
          />
        ) : (
          <div className="im-list-grid">
            {filteredMembers.map((member) => (
              <div
                key={member.user_id}
                className="im-list-row"
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
                    <span className={`group-role-badge is-role-${member.role}`}>
                      {member.role === 3 ? "群主" : member.role === 2 ? "管理员" : "成员"}
                    </span>
                    {member.is_muted ? <span className="ml-2 text-amber-500">已禁言</span> : null}
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
