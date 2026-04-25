"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useAuthStore } from "@/lib/store";
import { useContactStore } from "@/lib/store/contact";
import { useChatStore } from "@/lib/store/chat";
import { useGroupStore } from "@/lib/store/group";
import { FriendAPI } from "@/lib/api/friend";
import { MessageAPI } from "@/lib/api/message";
import { UserAPI } from "@/lib/api/user";
import { GroupAPI } from "@/lib/api/group";
import type { User, FriendRequest, Group } from "@/lib/types/api";
import { useRouter } from "next/navigation";
import { wsClient } from "@/lib/websocket/client";
import { FriendRequestItem } from "@/components/contacts/FriendRequestItem";
import { EmptyPanel, SectionCard, SectionTitle, SidebarSection } from "@/components/workspace/section";

export default function ContactsPage() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);

  // 好友/请求相关
  const {
    friends,
    setFriends,
    receivedRequests,
    setReceivedRequests,
    sentRequests,
    setSentRequests,
    selectedFriend,
    setSelectedFriend,
    searchResult,
    setSearchResult,
    pendingRequestCount,
    setPendingRequestCount,
  } = useContactStore();

  // 群聊相关
  const { groups, setGroups, currentGroup, setCurrentGroup } = useGroupStore();

  const { setCurrentConversation } = useChatStore();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // 右侧区域子标签：详情 | 请求
  const [activeRightTab, setActiveRightTab] = useState<"detail" | "requests">("detail");

  // 添加好友弹窗
  const [searchInput, setSearchInput] = useState("");
  const [showAddFriend, setShowAddFriend] = useState(false);

  // 添加/加入群聊弹窗
  const [showJoinGroup, setShowJoinGroup] = useState(false);
  const [groupSearchKeyword, setGroupSearchKeyword] = useState("");
  const [groupSearchResults, setGroupSearchResults] = useState<Group[]>([]);

  const [remark, setRemark] = useState("");

  // 加载当前用户信息
  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const res = await UserAPI.getMe();
        if (res.data.code === 0) {
          setCurrentUser(res.data.data);
        }
      } catch (error) {
        console.error("加载用户信息失败:", error);
      }
    };

    if (token) {
      loadCurrentUser();
    }
  }, [token]);

  // 加载好友列表
  const loadFriends = async () => {
    try {
      const res = await FriendAPI.getFriendList();
      if (res.data.code === 0) {
        setFriends(res.data.data);
      }
    } catch (error) {
      console.error("加载好友列表失败:", error);
    }
  };

  // 加载收到的好友请求
  const loadReceivedRequests = async () => {
    try {
      const res = await FriendAPI.getReceivedRequests();
      if (res.data.code === 0) {
        setReceivedRequests(res.data.data);
        // 计算待处理数量
        const pending = res.data.data.filter((r) => r.status === 0).length;
        setPendingRequestCount(pending);
      }
    } catch (error) {
      console.error("加载好友请求失败:", error);
    }
  };

  // 加载发出的好友请求
  const loadSentRequests = async () => {
    try {
      const res = await FriendAPI.getSentRequests();
      if (res.data.code === 0) {
        setSentRequests(res.data.data);
      }
    } catch (error) {
      console.error("加载发出的请求失败:", error);
    }
  };

  // 加载我的群组
  const loadUserGroups = async () => {
    try {
      const res = await GroupAPI.getUserGroups();
      if (res.data.code === 0) {
        setGroups(res.data.data);
      }
    } catch (error) {
      console.error("加载群组列表失败:", error);
    }
  };

  // 初始加载 & WebSocket 监听
  useEffect(() => {
    if (token) {
      loadFriends();
      loadReceivedRequests();
      loadSentRequests();
      loadUserGroups();

      // 连接WebSocket
      wsClient.connect(token);

      // 监听好友请求
      const handleFriendRequest = (request: FriendRequest) => {
        console.log("📨 收到新的好友请求:", request);
        loadReceivedRequests();
        alert(`收到来自 ${request.from_user?.nickname || request.from_user_id} 的好友请求`);
        setActiveRightTab("requests");
      };

      // 监听好友请求被接受
      const handleFriendAccepted = (data: { friend?: { nickname: string } }) => {
        console.log("✅ 好友请求已被接受:", data);
        loadFriends();
        loadSentRequests();
        if (data.friend) {
          alert(`${data.friend.nickname} 已同意你的好友请求`);
        }
      };

      wsClient.onFriendRequest(handleFriendRequest);
      wsClient.onFriendAccepted(handleFriendAccepted);

      return () => {
        wsClient.offFriendRequest(handleFriendRequest);
        wsClient.offFriendAccepted(handleFriendAccepted);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // 选中好友时更新备注输入框
  useEffect(() => {
    if (selectedFriend) {
      setRemark(selectedFriend.remark || "");
    }
  }, [selectedFriend]);

  // 如果没有选中任何对象且有待处理请求，自动切换到请求标签
  useEffect(() => {
    if (!selectedFriend && !currentGroup && pendingRequestCount > 0) {
      setActiveRightTab("requests");
    }
  }, [pendingRequestCount, selectedFriend, currentGroup]);

  // 搜索用户
  const handleSearchFriend = async () => {
    if (!searchInput.trim()) return;

    try {
      const res = await FriendAPI.searchFriend(searchInput.trim());
      if (res.data.code === 0) {
        setSearchResult(res.data.data);
      }
    } catch (error) {
      const errorMsg = (error as { response?: { data?: { msg?: string } } }).response?.data?.msg;
      alert(errorMsg || "搜索失败");
    }
  };

  // 发送好友请求
  const handleSendRequest = async () => {
    if (!searchResult) return;

    try {
      const res = await FriendAPI.sendRequest({
        to_user_id: searchResult.user_id,
        message: "我是 " + (currentUser?.nickname || "用户"),
      });

      if (res.data.code === 0) {
        alert("好友请求已发送");
        setShowAddFriend(false);
        setSearchInput("");
        setSearchResult(null);
        await loadSentRequests();
        setActiveRightTab("requests");
      }
    } catch (error) {
      const errorMsg = (error as { response?: { data?: { msg?: string } } }).response?.data?.msg;
      alert(errorMsg || "发送请求失败");
    }
  };

  // 接受好友请求
  const handleAcceptRequest = async (requestId: number) => {
    try {
      const res = await FriendAPI.acceptRequest({ request_id: requestId });
      if (res.data.code === 0) {
        alert("已同意好友请求");
        await loadFriends();
        await loadReceivedRequests();
      }
    } catch (error) {
      const errorMsg = (error as { response?: { data?: { msg?: string } } }).response?.data?.msg;
      alert(errorMsg || "操作失败");
    }
  };

  // 拒绝好友请求
  const handleRejectRequest = async (requestId: number) => {
    try {
      const res = await FriendAPI.rejectRequest({ request_id: requestId });
      if (res.data.code === 0) {
        alert("已拒绝好友请求");
        await loadReceivedRequests();
      }
    } catch (error) {
      const errorMsg = (error as { response?: { data?: { msg?: string } } }).response?.data?.msg;
      alert(errorMsg || "操作失败");
    }
  };

  // 更新备注
  const handleUpdateRemark = async () => {
    if (!selectedFriend) return;

    try {
      const res = await FriendAPI.updateRemark({
        friend_id: selectedFriend.friend_id,
        remark: remark.trim(),
      });

      if (res.data.code === 0) {
        alert("备注已更新");
        await loadFriends();
      }
    } catch (error) {
      const errorMsg = (error as { response?: { data?: { msg?: string } } }).response?.data?.msg;
      alert(errorMsg || "更新失败");
    }
  };

  // 删除好友
  const handleDeleteFriend = async () => {
    if (!selectedFriend) return;

    if (!confirm("确定要删除该好友吗？")) return;

    try {
      const res = await FriendAPI.deleteFriend(selectedFriend.friend_id);
      if (res.data.code === 0) {
        alert("已删除好友");
        setSelectedFriend(null);
        await loadFriends();
      }
    } catch (error) {
      const errorMsg = (error as { response?: { data?: { msg?: string } } }).response?.data?.msg;
      alert(errorMsg || "删除失败");
    }
  };

  // 去聊天（私聊）
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
    } catch (error) {
      const errorMsg = (error as { response?: { data?: { msg?: string } } }).response?.data?.msg;
      alert(errorMsg || "操作失败");
    }
  };

  // 搜索群聊
  const handleSearchGroups = async () => {
    if (!groupSearchKeyword.trim()) {
      setGroupSearchResults([]);
      return;
    }
    try {
      const res = await GroupAPI.searchGroups(groupSearchKeyword.trim());
      if (res.data.code === 0) {
        setGroupSearchResults(res.data.data);
      }
    } catch (error) {
      const errorMsg = (error as { response?: { data?: { msg?: string } } }).response?.data?.msg;
      alert(errorMsg || "搜索群聊失败");
    }
  };

  // 加入群聊
  const handleJoinGroup = async (groupId: string) => {
    try {
      const res = await GroupAPI.joinGroup({ group_id: groupId });
      if (res.data.code === 0) {
        alert("已加入群聊");
        await loadUserGroups();
        setShowJoinGroup(false);
        setGroupSearchKeyword("");
        setGroupSearchResults([]);
      }
    } catch (error) {
      const errorMsg = (error as { response?: { data?: { msg?: string } } }).response?.data?.msg;
      alert(errorMsg || "加入群聊失败");
    }
  };

  // 左侧选择逻辑：选择好友时清空选中群，选择群时清空选中好友
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
    <div className="min-h-screen bg-slate-50 font-display text-slate-800 dark:bg-background-dark dark:text-slate-200">
      <div className="flex h-screen flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white/95 px-6 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
          <div className="flex items-center gap-8">
            <nav className="flex items-center gap-6">
              <a className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary" href="/chat">聊天</a>
              <a className="text-sm font-medium text-primary" href="/contacts">通讯录</a>
              <a className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary" href="/groups">群聊</a>
              <a className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary" href="/moments">朋友圈</a>
              <a className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary" href="/me">我的</a>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowJoinGroup(true)}
              className="flex items-center gap-2 rounded-lg bg-slate-200 dark:bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700"
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
            <button className="relative overflow-hidden rounded-full">
              {currentUser?.avatar ? (
                <Image
                  alt="User avatar"
                  className="h-8 w-8 rounded-full object-cover"
                  src={currentUser.avatar}
                  width={32}
                  height={32}
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {(currentUser?.nickname || "我").slice(0, 1)}
                </div>
              )}
            </button>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <aside className="w-[380px] flex-shrink-0 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-y-auto">
            <div className="p-4 space-y-4">
              <SidebarSection title="群聊">
                {groups.length === 0 ? (
                  <EmptyPanel title="暂无群聊" description="点击右上角添加或加入群聊" className="min-h-[140px]" />
                ) : (
                  groups.map((group) => {
                    const isActive = currentGroup?.group_id === group.group_id;
                    return (
                      <a
                        key={group.group_id}
                        className={`flex items-center gap-3 rounded-2xl p-3 cursor-pointer transition-colors ${
                          isActive
                            ? "bg-primary/10 dark:bg-primary/20 text-primary"
                            : "bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800"
                        }`}
                        onClick={() => selectGroup(group)}
                      >
                        <div className="relative h-10 w-10 overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
                          <Image
                            src={group.avatar || "/default-group-avatar.png"}
                            alt={group.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <span className={`flex-1 truncate text-sm ${isActive ? 'font-semibold' : ''}`}>
                          {group.name}
                        </span>
                        {group.member_count ? (
                          <span className="text-xs text-slate-400">{group.member_count}</span>
                        ) : null}
                      </a>
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
                    const friendUser = friend.friend_user;

                    return (
                      <a
                        key={friend.id}
                        className={`flex items-center gap-3 rounded-2xl p-3 cursor-pointer transition-colors ${
                          isActive
                            ? "bg-primary/10 dark:bg-primary/20 text-primary"
                            : "bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800"
                        }`}
                        onClick={() => selectFriend(friend)}
                      >
                        <div className="relative inline-block">
                          <Image
                            className="size-10 rounded-full object-cover"
                            src={friendUser?.avatar || "/default-avatar.png"}
                            alt={friendUser?.nickname || "User"}
                            width={40}
                            height={40}
                          />
                          <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white dark:ring-slate-900"></span>
                        </div>
                        <span className={`flex-1 truncate text-sm ${isActive ? 'font-semibold' : ''}`}>
                          {friend.remark || friendUser?.nickname || `用户${friendUser?.user_id}`}
                        </span>
                      </a>
                    );
                  })
                )}
              </SidebarSection>
            </div>
          </aside>

          <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950/30">
            <div className="h-full p-8">
              <SectionCard className="mb-6 p-2">
                <div className="flex items-center gap-2">
                  <button
                    className={`relative rounded-2xl px-4 py-2 text-sm font-medium ${
                      activeRightTab === 'detail'
                        ? 'bg-primary/10 text-primary dark:bg-primary/20'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                    onClick={() => setActiveRightTab('detail')}
                  >
                    详情
                  </button>
                  <button
                    className={`relative rounded-2xl px-4 py-2 text-sm font-medium ${
                      activeRightTab === 'requests'
                        ? 'bg-primary/10 text-primary dark:bg-primary/20'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                    onClick={() => setActiveRightTab('requests')}
                  >
                    好友请求
                    {pendingRequestCount > 0 && (
                      <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white">
                        {pendingRequestCount > 99 ? '99+' : pendingRequestCount}
                      </span>
                    )}
                  </button>
                </div>
              </SectionCard>

              {/* 右侧内容 */}
              {activeRightTab === 'requests' ? (
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
                          <FriendRequestItem
                            key={req.id}
                            request={req}
                            type="sent"
                          />
                        ))
                      )}
                    </div>
                  </SectionCard>
                </div>
              ) : selectedFriend && friendUser ? (
                // 好友详情
                <>
                  <SectionCard>
                    <div className="flex flex-col items-center gap-6 text-center">
                      <div className="relative inline-block">
                        <Image
                          alt={`${friendUser.nickname}'s avatar`}
                          className="size-32 rounded-full object-cover"
                          src={friendUser.avatar || "/default-avatar.png"}
                          width={128}
                          height={128}
                        />
                        <span className="absolute bottom-2 right-2 block h-6 w-6 rounded-full bg-green-500 ring-4 ring-white dark:ring-background-light"></span>
                      </div>
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
                            <p className="text-slate-800 dark:text-slate-200">{friendUser.email || '未填写'}</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <SectionTitle title="备注信息" className="mb-4 border-b border-slate-200 pb-2 dark:border-slate-800" />
                        <div>
                          <label className="sr-only" htmlFor="contact-note">My Note for this contact</label>
                          <input
                            className="w-full rounded-2xl border border-slate-300 bg-background-light px-4 py-3 dark:border-slate-700 dark:bg-background-dark focus:border-primary focus:ring-primary"
                            id="contact-note"
                            placeholder="添加备注"
                            type="text"
                            value={remark}
                            onChange={(e) => setRemark(e.target.value)}
                          />
                        </div>
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
                </>
              ) : currentGroup ? (
                // 群聊详情（整合自群聊页）
                <GroupDetailInline
                  group={currentGroup}
                  onLeave={async () => {
                    await loadUserGroups();
                    setCurrentGroup(null);
                  }}
                />
              ) : (
                <EmptyPanel title="从左侧选择群聊或联系人查看详情" description="也可以使用右上角按钮添加好友或加入群聊" className="min-h-[520px] border-solid bg-white dark:bg-slate-900" />
              )}
            </div>
          </main>
        </div>
      </div>

      {/* 添加好友弹窗 */}
      {showAddFriend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined rounded-full bg-primary/10 p-2 text-primary">person_add</span>
                <h2 className="text-lg font-bold text-slate-800">添加好友</h2>
              </div>
              <button
                onClick={() => {
                  setShowAddFriend(false);
                  setSearchInput("");
                  setSearchResult(null);
                }}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="mb-6 space-y-2">
              <label className="text-sm font-medium text-slate-600">搜索用户</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    search
                  </span>
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSearchFriend();
                    }}
                    placeholder="输入用户ID或手机号"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2 pl-10 pr-3 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
                <button
                  onClick={handleSearchFriend}
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
                >
                  搜索
                </button>
              </div>
            </div>

            {searchResult ? (
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                <div className="flex items-center gap-4">
                  <Image
                    src={searchResult.avatar || "https://via.placeholder.com/56"}
                    alt={searchResult.nickname}
                    width={56}
                    height={56}
                    className="h-14 w-14 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-semibold text-slate-800">{searchResult.nickname}</p>
                    <p className="text-sm text-slate-500">ID: {searchResult.user_id}</p>
                  </div>
                  <button
                    onClick={handleSendRequest}
                    className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white"
                  >
                    添加
                  </button>
                </div>
              </div>
            ) : searchInput ? (
              <p className="py-6 text-center text-sm text-slate-400">点击搜索按钮查找用户</p>
            ) : (
              <p className="py-6 text-center text-sm text-slate-400">输入信息开始搜索</p>
            )}
          </div>
        </div>
      )}

      {/* 添加/加入群聊弹窗 */}
      {showJoinGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined rounded-full bg-primary/10 p-2 text-primary">group_add</span>
                <h2 className="text-lg font-bold text-slate-800">搜索并加入群聊</h2>
              </div>
              <button
                onClick={() => {
                  setShowJoinGroup(false);
                  setGroupSearchKeyword("");
                  setGroupSearchResults([]);
                }}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="mb-4 flex gap-2">
              <div className="relative flex-1">
                <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  search
                </span>
                <input
                  type="text"
                  value={groupSearchKeyword}
                  onChange={(e) => setGroupSearchKeyword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearchGroups();
                  }}
                  placeholder="输入群组关键词或群号"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2 pl-10 pr-3 text-sm focus:border-primary focus:outline-none"
                />
              </div>
              <button
                onClick={handleSearchGroups}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
              >
                搜索
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2">
              {groupSearchResults.length === 0 ? (
                <p className="py-10 text-center text-sm text-slate-400">输入关键词后搜索群聊</p>
              ) : (
                groupSearchResults.map((group) => (
                  <div
                    key={group.group_id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-100 cursor-pointer"
                  >
                    <div
                      className="bg-center bg-no-repeat aspect-square bg-cover rounded-lg size-12"
                      style={{ backgroundImage: `url(${group.avatar || '/default-group-avatar.png'})` }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-900 font-medium text-sm truncate">{group.name}</p>
                      <p className="text-slate-500 text-xs">{group.member_count} 人 · 群号 {group.group_id}</p>
                    </div>
                    <button
                      onClick={() => handleJoinGroup(group.group_id)}
                      className="bg-primary hover:bg-primary/90 text-white px-3 py-1 rounded text-xs"
                    >
                      加入
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 群聊详情（整合）
function GroupDetailInline({ group, onLeave }: { group: Group; onLeave?: () => void }) {
  const { groupMembers, setGroupMembers } = useGroupStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const members = groupMembers[group.group_id] || [];

  const loadMembers = async () => {
    try {
      setLoading(true);
      const res = await GroupAPI.getGroupMembers(group.group_id);
      if (res.data.code === 0) {
        setGroupMembers(group.group_id, res.data.data);
      }
      setError(null);
    } catch (e) {
      console.error("加载群成员失败:", e);
      setError("加载群成员失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group.group_id]);

  const handleLeave = async () => {
    if (!confirm("确定要退出该群聊吗？")) return;
    try {
      const res = await GroupAPI.leaveGroup(group.group_id);
      if (res.data.code === 0) {
        alert("已退出群聊");
        onLeave?.();
      }
    } catch (e) {
      const errorMsg = (e as { response?: { data?: { msg?: string } } }).response?.data?.msg;
      alert(errorMsg || "退出群聊失败");
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* 群组信息头部 */}
      <div className="flex-shrink-0 p-6 border border-slate-200 dark:border-slate-800 rounded-xl">
        <div className="flex items-center gap-4">
          <div
            className="bg-center bg-no-repeat aspect-square bg-cover rounded-lg size-16"
            style={{ backgroundImage: `url(${group.avatar || '/default-group-avatar.png'})` }}
          />
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{group.name}</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              {group.description || '暂无群描述'}
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
              {group.member_count} 人 · 群号: {group.group_id}
            </p>
          </div>
          <div className="flex gap-2">
            <button className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm">
              发消息
            </button>
            <button
              onClick={handleLeave}
              className="border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm"
            >
              退出群组
            </button>
          </div>
        </div>
      </div>

      {/* 群成员列表 */}
      <div className="flex-1 overflow-y-auto p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">群成员</h3>
        {loading ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">加载中...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((member) => (
              <div
                key={member.user_id}
                className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div
                  className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10"
                  style={{ backgroundImage: `url(${member.user?.avatar || '/default-avatar.png'})` }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 dark:text-white font-medium text-sm truncate">
                    {member.nickname || member.user?.nickname || `用户${member.user_id}`}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 text-xs">
                    {member.role === 3 ? '群主' : member.role === 2 ? '管理员' : '成员'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mx-6 mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
          <button onClick={() => setError(null)} className="ml-3 text-xs text-red-600 underline">知道了</button>
        </div>
      )}
    </div>
  );
}
