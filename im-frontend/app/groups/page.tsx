"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@/lib/store";
import { useGroupStore } from "@/lib/store/group";
import { GroupAPI } from "@/lib/api/group";
import { handleApiError, createUserFriendlyErrorMessage } from "@/lib/utils/errors";
import { Im4Button, Im4Empty, Im4Search, Im4SessionItem, Im4Shell } from "@/components/im4";
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

  const sessionPanel = (
    <div className="im4-session-panel">
      <div className="im4-session-head">
        <div className="im4-session-title">
          <div>
            <h1>群聊</h1>
            <p>创建、加入和管理多人会话。</p>
          </div>
        </div>
        <Im4Search
          type="text"
          placeholder="搜索我的群聊"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          onClear={() => setSearchKeyword("")}
        />
        <div className="im4-contact-actions">
          <Im4Button onClick={() => setShowJoinModal(true)}>加入群聊</Im4Button>
          <Im4Button tone="primary" onClick={() => setShowCreateModal(true)}>创建群聊</Im4Button>
        </div>
      </div>

      <div className="im4-session-list">
        <h2 className="im4-session-section-label">
          {searchKeyword.trim() ? `筛选结果 · ${filteredGroups.length}` : `我的群聊 · ${filteredGroups.length}`}
        </h2>
        {loading ? (
          <PageLoading message="加载群组中..." size="sm" />
        ) : filteredGroups.length === 0 ? (
          <Im4Empty
            title={searchKeyword.trim() ? "未找到相关群聊" : "暂无群聊"}
            description={searchKeyword.trim() ? "尝试其他关键词" : "可以创建群聊，或搜索公开群聊加入"}
            action={
              !searchKeyword.trim() ? (
                <>
                  <Im4Button onClick={() => setShowJoinModal(true)}>加入群聊</Im4Button>
                  <Im4Button onClick={() => setShowCreateModal(true)}>创建群聊</Im4Button>
                </>
              ) : null
            }
          />
        ) : (
          filteredGroups.map((group) => (
            <Im4SessionItem
              key={group.group_id}
              active={currentGroup?.group_id === group.group_id}
              type="group"
              name={group.name}
              avatar={group.avatar || "/default-group-avatar.png"}
              lastMessage={`${group.member_count} 人 · ${group.group_id}`}
              onClick={() => setCurrentGroup(group)}
            />
          ))
        )}
      </div>
    </div>
  );

  return (
    <>
      <Im4Shell
        active="groups"
        title="群聊"
        subtitle="多人会话、群成员和群资料"
        detailActive={Boolean(currentGroup)}
        sessionPanel={sessionPanel}
        avatarSrc={currentUser?.avatar}
        avatarName={currentUser?.nickname || "我"}
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
                <Im4Empty
                  title="选择一个群聊查看详情"
                  description="也可以创建群聊，或搜索公开群聊加入"
                  action={
                    <>
                      <Im4Button onClick={() => setShowJoinModal(true)}>加入群聊</Im4Button>
                      <Im4Button tone="primary" onClick={() => setShowCreateModal(true)}>创建群聊</Im4Button>
                    </>
                  }
                  className="min-h-[520px] w-full"
                />
              </div>
            )}
          </div>
      </Im4Shell>

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
