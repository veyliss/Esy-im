/**
 * 聊天状态管理
 */

import { create } from "zustand";
import type { Conversation, Message, TypingEvent, ReadReceiptEvent, MessageSearchResult, ConversationSetting } from "@/lib/types/api";

interface ChatState {
  // 会话列表
  conversations: Conversation[];
  setConversations: (conversations: Conversation[]) => void;
  
  // 当前选中的会话
  currentConversation: Conversation | null;
  setCurrentConversation: (conversation: Conversation | null) => void;
  
  // 当前会话的消息列表
  messages: Message[];
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  prependMessages: (messages: Message[]) => void;
  updateMessage: (messageId: number, updates: Partial<Message>) => void;
  
  // 未读消息总数
  unreadCount: number;
  setUnreadCount: (count: number) => void;

  // 离线未读消息数
  offlineUnreadCount: number;
  setOfflineUnreadCount: (count: number) => void;
  
  // WebSocket连接状态
  wsConnected: boolean;
  setWsConnected: (connected: boolean) => void;
  
  // Typing状态: key = conversationId or groupId
  typingUsers: Record<string, TypingEvent[]>;
  setTypingUser: (key: string, event: TypingEvent) => void;
  removeTypingUser: (key: string, userId: string) => void;
  
  // 已读回执: key = conversationId
  readReceipts: Record<number, ReadReceiptEvent[]>;
  addReadReceipt: (conversationId: number, receipt: ReadReceiptEvent) => void;

  // 搜索结果
  searchResults: MessageSearchResult | null;
  setSearchResults: (results: MessageSearchResult | null) => void;
  searchLoading: boolean;
  setSearchLoading: (loading: boolean) => void;

  // 游标分页状态
  hasMoreMessages: boolean;
  setHasMoreMessages: (hasMore: boolean) => void;
  nextCursor: string;
  setNextCursor: (cursor: string) => void;
  loadingOlder: boolean;
  setLoadingOlder: (loading: boolean) => void;

  // 会话设置 (key = chatId like "private_1" or "group_xxx")
  conversationSettings: Record<string, ConversationSetting>;
  setConversationSetting: (chatId: string, setting: ConversationSetting) => void;

  // 加载状态
  loading: boolean;
  setLoading: (loading: boolean) => void;
  
  // 清空所有状态
  clear: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  setConversations: (conversations) => set({ conversations }),
  
  currentConversation: null,
  setCurrentConversation: (conversation) => set({ currentConversation: conversation }),
  
  messages: [],
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => {
    const { messages } = get();
    set({ messages: [...messages, message] });
  },
  prependMessages: (messages) => {
    const { messages: current } = get();
    const currentIds = new Set(current.map((m) => m.id));
    set({ messages: [...messages.filter((m) => !currentIds.has(m.id)), ...current] });
  },
  updateMessage: (messageId, updates) => {
    const { messages } = get();
    set({
      messages: messages.map((msg) =>
        msg.id === messageId ? { ...msg, ...updates } : msg
      ),
    });
  },
  
  unreadCount: 0,
  setUnreadCount: (count) => set({ unreadCount: count }),

  offlineUnreadCount: 0,
  setOfflineUnreadCount: (count) => set({ offlineUnreadCount: count }),
  
  wsConnected: false,
  setWsConnected: (connected) => set({ wsConnected: connected }),
  
  typingUsers: {},
  setTypingUser: (key, event) => {
    const { typingUsers } = get();
    const existing = typingUsers[key] || [];
    const filtered = existing.filter((t) => t.user_id !== event.user_id);
    set({ typingUsers: { ...typingUsers, [key]: [...filtered, event] } });
    // 3秒后自动清除
    setTimeout(() => {
      const { typingUsers: current } = get();
      const list = current[key] || [];
      set({ typingUsers: { ...current, [key]: list.filter((t) => t.user_id !== event.user_id) } });
    }, 3000);
  },
  removeTypingUser: (key, userId) => {
    const { typingUsers } = get();
    const list = typingUsers[key] || [];
    set({ typingUsers: { ...typingUsers, [key]: list.filter((t) => t.user_id !== userId) } });
  },

  readReceipts: {},
  addReadReceipt: (conversationId, receipt) => {
    const { readReceipts } = get();
    const existing = readReceipts[conversationId] || [];
    set({ readReceipts: { ...readReceipts, [conversationId]: [...existing, receipt] } });
  },

  searchResults: null,
  setSearchResults: (results) => set({ searchResults: results }),
  searchLoading: false,
  setSearchLoading: (loading) => set({ searchLoading: loading }),

  hasMoreMessages: false,
  setHasMoreMessages: (hasMore) => set({ hasMoreMessages: hasMore }),
  nextCursor: '',
  setNextCursor: (cursor) => set({ nextCursor: cursor }),
  loadingOlder: false,
  setLoadingOlder: (loading) => set({ loadingOlder: loading }),

  conversationSettings: {},
  setConversationSetting: (chatId, setting) => set((state) => ({
    conversationSettings: { ...state.conversationSettings, [chatId]: setting },
  })),

  loading: false,
  setLoading: (loading) => set({ loading: loading }),
  
  clear: () =>
    set({
      conversations: [],
      currentConversation: null,
      messages: [],
      unreadCount: 0,
      offlineUnreadCount: 0,
      wsConnected: false,
      typingUsers: {},
      readReceipts: {},
      searchResults: null,
      searchLoading: false,
      hasMoreMessages: false,
      nextCursor: '',
      loadingOlder: false,
      conversationSettings: {},
      loading: false,
    }),
}));
