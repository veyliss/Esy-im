"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
import { TopBarActions, TopStatusPill } from "@/components/layout/top-actions";
import {
  ImActionButton,
  ImActionStrip,
  ImCountBadge,
  ImEmptyState,
  ImSearchBox,
  ImShell,
  ImSidebar,
  ImSidebarHeader,
  ImSidebarScroll,
  ImSidebarSection,
  ImSidebarToolbar,
} from "@/components/im/layout";
import {
  ChatComposer,
  ChatConversationHeader,
  ChatFilterTabs,
  ChatInspector,
  ChatMessageList,
  ChatStartPanel,
  ConversationItem,
  type ChatRenderableMessage,
  type ChatTimelineEntry,
} from "@/components/im/chat";
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
  pinned?: boolean;
  muted?: boolean;
  hidden?: boolean;
  data: Conversation | Group;
};

type ChatFilterMode = "all" | "private" | "group" | "unread";
type ConversationPrefs = Record<string, { pinned?: boolean; muted?: boolean; hidden?: boolean }>;
type ReplyDraft = { id: string; author: string; content: string };

const conversationPrefsKey = "esy-im:conversation-preferences";
const userPreferencesKey = "esy-im:user-preferences";
const quickReplyItems = ["收到", "我稍后回复", "现在方便吗？", "我们群里同步一下"];

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatChatDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (isSameDay(date, today)) return "今天";
  if (isSameDay(date, yesterday)) return "昨天";
  return date.toLocaleDateString("zh-CN", { month: "long", day: "numeric", weekday: "short" });
}

function formatListTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  const today = new Date();
  if (isSameDay(date, today)) {
    return date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" });
}

function getChatDraftKey(chat: ChatItem) {
  return `esy-im:draft:${chat.id}`;
}

