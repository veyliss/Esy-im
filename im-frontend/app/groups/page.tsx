"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store";
import { useGroupStore } from "@/lib/store/group";
import { GroupAPI } from "@/lib/api/group";
import { handleApiError, createUserFriendlyErrorMessage } from "@/lib/utils/errors";
import type { Group } from "@/lib/types/api";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { EmptyPanel, SidebarSection } from "@/components/workspace/section";
import { UserAvatar } from "@/components/ui/user-avatar";
import { ErrorAlert } from "@/components/ui/error-alert";
import { PageLoading } from "@/components/ui/loading-states";
import { GroupDetail } from "@/components/groups/GroupDetail";
import { CreateGroupModal } from "@/components/groups/CreateGroupModal";

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