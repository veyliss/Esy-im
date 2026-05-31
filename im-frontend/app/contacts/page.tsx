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
  WorkspaceSidebarHeader,
} from "@/components/workspace/section";
import { MobileDetailHeader } from "@/components/workspace/mobile-detail-header";
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
        toast("已接受好友申请", { tone: "success" });
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
        toast("已拒绝好友申请", { tone: "success" });
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

  const handleCopyFriendId = async () => {
    if (!friendUser?.user_id) return;
    try {
      await navigator.clipboard.writeText(friendUser.user_id);
      toast("用户 ID 已复制", { tone: "success" });
    } catch {
      setError("复制失败，请手动复制用户 ID");
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

  const groupedFriends = useMemo(() => {
    return filteredFriends.reduce<Array<{ key: string; items: typeof filteredFriends }>>((groups, friend) => {
      const fu = friend.friend_user;
      const displayName = friend.remark || fu?.nickname || `用户${fu?.user_id || ""}`;
      const firstChar = displayName.trim().charAt(0).toUpperCase();
      const key = /[A-Z]/.test(firstChar) ? firstChar : "#";
      const group = groups.find((item) => item.key === key);

      if (group) {
        group.items.push(friend);
      } else {
        groups.push({ key, items: [friend] });
      }

      return groups.sort((a, b) => {
        if (a.key === "#") return 1;
        if (b.key === "#") return -1;
        return a.key.localeCompare(b.key);
      });
    }, []);
  }, [filteredFriends]);

  const openRequests = () => {
    setSelectedFriend(null);
    setActiveRightTab("requests");
  };

  const backToList = () => {
    setSelectedFriend(null);
    setActiveRightTab("detail");
  };

  return (
    <>
      <WorkspaceShell
        active="contacts"
        navVariant="modern"
        mobileDetailActive={activeRightTab === "requests" || Boolean(selectedFriend)}
        rightSlot={
          <TopBarActions avatarSrc={currentUser?.avatar} avatarName={currentUser?.nickname || "我"}>
            <TopIconButton icon="notifications" label="好友请求" badge={pendingRequestCount} onClick={openRequests} />
          </TopBarActions>
        }
        sidebar={
          <WorkspaceSidebar>
            <SidebarToolbar>
              <WorkspaceSidebarHeader
                eyebrow="联系人"
                title="通讯录"
                description="管理好友、申请记录和一对一会话入口。"
                action={
                  pendingRequestCount > 0 ? (
                    <span className="workspace-count-badge">{pendingRequestCount > 99 ? "99+" : pendingRequestCount}</span>
                  ) : null
                }
              />
              <div className="relative">
                <SidebarSearch
                  type="text"
                  placeholder="搜索好友"
                  value={contactFilter}
                  onChange={(e) => setContactFilter(e.target.value)}
                  className={contactFilter ? "pr-12" : undefined}
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

              <div className="sidebar-quick-actions">
                <button
                  type="button"
                  onClick={() => setShowAddFriend(true)}
                  className="im-action-card is-primary"
                >
                  <span className="im-action-icon">
                    <span className="material-symbols-outlined text-xl">person_add</span>
                  </span>
                  <span className="im-action-copy">
                    <span>添加好友</span>
                    <small>通过账号、手机号或邮箱查找</small>
                  </span>
                  <span className="material-symbols-outlined shrink-0 text-slate-400">chevron_right</span>
                </button>
              </div>
            </SidebarToolbar>

            <SidebarScrollArea>
              <div className="sidebar-feature-row">
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

              <SidebarSection title={`我的好友 · ${filteredFriends.length}`}>
                {filteredFriends.length === 0 ? (
                  <EmptyPanel
                    title={filterKeyword ? "未找到相关好友" : "暂无好友"}
                    description={filterKeyword ? "尝试其他关键词" : "点击上方添加好友"}
                    icon="contacts"
                    action={
                      !filterKeyword ? (
                        <button type="button" className="im-secondary-button min-h-9 text-xs" onClick={() => setShowAddFriend(true)}>
                          添加好友
                        </button>
                      ) : null
                    }
                    className="min-h-[120px] border-0 bg-transparent"
                  />
                ) : (
                  <div className="space-y-4">
                    {groupedFriends.map((group) => (
                      <div key={group.key} className="contact-alpha-group">
                        <h4>{group.key}</h4>
                        <div className="space-y-3">
                          {group.items.map((friend) => {
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
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </SidebarSection>
            </SidebarScrollArea>
          </WorkspaceSidebar>
        }
        main={
          <div className="workspace-main-panel">
            <ErrorAlert error={error} onClose={() => setError(null)} className="mx-8 mt-6" />

            {activeRightTab === "requests" ? (
              <div className="im-detail-inner space-y-8">
                <MobileDetailHeader
                  title="新的朋友"
                  description="好友申请与记录"
                  onBack={backToList}
                />
                <div className="border-b border-slate-200 pb-5 dark:border-slate-800">
                  <h2 className="im-detail-title">新的朋友</h2>
                  <p className="im-detail-subtitle">处理收到的好友请求，或查看已发出的申请。</p>
                </div>

                <section>
                  <SectionTitle title="收到的请求" className="mb-4 border-b border-slate-200 pb-3 dark:border-slate-800" />
                  <div className="space-y-3">
                    {receivedRequests.length === 0 ? (
                      <EmptyPanel title="暂无收到的请求" icon="inbox" className="min-h-[180px] border-0 bg-transparent" />
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
                      <EmptyPanel title="暂无发出的请求" icon="send" className="min-h-[180px] border-0 bg-transparent" />
                    ) : (
                      sentRequests.map((req) => (
                        <FriendRequestItem key={req.id} request={req} type="sent" />
                      ))
                    )}
                  </div>
                </section>
              </div>
            ) : selectedFriend && friendUser ? (
              <div className="im-detail-inner">
                <MobileDetailHeader
                  title={selectedFriend.remark || friendUser.nickname || "好友详情"}
                  description={`用户 ID：${friendUser.user_id}`}
                  onBack={backToList}
                />
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
                  <h2 className="mt-5 im-detail-title">
                    {selectedFriend.remark || friendUser.nickname}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">昵称：{friendUser.nickname}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">用户 ID：{friendUser.user_id}</p>
                </section>

                <section className="mt-8">
                  <SectionTitle title="基础信息" className="mb-4" />
                  <div className="im-info-grid">
                    <div className="im-info-row">
                      <span>用户 ID</span>
                      <p>{friendUser.user_id}</p>
                    </div>
                    <div className="im-info-row">
                      <span>邮箱</span>
                      <p>{friendUser.email || "未填写"}</p>
                    </div>
                    <div className="im-info-row">
                      <span>关系</span>
                      <p>好友</p>
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
                    className="im-primary-button"
                  >
                    <span className="material-symbols-outlined text-lg">chat</span>
                    发送消息
                  </button>
                  <button
                    type="button"
                    onClick={handleUpdateRemark}
                    className="im-secondary-button"
                  >
                    <span className="material-symbols-outlined text-lg">save</span>
                    保存备注
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyFriendId}
                    className="im-secondary-button"
                  >
                    <span className="material-symbols-outlined text-lg">content_copy</span>
                    复制 ID
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteFriend}
                    className="im-danger-button"
                  >
                    <span className="material-symbols-outlined text-lg">delete</span>
                    删除联系人
                  </button>
                </div>
              </div>
            ) : (
              <div className="workspace-empty-wrap">
                <EmptyPanel
                  title="从左侧选择好友查看详情"
                  description="也可以使用上方入口添加新的好友"
                  icon="person_search"
                  action={
                    <button type="button" className="im-secondary-button" onClick={() => setShowAddFriend(true)}>
                      添加好友
                    </button>
                  }
                  className="min-h-[520px] w-full border-0 bg-white dark:bg-slate-900"
                />
              </div>
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
