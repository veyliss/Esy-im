import { create } from "zustand";
import type { Moment } from "@/lib/types/api";

interface MomentState {
  // 时间线动态列表
  timeline: Moment[];
  setTimeline: (timeline: Moment[]) => void;
  addMoment: (moment: Moment) => void;
  updateMoment: (id: number, updates: Partial<Moment>) => void;
  removeMoment: (id: number) => void;

  // 我的动态列表
  myMoments: Moment[];
  setMyMoments: (moments: Moment[]) => void;

  // 当前查看的动态详情
  currentMoment: Moment | null;
  setCurrentMoment: (moment: Moment | null) => void;

  // 加载状态
  loading: boolean;
  setLoading: (loading: boolean) => void;

  // 分页信息
  currentPage: number;
  pageSize: number;
  hasMore: boolean;
  setCurrentPage: (page: number) => void;
  setHasMore: (hasMore: boolean) => void;
}

export const useMomentStore = create<MomentState>((set) => ({
  timeline: [],
  setTimeline: (timeline) => set({ timeline }),
  addMoment: (moment) =>
    set((state) => ({ timeline: [moment, ...state.timeline] })),
  updateMoment: (id, updates) =>
    set((state) => ({
      timeline: state.timeline.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      ),
    })),
  removeMoment: (id) =>
    set((state) => ({
      timeline: state.timeline.filter((m) => m.id !== id),
    })),

  myMoments: [],
  setMyMoments: (moments) => set({ myMoments: moments }),

  currentMoment: null,
  setCurrentMoment: (moment) => set({ currentMoment: moment }),

  loading: false,
  setLoading: (loading) => set({ loading }),

  currentPage: 1,
  pageSize: 20,
  hasMore: true,
  setCurrentPage: (page) => set({ currentPage: page }),
  setHasMore: (hasMore) => set({ hasMore }),
}));
