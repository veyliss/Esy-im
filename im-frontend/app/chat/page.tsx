"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "antd";
import type { TextAreaRef } from "antd/es/input/TextArea";
import { useAuthStore } from "@/lib/store";
import { useChatStore } from "@/lib/store/chat";
import { useGroupStore } from "@/lib/store/group";
import { MessageAPI } from "@/lib/api/message";
import { GroupAPI } from "@/lib/api/group";
import { UploadAPI } from "@/lib/api/upload";
import { wsClient } from "@/lib/websocket/client";
import type { Message, MessageType, Conversation, Group, GroupMessage, GroupMessageType, TypingEvent, ReadReceiptEvent, ForwardTarget } from "@/lib/types/api";
import { UserAPI } from "@/lib/api/user";
import type { User } from "@/lib/types/api";
import { handleApiError, createUserFriendlyErrorMessage, isNetworkError, isWebSocketError } from "@/lib/utils/errors";
import {
  Im4Button,
  Im4Composer,
  Im4ConversationHeader,
  Im4Empty,
  Im4IconButton,
  Im4Inspector,
  Im4MessageList,
  Im4Search,
  Im4Segmented,
  Im4SessionItem,
  Im4Shell,
  Im4StartPanel,
  Im4Status,
  type Im4RenderableMessage,
  type Im4TimelineEntry,
} from "@/components/im4";
import { ErrorAlert } from "@/components/ui/error-alert";
import { useAppInteractions } from "@/components/ui/app-interactions";
import { ForwardModal } from "@/components/chat/ForwardModal";
import { VoiceRecorder } from "@/components/chat/VoiceRecorder";
import { MentionPicker } from "@/components/chat/MentionPicker";
import { PinnedMessageBar } from "@/components/chat/PinnedMessageBar";
import { FavoriteAPI } from "@/lib/api/favorite";
import { showNotification } from "@/lib/utils/notifications";
import type { GroupPinnedMessage } from "@/lib/types/api";

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
type ReplyDraft = { id: string; author: string; content: string };

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
    prependMessages,
    unreadCount: privateUnreadCount,
    setUnreadCount: setPrivateUnreadCount,
    offlineUnreadCount,
    setOfflineUnreadCount,
    wsConnected,
    setWsConnected,
    setTypingUser,
    typingUsers,
    addReadReceipt,
    setHasMoreMessages,
    setNextCursor,
    nextCursor,
    hasMoreMessages,
    loadingOlder,
    setLoadingOlder,
    setSearchResults,
    searchResults,
    searchLoading,
    setSearchLoading,
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
    setGroupTypingUser,
    groupTypingUsers,
    groupHasMore,
    groupNextCursor,
    setGroupCursor,
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
  const [compactMessages, setCompactMessages] = useState(false);
  const [replyDraft, setReplyDraft] = useState<ReplyDraft | null>(null);
  const [threadSearchOpen, setThreadSearchOpen] = useState(false);
  const [threadKeyword, setThreadKeyword] = useState("");
  const [forwardMessage, setForwardMessage] = useState<Im4RenderableMessage | null>(null);
  const [forwardModalOpen, setForwardModalOpen] = useState(false);
  const [voiceRecorderOpen, setVoiceRecorderOpen] = useState(false);
  const [mentionPickerOpen, setMentionPickerOpen] = useState(false);
  const [atUserIds, setAtUserIds] = useState<string[]>([]);
  const [pinnedMessages, setPinnedMessages] = useState<GroupPinnedMessage[]>([]);
  const [groupMembers, setGroupMembers] = useState<import("@/lib/types/api").GroupMember[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const composerInputRef = useRef<TextAreaRef>(null);
  const chatImageInputRef = useRef<HTMLInputElement>(null);
  const chatFileInputRef = useRef<HTMLInputElement>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

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
      const rawUserPrefs = window.localStorage.getItem(userPreferencesKey);
      const userPrefs = rawUserPrefs ? (JSON.parse(rawUserPrefs) as { compactMessages?: boolean }) : {};
      setCompactMessages(Boolean(userPrefs.compactMessages));
    } catch {
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
        if (!message.id || !message.conversation_id) {
          console.warn("收到不完整的消息数据:", message);
          return;
        }
        
        if (currentChat?.type === 'private' && 
            currentChat.data && 
            'id' in currentChat.data && 
            message.conversation_id === currentChat.data.id) {
          const existingMessages = useChatStore.getState().messages;
          if (!existingMessages.some((item) => item.id === message.id)) {
            addPrivateMessage(message);
          }
          MessageAPI.markConversationAsRead(currentChat.data.id).catch(err => {
            console.error("标记消息已读失败:", err);
          });
        } else {
          // 桌面通知
          showNotification(`${message.from_user?.nickname || '新消息'}`, {
            body: message.content?.slice(0, 50) || '[图片]',
            icon: message.from_user?.avatar,
          });
        }
        
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
        if (!message.id || !message.group_id) {
          console.warn("收到不完整的群消息数据:", message);
          return;
        }
        
        if (currentChat?.type === 'group' && 
            currentChat.data && 
            'group_id' in currentChat.data && 
            message.group_id === currentChat.data.group_id) {
          addGroupMessage(currentChat.data.group_id, message);
          GroupAPI.markGroupMessagesAsRead(currentChat.data.group_id).catch(err => {
            console.error("标记群消息已读失败:", err);
          });
        } else {
          setGroupUnreadCount(message.group_id, (groupUnreadCounts[message.group_id] || 0) + 1);
          // 桌面通知
          showNotification(`[群] ${message.from_user?.nickname || '新群消息'}`, {
            body: message.content?.slice(0, 50) || '[图片]',
            icon: message.from_user?.avatar,
          });
        }
        
        loadGroups();
      } catch (error) {
        console.error("处理群聊消息失败:", error);
      }
    };

    // 监听 Typing 事件
    const handleTyping = (event: TypingEvent) => {
      if (event.conversation_id) {
        const key = `private_${event.conversation_id}`;
        setTypingUser(key, event);
      } else if (event.group_id) {
        setGroupTypingUser(event.group_id, event);
      }
    };

    // 监听已读回执
    const handleReadReceipt = (event: ReadReceiptEvent) => {
      addReadReceipt(event.conversation_id, event);
    };

    // 监听群邀请
    const handleGroupInvitation = () => {
      toast("收到新的群邀请", { tone: "info", title: "群邀请" });
    };

    // 监听群公告
    const handleGroupAnnouncement = () => {
      toast("收到新的群公告", { tone: "info", title: "群公告" });
    };

    wsClient.onMessage(handlePrivateMessage);
    wsClient.onGroupMessage(handleGroupMessage);
    wsClient.onTyping(handleTyping);
    wsClient.onReadReceipt(handleReadReceipt);
    wsClient.onGroupInvitation(handleGroupInvitation);
    wsClient.onGroupAnnouncement(handleGroupAnnouncement);

    // 清理
    return () => {
      wsClient.offConnect(handleConnect);
      wsClient.offDisconnect(handleDisconnect);
      wsClient.offMessage(handlePrivateMessage);
      wsClient.offGroupMessage(handleGroupMessage);
      wsClient.offTyping(handleTyping);
      wsClient.offReadReceipt(handleReadReceipt);
      wsClient.offGroupInvitation(handleGroupInvitation);
      wsClient.offGroupAnnouncement(handleGroupAnnouncement);
      wsClient.offError(handleError);
    };
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

  // 加载私聊未读消息数 (含离线)
  const loadPrivateUnreadCount = async () => {
    try {
      const res = await MessageAPI.getUnreadCount();
      if (res.data.code === 0) {
        const { total, offline } = res.data.data;
        setPrivateUnreadCount(total);
        setOfflineUnreadCount(offline);
      }
    } catch (error) {
      console.error("加载未读消息数失败:", error);
    }
  };

  // 加载群聊未读消息数 (批量接口)
  const loadGroupUnreadCounts = async () => {
    try {
      const groupIds = groups.map(g => g.group_id);
      if (groupIds.length === 0) return;
      const res = await GroupAPI.batchGetUnreadCounts(groupIds);
      if (res.data.code === 0) {
        const counts = res.data.data;
        for (const [gid, count] of Object.entries(counts)) {
          setGroupUnreadCount(gid, count as number);
        }
      }
    } catch (error) {
      console.error("加载群聊未读消息数失败:", error);
    }
  };

  // 加载私聊消息 (游标分页)
  const loadPrivateMessages = async (conversationId: number) => {
    try {
      const res = await MessageAPI.getConversationMessagesCursor(conversationId, {
        cursor: 0,
        limit: 20,
      });
      if (res.data.code === 0) {
        const messages = res.data.data.list.filter(msg => msg.id && msg.conversation_id);
        setPrivateMessages(messages);
        setHasMoreMessages(res.data.data.has_more);
        setNextCursor(res.data.data.next_cursor);
        await MessageAPI.markConversationAsRead(conversationId);
        await loadPrivateUnreadCount();
        await loadConversations();
      }
    } catch (error) {
      console.error("加载私聊消息失败:", error);
      const apiError = handleApiError(error);
      setError(createUserFriendlyErrorMessage(apiError));
    }
  };

  const loadOlderPrivateMessages = async () => {
    if (!currentChat || currentChat.type !== "private" || !("id" in currentChat.data)) return;
    if (!hasMoreMessages || loadingOlder) return;

    setLoadingOlder(true);
    try {
      const res = await MessageAPI.getConversationMessagesCursor(currentChat.data.id, {
        cursor: Number(nextCursor),
        limit: 20,
      });

      if (res.data.code === 0) {
        const olderMessages = res.data.data.list.filter(msg => msg.id && msg.conversation_id);
        prependMessages(olderMessages);
        setHasMoreMessages(res.data.data.has_more);
        setNextCursor(res.data.data.next_cursor);
      }
    } catch (error) {
      console.error("加载更早私聊消息失败:", error);
      const apiError = handleApiError(error);
      setError(createUserFriendlyErrorMessage(apiError));
    } finally {
      setLoadingOlder(false);
    }
  };

  // 加载群聊消息 (游标分页)
  const loadGroupMessages = async (groupId: string) => {
    try {
      const res = await GroupAPI.getGroupMessagesCursor(groupId, { cursor: 0, limit: 20 });
      if (res.data.code === 0) {
        setGroupMessages(groupId, res.data.data.list);
        setGroupCursor(groupId, res.data.data.has_more, res.data.data.next_cursor);
        await GroupAPI.markGroupMessagesAsRead(groupId);
        setGroupUnreadCount(groupId, 0);
      }
    } catch (error) {
      console.error("加载群聊消息失败:", error);
      const apiError = handleApiError(error);
      setError(createUserFriendlyErrorMessage(apiError));
    }
  };

  const loadOlderGroupMessages = async () => {
    if (!currentChat || currentChat.type !== "group" || !("group_id" in currentChat.data)) return;
    const groupId = currentChat.data.group_id;
    if (!groupHasMore[groupId]) return;

    try {
      const cursor = groupNextCursor[groupId] || "0";
      const res = await GroupAPI.getGroupMessagesCursor(groupId, { cursor: Number(cursor), limit: 20 });
      if (res.data.code === 0) {
        const existing = useGroupStore.getState().groupMessages[groupId] || [];
        setGroupMessages(groupId, [...res.data.data.list, ...existing]);
        setGroupCursor(groupId, res.data.data.has_more, res.data.data.next_cursor);
      }
    } catch (error) {
      console.error("加载更早群消息失败:", error);
    }
  };

  // 加载群置顶消息
  const loadPinnedMessages = async (groupId: string) => {
    try {
      const res = await GroupAPI.getPinnedMessages(groupId);
      if (res.data.code === 0) {
        setPinnedMessages(res.data.data);
      }
    } catch (error) {
      console.error("加载置顶消息失败:", error);
    }
  };

  // 加载群成员
  const loadGroupMembers = async (groupId: string) => {
    try {
      const res = await GroupAPI.getGroupMembers(groupId);
      if (res.data.code === 0) {
        setGroupMembers(res.data.data);
      }
    } catch (error) {
      console.error("加载群成员失败:", error);
    }
  };

  // 初始加载
  useEffect(() => {
    if (token) {
      loadConversations();
      loadGroups();
      loadPrivateUnreadCount();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // 加载群聊未读数
  useEffect(() => {
    if (groups.length > 0) {
      loadGroupUnreadCounts();
    }
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
    setHasMoreMessages(false);
    setNextCursor('');
    setSearchResults(null);
    
    if (chatItem.type === 'private' && 'id' in chatItem.data) {
      await loadPrivateMessages(chatItem.data.id);
    } else if (chatItem.type === 'group' && 'group_id' in chatItem.data) {
      await loadGroupMessages(chatItem.data.group_id);
      await loadPinnedMessages(chatItem.data.group_id);
      await loadGroupMembers(chatItem.data.group_id);
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
        const conversation = currentChat.data as Conversation;
        const toUserId = conversation.user1_id === currentUser.user_id
          ? conversation.user2_id
          : conversation.user1_id;
        const toUser = conversation.user1_id === currentUser.user_id
          ? conversation.user2
          : conversation.user1;
        const tempId = `private-${conversation.id}-${Date.now()}`;
        const optimisticMessage: Message = {
          id: -Date.now(),
          conversation_id: conversation.id,
          from_user_id: currentUser.user_id,
          to_user_id: toUserId,
          message_type: 1 as MessageType,
          content,
          media_url: "",
          is_read: false,
          read_at: null,
          is_recalled: false,
          recalled_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          from_user: currentUser,
          to_user: toUser,
          client_status: "sending",
          client_temp_id: tempId,
        };

        setPrivateMessages([...useChatStore.getState().messages, optimisticMessage]);
        setMessageInput("");
        setReplyDraft(null);

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
          
          const current = useChatStore.getState().messages;
          setPrivateMessages(current.map((item) => (
            item.client_temp_id === tempId ? { ...message, client_status: "sent" } : item
          )));
          window.localStorage.removeItem(draftKey);
          await loadConversations();
        }
      } else if (currentChat.type === 'group' && 'group_id' in currentChat.data) {
        const group = currentChat.data as Group;
        const atUsersStr = atUserIds.length > 0 ? JSON.stringify(atUserIds) : undefined;
        
        const res = await GroupAPI.sendGroupMessage({
          group_id: group.group_id,
          message_type: 1 as GroupMessageType,
          content: content,
          at_users: atUsersStr,
        });

        if (res.data.code === 0) {
          const message = res.data.data;
          if (!message.id) {
            throw new Error("发送成功但返回的消息数据不完整");
          }
          
          addGroupMessage(group.group_id, message);
          setMessageInput("");
          setReplyDraft(null);
          setAtUserIds([]);
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
      if (currentChat?.type === "private") {
        const current = useChatStore.getState().messages;
        setPrivateMessages(current.map((item) => (
          item.client_status === "sending" ? { ...item, client_status: "failed" } : item
        )));
        setMessageInput((value) => value || window.localStorage.getItem(getChatDraftKey(currentChat)) || "");
      }
      toast(userMessage, { tone: "error", title: "发送失败" });
    } finally {
      setSendingMessage(false);
    }
  };

  const handleChatImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !currentChat || !currentUser) return;

    if (!file.type.startsWith("image/")) {
      setError("请选择图片文件");
      return;
    }

    setSendingMessage(true);
    setError(null);
    try {
      const uploadRes = await UploadAPI.uploadImage(file);
      const imageUrl = uploadRes.data.data.url;

      if (currentChat.type === "private" && "id" in currentChat.data) {
        const conversation = currentChat.data as Conversation;
        const toUserId = conversation.user1_id === currentUser.user_id
          ? conversation.user2_id
          : conversation.user1_id;
        const toUser = conversation.user1_id === currentUser.user_id
          ? conversation.user2
          : conversation.user1;
        const tempId = `image-${conversation.id}-${Date.now()}`;
        const optimisticMessage: Message = {
          id: -Date.now(),
          conversation_id: conversation.id,
          from_user_id: currentUser.user_id,
          to_user_id: toUserId,
          message_type: 2 as MessageType,
          content: "[图片]",
          media_url: imageUrl,
          is_read: false,
          read_at: null,
          is_recalled: false,
          recalled_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          from_user: currentUser,
          to_user: toUser,
          client_status: "sending",
          client_temp_id: tempId,
        };

        setPrivateMessages([...useChatStore.getState().messages, optimisticMessage]);
        const res = await MessageAPI.sendMessage({
          to_user_id: toUserId,
          message_type: 2 as MessageType,
          content: "[图片]",
          media_url: imageUrl,
        });
        if (res.data.code === 0) {
          const current = useChatStore.getState().messages;
          setPrivateMessages(current.map((item) => (
            item.client_temp_id === tempId ? { ...res.data.data, client_status: "sent" } : item
          )));
          await loadConversations();
        }
      } else if (currentChat.type === "group" && "group_id" in currentChat.data) {
        const group = currentChat.data as Group;
        const res = await GroupAPI.sendGroupMessage({
          group_id: group.group_id,
          message_type: 2 as GroupMessageType,
          content: "[图片]",
          media_url: imageUrl,
        });
        if (res.data.code === 0) {
          addGroupMessage(group.group_id, res.data.data);
          await loadGroups();
        }
      }
    } catch (error) {
      console.error("发送图片失败:", error);
      const apiError = handleApiError(error);
      const userMessage = createUserFriendlyErrorMessage(apiError);
      setError(userMessage);
      toast(userMessage, { tone: "error", title: "图片发送失败" });
    } finally {
      setSendingMessage(false);
    }
  };

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [privateMessages, groupMessages]);

  // 获取会话设置 (从 store 而非 localStorage)
  const getChatSetting = useCallback((chatId: string) => {
    const store = useChatStore.getState();
    return store.conversationSettings[chatId];
  }, []);

  // 合并并排序聊天列表
  const chatList = useMemo(() => {
    const items: ChatItem[] = [];

    conversations.forEach(conversation => {
      const opponent = conversation.user1_id === currentUser?.user_id
        ? conversation.user2
        : conversation.user1;
      
      const unreadCount = conversation.user1_id === currentUser?.user_id
        ? conversation.user1_unread
        : conversation.user2_unread;

      const chatId = `private_${conversation.id}`;
      const setting = getChatSetting(chatId);

      items.push({
        type: 'private',
        id: chatId,
        name: opponent?.nickname || `用户${opponent?.user_id}`,
        avatar: opponent?.avatar || '/default-avatar.png',
        lastMessage: conversation.last_message?.content || '暂无消息',
        lastMessageTime: conversation.last_message?.created_at,
        unreadCount: unreadCount,
        pinned: setting?.is_pinned,
        muted: setting?.is_muted,
        data: conversation,
      });
    });

    groups.forEach(group => {
      const chatId = `group_${group.group_id}`;
      const setting = getChatSetting(chatId);

      items.push({
        type: 'group',
        id: chatId,
        name: group.name,
        avatar: group.avatar || '/default-group-avatar.png',
        lastMessage: '',
        lastMessageTime: group.updated_at,
        unreadCount: groupUnreadCounts[group.group_id] || 0,
        pinned: setting?.is_pinned,
        muted: setting?.is_muted,
        data: group,
      });
    });

    const visibleItems = items.filter((item) => !item.hidden);

    return visibleItems.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      const timeA = new Date(a.lastMessageTime || 0).getTime();
      const timeB = new Date(b.lastMessageTime || 0).getTime();
      return timeB - timeA;
    });
  }, [conversations, groups, currentUser, groupUnreadCounts, getChatSetting]);

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

  const messageTimeline = useMemo<Im4TimelineEntry[]>(() => {
    let lastDateLabel = "";
    return currentMessages.flatMap((message) => {
      const dateLabel = formatChatDate(message.created_at);
      const entries: Im4TimelineEntry[] = [];
      if (dateLabel && dateLabel !== lastDateLabel) {
        entries.push({ type: "date", id: `date-${dateLabel}-${message.id}`, label: dateLabel });
        lastDateLabel = dateLabel;
      }
      entries.push({ type: "message", id: `message-${message.id}`, message });
      return entries;
    });
  }, [currentMessages]);

  const visibleMessageTimeline = useMemo<Im4TimelineEntry[]>(() => {
    // 如果搜索结果存在，使用搜索结果
    if (searchResults) {
      return searchResults.list.flatMap((message) => {
        const entries: Im4TimelineEntry[] = [];
        entries.push({ type: "message", id: `search-${message.id}`, message });
        return entries;
      });
    }

    const keyword = threadKeyword.trim().toLowerCase();
    if (!keyword) return messageTimeline;

    return messageTimeline.filter((entry) => {
      if (entry.type === "date") return false;
      return entry.message.content.toLowerCase().includes(keyword);
    });
  }, [messageTimeline, threadKeyword, searchResults]);

  const composerHint = useMemo(() => {
    if (!currentChat) return "选择一个会话后开始输入";
    if (replyDraft) return "正在回复指定消息，Enter 发送";
    if (!wsConnected) return "连接恢复后消息可能延迟送达";
    if (messageInput.length > 900) return "消息接近长度上限";
    // Typing hint
    if (currentChat.type === 'private' && 'id' in currentChat.data) {
      const key = `private_${currentChat.data.id}`;
      const typing = typingUsers[key];
      if (typing && typing.length > 0) {
        return `${typing[0].nickname || '对方'} 正在输入...`;
      }
    } else if (currentChat.type === 'group' && 'group_id' in currentChat.data) {
      const typing = groupTypingUsers[currentChat.data.group_id];
      if (typing && typing.length > 0) {
        return `${typing.map(t => t.nickname || '某人').join('、')} 正在输入...`;
      }
    }
    return "Enter 发送，Shift + Enter 换行";
  }, [currentChat, messageInput.length, replyDraft, wsConnected, typingUsers, groupTypingUsers]);

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

      // Debounce typing notification (REST API)
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        if (nextValue.trim()) {
          if (currentChat.type === 'private' && 'id' in currentChat.data) {
            MessageAPI.sendTyping(currentChat.data.id).catch(() => {});
          } else if (currentChat.type === 'group' && 'group_id' in currentChat.data) {
            GroupAPI.sendGroupTyping(currentChat.data.group_id).catch(() => {});
          }
        }
      }, 300);

      // Detect @ trigger for group mention picker
      if (currentChat.type === 'group' && nextValue.endsWith('@') && nextValue.length > (value.length - 2)) {
        setMentionPickerOpen(true);
      }
    }

    if (value.length > 1000) {
      toast("消息最多 1000 个字符", { tone: "warning" });
    }
  };

  // 会话置顶 (API)
  const handleTogglePinned = async () => {
    if (!currentChat) return;
    const currentPinned = currentChat.pinned || false;
    const newPinned = !currentPinned;

    try {
      if (currentChat.type === 'private' && 'id' in currentChat.data) {
        await MessageAPI.pinConversation(currentChat.data.id, newPinned);
      }
      const { setConversationSetting } = useChatStore.getState();
      setConversationSetting(currentChat.id, {
        conversation_id: currentChat.type === 'private' && 'id' in currentChat.data ? currentChat.data.id : 0,
        is_pinned: newPinned,
        is_muted: currentChat.muted || false,
      });
      setCurrentChat({ ...currentChat, pinned: newPinned });
      toast(newPinned ? "已置顶会话" : "已取消置顶", { tone: "success" });
    } catch (error) {
      toast("操作失败，请重试", { tone: "error" });
    }
  };

  // 会话免打扰 (API)
  const handleToggleMuted = async () => {
    if (!currentChat) return;
    const currentMuted = currentChat.muted || false;
    const newMuted = !currentMuted;

    try {
      if (currentChat.type === 'private' && 'id' in currentChat.data) {
        await MessageAPI.muteConversation(currentChat.data.id, newMuted);
      }
      const { setConversationSetting } = useChatStore.getState();
      setConversationSetting(currentChat.id, {
        conversation_id: currentChat.type === 'private' && 'id' in currentChat.data ? currentChat.data.id : 0,
        is_pinned: currentChat.pinned || false,
        is_muted: newMuted,
      });
      setCurrentChat({ ...currentChat, muted: newMuted });
      toast(newMuted ? "已设为免打扰" : "已取消免打扰", { tone: "success" });
    } catch (error) {
      toast("操作失败，请重试", { tone: "error" });
    }
  };

  const handleCopyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast("消息已复制", { tone: "success" });
    } catch {
      setError("复制失败，请手动复制消息内容");
    }
  };

  const handleReplyMessage = (message: Im4RenderableMessage) => {
    const isMine = message.from_user_id === currentUser?.user_id;
    setReplyDraft({
      id: String(message.id),
      author: isMine ? "我" : message.from_user?.nickname || `用户${message.from_user_id}`,
      content: message.content,
    });
    window.setTimeout(() => composerInputRef.current?.focus(), 60);
  };

  const handleForwardMessage = (message: Im4RenderableMessage) => {
    setForwardMessage(message);
    setForwardModalOpen(true);
  };

  const handleForwardSubmit = async (targets: ForwardTarget[]) => {
    if (!forwardMessage) return;
    try {
      await MessageAPI.forwardMessage({
        message_id: forwardMessage.id,
        targets,
      });
      toast("消息已转发", { tone: "success" });
      setForwardModalOpen(false);
      setForwardMessage(null);
    } catch (error) {
      const apiError = handleApiError(error);
      toast(createUserFriendlyErrorMessage(apiError), { tone: "error", title: "转发失败" });
    }
  };

  // 收藏消息
  const handleFavoriteMessage = async (message: Im4RenderableMessage) => {
    try {
      const res = await FavoriteAPI.addFavorite(message.id);
      if (res.data.code === 0) {
        toast("消息已收藏", { tone: "success" });
      }
    } catch (error) {
      const apiError = handleApiError(error);
      toast(createUserFriendlyErrorMessage(apiError), { tone: "error", title: "收藏失败" });
    }
  };

  // 置顶消息 (群聊)
  const handlePinMessage = async (message: Im4RenderableMessage) => {
    if (!currentChat || currentChat.type !== 'group' || !("group_id" in currentChat.data)) return;
    try {
      const res = await GroupAPI.pinMessage(currentChat.data.group_id, message.id);
      if (res.data.code === 0) {
        toast("消息已置顶", { tone: "success" });
        await loadPinnedMessages(currentChat.data.group_id);
      }
    } catch (error) {
      const apiError = handleApiError(error);
      toast(createUserFriendlyErrorMessage(apiError), { tone: "error", title: "置顶失败" });
    }
  };

  // 语音录制完成
  const handleVoiceRecord = async (blob: Blob) => {
    if (!currentChat || !currentUser) return;
    setSendingMessage(true);
    try {
      const file = new File([blob], `voice-${Date.now()}.webm`, { type: blob.type });
      const uploadRes = await UploadAPI.uploadFile(file);
      const audioUrl = uploadRes.data.data.url;

      if (currentChat.type === 'private' && 'id' in currentChat.data) {
        const conversation = currentChat.data as Conversation;
        const toUserId = conversation.user1_id === currentUser.user_id ? conversation.user2_id : conversation.user1_id;
        const res = await MessageAPI.sendMessage({
          to_user_id: toUserId,
          message_type: 3 as MessageType,
          content: "[语音]",
          media_url: audioUrl,
        });
        if (res.data.code === 0) {
          addPrivateMessage(res.data.data);
          await loadConversations();
        }
      } else if (currentChat.type === 'group' && 'group_id' in currentChat.data) {
        const res = await GroupAPI.sendGroupMessage({
          group_id: currentChat.data.group_id,
          message_type: 3 as GroupMessageType,
          content: "[语音]",
          media_url: audioUrl,
        });
        if (res.data.code === 0) {
          addGroupMessage(currentChat.data.group_id, res.data.data);
          await loadGroups();
        }
      }
      toast("语音消息已发送", { tone: "success" });
    } catch (error) {
      const apiError = handleApiError(error);
      toast(createUserFriendlyErrorMessage(apiError), { tone: "error", title: "语音发送失败" });
    } finally {
      setSendingMessage(false);
    }
  };

  // 文件发送
  const handleFileAttach = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !currentChat || !currentUser) return;

    setSendingMessage(true);
    try {
      const uploadRes = await UploadAPI.uploadFile(file);
      const fileUrl = uploadRes.data.data.url;
      const fileName = uploadRes.data.data.filename || file.name;

      if (currentChat.type === 'private' && 'id' in currentChat.data) {
        const conversation = currentChat.data as Conversation;
        const toUserId = conversation.user1_id === currentUser.user_id ? conversation.user2_id : conversation.user1_id;
        const res = await MessageAPI.sendMessage({
          to_user_id: toUserId,
          message_type: 5 as MessageType,
          content: fileName,
          media_url: fileUrl,
        });
        if (res.data.code === 0) {
          addPrivateMessage(res.data.data);
          await loadConversations();
        }
      } else if (currentChat.type === 'group' && 'group_id' in currentChat.data) {
        const res = await GroupAPI.sendGroupMessage({
          group_id: currentChat.data.group_id,
          message_type: 5 as GroupMessageType,
          content: fileName,
          media_url: fileUrl,
        });
        if (res.data.code === 0) {
          addGroupMessage(currentChat.data.group_id, res.data.data);
          await loadGroups();
        }
      }
      toast("文件已发送", { tone: "success" });
    } catch (error) {
      const apiError = handleApiError(error);
      toast(createUserFriendlyErrorMessage(apiError), { tone: "error", title: "文件发送失败" });
    } finally {
      setSendingMessage(false);
    }
  };

  // @提及选择
  const handleMentionSelect = (userId: string, nickname: string) => {
    setAtUserIds(prev => prev.includes(userId) ? prev : [...prev, userId]);
    const mentionText = `@${nickname} `;
    setMessageInput(prev => prev + mentionText);
    setMentionPickerOpen(false);
    composerInputRef.current?.focus();
  };

  const handleQuickReply = (value: string) => {
    const nextValue = messageInput.trim() ? `${messageInput}\n${value}` : value;
    handleComposerChange(nextValue);
    window.setTimeout(() => composerInputRef.current?.focus(), 60);
  };

  // 服务端消息搜索 (debounce)
  useEffect(() => {
    if (!threadKeyword.trim() || !currentChat) {
      setSearchResults(null);
      return;
    }

    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const conversationId = currentChat.type === 'private' && 'id' in currentChat.data
          ? currentChat.data.id
          : undefined;
        const res = await MessageAPI.searchMessages({
          keyword: threadKeyword.trim(),
          conversation_id: conversationId,
          page: 1,
          page_size: 20,
        });
        if (res.data.code === 0) {
          setSearchResults(res.data.data);
        }
      } catch (error) {
        console.error("搜索消息失败:", error);
      } finally {
        setSearchLoading(false);
      }
    }, 400);

    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [threadKeyword, currentChat, setSearchResults, setSearchLoading]);

  const handleConversationPref = async (chatItem: ChatItem, patch: { pinned?: boolean; muted?: boolean }, successMessage: string) => {
    try {
      if (patch.pinned !== undefined && chatItem.type === 'private' && 'id' in chatItem.data) {
        await MessageAPI.pinConversation(chatItem.data.id, patch.pinned);
      }
      if (patch.muted !== undefined && chatItem.type === 'private' && 'id' in chatItem.data) {
        await MessageAPI.muteConversation(chatItem.data.id, patch.muted);
      }
      const { setConversationSetting } = useChatStore.getState();
      const currentSetting = getChatSetting(chatItem.id);
      setConversationSetting(chatItem.id, {
        conversation_id: chatItem.type === 'private' && 'id' in chatItem.data ? chatItem.data.id : 0,
        is_pinned: patch.pinned ?? currentSetting?.is_pinned ?? false,
        is_muted: patch.muted ?? currentSetting?.is_muted ?? false,
      });
      if (currentChat?.id === chatItem.id) {
        setCurrentChat({ ...currentChat, ...patch });
      }
      toast(successMessage, { tone: "success" });
    } catch {
      toast("操作失败，请重试", { tone: "error" });
    }
  };

  const handleHideChatItem = (chatItem: ChatItem) => {
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

  // 当前聊天对方在线状态
  const opponentOnlineStatus = useMemo(() => {
    if (!currentChat || currentChat.type !== 'private') return null;
    const conv = currentChat.data as Conversation;
    const opponentId = conv.user1_id === currentUser?.user_id ? conv.user2_id : conv.user1_id;
    // 从 typingUsers 推断 (如果最近有 typing 则认为在线)
    const key = `private_${conv.id}`;
    const typing = typingUsers[key];
    if (typing && typing.length > 0) return "online";
    return wsConnected ? "在线" : "连接中";
  }, [currentChat, currentUser, typingUsers, wsConnected]);

  const sessionPanel = (
    <div className={`im4-session-panel ${compactMessages ? "is-compact" : ""}`}>
      <div className="im4-session-head">
        <div className="im4-session-title">
          <div>
            <h1>会话</h1>
            <p>私聊、群聊、未读和草稿集中处理。</p>
          </div>
          {totalUnreadCount > 0 ? (
            <span className="im4-session-badge">{totalUnreadCount > 99 ? "99+" : totalUnreadCount}</span>
          ) : null}
        </div>
        <Im4Search
          type="text"
          placeholder="搜索聊天"
          value={chatFilter}
          onChange={(e) => setChatFilter(e.target.value)}
          onClear={() => setChatFilter("")}
        />
        <Im4Segmented active={chatMode} items={chatModeItems} onChange={setChatMode} label="会话筛选" />
      </div>

      <div className="im4-session-list">
        <h2 className="im4-session-section-label">会话列表 · {filteredChatList.length}</h2>
        {filteredChatList.length === 0 ? (
          <Im4Empty
            title={chatFilter.trim() ? "未找到相关聊天" : "暂无聊天记录"}
            description={chatFilter.trim() ? "尝试更换关键词" : "去通讯录添加好友，或创建一个群聊"}
            action={
              !chatFilter.trim() ? (
                <>
                  <Im4Button onClick={() => router.push("/contacts")}>添加好友</Im4Button>
                  <Im4Button onClick={() => router.push("/groups")}>创建群聊</Im4Button>
                </>
              ) : null
            }
          />
        ) : (
          filteredChatList.map((chatItem) => (
            <Im4SessionItem
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
      </div>
    </div>
  );

  const mobileRightSlot = (
    <div className="flex items-center gap-2">
      <Im4Status tone={wsConnected ? "online" : "warning"}>{wsConnected ? "在线" : "连接中"}</Im4Status>
      {totalUnreadCount > 0 ? (
        <Im4Status tone="primary">未读 {totalUnreadCount > 99 ? "99+" : totalUnreadCount}</Im4Status>
      ) : null}
    </div>
  );

  const inspector =
    inspectorOpen && currentChat ? (
      <Im4Inspector
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
        onHideConversation={() => {
          toast("会话已隐藏", { tone: "success" });
          setCurrentChat(null);
          setInspectorOpen(false);
        }}
      />
    ) : null;

  return (
    <>
    <Im4Shell
      active="chat"
      title="聊天"
      subtitle="会话、消息和实时状态"
      detailActive={Boolean(currentChat)}
      sessionPanel={sessionPanel}
      rightSlot={mobileRightSlot}
      inspector={inspector}
      avatarSrc={currentUser?.avatar}
      avatarName={currentUser?.nickname || "我"}
      avatarStatus={wsConnected ? "online" : "away"}
      onMobileBack={currentChat ? () => {
        setCurrentChat(null);
        setInspectorOpen(false);
      } : undefined}
    >
      {currentChat ? (
        <>
          <Im4ConversationHeader
            avatar={currentChat.avatar}
            name={currentChat.name}
            shape={currentChat.type === "group" ? "rounded" : "circle"}
            meta={
              currentChat.type === "group" && "member_count" in currentChat.data
                ? `${currentChat.data.member_count} 位成员`
                : String(opponentOnlineStatus)
            }
            onBack={() => {
              setCurrentChat(null);
              setInspectorOpen(false);
            }}
            actions={
              <>
                <Im4IconButton
                  icon="search"
                  label="搜索当前聊天"
                  active={threadSearchOpen}
                  onClick={() => setThreadSearchOpen((value) => !value)}
                />
                <Im4IconButton
                  icon={currentChat.pinned ? "keep_off" : "keep"}
                  label={currentChat.pinned ? "取消置顶" : "置顶会话"}
                  active={currentChat.pinned}
                  onClick={handleTogglePinned}
                />
                <Im4IconButton
                  icon={currentChat.muted ? "notifications" : "notifications_off"}
                  label={currentChat.muted ? "取消免打扰" : "免打扰"}
                  active={currentChat.muted}
                  onClick={handleToggleMuted}
                />
                <Im4IconButton icon="info" label="查看资料" active={inspectorOpen} onClick={() => setInspectorOpen((value) => !value)} />
              </>
            }
          />

          <ErrorAlert error={connectionError} type="warning" onClose={() => setConnectionError(null)} className="mx-6 mt-4" />
          {offlineUnreadCount > 0 ? (
            <Alert
              type="info"
              showIcon
              closable
              message={`你有 ${offlineUnreadCount} 条离线消息`}
              className="mx-6 mt-3"
              onClose={() => setOfflineUnreadCount(0)}
            />
          ) : null}
          <ErrorAlert error={error} onClose={() => setError(null)} className="mx-6 mt-3" />

          {threadSearchOpen ? (
            <div className="im4-thread-search">
              <Im4Search
                type="text"
                placeholder="搜索当前聊天记录"
                value={threadKeyword}
                onChange={(e) => setThreadKeyword(e.target.value)}
                onClear={() => { setThreadKeyword(""); setSearchResults(null); }}
              />
              {threadKeyword.trim() ? (
                <span>{searchLoading ? "搜索中..." : `${searchResults?.total ?? visibleMessageTimeline.filter((entry) => entry.type === "message").length} 条结果`}</span>
              ) : (
                <span>输入关键词搜索消息</span>
              )}
            </div>
          ) : null}

          {/* 群置顶消息条 */}
          {currentChat.type === "group" && pinnedMessages.length > 0 ? (
            <PinnedMessageBar
              pinnedMessages={pinnedMessages}
              onDismiss={() => setPinnedMessages([])}
            />
          ) : null}

          <Im4MessageList
            entries={visibleMessageTimeline}
            currentUser={currentUser}
            showSender={currentChat.type === "group"}
            endRef={messagesEndRef}
            hasMore={
              currentChat.type === "private"
                ? hasMoreMessages && !threadKeyword.trim()
                : currentChat.type === "group" && "group_id" in currentChat.data
                  ? !!groupHasMore[currentChat.data.group_id] && !threadKeyword.trim()
                  : false
            }
            loadingOlder={loadingOlder}
            onLoadOlder={
              currentChat.type === "private"
                ? loadOlderPrivateMessages
                : loadOlderGroupMessages
            }
            onCopyMessage={handleCopyMessage}
            onReplyMessage={handleReplyMessage}
            onForwardMessage={handleForwardMessage}
            onFavoriteMessage={handleFavoriteMessage}
            onPinMessage={currentChat.type === "group" ? handlePinMessage : undefined}
            onOpenInspector={() => setInspectorOpen(true)}
          />

          <input
            ref={chatImageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleChatImageChange}
          />
          <input
            ref={chatFileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileAttach}
          />
          <Im4Composer
            inputRef={composerInputRef}
            value={messageInput}
            placeholder={currentChat.type === "group" ? "发送群消息 (输入@提及)" : "发送消息"}
            hint={composerHint}
            replyPreview={replyDraft}
            quickReplies={quickReplyItems}
            sending={sendingMessage}
            onChange={handleComposerChange}
            onSend={handleSendMessage}
            onAttach={() => chatImageInputRef.current?.click()}
            onAttachFile={() => chatFileInputRef.current?.click()}
            onVoiceRecord={() => setVoiceRecorderOpen(true)}
            onCancelReply={() => setReplyDraft(null)}
            onQuickReply={handleQuickReply}
          />
        </>
      ) : (
        <Im4StartPanel
          onOpenRecent={firstAvailableChat ? handlePickFirstChat : undefined}
          onOpenContacts={() => router.push("/contacts")}
        />
      )}
    </Im4Shell>

    {forwardModalOpen && forwardMessage ? (
      <ForwardModal
        message={forwardMessage}
        conversations={conversations}
        groups={groups}
        currentUser={currentUser}
        onSubmit={handleForwardSubmit}
        onClose={() => { setForwardModalOpen(false); setForwardMessage(null); }}
      />
    ) : null}

    {voiceRecorderOpen ? (
      <VoiceRecorder
        onRecordComplete={(blob: Blob) => { setVoiceRecorderOpen(false); handleVoiceRecord(blob); }}
        onCancel={() => setVoiceRecorderOpen(false)}
      />
    ) : null}

    {mentionPickerOpen && currentChat?.type === 'group' ? (
      <MentionPicker
        members={groupMembers}
        onSelect={handleMentionSelect}
        onClose={() => setMentionPickerOpen(false)}
      />
    ) : null}
    </>
  );
}
