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
import { ActionBar, EmptyPanel, SectionCard, SectionTitle, SidebarSection } from "@/components/workspace/section";
import { UserAvatar } from "@/components/ui/user-avatar";
import { ErrorAlert } from "@/components/ui/error-alert";

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
  }, [token]);

  // 加载群聊未读数
  useEffect(() => {
    if (groups.length > 0) {
      loadGroupUnreadCounts();
    }
  }, [groups]);

  // 选择聊天
  const handleSelectChat = async (chatItem: ChatItem) => {
    setError(null);
    setCurrentChat(chatItem);
    
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
      headerDescription="统一私聊与群聊入口，快速切换会话。"
      rightSlot={
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 dark:text-slate-400">{wsConnected ? "已连接" : "连接中"}</span>
          {totalUnreadCount > 0 ? (
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              未读 {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
            </span>
          ) : null}
          <UserAvatar
            src={currentUser?.avatar}
            name={currentUser?.nickname || "我"}
            size="sm"
            border
            showStatus
            status={wsConnected ? "online" : "away"}
          />
        </div>
      }
      sidebar={
        <div className="flex h-full flex-col p-4">
          <SidebarSection title="会话列表" className="flex min-h-0 flex-1 flex-col" bodyClassName="flex-1 space-y-2">
            <input
              type="text"
              placeholder="搜索聊天..."
              value={chatFilter}
              onChange={(e) => setChatFilter(e.target.value)}
              className="ui-input w-full rounded-lg px-4 py-3 text-sm"
            />

            <div className="flex-1 overflow-y-auto pt-2">
              <div className="space-y-2">
                {filteredChatList.length === 0 ? (
                  <EmptyPanel
                    title={chatFilter.trim() ? "未找到相关聊天" : "暂无聊天记录"}
                    description={chatFilter.trim() ? "尝试更换关键词" : "去通讯录添加好友，或到群聊页面创建群聊"}
                    className="min-h-[220px]"
                  />
                ) : (
                  filteredChatList.map((chatItem) => {
                    const isActive = currentChat?.id === chatItem.id;

                    return (
                      <button
                        key={chatItem.id}
                        type="button"
                        onClick={() => handleSelectChat(chatItem)}
                        className={`flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left transition-all ${
                          isActive
                            ? "border-primary/30 bg-primary/10 shadow-sm dark:border-primary/40 dark:bg-primary/20"
                            : "border-transparent bg-slate-50 hover:border-slate-200 hover:bg-white dark:bg-slate-800/40 dark:hover:border-slate-700 dark:hover:bg-slate-800"
                        }`}
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
                            <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{chatItem.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {chatItem.lastMessageTime
                                ? new Date(chatItem.lastMessageTime).toLocaleTimeString("zh-CN", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : ""}
                            </p>
                          </div>
                          <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">{chatItem.lastMessage || "暂无消息"}</p>
                        </div>

                        {chatItem.unreadCount > 0 ? (
                          <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-white">
                            {chatItem.unreadCount > 99 ? "99+" : chatItem.unreadCount}
                          </span>
                        ) : null}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </SidebarSection>
        </div>
      }
      main={
        currentChat ? (
          <div className="flex h-full min-w-0 flex-1 flex-col p-6">
            <SectionCard className="flex min-h-0 flex-1 flex-col p-0">
              <div className="border-b border-slate-200/70 px-6 py-5 dark:border-slate-800">
                <SectionTitle
                  title={currentChat.name}
                  description={currentChat.type === "group" && "member_count" in currentChat.data ? `${currentChat.data.member_count} 人` : "当前会话"}
                  action={
                    <UserAvatar
                      src={currentChat.avatar}
                      name={currentChat.name}
                      size="md"
                      shape={currentChat.type === "group" ? "rounded" : "circle"}
                      border
                    />
                  }
                />
              </div>

              <ErrorAlert
                error={connectionError}
                type="warning"
                onClose={() => setConnectionError(null)}
                className="mx-6 mt-4"
              />
              <ErrorAlert error={error} onClose={() => setError(null)} className="mx-6 mt-3" />

              <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
                {currentMessages.length === 0 ? (
                  <EmptyPanel title="暂无消息" description="开始发送第一条消息吧" className="min-h-[420px]" />
                ) : (
                currentMessages.map((message) => {
                  const isMyMessage = message.from_user_id === currentUser?.user_id;
                  const messageUser = isMyMessage ? currentUser : message.from_user;

                  if (isMyMessage) {
                    return (
                      <div key={message.id} className="flex justify-end gap-3">
                        <div className="max-w-lg rounded-lg rounded-tr-md bg-primary px-4 py-3 text-sm text-white shadow-sm">
                          {message.content}
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
                    <div key={message.id} className="flex gap-3">
                      <UserAvatar
                        src={messageUser?.avatar}
                        name={messageUser?.nickname || `用户${message.from_user_id}`}
                        size="md"
                        border
                        className="shrink-0"
                      />
                      <div className="max-w-lg">
                        {currentChat.type === "group" ? (
                          <p className="mb-1 text-xs text-slate-500 dark:text-slate-400">
                            {messageUser?.nickname || `用户${message.from_user_id}`}
                          </p>
                        ) : null}
                        <div className="rounded-lg rounded-tl-md bg-slate-100 px-4 py-3 text-sm text-slate-700 shadow-sm dark:bg-slate-800 dark:text-slate-200">
                          {message.content}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

              <div className="border-t border-slate-200/70 bg-white/80 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/70">
                <ActionBar className="gap-2">
                  <input
                    className="form-input flex-1 rounded-lg px-4 py-3 text-sm"
                    placeholder="输入消息..."
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

                  <button
                    className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={handleSendMessage}
                    disabled={sendingMessage || !messageInput.trim()}
                    aria-label="发送消息"
                    title="发送消息"
                  >
                    发送
                  </button>
                </ActionBar>
              </div>
            </SectionCard>
          </div>
        ) : (
          <div className="flex h-full min-h-[72vh] items-center justify-center p-6">
            <EmptyPanel title="选择一个聊天开始交流" description="支持私聊与群聊" className="min-h-[520px] w-full border-solid bg-white/80 dark:bg-slate-900/70" />
          </div>
        )
      }
    />
  );
}
