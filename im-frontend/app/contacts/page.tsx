"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@/lib/store";
import { useContactStore } from "@/lib/store/contact";
import { useChatStore } from "@/lib/store/chat";
import { FriendAPI } from "@/lib/api/friend";
import { MessageAPI } from "@/lib/api/message";
import { UserAPI } from "@/lib/api/user";
import { handleApiError, createUserFriendlyErrorMessage } from "@/lib/utils/errors";
import type { User } from "@/lib/types/api";
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
import { useAppInteractions } from "@/components/ui/app-interactions";
import { FriendRequestItem } from "@/components/contacts/FriendRequestItem";
import { AddFriendModal } from "@/components/contacts/AddFriendModal";

export default function ContactsPage() {
  const { confirm, toast } = useAppInteractions();
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

  const { setCurrentConversation } = useChatStore();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeRightTab, setActiveRightTab] = useState<"detail" | "requests">("detail");
  const [showAddFriend, setShowAddFriend] = useState(false);
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

  useEffect(() => {
    if (token) {
      loadFriends();
      loadReceivedRequests();
      loadSentRequests();

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
    // Contacts bootstrap and realtime subscriptions are tied to auth token changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (selectedFriend) setRemark(selectedFriend.remark || "");
  }, [selectedFriend]);

  useEffect(() => {
    if (!selectedFriend && pendingRequestCount > 0) {
      setActiveRightTab("requests");
    }
  }, [pendingRequestCount, selectedFriend]);

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
      if (res.data.code === 0) {
        await loadFriends();
        toast("备注已保存", { tone: "success" });
      }
    } catch (e) {
      const apiError = handleApiError(e);
      setError(createUserFriendlyErrorMessage(apiError));
    }
  };

  const handleDeleteFriend = async () => {
    if (!selectedFriend) return;
    const confirmed = await confirm({
      title: "删除联系人",
      message: "删除后将从通讯录移除该好友，聊天记录不会自动清空。",
      confirmText: "删除",
      tone: "danger",
    });
    if (!confirmed) return;

    try {
      const res = await FriendAPI.deleteFriend(selectedFriend.friend_id);
      if (res.data.code === 0) {
        setSelectedFriend(null);
        await loadFriends();
        toast("联系人已删除", { tone: "success" });
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
    setActiveRightTab("detail");
  };

  const friendUser = selectedFriend?.friend_user;
  const filterKeyword = contactFilter.trim().toLowerCase();

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
              <div className="relative">
                <SidebarSearch
                  type="text"
                  placeholder="搜索好友"
                  value={contactFilter}
                  onChange={(e) => setContactFilter(e.target.value)}
                />
                {contactFilter ? (
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex size-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                    onClick={() => setContactFilter("")}
                    aria-label="清空搜索"
                    title="清空搜索"
                  >
                    <span className="material-symbols-outlined text-base">close</span>
                  </button>
                ) : null}
              </div>

              <div className="grid gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => setShowAddFriend(true)}
                  className="flex min-h-[58px] w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-all duration-160 border-primary/32 bg-blue-50 text-primary-dark hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm hover:-translate-y-px dark:border-primary/38 dark:bg-primary/16 dark:text-blue-200 dark:hover:border-slate-700 dark:hover:bg-slate-800"
                >
                  <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
                    <span className="material-symbols-outlined text-xl">person_add</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span>添加好友</span>
                    <small>通过账号、手机号或邮箱查找</small>
                  </span>
                  <span className="material-symbols-outlined shrink-0 text-slate-400">chevron_right</span>
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

              <SidebarSection title="我的好友">
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
          <div className="p-11 max-sm:p-6 workspace-main-panel">
            <ErrorAlert error={error} onClose={() => setError(null)} className="mb-4" />

            {activeRightTab === "requests" ? (
              <div className="w-full max-w-3xl mx-auto space-y-8">
                <div className="border-b border-slate-200 pb-4 dark:border-slate-800">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">新的朋友</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">处理收到的好友请求，或查看已发出的申请。</p>
                </div>

                <section>
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

                <section>
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
              <div className="mx-auto max-w-3xl">
                <section className="border-b border-slate-200 pb-10 text-center dark:border-slate-800 pt-2">
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

                <section className="mt-8">
                  <SectionTitle title="基础信息" className="mb-4" />
                  <div className="divide-y divide-slate-200 rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-800 overflow-hidden bg-white dark:bg-transparent">
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

                <section className="mt-8">
                  <SectionTitle title="备注信息" className="mb-4" />
                  <input
                    className="ui-input w-full rounded-lg px-4 py-3 text-sm"
                    placeholder="添加备注"
                    type="text"
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                  />
                </section>

                <div className="mt-10 flex flex-wrap justify-center gap-3 border-t border-slate-200 pt-6 dark:border-slate-800">
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
            ) : (
              <EmptyPanel
                title="从左侧选择好友查看详情"
                description="也可以使用上方入口添加新的好友"
                className="min-h-[calc(100vh-220px)] border-0 bg-white dark:bg-slate-900"
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
    </>
  );
}
