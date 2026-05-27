"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store";
import { useGroupStore } from "@/lib/store/group";
import { GroupAPI } from "@/lib/api/group";
import { handleApiError, createUserFriendlyErrorMessage } from "@/lib/utils/errors";
import type { Group } from "@/lib/types/api";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { TopBarActions, TopIconButton } from "@/components/layout/top-actions";
import {
  EmptyPanel,
  SidebarItem,
  SidebarItemSurface,
  SidebarScrollArea,
  SidebarSearch,
  SidebarSection,
  SidebarToolbar,
  WorkspaceSidebar,
} from "@/components/workspace/section";
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
  const [currentUser, setCurrentUser] = useState<{ avatar?: string; nickname?: string } | null>(null);

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

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const { UserAPI } = await import("@/lib/api/user");
        const res = await UserAPI.getMe();
        if (res.data.code === 0) setCurrentUser(res.data.data);
      } catch (error) {
        console.error("加载用户信息失败:", error);
      }
    };

    if (token) loadCurrentUser();
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
          <TopBarActions avatarSrc={currentUser?.avatar} avatarName={currentUser?.nickname || "我"}>
            <TopIconButton icon="search" label="搜索群组" />
            <TopIconButton icon="add" label="创建群聊" onClick={() => setShowCreateModal(true)} tone="primary" />
            <TopIconButton icon="notifications" label="通知" />
          </TopBarActions>
        }
        sidebar={
          <WorkspaceSidebar>
            <SidebarToolbar>
              <SidebarSearch
                type="text"
                placeholder="搜索群组"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
            </SidebarToolbar>

            <SidebarSection
              title={searchKeyword.trim() ? "搜索结果" : "我的群组"}
              className="flex min-h-0 flex-1 flex-col py-4"
              bodyClassName="flex-1"
            >
              <SidebarScrollArea className="pt-2">
                {searchKeyword.trim() ? (
                  searchResults.length === 0 ? (
                    <EmptyPanel title="未找到相关群组" description="尝试其他关键词" className="min-h-[220px] border-0 bg-transparent" />
                  ) : (
                    <div className="space-y-1 px-1">
                      {searchResults.map((group) => (
                        <SidebarItemSurface key={group.group_id}>
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
                            type="button"
                            onClick={() => handleJoinGroup(group.group_id)}
                            className="rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-primary/90"
                          >
                            加入
                          </button>
                        </SidebarItemSurface>
                      ))}
                    </div>
                  )
                ) : loading ? (
                  <PageLoading message="加载群组中..." size="sm" />
                ) : groups.length === 0 ? (
                  <EmptyPanel title="暂无群组" description="点击右上角创建群聊" className="min-h-[220px] border-0 bg-transparent" />
                ) : (
                  <div className="space-y-1 px-1">
                    {groups.map((group) => {
                      const isActive = currentGroup?.group_id === group.group_id;
                      return (
                        <SidebarItem
                          key={group.group_id}
                          active={isActive}
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
                            <p className={`truncate text-sm font-semibold ${isActive ? "text-primary" : "text-slate-900 dark:text-slate-100"}`}>{group.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{group.member_count} 人</p>
                          </div>
                        </SidebarItem>
                      );
                    })}
                  </div>
                )}
              </SidebarScrollArea>
            </SidebarSection>
          </WorkspaceSidebar>
        }
        main={
          <div className="workspace-main-panel">
            <ErrorAlert error={error} onClose={() => setError(null)} className="mx-8 mt-6" />
            {currentGroup ? (
              <GroupDetail group={currentGroup} />
            ) : (
              <div className="workspace-empty-wrap">
                <EmptyPanel title="选择一个群组查看详情" description="或者创建一个新的群组" className="min-h-[520px] border-0 bg-white dark:bg-slate-900" />
              </div>
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
