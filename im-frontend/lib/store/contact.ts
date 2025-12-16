/**
 * 联系人状态管理
 */

import { create } from "zustand";
import type { Friend, FriendRequest, User } from "@/lib/types/api";

interface ContactState {
  // 好友列表
  friends: Friend[];
  setFriends: (friends: Friend[]) => void;
  
  // 收到的好友请求
  receivedRequests: FriendRequest[];
  setReceivedRequests: (requests: FriendRequest[]) => void;
  
  // 发出的好友请求
  sentRequests: FriendRequest[];
  setSentRequests: (requests: FriendRequest[]) => void;
  
  // 当前选中的好友
  selectedFriend: Friend | null;
  setSelectedFriend: (friend: Friend | null) => void;
  
  // 搜索结果
  searchResult: User | null;
  setSearchResult: (user: User | null) => void;
  
  // 待处理的好友请求数量
  pendingRequestCount: number;
  setPendingRequestCount: (count: number) => void;
  
  // 加载状态
  loading: boolean;
  setLoading: (loading: boolean) => void;
  
  // 清空所有状态
  clear: () => void;
}

export const useContactStore = create<ContactState>((set) => ({
  friends: [],
  setFriends: (friends) => set({ friends }),
  
  receivedRequests: [],
  setReceivedRequests: (requests) => set({ receivedRequests: requests }),
  
  sentRequests: [],
  setSentRequests: (requests) => set({ sentRequests: requests }),
  
  selectedFriend: null,
  setSelectedFriend: (friend) => set({ selectedFriend: friend }),
  
  searchResult: null,
  setSearchResult: (user) => set({ searchResult: user }),
  
  pendingRequestCount: 0,
  setPendingRequestCount: (count) => set({ pendingRequestCount: count }),
  
  loading: false,
  setLoading: (loading) => set({ loading }),
  
  clear: () =>
    set({
      friends: [],
      receivedRequests: [],
      sentRequests: [],
      selectedFriend: null,
      searchResult: null,
      pendingRequestCount: 0,
      loading: false,
    }),
}));
