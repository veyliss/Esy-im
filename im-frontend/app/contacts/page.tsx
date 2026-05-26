"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store";
import { useContactStore } from "@/lib/store/contact";
import { useChatStore } from "@/lib/store/chat";
import { useGroupStore } from "@/lib/store/group";
import { FriendAPI } from "@/lib/api/friend";
import { MessageAPI } from "@/lib/api/message";
import { UserAPI } from "@/lib/api/user";
import { GroupAPI } from "@/lib/api/group";
import { handleApiError, createUserFriendlyErrorMessage } from "@/lib/utils/errors";
import type { User, FriendRequest, Group } from "@/lib/types/api";
import { useRouter } from "next/navigation";
import { wsClient } from "@/lib/websocket/client";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { EmptyPanel, SectionCard, SectionTitle, SidebarSection } from "@/components/workspace/section";
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

      const handleFriendRequest = (request: FriendRequest) => {
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

  return (
    <>
      <WorkspaceShell
        active="contacts"
        navVariant="modern"
        headerDescription="管理好友与群组通讯录。"
        rightSlot={
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowJoinGroup(true)}
              className="flex items-center gap-2 rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <span className="material-symbols-outlined text-base">group_add</span>
              添加/加入群聊
            </button>
            <button
              onClick={() => setShowAddFriend(true)}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90"
            >
              <span className="material-symbols-outlined text-base">person_add</span>
              添加好友
            </button>
            {pendingRequestCount > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white">
                {pendingRequestCount > 99 ? "99+" : pendingRequestCount}
              </span>
            )}
            <UserAvatar
              src={currentUser?.avatar}
              name={currentUser?.nickname || "我"}
              size="sm"
              border
            />
          </div>
        }
        sidebar={
          <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
            <SidebarSection title="群聊">
              {groups.length === 0 ? (
                <EmptyPanel title="暂无群聊" description="点击右上角添加或加入群聊" className="min-h-[140px]" />
              ) : (
                groups.map((group) => {
                  const isActive = currentGroup?.group_id === group.group_id;
                  return (
                    <button
                      key={group.group_id}
                      type="button"
                      className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-colors ${
                        isActive
                          ? "border-primary/30 bg-primary/10 dark:bg-primary/20"
                          : "bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800"
                      }`}
                      onClick={() => selectGroup(group)}
                    >
                      <UserAvatar
                        src={group.avatar || "/default-group-avatar.png"}
                        name={group.name}
                        size="md"
                        shape="rounded"
                        border
                      />
                      <span className={`flex-1 truncate text-sm text-slate-800 dark:text-slate-100 ${isActive ? "font-semibold" : ""}`}>
                        {group.name}
                      </span>
                      {group.member_count ? (
                        <span className="text-xs text-slate-400">{group.member_count}</span>
                      ) : null}
                    </button>
                  );
                })
              )}
            </SidebarSection>

            <SidebarSection title="我的好友">
              {friends.length === 0 ? (
                <EmptyPanel title="暂无好友" description="点击右上角添加好友" className="min-h-[140px]" />
              ) : (
                friends.map((friend) => {
                  const isActive = selectedFriend?.id === friend.id;
                  const fu = friend.friend_user;
                  return (
                    <button
                      key={friend.id}
                      type="button"
                      className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-colors ${
                        isActive
                          ? "border-primary/30 bg-primary/10 dark:bg-primary/20"
                          : "bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800"
                      }`}
                      onClick={() => selectFriend(friend)}
                    >
                      <UserAvatar
                        src={fu?.avatar || "/default-avatar.png"}
                        name={fu?.nickname || "用户"}
                        size="md"
                        status="online"
                        border
                      />
                      <span className={`flex-1 truncate text-sm text-slate-800 dark:text-slate-100 ${isActive ? "font-semibold" : ""}`}>
                        {friend.remark || fu?.nickname || `用户${fu?.user_id}`}
                      </span>
                    </button>
                  );
                })
              )}
            </SidebarSection>
          </div>
        }
        main={
          <div className="h-full overflow-y-auto p-6">
            <ErrorAlert error={error} onClose={() => setError(null)} className="mb-4" />

            <SectionCard className="mb-6 p-2">
              <div className="flex items-center gap-2">
                <button
                  className={`rounded-2xl px-4 py-2 text-sm font-medium ${
                    activeRightTab === "detail"
                      ? "bg-primary/10 text-primary dark:bg-primary/20"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                  }`}
                  onClick={() => setActiveRightTab("detail")}
                >
                  详情
                </button>
                <button
                  className={`rounded-2xl px-4 py-2 text-sm font-medium ${
                    activeRightTab === "requests"
                      ? "bg-primary/10 text-primary dark:bg-primary/20"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                  }`}
                  onClick={() => setActiveRightTab("requests")}
                >
                  好友请求
                  {pendingRequestCount > 0 && (
                    <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white">
                      {pendingRequestCount > 99 ? "99+" : pendingRequestCount}
                    </span>
                  )}
                </button>
              </div>
            </SectionCard>

            {activeRightTab === "requests" ? (
              <div className="space-y-6">
                <SectionCard>
                  <SectionTitle title="收到的请求" className="mb-4" />
                  <div className="space-y-3">
                    {receivedRequests.length === 0 ? (
                      <EmptyPanel title="暂无收到的请求" className="min-h-[180px]" />
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
                </SectionCard>

                <SectionCard>
                  <SectionTitle title="我发出的请求" className="mb-4" />
                  <div className="space-y-3">
                    {sentRequests.length === 0 ? (
                      <EmptyPanel title="暂无发出的请求" className="min-h-[180px]" />
                    ) : (
                      sentRequests.map((req) => (
                        <FriendRequestItem key={req.id} request={req} type="sent" />
                      ))
                    )}
                  </div>
                </SectionCard>
              </div>
            ) : selectedFriend && friendUser ? (
              <SectionCard>
                <div className="flex flex-col items-center gap-6 text-center">
                  <UserAvatar
                    src={friendUser.avatar || "/default-avatar.png"}
                    name={friendUser.nickname}
                    size="2xl"
                    status="online"
                    border
                  />
                  <div>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                      {selectedFriend.remark || friendUser.nickname}
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400">昵称：{friendUser.nickname}</p>
                  </div>
                </div>

                <div className="mt-12 w-full space-y-8 text-left">
                  <div>
                    <SectionTitle title="基础信息" className="mb-4 border-b border-slate-200 pb-2 dark:border-slate-800" />
                    <div className="space-y-3">
                      <div className="flex">
                        <p className="w-24 shrink-0 text-slate-500 dark:text-slate-400">用户 ID</p>
                        <p className="text-slate-800 dark:text-slate-200">{friendUser.user_id}</p>
                      </div>
                      <div className="flex">
                        <p className="w-24 shrink-0 text-slate-500 dark:text-slate-400">邮箱</p>
                        <p className="text-slate-800 dark:text-slate-200">{friendUser.email || "未填写"}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <SectionTitle title="备注信息" className="mb-4 border-b border-slate-200 pb-2 dark:border-slate-800" />
                    <input
                      className="w-full rounded-2xl border border-slate-300 bg-background-light px-4 py-3 dark:border-slate-700 dark:bg-background-dark focus:border-primary focus:ring-primary"
                      placeholder="添加备注"
                      type="text"
                      value={remark}
                      onChange={(e) => setRemark(e.target.value)}
                    />
                  </div>
                </div>

                <div className="mt-12 flex flex-wrap justify-center gap-4">
                  <button
                    onClick={handleSendMessage}
                    className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary/90"
                  >
                    发送消息
                  </button>
                  <button
                    onClick={handleUpdateRemark}
                    className="rounded-lg bg-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    保存备注
                  </button>
                  <button
                    onClick={handleDeleteFriend}
                    className="rounded-lg bg-red-100 px-6 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
                  >
                    删除联系人
                  </button>
                </div>
              </SectionCard>
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
                className="min-h-[520px] border-solid bg-white dark:bg-slate-900"
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
