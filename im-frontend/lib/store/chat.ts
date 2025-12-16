/**
 * 聊天状态管理
 */

import { create } from "zustand";
import type { Conversation, Message } from "@/lib/types/api";

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
  updateMessage: (messageId: number, updates: Partial<Message>) => void;
  
  // 未读消息总数
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  
  // WebSocket连接状态
  wsConnected: boolean;
  setWsConnected: (connected: boolean) => void;
  
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
  
  wsConnected: false,
  setWsConnected: (connected) => set({ wsConnected: connected }),
  
  loading: false,
  setLoading: (loading) => set({ loading: loading }),
  
  clear: () =>
    set({
      conversations: [],
      currentConversation: null,
      messages: [],
      unreadCount: 0,
      wsConnected: false,
      loading: false,
    }),
}));
