"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@/lib/store";
import { useContactStore } from "@/lib/store/contact";
import { useChatStore } from "@/lib/store/chat";
import { useGroupStore } from "@/lib/store/group";
import { FriendAPI } from "@/lib/api/friend";
import { MessageAPI } from "@/lib/api/message";
import { UserAPI } from "@/lib/api/user";
import { GroupAPI } from "@/lib/api/group";
import { handleApiError, createUserFriendlyErrorMessage } from "@/lib/utils/errors";
import type { User, Group } from "@/lib/types/api";
import { useRouter } from "next/navigation";
import { wsClient } from "@/lib/websocket/client";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { TopBarActions, TopIconButton } from "@/components/layout/top-actions";
import {
  EmptyPanel,
  SectionTitle,
  SidebarItem,
  SidebarScrollArea,
  SidebarSearch,
  SidebarSection,
  SidebarToolbar,
  WorkspaceSidebar,
} from "@/components/workspace/section";
import { UserAvatar } from "@/components/ui/user-avatar";
import { ErrorAlert } from "@/components/ui/error-alert";
import { FriendRequestItem } from "@/components/contacts/FriendRequestItem";
import { ContactGroupDetail } from "@/components/contacts/ContactGroupDetail";
import { AddFriendModal } from "@/components/contacts/AddFriendModal";
import { JoinGroupModal } from "@/components/contacts/JoinGroupModal";

