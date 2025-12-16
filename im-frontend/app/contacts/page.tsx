"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { FriendItem } from "@/components/contacts/FriendItem";
import { FriendRequestItem } from "@/components/contacts/FriendRequestItem";
import { NavTabs } from "@/components/ui/nav-tabs";
import { useAuthStore } from "@/lib/store";
import { useContactStore } from "@/lib/store/contact";
import { useChatStore } from "@/lib/store/chat";
import { FriendAPI } from "@/lib/api/friend";
import { MessageAPI } from "@/lib/api/message";
import { UserAPI } from "@/lib/api/user";
import type { User, FriendRequest } from "@/lib/types/api";
import { useRouter } from "next/navigation";
import { wsClient } from "@/lib/websocket/client";

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
    searchResult,
    setSearchResult,
    pendingRequestCount,
    setPendingRequestCount,
  } = useContactStore();
  
  const { setCurrentConversation } = useChatStore();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<"friends" | "requests">("friends");
  const [searchInput, setSearchInput] = useState("");
  const [remark, setRemark] = useState("");
  const [showAddFriend, setShowAddFriend] = useState(false);

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

  // 初始加载
  useEffect(() => {
    if (token) {
      loadFriends();
      loadReceivedRequests();
      loadSentRequests();
      
      // 连接WebSocket
      wsClient.connect(token);
      
      // 监听好友请求
      const handleFriendRequest = (request: FriendRequest) => {
        console.log('📨 收到新的好友请求:', request);
        // 重新加载好友请求列表
        loadReceivedRequests();
        // 可以显示通知
        alert(`收到来自 ${request.from_user?.nickname || request.from_user_id} 的好友请求`);
      };
      
      // 监听好友请求被接受
      const handleFriendAccepted = (data: { friend?: { nickname: string } }) => {
        console.log('✅ 好友请求已被接受:', data);
        // 重新加载好友列表和发出的请求
        loadFriends();
        loadSentRequests();
        // 可以显示通知
        if (data.friend) {
          alert(`${data.friend.nickname} 已同意你的好友请求`);
        }
      };
      
      wsClient.onFriendRequest(handleFriendRequest);
      wsClient.onFriendAccepted(handleFriendAccepted);
      
      // 清理
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

  // 搜索用户
  const handleSearch = async () => {
    if (!searchInput.trim()) return;

    try {
      const res = await FriendAPI.searchFriend(searchInput.trim());
      if (res.data.code === 0) {
        setSearchResult(res.data.data);
        setShowAddFriend(true);
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

  // 发送消息
  const handleSendMessage = async () => {
    if (!selectedFriend) return;

    try {
      // 创建或获取会话
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

  const friendUser = selectedFriend?.friend_user;

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-800 dark:text-slate-200">
      <div className="flex h-screen flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6">
          <div className="flex items-center gap-8">
            <nav className="flex items-center gap-6">
              <a className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary" href="/chat">聊天</a>
              <a className="text-sm font-medium text-primary" href="/contacts">通讯录</a>
              <a className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary" href="/moments">朋友圈</a>
              <a className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary" href="/me">我的</a>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowAddFriend(true)}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90"
            >
              <span className="material-symbols-outlined text-base">person_add</span>
              添加好友
            </button>
            <button className="relative">
              {currentUser?.avatar && (
                <img
                  alt="User avatar"
                  className="h-8 w-8 rounded-full object-cover"
                  src={currentUser.avatar}
                />
              )}
            </button>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <aside className="w-80 flex-shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-y-auto">
            <div className="p-4">
              <details className="group" open>
                <summary className="flex cursor-pointer items-center justify-between py-2 font-semibold text-slate-800 dark:text-slate-200">
                  <span>群聊</span>
                  <span className="material-symbols-outlined transition-transform group-open:rotate-90">chevron_right</span>
                </summary>
                <div className="mt-2 space-y-1">
                  <a className="flex items-center gap-3 rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800" href="#">
                    <div className="size-8 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                    <span className="flex-1 truncate text-sm">Tech Enthusiasts</span>
                  </a>
                  <a className="flex items-center gap-3 rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800" href="#">
                    <div className="size-8 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                    <span className="flex-1 truncate text-sm">Book Club</span>
                  </a>
                  <a className="flex items-center gap-3 rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800" href="#">
                    <div className="size-8 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                    <span className="flex-1 truncate text-sm">Travel Buddies</span>
                  </a>
                </div>
              </details>
            </div>
            <div className="border-t border-slate-200 dark:border-slate-800 p-4">
              <details className="group" open>
                <summary className="flex cursor-pointer items-center justify-between py-2 font-semibold text-slate-800 dark:text-slate-200">
                  <span>我的好友</span>
                  <span className="material-symbols-outlined transition-transform group-open:rotate-90">chevron_right</span>
                </summary>
                <div className="mt-2 space-y-1">
                  {friends.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-300 bg-white py-6 text-center text-xs text-slate-400">
                      暂无好友，点击右上角添加
                    </div>
                  ) : (
                    friends.map((friend) => {
                      const isActive = selectedFriend?.id === friend.id;
                      const friendUser = friend.friend_user;

                      return (
                        <a
                          key={friend.id}
                          className={`flex items-center gap-3 rounded-lg p-2 cursor-pointer transition-colors ${
                            isActive
                              ? "bg-primary/10 dark:bg-primary/20 text-primary"
                              : "hover:bg-slate-100 dark:hover:bg-slate-800"
                          }`}
                          onClick={() => setSelectedFriend(friend)}
                        >
                          <div className="relative inline-block">
                            <img
                              className="size-8 rounded-full object-cover"
                              src={friendUser?.avatar || '/default-avatar.png'}
                              alt={friendUser?.nickname || 'User'}
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
                </div>
              </details>
            </div>
          </aside>

          <main className="flex-1 overflow-y-auto p-8">
            <div className="mx-auto max-w-2xl">
              {selectedFriend && friendUser ? (
                <>
                  <div className="flex flex-col items-center gap-6 text-center">
                    <div className="relative inline-block">
                      <img
                        alt={`${friendUser.nickname}'s avatar`}
                        className="size-32 rounded-full object-cover"
                        src={friendUser.avatar || '/default-avatar.png'}
                      />
                      <span className="absolute bottom-2 right-2 block h-6 w-6 rounded-full bg-green-500 ring-4 ring-white dark:ring-background-light"></span>
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                        {selectedFriend.remark || friendUser.nickname}
                      </h2>
                      <p className="text-slate-500 dark:text-slate-400">
                        昵称: {friendUser.nickname}
                      </p>
                    </div>
                  </div>

                  <div className="mt-12 space-y-8">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 border-b border-slate-200 dark:border-slate-800 pb-2">
                        基础信息
                      </h3>
                      <div className="space-y-3">
                        <div className="flex">
                          <p className="w-24 shrink-0 text-slate-500 dark:text-slate-400">User ID</p>
                          <p className="text-slate-800 dark:text-slate-200">{friendUser.user_id}</p>
                        </div>
                        <div className="flex">
                          <p className="w-24 shrink-0 text-slate-500 dark:text-slate-400">邮箱</p>
                          <p className="text-slate-800 dark:text-slate-200">{friendUser.email || '未填写'}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 border-b border-slate-200 dark:border-slate-800 pb-2">
                        备注信息
                      </h3>
                      <div>
                        <label className="sr-only" htmlFor="contact-note">My Note for this contact</label>
                        <input
                          className="w-full rounded-lg border-slate-300 dark:border-slate-700 bg-background-light dark:bg-background-dark focus:border-primary focus:ring-primary"
                          id="contact-note"
                          placeholder="添加备注"
                          type="text"
                          value={remark}
                          onChange={(e) => setRemark(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-12 flex justify-center gap-4">
                    <button
                      onClick={handleSendMessage}
                      className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary/90"
                    >
                      发送消息
                    </button>
                    <button
                      onClick={handleUpdateRemark}
                      className="rounded-lg bg-slate-200 dark:bg-slate-800 px-6 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700"
                    >
                      保存备注
                    </button>
                    <button
                      onClick={handleDeleteFriend}
                      className="rounded-lg bg-red-100 dark:bg-red-900/20 px-6 py-2.5 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/30"
                    >
                      删除联系人
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-slate-400">
                  <span className="material-symbols-outlined text-6xl text-slate-300">account_circle</span>
                  <p className="mt-4 text-lg font-semibold text-slate-600">选择一个联系人查看详情</p>
                  <p className="text-sm">在左侧列表点击好友即可查看资料</p>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

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
                      if (e.key === "Enter") handleSearch();
                    }}
                    placeholder="输入用户ID或手机号"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2 pl-10 pr-3 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
                <button
                  onClick={handleSearch}
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
    </div>
  );
}