export default function ChatPage() {
  const { toast } = useAppInteractions();
  const router = useRouter();
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
    currentGroup: selectedGroup,
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
  const [chatMode, setChatMode] = useState<ChatFilterMode>("all");
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [conversationPrefs, setConversationPrefs] = useState<ConversationPrefs>({});
  const [compactMessages, setCompactMessages] = useState(false);
  const [replyDraft, setReplyDraft] = useState<ReplyDraft | null>(null);
  const [threadSearchOpen, setThreadSearchOpen] = useState(false);
  const [threadKeyword, setThreadKeyword] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const composerInputRef = useRef<HTMLTextAreaElement>(null);

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

  useEffect(() => {
    try {
      const rawPrefs = window.localStorage.getItem(conversationPrefsKey);
      setConversationPrefs(rawPrefs ? JSON.parse(rawPrefs) : {});

      const rawUserPrefs = window.localStorage.getItem(userPreferencesKey);
      const userPrefs = rawUserPrefs ? (JSON.parse(rawUserPrefs) as { compactMessages?: boolean }) : {};
      setCompactMessages(Boolean(userPrefs.compactMessages));
    } catch {
      setConversationPrefs({});
      setCompactMessages(false);
    }
  }, []);

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
    setReplyDraft(null);
    setThreadKeyword("");
    setThreadSearchOpen(false);
    
    if (chatItem.type === 'private' && 'id' in chatItem.data) {
      await loadPrivateMessages(chatItem.data.id);
    } else if (chatItem.type === 'group' && 'group_id' in chatItem.data) {
      await loadGroupMessages(chatItem.data.group_id);
    }
  };

  useEffect(() => {
    if (!currentChat) {
      setMessageInput("");
      return;
    }

    const draft = window.localStorage.getItem(getChatDraftKey(currentChat)) || "";
    setMessageInput(draft);
    window.setTimeout(() => composerInputRef.current?.focus(), 80);
  }, [currentChat]);

  // 发送消息
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !currentChat || !currentUser) return;

    setSendingMessage(true);
    setError(null);
    
    try {
      const rawContent = messageInput.trim();
      if (rawContent.length === 0) {
        setError("消息内容不能为空");
        return;
      }
      
      if (rawContent.length > 1000) {
        setError("消息内容过长，请控制在1000字符以内");
        return;
      }

      const draftKey = getChatDraftKey(currentChat);
      const quote = replyDraft
        ? `「回复 ${replyDraft.author}：${replyDraft.content.slice(0, 80)}」\n`
        : "";
      const content = `${quote}${rawContent}`;

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
          setReplyDraft(null);
          window.localStorage.removeItem(draftKey);
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
          setReplyDraft(null);
          window.localStorage.removeItem(draftKey);
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

    const visibleItems = items
      .map((item) => ({
        ...item,
        ...conversationPrefs[item.id],
      }))
      .filter((item) => !item.hidden);

    // 置顶优先，其次按最后消息时间排序
    return visibleItems.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      const timeA = new Date(a.lastMessageTime || 0).getTime();
      const timeB = new Date(b.lastMessageTime || 0).getTime();
      return timeB - timeA;
    });
  }, [conversations, groups, currentUser, groupUnreadCounts, conversationPrefs]);

  useEffect(() => {
    if (!selectedGroup) return;
    const targetChat = chatList.find((item) =>
      item.type === "group" &&
      "group_id" in item.data &&
      item.data.group_id === selectedGroup.group_id
    );
    if (targetChat && currentChat?.id !== targetChat.id) {
      handleSelectChat(targetChat);
    }
    // Selecting a group from the Groups page should open its chat once the list is ready.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGroup, chatList, currentChat?.id]);

  // 过滤聊天列表
  const filteredChatList = useMemo(() => {
    const keyword = chatFilter.trim().toLowerCase();
    return chatList.filter((item) => {
      if (chatMode === "private" && item.type !== "private") return false;
      if (chatMode === "group" && item.type !== "group") return false;
      if (chatMode === "unread" && item.unreadCount <= 0) return false;
      if (!keyword) return true;

      return (
        item.name.toLowerCase().includes(keyword) ||
        (item.lastMessage && item.lastMessage.toLowerCase().includes(keyword))
      );
    });
  }, [chatFilter, chatList, chatMode]);

  const chatModeItems = useMemo(
    () => [
      { key: "all" as const, label: "全部", count: chatList.length },
      { key: "private" as const, label: "私聊", count: chatList.filter((item) => item.type === "private").length },
      { key: "group" as const, label: "群聊", count: chatList.filter((item) => item.type === "group").length },
      { key: "unread" as const, label: "未读", count: chatList.filter((item) => item.unreadCount > 0).length },
    ],
    [chatList],
  );

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

  const messageTimeline = useMemo<ChatTimelineEntry[]>(() => {
    let lastDateLabel = "";
    return currentMessages.flatMap((message) => {
      const dateLabel = formatChatDate(message.created_at);
      const entries: ChatTimelineEntry[] = [];
      if (dateLabel && dateLabel !== lastDateLabel) {
        entries.push({ type: "date", id: `date-${dateLabel}-${message.id}`, label: dateLabel });
        lastDateLabel = dateLabel;
      }
      entries.push({ type: "message", id: `message-${message.id}`, message });
      return entries;
    });
  }, [currentMessages]);

  const visibleMessageTimeline = useMemo<ChatTimelineEntry[]>(() => {
    const keyword = threadKeyword.trim().toLowerCase();
    if (!keyword) return messageTimeline;

    return messageTimeline.filter((entry) => {
      if (entry.type === "date") return false;
      return entry.message.content.toLowerCase().includes(keyword);
    });
  }, [messageTimeline, threadKeyword]);

  const composerHint = useMemo(() => {
    if (!currentChat) return "选择一个会话后开始输入";
    if (replyDraft) return "正在回复指定消息，Enter 发送";
    if (!wsConnected) return "连接恢复后消息可能延迟送达";
    if (messageInput.length > 900) return "消息接近长度上限";
    return "Enter 发送，Shift + Enter 换行";
  }, [currentChat, messageInput.length, replyDraft, wsConnected]);

  const firstAvailableChat = filteredChatList[0] || chatList[0] || null;

  const handlePickFirstChat = () => {
    if (firstAvailableChat) {
      handleSelectChat(firstAvailableChat);
    }
  };

  const handleComposerChange = (value: string) => {
    const nextValue = value.length <= 1000 ? value : value.slice(0, 1000);
    setMessageInput(nextValue);

    if (currentChat) {
      const draftKey = getChatDraftKey(currentChat);
      if (nextValue.trim()) {
        window.localStorage.setItem(draftKey, nextValue);
      } else {
        window.localStorage.removeItem(draftKey);
      }
    }

    if (value.length > 1000) {
      toast("消息最多 1000 个字符", { tone: "warning" });
    }
  };

  const updateConversationPref = (chatId: string, patch: ConversationPrefs[string]) => {
    setConversationPrefs((current) => {
      const next = {
        ...current,
        [chatId]: {
          ...current[chatId],
          ...patch,
        },
      };
      window.localStorage.setItem(conversationPrefsKey, JSON.stringify(next));
      return next;
    });
  };

  const syncCurrentChatPref = (patch: ConversationPrefs[string]) => {
    if (!currentChat) return;
    updateConversationPref(currentChat.id, patch);
    setCurrentChat({ ...currentChat, ...patch });
  };

  const handleTogglePinned = () => {
    if (!currentChat) return;
    syncCurrentChatPref({ pinned: !currentChat.pinned });
    toast(currentChat.pinned ? "已取消置顶" : "已置顶会话", { tone: "success" });
  };

  const handleToggleMuted = () => {
    if (!currentChat) return;
    syncCurrentChatPref({ muted: !currentChat.muted });
    toast(currentChat.muted ? "已取消免打扰" : "已设为免打扰", { tone: "success" });
  };

  const handleHideConversation = () => {
    if (!currentChat) return;
    updateConversationPref(currentChat.id, { hidden: true });
    toast("会话已从列表隐藏", { tone: "success" });
    setCurrentChat(null);
    setInspectorOpen(false);
  };

  const handleCopyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast("消息已复制", { tone: "success" });
    } catch {
      setError("复制失败，请手动复制消息内容");
    }
  };

  const handleReplyMessage = (message: ChatRenderableMessage) => {
    const isMine = message.from_user_id === currentUser?.user_id;
    setReplyDraft({
      id: String(message.id),
      author: isMine ? "我" : message.from_user?.nickname || `用户${message.from_user_id}`,
      content: message.content,
    });
    window.setTimeout(() => composerInputRef.current?.focus(), 60);
  };

  const handleQuickReply = (value: string) => {
    const nextValue = messageInput.trim() ? `${messageInput}\n${value}` : value;
    handleComposerChange(nextValue);
    window.setTimeout(() => composerInputRef.current?.focus(), 60);
  };

  const handleConversationPref = (chatItem: ChatItem, patch: ConversationPrefs[string], successMessage: string) => {
    updateConversationPref(chatItem.id, patch);
    if (currentChat?.id === chatItem.id) {
      setCurrentChat({ ...currentChat, ...patch });
    }
    toast(successMessage, { tone: "success" });
  };

  const handleHideChatItem = (chatItem: ChatItem) => {
    updateConversationPref(chatItem.id, { hidden: true });
    if (currentChat?.id === chatItem.id) {
      setCurrentChat(null);
      setInspectorOpen(false);
    }
    toast("会话已隐藏", { tone: "success" });
  };

  // 计算总未读数
  const totalUnreadCount = useMemo(() => {
    const groupUnread = Object.values(groupUnreadCounts).reduce((sum, count) => sum + count, 0);
    return privateUnreadCount + groupUnread;
  }, [privateUnreadCount, groupUnreadCounts]);

  return (
    <ImShell
      active="chat"
      title="聊天"
      subtitle="会话、消息和实时状态"
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
      mainClassName="im3-chat-main"
      sidebar={
        <ImSidebar className={compactMessages ? "is-compact" : undefined}>
          <ImSidebarToolbar>
            <ImSidebarHeader
              eyebrow="消息中心"
              title="会话"
              description="私聊、群聊和未读消息统一在这里处理。"
              action={
                totalUnreadCount > 0 ? (
                  <ImCountBadge>{totalUnreadCount > 99 ? "99+" : totalUnreadCount}</ImCountBadge>
                ) : null
              }
            />
            <ImSearchBox
              type="text"
              placeholder="搜索聊天"
              value={chatFilter}
              onChange={(e) => setChatFilter(e.target.value)}
              onClear={() => setChatFilter("")}
            />
            <ChatFilterTabs active={chatMode} items={chatModeItems} onChange={setChatMode} />
          </ImSidebarToolbar>

          <ImSidebarScroll>
            <ImSidebarSection title={`会话列表 · ${filteredChatList.length}`}>
                {filteredChatList.length === 0 ? (
                  <ImEmptyState
                    title={chatFilter.trim() ? "未找到相关聊天" : "暂无聊天记录"}
                    description={chatFilter.trim() ? "尝试更换关键词" : "去通讯录添加好友，或到群聊页面创建群聊"}
                    action={
                      !chatFilter.trim() ? (
                        <ImActionStrip>
                          <ImActionButton onClick={() => router.push("/contacts")}>
                            添加好友
                          </ImActionButton>
                          <ImActionButton onClick={() => router.push("/groups")}>
                            创建群聊
                          </ImActionButton>
                        </ImActionStrip>
                      ) : null
                    }
                  />
                ) : (
                  filteredChatList.map((chatItem) => (
                    <ConversationItem
                      key={chatItem.id}
                      active={currentChat?.id === chatItem.id}
                      type={chatItem.type}
                      name={chatItem.name}
                      avatar={chatItem.avatar}
                      lastMessage={chatItem.lastMessage}
                      time={formatListTime(chatItem.lastMessageTime)}
                      unreadCount={chatItem.unreadCount}
                      pinned={chatItem.pinned}
                      muted={chatItem.muted}
                      onClick={() => handleSelectChat(chatItem)}
                      onPin={() =>
                        handleConversationPref(
                          chatItem,
                          { pinned: !chatItem.pinned },
                          chatItem.pinned ? "已取消置顶" : "已置顶会话",
                        )
                      }
                      onMute={() =>
                        handleConversationPref(
                          chatItem,
                          { muted: !chatItem.muted },
                          chatItem.muted ? "已取消免打扰" : "已设为免打扰",
                        )
                      }
                      onHide={() => handleHideChatItem(chatItem)}
                    />
                  ))
                )}
            </ImSidebarSection>
          </ImSidebarScroll>
        </ImSidebar>
      }
    >
      {currentChat ? (
        <div className="im3-chat-surface">
          <ChatConversationHeader
            avatar={currentChat.avatar}
            name={currentChat.name}
            shape={currentChat.type === "group" ? "rounded" : "circle"}
            meta={
              currentChat.type === "group" && "member_count" in currentChat.data
                ? `${currentChat.data.member_count} 位成员`
                : wsConnected
                  ? "在线"
                  : "连接中"
            }
            onBack={() => {
              setCurrentChat(null);
              setInspectorOpen(false);
            }}
            actions={
              <>
                <button
                  type="button"
                  className={`im3-icon-button ${threadSearchOpen ? "is-active" : ""}`}
                  onClick={() => setThreadSearchOpen((value) => !value)}
                  aria-label="搜索当前聊天"
                  title="搜索当前聊天"
                >
                  <span className="material-symbols-outlined">search</span>
                </button>
                <button
                  type="button"
                  className={`im3-icon-button ${currentChat.pinned ? "is-active" : ""}`}
                  onClick={handleTogglePinned}
                  aria-label={currentChat.pinned ? "取消置顶" : "置顶会话"}
                  title={currentChat.pinned ? "取消置顶" : "置顶会话"}
                >
                  <span className="material-symbols-outlined">{currentChat.pinned ? "keep_off" : "keep"}</span>
                </button>
                <button
                  type="button"
                  className={`im3-icon-button ${currentChat.muted ? "is-active" : ""}`}
                  onClick={handleToggleMuted}
                  aria-label={currentChat.muted ? "取消免打扰" : "免打扰"}
                  title={currentChat.muted ? "取消免打扰" : "免打扰"}
                >
                  <span className="material-symbols-outlined">{currentChat.muted ? "notifications" : "notifications_off"}</span>
                </button>
                <button
                  type="button"
                  className="im3-icon-button"
                  onClick={() => setInspectorOpen((value) => !value)}
                  aria-label="查看资料"
                  title="查看资料"
                >
                  <span className="material-symbols-outlined">info</span>
                </button>
              </>
            }
          />

            <ErrorAlert
              error={connectionError}
              type="warning"
              onClose={() => setConnectionError(null)}
              className="mx-8 mt-5"
            />
            <ErrorAlert error={error} onClose={() => setError(null)} className="mx-8 mt-3" />

            {threadSearchOpen ? (
              <div className="chat-thread-search">
                <ImSearchBox
                  type="text"
                  placeholder="搜索当前聊天记录"
                  value={threadKeyword}
                  onChange={(e) => setThreadKeyword(e.target.value)}
                  onClear={() => setThreadKeyword("")}
                />
                {threadKeyword.trim() ? (
                  <span>{visibleMessageTimeline.filter((entry) => entry.type === "message").length} 条结果</span>
                ) : (
                  <span>输入关键词筛选消息</span>
                )}
              </div>
            ) : null}

            <ChatMessageList
              entries={visibleMessageTimeline}
              currentUser={currentUser}
              showSender={currentChat.type === "group"}
              endRef={messagesEndRef}
              onCopyMessage={handleCopyMessage}
              onReplyMessage={handleReplyMessage}
              onOpenInspector={() => setInspectorOpen(true)}
            />

            <ChatComposer
              inputRef={composerInputRef}
              value={messageInput}
              placeholder={currentChat.type === "group" ? "发送群消息" : "发送消息"}
              hint={composerHint}
              replyPreview={replyDraft}
              quickReplies={quickReplyItems}
              sending={sendingMessage}
              onChange={handleComposerChange}
              onSend={handleSendMessage}
              onAttach={() => toast("附件发送能力还未接入后端接口", { tone: "info" })}
              onCancelReply={() => setReplyDraft(null)}
              onQuickReply={handleQuickReply}
            />

            {inspectorOpen ? (
              <ChatInspector
                name={currentChat.name}
                avatar={currentChat.avatar}
                type={currentChat.type}
                unreadCount={currentChat.unreadCount}
                messageCount={currentMessages.length}
                pinned={currentChat.pinned}
                muted={currentChat.muted}
                groupId={currentChat.type === "group" && "group_id" in currentChat.data ? currentChat.data.group_id : undefined}
                memberCount={currentChat.type === "group" && "member_count" in currentChat.data ? currentChat.data.member_count : undefined}
                onClose={() => setInspectorOpen(false)}
                onTogglePinned={handleTogglePinned}
                onToggleMuted={handleToggleMuted}
                onOpenDetail={() => router.push(currentChat.type === "group" ? "/groups" : "/contacts")}
                onHideConversation={handleHideConversation}
              />
            ) : null}
          </div>
      ) : (
        <ChatStartPanel
          onOpenRecent={firstAvailableChat ? handlePickFirstChat : undefined}
          onOpenContacts={() => router.push("/contacts")}
        />
      )}
    </ImShell>
  );
}
