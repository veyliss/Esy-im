"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuthStore } from "@/lib/store";
import { useChatStore } from "@/lib/store/chat";
import { useGroupStore } from "@/lib/store/group";
import { MessageAPI } from "@/lib/api/message";
import { GroupAPI } from "@/lib/api/group";
import { wsClient } from "@/lib/websocket/client";
import type { Message, MessageType, Conversation, Group, GroupMessage, GroupMessageType } from "@/lib/types/api";
import { UserAPI } from "@/lib/api/user";
import type { User } from "@/lib/types/api";
import { handleApiError, createUserFriendlyErrorMessage, isNetworkError, isWebSocketError } from "@/lib/utils/errors";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { TopBarActions, TopStatusPill } from "@/components/layout/top-actions";
import { EmptyPanel, SidebarItem, SidebarScrollArea, SidebarSearch, SidebarSection, SidebarToolbar, WorkspaceSidebar } from "@/components/workspace/section";
import { UserAvatar } from "@/components/ui/user-avatar";
import { ErrorAlert } from "@/components/ui/error-alert";
import { useAppInteractions } from "@/components/ui/app-interactions";

// 聊天项目类型（私聊或群聊）
type ChatItem = {
  type: 'private' | 'group';
  id: string;
  name: string;
  avatar: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  data: Conversation | Group;
};

