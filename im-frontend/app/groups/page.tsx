"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store";
import { useGroupStore } from "@/lib/store/group";
import { GroupAPI } from "@/lib/api/group";
import { handleApiError, createUserFriendlyErrorMessage } from "@/lib/utils/errors";
import type { Group } from "@/lib/types/api";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { ActionBar, EmptyPanel, SectionCard, SectionTitle, SidebarSection } from "@/components/workspace/section";
import { UserAvatar } from "@/components/ui/user-avatar";
import { ErrorAlert } from "@/components/ui/error-alert";
import { PageLoading } from "@/components/ui/loading-states";

export default function GroupsPage() {
  const token = useAuthStore((state) => state.token);
  const {
    groups,
    setGroups,
    currentGroup,
    setCurrentGroup,
    loading,
    setLoading,
    error,
    setError,
  } = useGroupStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState<Group[]>([]);

  // 加载用户群组列表
  const loadUserGroups = async () => {
    try {
      setLoading(true);
      const res = await GroupAPI.getUserGroups();
      if (res.data.code === 0) {
        setGroups(res.data.data);
      }
    } catch (error) {
      console.error("加载群组列表失败:", error);
      const apiError = handleApiError(error);
      setError(createUserFriendlyErrorMessage(apiError));
    } finally {
      setLoading(false);
    }
  };

  // 搜索群组
  const searchGroups = async () => {
    if (!searchKeyword.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const res = await GroupAPI.searchGroups(searchKeyword);
      if (res.data.code === 0) {
        setSearchResults(res.data.data);
      }
    } catch (error) {
      console.error("搜索群组失败:", error);
      const apiError = handleApiError(error);
      setError(createUserFriendlyErrorMessage(apiError));
    }
  };

  // 加入群组
  const handleJoinGroup = async (groupId: string) => {
    try {
      const res = await GroupAPI.joinGroup({ group_id: groupId });
      if (res.data.code === 0) {
        // 重新加载群组列表
        await loadUserGroups();
        setError(null);
      }
    } catch (error) {
      console.error("加入群组失败:", error);
      const apiError = handleApiError(error);
      setError(createUserFriendlyErrorMessage(apiError));
    }
  };

  // 初始加载
  useEffect(() => {
    if (token) {
      loadUserGroups();
    }
  }, [token]);

  // 搜索防抖
  useEffect(() => {
    const timer = setTimeout(() => {
      searchGroups();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchKeyword]);

  return (
    <>
      <WorkspaceShell
        active="groups"
        navVariant="modern"
        rightSlot={
          <button
            onClick={() => setShowCreateModal(true)}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary/90"
          >
            创建群聊
          </button>
        }
        headerDescription="统一群聊导航入口，保持搜索、列表与详情区的视觉一致性。"
        sidebar={
          <div className="flex h-full flex-col p-4">
            <SidebarSection
              title={searchKeyword.trim() ? "搜索结果" : "我的群组"}
              className="flex min-h-0 flex-1 flex-col"
              bodyClassName="flex-1 space-y-2"
            >
              <input
                type="text"
                placeholder="搜索群组..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="ui-input w-full rounded-2xl px-4 py-3 text-sm"
              />

              <div className="flex-1 overflow-y-auto pt-2">
                {searchKeyword.trim() ? (
                  searchResults.length === 0 ? (
                    <EmptyPanel title="未找到相关群组" description="尝试其他关键词" className="min-h-[220px]" />
                  ) : (
                    <div className="space-y-2">
                      {searchResults.map((group) => (
                        <div
                          key={group.group_id}
                          className="flex items-center gap-3 rounded-2xl border border-transparent bg-slate-50 px-3 py-3 transition-all hover:border-slate-200 hover:bg-white dark:bg-slate-800/40 dark:hover:border-slate-700 dark:hover:bg-slate-800"
                        >
                          <UserAvatar
                            src={group.avatar || "/default-group-avatar.png"}
                            name={group.name}
                            size="md"
                            shape="rounded"
                            border
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{group.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{group.member_count} 人</p>
                          </div>
                          <button
                            onClick={() => handleJoinGroup(group.group_id)}
                            className="rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-primary/90"
                          >
                            加入
                          </button>
                        </div>
                      ))}
                    </div>
                  )
                ) : loading ? (
                  <PageLoading message="加载群组中..." size="sm" />
                ) : groups.length === 0 ? (
                  <EmptyPanel title="暂无群组" description="点击右上角创建群聊" className="min-h-[220px]" />
                ) : (
                  <div className="space-y-2">
                    {groups.map((group) => {
                      const isActive = currentGroup?.group_id === group.group_id;
                      return (
                        <button
                          key={group.group_id}
                          type="button"
                          className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-all ${
                            isActive
                              ? "border-primary/30 bg-primary/10 shadow-sm dark:border-primary/40 dark:bg-primary/20"
                              : "border-transparent bg-slate-50 hover:border-slate-200 hover:bg-white dark:bg-slate-800/40 dark:hover:border-slate-700 dark:hover:bg-slate-800"
                          }`}
                          onClick={() => setCurrentGroup(group)}
                        >
                          <UserAvatar
                            src={group.avatar || "/default-group-avatar.png"}
                            name={group.name}
                            size="md"
                            shape="rounded"
                            border
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{group.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{group.member_count} 人</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </SidebarSection>
          </div>
        }
        main={
          <div className="h-full overflow-y-auto p-6">
            <ErrorAlert error={error} onClose={() => setError(null)} className="mb-4" />
            {currentGroup ? (
              <GroupDetail group={currentGroup} />
            ) : (
              <EmptyPanel title="选择一个群组查看详情" description="或者创建一个新的群组" className="min-h-[520px] border-solid bg-white/80 dark:bg-slate-900/70" />
            )}
          </div>
        }
      />

      {showCreateModal && (
        <CreateGroupModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadUserGroups();
          }}
        />
      )}
    </>
  );
}

// 群组详情组件
function GroupDetail({ group }: { group: Group }) {
  const { groupMembers, setGroupMembers } = useGroupStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const members = groupMembers[group.group_id] || [];

  // 加载群成员
  const loadGroupMembers = async () => {
    try {
      setLoading(true);
      const res = await GroupAPI.getGroupMembers(group.group_id);
      if (res.data.code === 0) {
        setGroupMembers(group.group_id, res.data.data);
      }
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
  }, [group.group_id]);

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
          <button className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90">
            发消息
          </button>
          <button className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
            管理
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
                className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/80 p-3 dark:border-slate-700 dark:bg-slate-800/70"
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

// 创建群组模态框组件
function CreateGroupModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
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