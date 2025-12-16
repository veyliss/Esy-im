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
    <div className="flex h-screen flex-col bg-background-light dark:bg-background-dark font-display">
      <header className="flex-shrink-0 bg-background-light dark:bg-background-dark border-b border-gray-200 dark:border-gray-800">
        <div className="mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <nav className="flex items-center gap-6">
                <a className="text-sm font-medium text-primary" href="/chat">聊天</a>
                <a className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary" href="/contacts">通讯录</a>
                <a className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary" href="/groups">群聊</a>
                <a className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary" href="/moments">朋友圈</a>
                <a className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary" href="/me">我的</a>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className={`h-2.5 w-2.5 rounded-full ${wsConnected ? "bg-emerald-500" : "bg-amber-400"}`} />
                {wsConnected ? "已连接" : "连接中..."}
              </div>
              {totalUnreadCount > 0 && (
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  未读 {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
                </span>
              )}
              {currentUser?.avatar && (
                <div
                  className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10"
                  style={{ backgroundImage: `url(${currentUser.avatar})` }}
                />
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex-grow flex overflow-hidden">
        <aside className="w-80 flex-shrink-0 bg-background-light dark:bg-background-dark border-r border-gray-200 dark:border-gray-800 flex flex-col">
          {/* 搜索框 */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <input
              type="text"
              placeholder="搜索聊天..."
              value={chatFilter}
              onChange={(e) => setChatFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* 聊天列表 */}
          <div className="flex-grow overflow-y-auto">
            <div className="space-y-1 p-2">
              {filteredChatList.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300/70 py-12 text-center text-sm text-slate-400">
                  {chatFilter.trim() ? "未找到相关聊天" : "暂无聊天记录"}
                  {!chatFilter.trim() && <p className="mt-1 text-xs">去联系人页面添加好友或创建群聊吧</p>}
                </div>
              ) : (
                filteredChatList.map((chatItem) => {
                  const isActive = currentChat?.id === chatItem.id;
                  
                  return (
                    <div
                      key={chatItem.id}
                      className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-colors ${
                        isActive
                          ? "bg-primary/10 dark:bg-primary/20"
                          : "hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                      onClick={() => handleSelectChat(chatItem)}
                    >
                      <div className="relative">
                        <div
                          className={`bg-center bg-no-repeat aspect-square bg-cover size-12 ${
                            chatItem.type === 'group' ? 'rounded-lg' : 'rounded-full'
                          }`}
                          style={{ backgroundImage: `url(${chatItem.avatar})` }}
                        />
                        {chatItem.type === 'group' && (
                          <span className="absolute -bottom-1 -right-1 bg-blue-500 text-white text-xs px-1 rounded">群</span>
                        )}
                        {chatItem.type === 'private' && (
                          <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 border-2 border-background-light dark:border-background-dark"></span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <p className="text-gray-900 dark:text-white font-semibold text-sm truncate">
                            {chatItem.name}
                          </p>
                          <p className="text-gray-500 dark:text-gray-400 text-xs">
                            {chatItem.lastMessageTime ?
                              new Date(chatItem.lastMessageTime).toLocaleTimeString('zh-CN', {
                                hour: '2-digit',
                                minute: '2-digit'
                              }) :
                              ''
                            }
                          </p>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 text-sm truncate mt-1">
                          {chatItem.lastMessage || '暂无消息'}
                        </p>
                      </div>
                      {chatItem.unreadCount > 0 && (
                        <div className="flex flex-col items-end space-y-1">
                          <span className="bg-primary text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                            {chatItem.unreadCount > 99 ? '99+' : chatItem.unreadCount}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col bg-white dark:bg-gray-900">
          {currentChat ? (
            <>
              <div className="flex-shrink-0 flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <div
                    className={`bg-center bg-no-repeat aspect-square bg-cover size-10 ${
                      currentChat.type === 'group' ? 'rounded-lg' : 'rounded-full'
                    }`}
                    style={{ backgroundImage: `url(${currentChat.avatar})` }}
                  />
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{currentChat.name}</h3>
                    {currentChat.type === 'group' && 'member_count' in currentChat.data && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {currentChat.data.member_count} 人
                      </p>
                    )}
                  </div>
                </div>
                <button className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                  </svg>
                </button>
              </div>

              {(error || connectionError) && (
                <div className="mx-6 mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  {error || connectionError}
                  <button
                    onClick={() => {
                      setError(null);
                      setConnectionError(null);
                    }}
                    className="ml-3 text-xs text-amber-600 underline"
                  >
                    知道了
                  </button>
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {currentMessages.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 py-12 text-center text-slate-400">
                    暂无消息，开始聊天吧
                  </div>
                ) : (
                  currentMessages.map((message) => {
                    const isMyMessage = message.from_user_id === currentUser?.user_id;
                    const messageUser = isMyMessage ? currentUser : message.from_user;

                    if (isMyMessage) {
                      // 我发送的消息 - 右对齐
                      return (
                        <div key={message.id} className="flex items-start gap-4 justify-end">
                          <div className="flex flex-col items-end max-w-lg">
                            <div className="bg-primary text-white rounded-lg rounded-tr-none px-4 py-3 shadow-sm">
                              <p className="text-sm">{message.content}</p>
                            </div>
                          </div>
                          <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-10 shrink-0"
                               style={{ backgroundImage: `url(${messageUser?.avatar || '/default-avatar.png'})` }} />
                        </div>
                      );
                    } else {
                      // 对方发送的消息 - 左对齐
                      return (
                        <div key={message.id} className="flex items-start gap-4">
                          <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-10 shrink-0"
                               style={{ backgroundImage: `url(${messageUser?.avatar || '/default-avatar.png'})` }} />
                          <div className="flex flex-col items-start max-w-lg">
                            {currentChat.type === 'group' && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                {messageUser?.nickname || `用户${message.from_user_id}`}
                              </p>
                            )}
                            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg rounded-tl-none px-4 py-3 shadow-sm">
                              <p className="text-sm text-gray-800 dark:text-gray-200">{message.content}</p>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="flex-shrink-0 px-6 py-4 bg-background-light dark:bg-background-dark border-t border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <input
                      className="form-input w-full rounded-full py-3 pl-5 pr-12 bg-gray-100 dark:bg-gray-800 border-transparent focus:border-primary focus:ring-primary text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
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
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 gap-2">
                      <button className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                        </svg>
                      </button>
                      <button className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                  <button className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-3">
                    <span className="material-symbols-outlined">history</span>
                  </button>
                  <button
                    className="bg-primary hover:bg-primary/90 text-white rounded-full p-3 flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={handleSendMessage}
                    disabled={sendingMessage || !messageInput.trim()}
                  >
                    <span className="material-symbols-outlined">send</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-slate-400">
              <span className="material-symbols-outlined text-5xl text-slate-300">chat</span>
              <p className="text-lg font-semibold text-slate-500">选择一个聊天开始交流</p>
              <p className="text-sm">支持私聊和群聊</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
