/**
 * UI状态管理
 */

import { create } from 'zustand';

interface UIState {
  // 侧边栏状态
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  
  // 移动端菜单状态
  mobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
  setMobileMenuOpen: (open: boolean) => void;
  
  // 搜索状态
  searchOpen: boolean;
  toggleSearch: () => void;
  setSearchOpen: (open: boolean) => void;
  
  // 用户下拉菜单状态
  userDropdownOpen: boolean;
  setUserDropdownOpen: (open: boolean) => void;
  
  // 全局加载状态
  loading: boolean;
  setLoading: (loading: boolean) => void;
  
  // 主题状态
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  
  // 通知状态
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  duration?: number;
}

export const useUIStore = create<UIState>((set, get) => ({
  // 侧边栏状态
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  
  // 移动端菜单状态
  mobileMenuOpen: false,
  toggleMobileMenu: () => set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
  
  // 搜索状态
  searchOpen: false,
  toggleSearch: () => set((state) => ({ searchOpen: !state.searchOpen })),
  setSearchOpen: (open) => set({ searchOpen: open }),
  
  // 用户下拉菜单状态
  userDropdownOpen: false,
  setUserDropdownOpen: (open) => set({ userDropdownOpen: open }),
  
  // 全局加载状态
  loading: false,
  setLoading: (loading) => set({ loading }),
  
  // 主题状态
  theme: 'light',
  toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
  setTheme: (theme) => set({ theme }),
  
  // 通知状态
  notifications: [],
  addNotification: (notification) => {
    // 使用时间戳和计数器生成更可靠的ID
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    const newNotification: Notification = {
      id: `notification-${timestamp}-${random}`,
      timestamp: new Date(),
      ...notification,
    };
    
    set((state) => ({
      notifications: [...state.notifications, newNotification],
    }));
    
    // 自动移除通知
    if (newNotification.duration !== 0) {
      setTimeout(() => {
        get().removeNotification(newNotification.id);
      }, newNotification.duration || 5000);
    }
  },
  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },
  clearNotifications: () => set({ notifications: [] }),
}));

/**
 * 响应式断点hooks
 */
export const useBreakpoint = () => {
  if (typeof window === 'undefined') return 'lg';
  
  const width = window.innerWidth;
  
  if (width < 640) return 'sm';
  if (width < 768) return 'md';
  if (width < 1024) return 'lg';
  if (width < 1280) return 'xl';
  return '2xl';
};

/**
 * 移动端检测hooks
 */
export const useIsMobile = () => {
  const breakpoint = useBreakpoint();
  return breakpoint === 'sm' || breakpoint === 'md';
};