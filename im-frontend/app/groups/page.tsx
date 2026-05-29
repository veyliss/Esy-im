"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@/lib/store";
import { useGroupStore } from "@/lib/store/group";
import { GroupAPI } from "@/lib/api/group";
import { handleApiError, createUserFriendlyErrorMessage } from "@/lib/utils/errors";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { TopBarActions, TopIconButton } from "@/components/layout/top-actions";
import {
  EmptyPanel,
  SidebarItem,
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
import { JoinGroupModal } from "@/components/groups/JoinGroupModal";

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
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
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

  // 初始加载
  useEffect(() => {
    if (token) {
      loadUserGroups();
    }
    // Group list bootstrap is tied to auth token changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const filteredGroups = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();
    if (!keyword) return groups;
    return groups.filter((group) =>
      group.name.toLowerCase().includes(keyword) || group.group_id.toLowerCase().includes(keyword),
    );
  }, [groups, searchKeyword]);

  return (
    <>
      <WorkspaceShell
        active="groups"
        navVariant="modern"
        mobileDetailActive={Boolean(currentGroup)}
        rightSlot={
          <TopBarActions avatarSrc={currentUser?.avatar} avatarName={currentUser?.nickname || "我"}>
            <TopIconButton icon="group_add" label="加入群聊" onClick={() => setShowJoinModal(true)} />
            <TopIconButton icon="add" label="创建群聊" onClick={() => setShowCreateModal(true)} tone="primary" />
          </TopBarActions>
        }
        sidebar={
          <WorkspaceSidebar>
            <SidebarToolbar>
              <SidebarSearch
                type="text"
                placeholder="搜索我的群聊"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
              <div className="grid gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(true)}
                  className="im-action-card"
                >
                  <span className="im-action-icon">
                    <span className="material-symbols-outlined text-xl">group_add</span>
                  </span>
                  <span className="im-action-copy">
                    <span>加入群聊</span>
                    <small>搜索群号或关键词</small>
                  </span>
                  <span className="material-symbols-outlined shrink-0 text-slate-400">chevron_right</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="im-action-card is-primary"
                >
                  <span className="im-action-icon">
                    <span className="material-symbols-outlined text-xl">add</span>
                  </span>
                  <span className="im-action-copy">
                    <span>创建群聊</span>
                    <small>发起新的多人会话</small>
                  </span>
                  <span className="material-symbols-outlined shrink-0 text-slate-400">chevron_right</span>
                </button>
              </div>
            </SidebarToolbar>

            <SidebarSection
              title={searchKeyword.trim() ? "筛选结果" : "我的群聊"}
              className="flex min-h-0 flex-1 flex-col py-4"
              bodyClassName="flex-1"
            >
              <SidebarScrollArea className="pt-2">
                {loading ? (
                  <PageLoading message="加载群组中..." size="sm" />
                ) : filteredGroups.length === 0 ? (
                  <EmptyPanel
                    title={searchKeyword.trim() ? "未找到相关群聊" : "暂无群聊"}
                    description={searchKeyword.trim() ? "尝试其他关键词" : "可以创建群聊，或搜索公开群聊加入"}
                    className="min-h-[220px] border-0 bg-transparent"
                  />
                ) : (
                  <div className="space-y-1 px-1">
                    {filteredGroups.map((group) => {
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
              <GroupDetail
                group={currentGroup}
                onBack={() => setCurrentGroup(null)}
                onLeave={async () => {
                  setCurrentGroup(null);
                  await loadUserGroups();
                }}
              />
            ) : (
              <div className="workspace-empty-wrap">
                <EmptyPanel title="选择一个群聊查看详情" description="也可以创建群聊，或搜索公开群聊加入" className="min-h-[520px] w-full border-0 bg-white dark:bg-slate-900" />
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

      {showJoinModal && (
        <JoinGroupModal
          onClose={() => setShowJoinModal(false)}
          onSuccess={async () => {
            setShowJoinModal(false);
            await loadUserGroups();
          }}
        />
      )}
    </>
  );
}
