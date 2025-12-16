import { create } from 'zustand';
import type { Group, GroupMember, GroupMessage } from '@/lib/types/api';

interface GroupStore {
  // 群组列表
  groups: Group[];
  setGroups: (groups: Group[]) => void;
  addGroup: (group: Group) => void;
  updateGroup: (groupId: string, updates: Partial<Group>) => void;
  removeGroup: (groupId: string) => void;

  // 当前选中的群组
  currentGroup: Group | null;
  setCurrentGroup: (group: Group | null) => void;

  // 群成员
  groupMembers: Record<string, GroupMember[]>;
  setGroupMembers: (groupId: string, members: GroupMember[]) => void;
  addGroupMember: (groupId: string, member: GroupMember) => void;
  removeGroupMember: (groupId: string, userId: string) => void;
  updateGroupMember: (groupId: string, userId: string, updates: Partial<GroupMember>) => void;

  // 群消息
  groupMessages: Record<string, GroupMessage[]>;
  setGroupMessages: (groupId: string, messages: GroupMessage[]) => void;
  addGroupMessage: (groupId: string, message: GroupMessage) => void;
  updateGroupMessage: (groupId: string, messageId: number, updates: Partial<GroupMessage>) => void;

  // 未读消息数
  groupUnreadCounts: Record<string, number>;
  setGroupUnreadCount: (groupId: string, count: number) => void;
  incrementGroupUnreadCount: (groupId: string) => void;
  clearGroupUnreadCount: (groupId: string) => void;

  // 加载状态
  loading: boolean;
  setLoading: (loading: boolean) => void;

  // 错误状态
  error: string | null;
  setError: (error: string | null) => void;
}

export const useGroupStore = create<GroupStore>((set, get) => ({
  // 群组列表
  groups: [],
  setGroups: (groups) => set({ groups }),
  addGroup: (group) => set((state) => ({ 
    groups: [group, ...state.groups] 
  })),
  updateGroup: (groupId, updates) => set((state) => ({
    groups: state.groups.map(group => 
      group.group_id === groupId ? { ...group, ...updates } : group
    ),
    currentGroup: state.currentGroup?.group_id === groupId 
      ? { ...state.currentGroup, ...updates } 
      : state.currentGroup
  })),
  removeGroup: (groupId) => set((state) => ({
    groups: state.groups.filter(group => group.group_id !== groupId),
    currentGroup: state.currentGroup?.group_id === groupId ? null : state.currentGroup
  })),

  // 当前选中的群组
  currentGroup: null,
  setCurrentGroup: (group) => set({ currentGroup: group }),

  // 群成员
  groupMembers: {},
  setGroupMembers: (groupId, members) => set((state) => ({
    groupMembers: { ...state.groupMembers, [groupId]: members }
  })),
  addGroupMember: (groupId, member) => set((state) => ({
    groupMembers: {
      ...state.groupMembers,
      [groupId]: [...(state.groupMembers[groupId] || []), member]
    }
  })),
  removeGroupMember: (groupId, userId) => set((state) => ({
    groupMembers: {
      ...state.groupMembers,
      [groupId]: (state.groupMembers[groupId] || []).filter(member => member.user_id !== userId)
    }
  })),
  updateGroupMember: (groupId, userId, updates) => set((state) => ({
    groupMembers: {
      ...state.groupMembers,
      [groupId]: (state.groupMembers[groupId] || []).map(member =>
        member.user_id === userId ? { ...member, ...updates } : member
      )
    }
  })),

  // 群消息
  groupMessages: {},
  setGroupMessages: (groupId, messages) => set((state) => ({
    groupMessages: { ...state.groupMessages, [groupId]: messages }
  })),
  addGroupMessage: (groupId, message) => set((state) => ({
    groupMessages: {
      ...state.groupMessages,
      [groupId]: [...(state.groupMessages[groupId] || []), message]
    }
  })),
  updateGroupMessage: (groupId, messageId, updates) => set((state) => ({
    groupMessages: {
      ...state.groupMessages,
      [groupId]: (state.groupMessages[groupId] || []).map(message =>
        message.id === messageId ? { ...message, ...updates } : message
      )
    }
  })),

  // 未读消息数
  groupUnreadCounts: {},
  setGroupUnreadCount: (groupId, count) => set((state) => ({
    groupUnreadCounts: { ...state.groupUnreadCounts, [groupId]: count }
  })),
  incrementGroupUnreadCount: (groupId) => set((state) => ({
    groupUnreadCounts: {
      ...state.groupUnreadCounts,
      [groupId]: (state.groupUnreadCounts[groupId] || 0) + 1
    }
  })),
  clearGroupUnreadCount: (groupId) => set((state) => ({
    groupUnreadCounts: { ...state.groupUnreadCounts, [groupId]: 0 }
  })),

  // 加载状态
  loading: false,
  setLoading: (loading) => set({ loading }),

  // 错误状态
  error: null,
  setError: (error) => set({ error }),
}));