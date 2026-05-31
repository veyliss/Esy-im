"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@/lib/store";
import { useGroupStore } from "@/lib/store/group";
import { GroupAPI } from "@/lib/api/group";
import { handleApiError, createUserFriendlyErrorMessage } from "@/lib/utils/errors";
import { TopBarActions, TopIconButton } from "@/components/layout/top-actions";
import {
  ImActionButton,
  ImActionStrip,
  ImEmptyState,
  ImListItem,
  ImSearchBox,
  ImShell,
  ImSidebar,
  ImSidebarHeader,
  ImSidebarScroll,
  ImSidebarSection,
  ImSidebarToolbar,
} from "@/components/im/layout";
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
      <ImShell
        active="groups"
        title="群聊"
        subtitle="多人会话、群成员和群资料"
        mobileDetailActive={Boolean(currentGroup)}
        rightSlot={
          <TopBarActions avatarSrc={currentUser?.avatar} avatarName={currentUser?.nickname || "我"}>
            <TopIconButton icon="group_add" label="加入群聊" onClick={() => setShowJoinModal(true)} />
            <TopIconButton icon="add" label="创建群聊" onClick={() => setShowCreateModal(true)} tone="primary" />
          </TopBarActions>
        }
        sidebar={
          <ImSidebar>
            <ImSidebarToolbar>
              <ImSidebarHeader
                eyebrow="多人会话"
                title="群聊"
                description="创建、加入和管理你的群组关系。"
              />
              <ImSearchBox
                type="text"
                placeholder="搜索我的群聊"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onClear={() => setSearchKeyword("")}
              />
              <ImActionStrip>
                <ImActionButton onClick={() => setShowJoinModal(true)}>
                  加入群聊
                </ImActionButton>
                <ImActionButton tone="primary" onClick={() => setShowCreateModal(true)}>
                  创建群聊
                </ImActionButton>
              </ImActionStrip>
            </ImSidebarToolbar>

            <ImSidebarScroll>
            <ImSidebarSection
              title={searchKeyword.trim() ? `筛选结果 · ${filteredGroups.length}` : `我的群聊 · ${filteredGroups.length}`}
            >
                {loading ? (
                  <PageLoading message="加载群组中..." size="sm" />
                ) : filteredGroups.length === 0 ? (
                  <ImEmptyState
                    title={searchKeyword.trim() ? "未找到相关群聊" : "暂无群聊"}
                    description={searchKeyword.trim() ? "尝试其他关键词" : "可以创建群聊，或搜索公开群聊加入"}
                    action={
                      !searchKeyword.trim() ? (
                        <ImActionStrip>
                          <ImActionButton onClick={() => setShowJoinModal(true)}>
                            加入群聊
                          </ImActionButton>
                          <ImActionButton onClick={() => setShowCreateModal(true)}>
                            创建群聊
                          </ImActionButton>
                        </ImActionStrip>
                      ) : null
                    }
                  />
                ) : (
                  <div className="space-y-3">
                    {filteredGroups.map((group) => {
                      const isActive = currentGroup?.group_id === group.group_id;
                      return (
                        <ImListItem
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
                        </ImListItem>
                      );
                    })}
                  </div>
                )}
            </ImSidebarSection>
            </ImSidebarScroll>
          </ImSidebar>
        }
      >
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
                <ImEmptyState
                  title="选择一个群聊查看详情"
                  description="也可以创建群聊，或搜索公开群聊加入"
                  action={
                    <ImActionStrip>
                      <ImActionButton onClick={() => setShowJoinModal(true)}>
                        加入群聊
                      </ImActionButton>
                      <ImActionButton tone="primary" onClick={() => setShowCreateModal(true)}>
                        创建群聊
                      </ImActionButton>
                    </ImActionStrip>
                  }
                  className="min-h-[520px] w-full"
                />
              </div>
            )}
          </div>
      </ImShell>

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