export default function ContactsPage() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);

  const {
    friends,
    setFriends,
    receivedRequests,
    setReceivedRequests,
    sentRequests,
    setSentRequests,
    selectedFriend,
    setSelectedFriend,
    pendingRequestCount,
    setPendingRequestCount,
  } = useContactStore();

  const { groups, setGroups, currentGroup, setCurrentGroup } = useGroupStore();
  const { setCurrentConversation } = useChatStore();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeRightTab, setActiveRightTab] = useState<"detail" | "requests">("detail");
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showJoinGroup, setShowJoinGroup] = useState(false);
  const [remark, setRemark] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [contactFilter, setContactFilter] = useState("");

  useEffect(() => {
    if (token) {
      UserAPI.getMe().then((res) => {
        if (res.data.code === 0) setCurrentUser(res.data.data);
      }).catch(() => {});
    }
  }, [token]);

  const loadFriends = async () => {
    try {
      const res = await FriendAPI.getFriendList();
      if (res.data.code === 0) setFriends(res.data.data);
    } catch (e) {
      console.error("加载好友列表失败:", e);
    }
  };

  const loadReceivedRequests = async () => {
    try {
      const res = await FriendAPI.getReceivedRequests();
      if (res.data.code === 0) {
        setReceivedRequests(res.data.data);
        setPendingRequestCount(res.data.data.filter((r) => r.status === 0).length);
      }
    } catch (e) {
      console.error("加载好友请求失败:", e);
    }
  };

  const loadSentRequests = async () => {
    try {
      const res = await FriendAPI.getSentRequests();
      if (res.data.code === 0) setSentRequests(res.data.data);
    } catch (e) {
      console.error("加载发出的请求失败:", e);
    }
  };

  const loadUserGroups = async () => {
    try {
      const res = await GroupAPI.getUserGroups();
      if (res.data.code === 0) setGroups(res.data.data);
    } catch (e) {
      console.error("加载群组列表失败:", e);
    }
  };

  useEffect(() => {
    if (token) {
      loadFriends();
      loadReceivedRequests();
      loadSentRequests();
      loadUserGroups();

      wsClient.connect(token);

      const handleFriendRequest = () => {
        loadReceivedRequests();
        setActiveRightTab("requests");
      };

      const handleFriendAccepted = () => {
        loadFriends();
        loadSentRequests();
      };

      wsClient.onFriendRequest(handleFriendRequest);
      wsClient.onFriendAccepted(handleFriendAccepted);

      return () => {
        wsClient.offFriendRequest(handleFriendRequest);
        wsClient.offFriendAccepted(handleFriendAccepted);
      };
    }
  }, [token]);

  useEffect(() => {
    if (selectedFriend) setRemark(selectedFriend.remark || "");
  }, [selectedFriend]);

  useEffect(() => {
    if (!selectedFriend && !currentGroup && pendingRequestCount > 0) {
      setActiveRightTab("requests");
    }
  }, [pendingRequestCount, selectedFriend, currentGroup]);

  const handleAcceptRequest = async (requestId: number) => {
    try {
      const res = await FriendAPI.acceptRequest({ request_id: requestId });
      if (res.data.code === 0) {
        await loadFriends();
        await loadReceivedRequests();
      }
    } catch (e) {
      const apiError = handleApiError(e);
      setError(createUserFriendlyErrorMessage(apiError));
    }
  };

  const handleRejectRequest = async (requestId: number) => {
    try {
      const res = await FriendAPI.rejectRequest({ request_id: requestId });
      if (res.data.code === 0) {
        await loadReceivedRequests();
      }
    } catch (e) {
      const apiError = handleApiError(e);
      setError(createUserFriendlyErrorMessage(apiError));
    }
  };

  const handleUpdateRemark = async () => {
    if (!selectedFriend) return;
    try {
      const res = await FriendAPI.updateRemark({
        friend_id: selectedFriend.friend_id,
        remark: remark.trim(),
      });
      if (res.data.code === 0) await loadFriends();
    } catch (e) {
      const apiError = handleApiError(e);
      setError(createUserFriendlyErrorMessage(apiError));
    }
  };

  const handleDeleteFriend = async () => {
    if (!selectedFriend || !confirm("确定要删除该好友吗？")) return;
    try {
      const res = await FriendAPI.deleteFriend(selectedFriend.friend_id);
      if (res.data.code === 0) {
        setSelectedFriend(null);
        await loadFriends();
      }
    } catch (e) {
      const apiError = handleApiError(e);
      setError(createUserFriendlyErrorMessage(apiError));
    }
  };

  const handleSendMessage = async () => {
    if (!selectedFriend) return;
    try {
      const res = await MessageAPI.getOrCreateConversation({
        friend_user_id: selectedFriend.friend_id,
      });
      if (res.data.code === 0) {
        setCurrentConversation(res.data.data);
        router.push("/chat");
      }
    } catch (e) {
      const apiError = handleApiError(e);
      setError(createUserFriendlyErrorMessage(apiError));
    }
  };

  const selectFriend = (friend: (typeof friends)[number]) => {
    setSelectedFriend(friend);
    setCurrentGroup(null);
    setActiveRightTab("detail");
  };

  const selectGroup = (group: Group) => {
    setCurrentGroup(group);
    setSelectedFriend(null);
    setActiveRightTab("detail");
  };

  const friendUser = selectedFriend?.friend_user;
  const filterKeyword = contactFilter.trim().toLowerCase();

  const filteredGroups = useMemo(() => {
    if (!filterKeyword) return groups;
    return groups.filter((group) => group.name.toLowerCase().includes(filterKeyword));
  }, [filterKeyword, groups]);

  const filteredFriends = useMemo(() => {
    if (!filterKeyword) return friends;
    return friends.filter((friend) => {
      const fu = friend.friend_user;
      const displayName = friend.remark || fu?.nickname || `用户${fu?.user_id || ""}`;
      return displayName.toLowerCase().includes(filterKeyword) || String(fu?.user_id || "").includes(filterKeyword);
    });
  }, [filterKeyword, friends]);

  const openRequests = () => {
    setSelectedFriend(null);
    setCurrentGroup(null);
    setActiveRightTab("requests");
  };

  return (
    <>
      <WorkspaceShell
        active="contacts"
        navVariant="modern"
        rightSlot={
          <TopBarActions avatarSrc={currentUser?.avatar} avatarName={currentUser?.nickname || "我"}>
            <TopIconButton icon="notifications" label="好友请求" badge={pendingRequestCount} onClick={openRequests} />
          </TopBarActions>
        }
        sidebar={
          <WorkspaceSidebar>
            <SidebarToolbar>
              <SidebarSearch
                type="text"
                placeholder="搜索联系人或群聊"
                value={contactFilter}
                onChange={(e) => setContactFilter(e.target.value)}
              />
              <div className="contacts-action-grid mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddFriend(true)}
                  className="contacts-action-button contacts-action-primary flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary/90"
                >
                  <span className="material-symbols-outlined text-lg">person_add</span>
                  添加好友
                </button>
                <button
                  type="button"
                  onClick={() => setShowJoinGroup(true)}
                  className="contacts-action-button flex items-center justify-center gap-2 rounded-lg bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition-colors hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-800 dark:hover:bg-slate-800"
                >
                  <span className="material-symbols-outlined text-lg">group_add</span>
                  加入群聊
                </button>
              </div>
            </SidebarToolbar>

            <SidebarScrollArea>
              <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                <SidebarItem
                  type="button"
                  onClick={openRequests}
                  active={activeRightTab === "requests"}
                >
                  <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary dark:bg-primary/20">
                    <span className="material-symbols-outlined text-xl">person_add</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block text-sm ${activeRightTab === "requests" ? "font-semibold text-primary" : "font-semibold text-slate-900 dark:text-slate-100"}`}>
                      新的朋友
                    </span>
                    <span className="block text-xs text-slate-500 dark:text-slate-400">好友申请与记录</span>
                  </span>
                  {pendingRequestCount > 0 ? (
                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white">
                      {pendingRequestCount > 99 ? "99+" : pendingRequestCount}
                    </span>
                  ) : null}
                </SidebarItem>
              </div>

              <SidebarSection title="群聊" className="contacts-section">
                {filteredGroups.length === 0 ? (
                  <EmptyPanel
                    title={filterKeyword ? "未找到相关群聊" : "暂无群聊"}
                    description={filterKeyword ? "尝试其他关键词" : "点击上方加入群聊"}
                    className="min-h-[120px] border-0 bg-transparent"
                  />
                ) : (
                  filteredGroups.map((group) => {
                    const isActive = currentGroup?.group_id === group.group_id;
                    return (
                      <SidebarItem
                        key={group.group_id}
                        type="button"
                        active={isActive}
                        onClick={() => selectGroup(group)}
                      >
                        <UserAvatar
                          src={group.avatar || "/default-group-avatar.png"}
                          name={group.name}
                          size="md"
                          shape="rounded"
                          border
                        />
                        <span className={`flex-1 truncate text-sm ${isActive ? "font-semibold text-primary" : "text-slate-800 dark:text-slate-100"}`}>
                          <span className="block truncate">{group.name}</span>
                          <span className="mt-0.5 block truncate text-xs font-normal text-slate-500 dark:text-slate-400">
                            群聊 · {group.member_count || 0} 人
                          </span>
                        </span>
                        <span className="material-symbols-outlined text-base text-slate-300">chevron_right</span>
                      </SidebarItem>
                    );
                  })
                )}
              </SidebarSection>

              <SidebarSection title="我的好友" className="contacts-section">
                {filteredFriends.length === 0 ? (
                  <EmptyPanel
                    title={filterKeyword ? "未找到相关好友" : "暂无好友"}
                    description={filterKeyword ? "尝试其他关键词" : "点击上方添加好友"}
                    className="min-h-[120px] border-0 bg-transparent"
                  />
                ) : (
                  filteredFriends.map((friend) => {
                    const isActive = selectedFriend?.id === friend.id;
                    const fu = friend.friend_user;
                    const displayName = friend.remark || fu?.nickname || `用户${fu?.user_id}`;
                    return (
                      <SidebarItem
                        key={friend.id}
                        type="button"
                        active={isActive}
                        onClick={() => selectFriend(friend)}
                      >
                        <UserAvatar
                          src={fu?.avatar || "/default-avatar.png"}
                          name={fu?.nickname || "用户"}
                          size="md"
                          status="online"
                          border
                        />
                        <span className={`min-w-0 flex-1 text-sm ${isActive ? "font-semibold text-primary" : "text-slate-800 dark:text-slate-100"}`}>
                          <span className="block truncate">{displayName}</span>
                          <span className="mt-0.5 block truncate text-xs font-normal text-slate-500 dark:text-slate-400">
                            用户 ID：{fu?.user_id || "-"}
                          </span>
                        </span>
                        <span className="material-symbols-outlined text-base text-slate-300">chevron_right</span>
                      </SidebarItem>
                    );
                  })
                )}
              </SidebarSection>
            </SidebarScrollArea>
          </WorkspaceSidebar>
        }
        main={
          <div className="contacts-main-surface workspace-main-panel">
            <ErrorAlert error={error} onClose={() => setError(null)} className="mb-4" />

            {activeRightTab === "requests" ? (
              <div className="contacts-content contacts-requests mx-auto max-w-3xl space-y-8">
                <div className="contacts-page-head border-b border-slate-200 pb-4 dark:border-slate-800">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">新的朋友</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">处理收到的好友请求，或查看已发出的申请。</p>
                </div>

                <section className="contacts-request-section">
                  <SectionTitle title="收到的请求" className="mb-4 border-b border-slate-200 pb-3 dark:border-slate-800" />
                  <div className="space-y-3">
                    {receivedRequests.length === 0 ? (
                      <EmptyPanel title="暂无收到的请求" className="min-h-[180px] border-0 bg-transparent" />
                    ) : (
                      receivedRequests.map((req) => (
                        <FriendRequestItem
                          key={req.id}
                          request={req}
                          type="received"
                          onAccept={handleAcceptRequest}
                          onReject={handleRejectRequest}
                        />
                      ))
                    )}
                  </div>
                </section>

                <section className="contacts-request-section">
                  <SectionTitle title="我发出的请求" className="mb-4 border-b border-slate-200 pb-3 dark:border-slate-800" />
                  <div className="space-y-3">
                    {sentRequests.length === 0 ? (
                      <EmptyPanel title="暂无发出的请求" className="min-h-[180px] border-0 bg-transparent" />
                    ) : (
                      sentRequests.map((req) => (
                        <FriendRequestItem key={req.id} request={req} type="sent" />
                      ))
                    )}
                  </div>
                </section>
              </div>
            ) : selectedFriend && friendUser ? (
              <div className="contacts-content contacts-detail mx-auto max-w-3xl">
                <section className="contacts-profile border-b border-slate-200 pb-10 text-center dark:border-slate-800">
                  <div className="relative mx-auto inline-block">
                    <UserAvatar
                      src={friendUser.avatar || "/default-avatar.png"}
                      name={friendUser.nickname}
                      size="3xl"
                      status="online"
                      showStatus
                      border
                    />
                  </div>
                  <h2 className="mt-5 text-3xl font-bold text-slate-900 dark:text-white">
                    {selectedFriend.remark || friendUser.nickname}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">昵称：{friendUser.nickname}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">用户 ID：{friendUser.user_id}</p>
                </section>

                <section className="contacts-info-section mt-8">
                  <SectionTitle title="基础信息" className="mb-4" />
                  <div className="contacts-info-table divide-y divide-slate-200 rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
                    <div className="grid grid-cols-[120px_1fr] gap-4 px-4 py-3 text-sm">
                      <p className="text-slate-500 dark:text-slate-400">用户 ID</p>
                      <p className="text-slate-900 dark:text-slate-100">{friendUser.user_id}</p>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] gap-4 px-4 py-3 text-sm">
                      <p className="text-slate-500 dark:text-slate-400">邮箱</p>
                      <p className="text-slate-900 dark:text-slate-100">{friendUser.email || "未填写"}</p>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] gap-4 px-4 py-3 text-sm">
                      <p className="text-slate-500 dark:text-slate-400">关系</p>
                      <p className="text-slate-900 dark:text-slate-100">好友</p>
                    </div>
                  </div>
                </section>

                <section className="contacts-remark-section mt-8">
                  <SectionTitle title="备注信息" className="mb-4" />
                  <input
                    className="ui-input w-full rounded-lg px-4 py-3 text-sm"
                    placeholder="添加备注"
                    type="text"
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                  />
                </section>

                <div className="contacts-detail-actions mt-10 flex flex-wrap justify-center gap-3 border-t border-slate-200 pt-6 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={handleSendMessage}
                    className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary/90"
                  >
                    <span className="material-symbols-outlined text-lg">chat</span>
                    发送消息
                  </button>
                  <button
                    type="button"
                    onClick={handleUpdateRemark}
                    className="flex items-center gap-2 rounded-lg bg-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    <span className="material-symbols-outlined text-lg">save</span>
                    保存备注
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteFriend}
                    className="flex items-center gap-2 rounded-lg bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50"
                  >
                    <span className="material-symbols-outlined text-lg">delete</span>
                    删除联系人
                  </button>
                </div>
              </div>
            ) : currentGroup ? (
              <ContactGroupDetail
                group={currentGroup}
                onLeave={async () => {
                  await loadUserGroups();
                  setCurrentGroup(null);
                }}
              />
            ) : (
              <EmptyPanel
                title="从左侧选择群聊或联系人查看详情"
                description="也可以使用右上角按钮添加好友或加入群聊"
                className="contacts-empty-state min-h-[520px] border-0 bg-white dark:bg-slate-900"
              />
            )}
          </div>
        }
      />

      {showAddFriend && (
        <AddFriendModal
          currentUserNickname={currentUser?.nickname}
          onClose={() => setShowAddFriend(false)}
          onSuccess={async () => {
            setShowAddFriend(false);
            await loadSentRequests();
            setActiveRightTab("requests");
          }}
        />
      )}

      {showJoinGroup && (
        <JoinGroupModal
          onClose={() => setShowJoinGroup(false)}
          onSuccess={async () => {
            setShowJoinGroup(false);
            await loadUserGroups();
          }}
        />
      )}
    </>
  );
}
