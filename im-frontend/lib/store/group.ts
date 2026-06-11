import { create } from 'zustand';
import type { Group, GroupMember, GroupMessage, GroupInvitation, GroupAnnouncement, TypingEvent } from '@/lib/types/api';

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

  // 群邀请
  invitations: GroupInvitation[];
  setInvitations: (invitations: GroupInvitation[]) => void;
  addInvitation: (invitation: GroupInvitation) => void;
  removeInvitation: (invitationId: number) => void;

  // 群公告: key = groupId
  announcements: Record<string, GroupAnnouncement[]>;
  setAnnouncements: (groupId: string, announcements: GroupAnnouncement[]) => void;
  addAnnouncement: (groupId: string, announcement: GroupAnnouncement) => void;

  // 群 Typing 状态: key = groupId
  groupTypingUsers: Record<string, TypingEvent[]>;
  setGroupTypingUser: (groupId: string, event: TypingEvent) => void;
  removeGroupTypingUser: (groupId: string, userId: string) => void;

  // 群消息游标分页状态
  groupHasMore: Record<string, boolean>;
  groupNextCursor: Record<string, string>;
  setGroupCursor: (groupId: string, hasMore: boolean, nextCursor: string) => void;

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

  // 群邀请
  invitations: [],
  setInvitations: (invitations) => set({ invitations }),
  addInvitation: (invitation) => set((state) => ({
    invitations: [invitation, ...state.invitations],
  })),
  removeInvitation: (invitationId) => set((state) => ({
    invitations: state.invitations.filter((inv) => inv.id !== invitationId),
  })),

  // 群公告
  announcements: {},
  setAnnouncements: (groupId, announcements) => set((state) => ({
    announcements: { ...state.announcements, [groupId]: announcements },
  })),
  addAnnouncement: (groupId, announcement) => set((state) => ({
    announcements: {
      ...state.announcements,
      [groupId]: [announcement, ...(state.announcements[groupId] || [])],
    },
  })),

  // 群 Typing
  groupTypingUsers: {},
  setGroupTypingUser: (groupId, event) => {
    const { groupTypingUsers } = get();
    const existing = groupTypingUsers[groupId] || [];
    const filtered = existing.filter((t) => t.user_id !== event.user_id);
    set({ groupTypingUsers: { ...groupTypingUsers, [groupId]: [...filtered, event] } });
    // 3秒后自动清除
    setTimeout(() => {
      const { groupTypingUsers: current } = get();
      const list = current[groupId] || [];
      set({ groupTypingUsers: { ...current, [groupId]: list.filter((t) => t.user_id !== event.user_id) } });
    }, 3000);
  },
  removeGroupTypingUser: (groupId, userId) => {
    const { groupTypingUsers } = get();
    const list = groupTypingUsers[groupId] || [];
    set({ groupTypingUsers: { ...groupTypingUsers, [groupId]: list.filter((t) => t.user_id !== userId) } });
  },

  // 群消息游标分页
  groupHasMore: {},
  groupNextCursor: {},
  setGroupCursor: (groupId, hasMore, nextCursor) => set((state) => ({
    groupHasMore: { ...state.groupHasMore, [groupId]: hasMore },
    groupNextCursor: { ...state.groupNextCursor, [groupId]: nextCursor },
  })),

  // 加载状态
  loading: false,
  setLoading: (loading) => set({ loading }),

  // 错误状态
  error: null,
  setError: (error) => set({ error }),
}));