export default function ChatPage() {
  const { toast } = useAppInteractions();
  const token = useAuthStore((state) => state.token);
  const {
    conversations,
    setConversations,
    messages: privateMessages,
    setMessages: setPrivateMessages,
    addMessage: addPrivateMessage,
    unreadCount: privateUnreadCount,
    setUnreadCount: setPrivateUnreadCount,
    wsConnected,
    setWsConnected,
  } = useChatStore();

  const {
    groups,
    setGroups,
    groupMessages,
    setGroupMessages,
    addGroupMessage,
    groupUnreadCounts,
    setGroupUnreadCount,
  } = useGroupStore();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentChat, setCurrentChat] = useState<ChatItem | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [chatFilter, setChatFilter] = useState("");
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
        const apiError = handleApiError(error);
        setError(createUserFriendlyErrorMessage(apiError));
      }
    };

    if (token) {
      loadCurrentUser();
    }
  }, [token]);

  // 初始化WebSocket连接
  useEffect(() => {
    if (!token) return;

    // 连接WebSocket
    wsClient.connect(token);

    // 监听连接状态
    const handleConnect = () => {
      setWsConnected(true);
      setConnectionError(null);
    };
    const handleDisconnect = () => {
      setWsConnected(false);
      setConnectionError("连接已断开，正在尝试重连...");
    };
    const handleError = (error: unknown) => {
      console.error("WebSocket错误:", error);
      const apiError = handleApiError(error);
      setConnectionError(createUserFriendlyErrorMessage(apiError));
    };
    
    wsClient.onConnect(handleConnect);
    wsClient.onDisconnect(handleDisconnect);
    wsClient.onError(handleError);

    // 监听私聊消息
    const handlePrivateMessage = (message: Message) => {
      console.log("收到私聊消息:", message);
      
      try {
        // 验证消息数据
        if (!message.id || !message.conversation_id) {
          console.warn("收到不完整的消息数据:", message);
          return;
        }
        
        // 如果是当前私聊会话的消息,添加到消息列表
        if (currentChat?.type === 'private' && 
            currentChat.data && 
            'id' in currentChat.data && 
            message.conversation_id === currentChat.data.id) {
          addPrivateMessage(message);
          // 标记为已读
          MessageAPI.markConversationAsRead(currentChat.data.id).catch(err => {
            console.error("标记消息已读失败:", err);
          });
        }
        
        // 刷新会话列表
        loadConversations();
        loadPrivateUnreadCount();
      } catch (error) {
        console.error("处理私聊消息失败:", error);
      }
    };

    // 监听群聊消息
    const handleGroupMessage = (message: GroupMessage) => {
      console.log("收到群聊消息:", message);
      
      try {
        // 验证消息数据
        if (!message.id || !message.group_id) {
          console.warn("收到不完整的群消息数据:", message);
          return;
        }
        
        // 如果是当前群聊的消息,添加到消息列表
        if (currentChat?.type === 'group' && 
            currentChat.data && 
            'group_id' in currentChat.data && 
            message.group_id === currentChat.data.group_id) {
          addGroupMessage(currentChat.data.group_id, message);
          // 标记为已读
          GroupAPI.markGroupMessagesAsRead(currentChat.data.group_id).catch(err => {
            console.error("标记群消息已读失败:", err);
          });
        } else {
          // 增加未读数
          setGroupUnreadCount(message.group_id, (groupUnreadCounts[message.group_id] || 0) + 1);
        }
        
        // 刷新群组列表
        loadGroups();
      } catch (error) {
        console.error("处理群聊消息失败:", error);
      }
    };

    wsClient.onMessage(handlePrivateMessage);
    wsClient.onGroupMessage(handleGroupMessage);

    // 清理
    return () => {
      wsClient.offConnect(handleConnect);
      wsClient.offDisconnect(handleDisconnect);
      wsClient.offMessage(handlePrivateMessage);
      wsClient.offGroupMessage(handleGroupMessage);
      wsClient.offError(handleError);
    };
    // WebSocket handlers intentionally resubscribe only when token or active chat changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, currentChat]);

  // 加载私聊会话列表
  const loadConversations = async () => {
    try {
      const res = await MessageAPI.getConversationList();
      if (res.data.code === 0) {
        setConversations(res.data.data);
      }
    } catch (error) {
      console.error("加载会话列表失败:", error);
      const apiError = handleApiError(error);
      setError(createUserFriendlyErrorMessage(apiError));
    }
  };

  // 加载群组列表
  const loadGroups = async () => {
    try {
      const res = await GroupAPI.getUserGroups();
      if (res.data.code === 0) {
        setGroups(res.data.data);
      }
    } catch (error) {
      console.error("加载群组列表失败:", error);
      const apiError = handleApiError(error);
      setError(createUserFriendlyErrorMessage(apiError));
    }
  };

  // 加载私聊未读消息数
  const loadPrivateUnreadCount = async () => {
    try {
      const res = await MessageAPI.getUnreadCount();
      if (res.data.code === 0) {
        setPrivateUnreadCount(res.data.data.count);
      }
    } catch (error) {
      console.error("加载未读消息数失败:", error);
    }
  };

  // 加载群聊未读消息数
  const loadGroupUnreadCounts = async () => {
    try {
      for (const group of groups) {
        const res = await GroupAPI.getGroupUnreadCount(group.group_id);
        if (res.data.code === 0) {
          setGroupUnreadCount(group.group_id, res.data.data.count);
        }
      }
    } catch (error) {
      console.error("加载群聊未读消息数失败:", error);
    }
  };

  // 加载私聊消息
  const loadPrivateMessages = async (conversationId: number) => {
    try {
      const res = await MessageAPI.getConversationMessages(conversationId, {
        page: 1,
        page_size: 50,
      });
      if (res.data.code === 0) {
        const messages = res.data.data.filter(msg => msg.id && msg.conversation_id);
        setPrivateMessages(messages);
        // 标记为已读
        await MessageAPI.markConversationAsRead(conversationId);
        // 刷新未读数和会话列表
        await loadPrivateUnreadCount();
        await loadConversations();
      }
    } catch (error) {
      console.error("加载私聊消息失败:", error);
      const apiError = handleApiError(error);
      setError(createUserFriendlyErrorMessage(apiError));
    }
  };

  // 加载群聊消息
  const loadGroupMessages = async (groupId: string) => {
    try {
      const res = await GroupAPI.getGroupMessages(groupId, {
        page: 1,
        page_size: 50,
      });
      if (res.data.code === 0) {
        setGroupMessages(groupId, res.data.data);
        // 标记为已读
        await GroupAPI.markGroupMessagesAsRead(groupId);
        // 清空未读数
        setGroupUnreadCount(groupId, 0);
      }
    } catch (error) {
      console.error("加载群聊消息失败:", error);
      const apiError = handleApiError(error);
      setError(createUserFriendlyErrorMessage(apiError));
    }
  };

  // 初始加载
  useEffect(() => {
    if (token) {
      loadConversations();
      loadGroups();
      loadPrivateUnreadCount();
    }
    // Initial data bootstrap is tied to auth token changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // 加载群聊未读数
  useEffect(() => {
    if (groups.length > 0) {
      loadGroupUnreadCounts();
    }
    // Unread counts refresh when the group list changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups]);

  // 选择聊天
  const handleSelectChat = async (chatItem: ChatItem) => {
    setError(null);
    setCurrentChat(chatItem);
    setInspectorOpen(false);
    
    if (chatItem.type === 'private' && 'id' in chatItem.data) {
      await loadPrivateMessages(chatItem.data.id);
    } else if (chatItem.type === 'group' && 'group_id' in chatItem.data) {
      await loadGroupMessages(chatItem.data.group_id);
    }
  };

  // 发送消息
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !currentChat || !currentUser) return;

    setSendingMessage(true);
    setError(null);
    
    try {
      const content = messageInput.trim();
      if (content.length === 0) {
        setError("消息内容不能为空");
        return;
      }
      
      if (content.length > 1000) {
        setError("消息内容过长，请控制在1000字符以内");
        return;
      }

      if (currentChat.type === 'private' && 'id' in currentChat.data) {
        // 发送私聊消息
        const conversation = currentChat.data as Conversation;
        const toUserId = conversation.user1_id === currentUser.user_id
          ? conversation.user2_id
          : conversation.user1_id;

        const res = await MessageAPI.sendMessage({
          to_user_id: toUserId,
          message_type: 1 as MessageType,
          content: content,
        });

        if (res.data.code === 0) {
          const message = res.data.data;
          if (!message.id) {
            throw new Error("发送成功但返回的消息数据不完整");
          }
          
          addPrivateMessage(message);
          setMessageInput("");
          await loadConversations();
        }
      } else if (currentChat.type === 'group' && 'group_id' in currentChat.data) {
        // 发送群聊消息
        const group = currentChat.data as Group;
        
        const res = await GroupAPI.sendGroupMessage({
          group_id: group.group_id,
          message_type: 1 as GroupMessageType,
          content: content,
        });

        if (res.data.code === 0) {
          const message = res.data.data;
          if (!message.id) {
            throw new Error("发送成功但返回的消息数据不完整");
          }
          
          addGroupMessage(group.group_id, message);
          setMessageInput("");
          await loadGroups();
        }
      }
    } catch (error) {
      console.error("发送消息失败:", error);
      const apiError = handleApiError(error);
      const userMessage = createUserFriendlyErrorMessage(apiError);
      
      if (isNetworkError(apiError)) {
        setError(`${userMessage}，消息已保存到本地，网络恢复后将自动重发`);
      } else if (isWebSocketError(apiError)) {
        setError(`${userMessage}，消息可能延迟送达`);
      } else {
        setError(userMessage);
      }
      toast(userMessage, { tone: "error", title: "发送失败" });
    } finally {
      setSendingMessage(false);
    }
  };

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [privateMessages, groupMessages]);

  // 合并并排序聊天列表
  const chatList = useMemo(() => {
    const items: ChatItem[] = [];

    // 添加私聊会话
    conversations.forEach(conversation => {
      const opponent = conversation.user1_id === currentUser?.user_id
        ? conversation.user2
        : conversation.user1;
      
      const unreadCount = conversation.user1_id === currentUser?.user_id
        ? conversation.user1_unread
        : conversation.user2_unread;

      items.push({
        type: 'private',
        id: `private_${conversation.id}`,
        name: opponent?.nickname || `用户${opponent?.user_id}`,
        avatar: opponent?.avatar || '/default-avatar.png',
        lastMessage: conversation.last_message?.content || '暂无消息',
        lastMessageTime: conversation.last_message?.created_at,
        unreadCount: unreadCount,
        data: conversation,
      });
    });

    // 添加群聊
    groups.forEach(group => {
      items.push({
        type: 'group',
        id: `group_${group.group_id}`,
        name: group.name,
        avatar: group.avatar || '/default-group-avatar.png',
        lastMessage: '', // TODO: 获取群聊最后一条消息
        lastMessageTime: group.updated_at,
        unreadCount: groupUnreadCounts[group.group_id] || 0,
        data: group,
      });
    });

    // 按最后消息时间排序
    return items.sort((a, b) => {
      const timeA = new Date(a.lastMessageTime || 0).getTime();
      const timeB = new Date(b.lastMessageTime || 0).getTime();
      return timeB - timeA;
    });
  }, [conversations, groups, currentUser, groupUnreadCounts]);

  // 过滤聊天列表
  const filteredChatList = useMemo(() => {
    const keyword = chatFilter.trim().toLowerCase();
    if (!keyword) return chatList;
    return chatList.filter(item => 
      item.name.toLowerCase().includes(keyword) ||
      (item.lastMessage && item.lastMessage.toLowerCase().includes(keyword))
    );
  }, [chatFilter, chatList]);

  // 获取当前消息列表
  const currentMessages = useMemo(() => {
    if (!currentChat) return [];
    
    if (currentChat.type === 'private' && 'id' in currentChat.data) {
      return privateMessages;
    } else if (currentChat.type === 'group' && 'group_id' in currentChat.data) {
      return groupMessages[currentChat.data.group_id] || [];
    }
    
    return [];
  }, [currentChat, privateMessages, groupMessages]);

  // 计算总未读数
  const totalUnreadCount = useMemo(() => {
    const groupUnread = Object.values(groupUnreadCounts).reduce((sum, count) => sum + count, 0);
    return privateUnreadCount + groupUnread;
  }, [privateUnreadCount, groupUnreadCounts]);

  return (
    <WorkspaceShell
      active="chat"
      navVariant="modern"
      mobileDetailActive={Boolean(currentChat)}
      rightSlot={
        <TopBarActions
          avatarSrc={currentUser?.avatar}
          avatarName={currentUser?.nickname || "我"}
          avatarStatus={wsConnected ? "online" : "away"}
          showAvatarStatus
        >
          <TopStatusPill tone={wsConnected ? "online" : "warning"}>
            <span className={`size-2 rounded-full ${wsConnected ? "bg-green-500" : "bg-amber-400"}`} />
            {wsConnected ? "已连接" : "连接中"}
          </TopStatusPill>
          {totalUnreadCount > 0 ? (
            <TopStatusPill tone="primary">
              未读 {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
            </TopStatusPill>
          ) : null}
        </TopBarActions>
      }
      mainClassName="bg-gradient-to-b from-slate-50/80 to-white dark:from-[#0f172a] dark:to-[#0f172a]"
      sidebar={
        <WorkspaceSidebar>
          <SidebarToolbar>
            <SidebarSearch
              type="text"
              placeholder="搜索聊天"
              value={chatFilter}
              onChange={(e) => setChatFilter(e.target.value)}
            />
          </SidebarToolbar>

          <SidebarSection title="会话列表" className="flex min-h-0 flex-1 flex-col py-4" bodyClassName="flex-1">
            <SidebarScrollArea className="pt-2">
              <div className="space-y-1 px-1">
                {filteredChatList.length === 0 ? (
                  <EmptyPanel
                    title={chatFilter.trim() ? "未找到相关聊天" : "暂无聊天记录"}
                    description={chatFilter.trim() ? "尝试更换关键词" : "去通讯录添加好友，或到群聊页面创建群聊"}
                    className="min-h-[220px] border-0 bg-transparent"
                  />
                ) : (
                  filteredChatList.map((chatItem) => {
                    const isActive = currentChat?.id === chatItem.id;

                    return (
                      <SidebarItem
                        key={chatItem.id}
                        onClick={() => handleSelectChat(chatItem)}
                        active={isActive}
                        className="min-h-[72px]"
                      >
                        <div className="relative">
                          <UserAvatar
                            src={chatItem.avatar}
                            name={chatItem.name}
                            size="md"
                            shape={chatItem.type === "group" ? "rounded" : "circle"}
                            border
                          />
                          {chatItem.type === "group" ? (
                            <span className="absolute -bottom-1 -right-1 rounded bg-slate-700 px-1 text-[10px] font-semibold text-white dark:bg-slate-200 dark:text-slate-900">
                              群
                            </span>
                          ) : null}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className={`truncate text-sm ${isActive ? "font-semibold text-primary" : "font-semibold text-slate-900 dark:text-slate-100"}`}>{chatItem.name}</p>
                            <p className="shrink-0 text-xs text-slate-500 dark:text-slate-400">
                              {chatItem.lastMessageTime
                                ? new Date(chatItem.lastMessageTime).toLocaleTimeString("zh-CN", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : ""}
                            </p>
                          </div>
                          <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">{chatItem.lastMessage || "暂无消息"}</p>
                        </div>

                        {chatItem.unreadCount > 0 ? (
                          <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-white">
                            {chatItem.unreadCount > 99 ? "99+" : chatItem.unreadCount}
                          </span>
                        ) : null}
                      </SidebarItem>
                    );
                  })
                )}
              </div>
            </SidebarScrollArea>
          </SidebarSection>
        </WorkspaceSidebar>
      }
      main={
        currentChat ? (
          <div className="flex h-full min-w-0 flex-1 flex-col bg-white dark:bg-slate-900">
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 dark:border-slate-800 min-h-[76px] px-8 max-sm:px-4 bg-white/92 dark:bg-slate-900/86 backdrop-blur-md">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  className="chat-mobile-back workspace-icon-button"
                  onClick={() => {
                    setCurrentChat(null);
                    setInspectorOpen(false);
                  }}
                  aria-label="返回会话列表"
                  title="返回"
                >
                  <span className="material-symbols-outlined text-xl">arrow_back</span>
                </button>
                <UserAvatar
                  src={currentChat.avatar}
                  name={currentChat.name}
                  size="md"
                  shape={currentChat.type === "group" ? "rounded" : "circle"}
                  border
                />
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-bold text-slate-900 dark:text-white">{currentChat.name}</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {currentChat.type === "group" && "member_count" in currentChat.data ? `${currentChat.data.member_count} 位成员` : wsConnected ? "在线" : "连接中"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="workspace-icon-button"
                onClick={() => setInspectorOpen((value) => !value)}
                aria-label="查看资料"
                title="查看资料"
              >
                <span className="material-symbols-outlined text-xl">info</span>
              </button>
            </div>

            <ErrorAlert
              error={connectionError}
              type="warning"
              onClose={() => setConnectionError(null)}
              className="mx-8 mt-5"
            />
            <ErrorAlert error={error} onClose={() => setError(null)} className="mx-8 mt-3" />

            <div className="chat-message-list flex-1 space-y-6 overflow-y-auto">
              {currentMessages.length === 0 ? (
                <EmptyPanel title="暂无消息" description="开始发送第一条消息吧" className="min-h-[420px] border-0 bg-transparent" />
              ) : (
                currentMessages.map((message) => {
                  const isMyMessage = message.from_user_id === currentUser?.user_id;
                  const messageUser = isMyMessage ? currentUser : message.from_user;
                  const messageTime = message.created_at
                    ? new Date(message.created_at).toLocaleTimeString("zh-CN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "";

                  if (isMyMessage) {
                    return (
                      <div key={message.id} className="flex justify-end gap-3 items-start">
                        <div className="flex max-w-[72%] min-w-0 flex-col items-end">
                          <div className="w-fit max-w-full rounded-lg rounded-tr-[2px] bg-primary px-4 py-3 text-white text-sm leading-relaxed shadow-[0_12px_28px_-22px_rgba(19,127,236,0.8)]">
                            {message.content}
                          </div>
                          {messageTime ? <span className="mt-[5px] text-[11px] text-slate-400 dark:text-slate-500">{messageTime}</span> : null}
                        </div>
                        <UserAvatar
                          src={messageUser?.avatar}
                          name={messageUser?.nickname || "我"}
                          size="md"
                          border
                          className="shrink-0"
                        />
                      </div>
                    );
                  }

                  return (
                    <div key={message.id} className="flex gap-3 items-start">
                      <UserAvatar
                        src={messageUser?.avatar}
                        name={messageUser?.nickname || `用户${message.from_user_id}`}
                        size="md"
                        border
                        className="shrink-0"
                      />
                      <div className="flex max-w-[72%] min-w-0 flex-col">
                        {currentChat.type === "group" ? (
                          <p className="mb-1 text-xs font-semibold text-slate-400 dark:text-slate-500">
                            {messageUser?.nickname || `用户${message.from_user_id}`}
                          </p>
                        ) : null}
                        <div className="w-fit max-w-full rounded-lg rounded-tl-[2px] bg-slate-100 dark:bg-slate-800 px-4 py-3 text-slate-800 dark:text-slate-200 text-sm leading-relaxed shadow-[0_1px_0_rgba(15,23,42,0.06),0_10px_26px_-24px_rgba(15,23,42,0.45)]">
                          {message.content}
                        </div>
                        {messageTime ? <span className="mt-[5px] text-[11px] text-slate-400 dark:text-slate-500">{messageTime}</span> : null}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="shrink-0 border-t border-slate-200 dark:border-slate-800 bg-slate-50/94 dark:bg-slate-900/92 px-8 py-[18px] max-sm:px-4 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <input
                    className="form-input w-full rounded-full border-transparent py-3 pl-5 pr-20 text-sm shadow-none bg-white dark:bg-slate-800 shadow-[0_1px_1px_rgba(15,23,42,0.04),0_10px_28px_-26px_rgba(15,23,42,0.5)]"
                    placeholder="输入消息"
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (!sendingMessage) {
                          handleSendMessage();
                        }
                      }
                    }}
                    disabled={sendingMessage}
                  />
                  <span className="absolute right-[18px] top-1/2 -translate-y-1/2 text-[11px] text-slate-400 pointer-events-none">{messageInput.length}/1000</span>
                </div>

                <button
                  className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-all hover:bg-primary/90 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 shadow-[0_12px_26px_-18px_rgba(19,127,236,0.8)]"
                  onClick={handleSendMessage}
                  disabled={sendingMessage || !messageInput.trim()}
                  aria-label="发送消息"
                  title="发送消息"
                >
                  <span className="material-symbols-outlined text-xl">send</span>
                </button>
              </div>
            </div>

            {inspectorOpen ? (
              <aside className="absolute right-[18px] top-[88px] z-20 w-[300px] overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-white/96 dark:bg-slate-900/96 shadow-[0_24px_70px_-42px_rgba(15,23,42,0.76)] backdrop-blur-md">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-4 py-[14px]">
                  <strong>{currentChat.type === "group" ? "群聊资料" : "联系人资料"}</strong>
                  <button
                    type="button"
                    className="workspace-icon-button"
                    onClick={() => setInspectorOpen(false)}
                    aria-label="关闭资料"
                    title="关闭"
                  >
                    <span className="material-symbols-outlined text-xl">close</span>
                  </button>
                </div>
                <div className="grid justify-items-center px-[18px] py-[22px] text-center">
                  <UserAvatar
                    src={currentChat.avatar}
                    name={currentChat.name}
                    size="2xl"
                    shape={currentChat.type === "group" ? "rounded" : "circle"}
                    border
                  />
                  <h3>{currentChat.name}</h3>
                  <p>
                    {currentChat.type === "group" && "group_id" in currentChat.data
                      ? `群号：${currentChat.data.group_id}`
                      : "私聊会话"}
                  </p>
                </div>
                <div className="grid border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <span>类型</span>
                    <strong>{currentChat.type === "group" ? "群聊" : "私聊"}</strong>
                  </div>
                  <div>
                    <span>未读</span>
                    <strong>{currentChat.unreadCount > 0 ? currentChat.unreadCount : "无"}</strong>
                  </div>
                  {currentChat.type === "group" && "member_count" in currentChat.data ? (
                    <div>
                      <span>成员</span>
                      <strong>{currentChat.data.member_count} 人</strong>
                    </div>
                  ) : null}
                </div>
              </aside>
            ) : null}
          </div>
        ) : (
          <div className="workspace-empty-wrap">
            <EmptyPanel title="选择一个聊天开始交流" description="支持私聊与群聊" className="min-h-[520px] w-full border-0 bg-white dark:bg-slate-900" />
          </div>
        )
      }
    />
  );
}
