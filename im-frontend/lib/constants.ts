/**
 * 应用常量
 */

// 应用信息
export const APP_CONFIG = {
  NAME: 'VeylissIM',
  VERSION: '1.0.0',
  DESCRIPTION: '即时通讯系统',
};

// 路由配置
export const ROUTE_CONFIG = {
  HOME: '/home',
  MESSAGES: '/main/messages',
  CONTACTS: '/main/contacts',
  MOMENTS: '/main/moments',
  ME: '/main/me',
  SETTINGS: '/settings',
  PROFILE: '/profile',
};

// 导航菜单项
export const NAV_MENU_ITEMS = [
  {
    key: ROUTE_CONFIG.HOME,
    label: '首页',
    icon: '🏠',
    description: '用户仪表板',
  },
  {
    key: ROUTE_CONFIG.MESSAGES,
    label: '消息',
    icon: '💬',
    description: '查看和管理消息',
  },
  {
    key: ROUTE_CONFIG.CONTACTS,
    label: '联系人',
    icon: '👥',
    description: '管理联系人列表',
  },
  {
    key: ROUTE_CONFIG.MOMENTS,
    label: '朋友圈',
    icon: '📸',
    description: '分享生活动态',
  },
  {
    key: ROUTE_CONFIG.ME,
    label: '我的',
    icon: '👤',
    description: '个人资料和设置',
  },
];

// 快速操作项
export const QUICK_ACTIONS: Array<{
  id: string;
  label: string;
  description: string;
  icon: string;
  color: 'blue' | 'green' | 'purple' | 'red' | 'orange' | 'gray';
  route: string;
}> = [
  {
    id: 'new-chat',
    label: '发起聊天',
    description: '开始新的对话',
    icon: '💬',
    color: 'blue',
    route: ROUTE_CONFIG.MESSAGES,
  },
  {
    id: 'add-contact',
    label: '添加联系人',
    description: '添加新的联系人',
    icon: '👥',
    color: 'green',
    route: ROUTE_CONFIG.CONTACTS,
  },
  {
    id: 'share-moment',
    label: '分享动态',
    description: '发布朋友圈动态',
    icon: '📸',
    color: 'purple',
    route: ROUTE_CONFIG.MOMENTS,
  },
  {
    id: 'settings',
    label: '设置',
    description: '应用设置',
    icon: '⚙️',
    color: 'gray',
    route: ROUTE_CONFIG.SETTINGS,
  },
];

// 用户指标数据
export const USER_METRICS: Array<{
  id: string;
  label: string;
  value: number;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: string;
}> = [
  {
    id: 'total-contacts',
    label: '联系人总数',
    value: 128,
    change: '+12',
    changeType: 'positive',
    icon: '👥',
  },
  {
    id: 'unread-messages',
    label: '未读消息',
    value: 5,
    change: '-3',
    changeType: 'negative',
    icon: '💬',
  },
  {
    id: 'online-friends',
    label: '在线好友',
    value: 23,
    change: '+2',
    changeType: 'positive',
    icon: '🟢',
  },
  {
    id: 'moments-today',
    label: '今日动态',
    value: 8,
    change: '+3',
    changeType: 'positive',
    icon: '📸',
  },
];

// 活动数据生成函数
export const getActivityData = () => {
  const now = new Date();
  return [
    {
      id: '1',
      type: 'message' as const,
      user: '张三',
      action: '发送了新消息',
      target: '你',
      time: new Date(now.getTime() - 1000 * 60 * 5), // 5分钟前
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangsan',
    },
    {
      id: '2',
      type: 'contact' as const,
      user: '李四',
      action: '添加了你为好友',
      time: new Date(now.getTime() - 1000 * 60 * 30), // 30分钟前
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lisi',
    },
    {
      id: '3',
      type: 'moment' as const,
      user: '王五',
      action: '发布了新动态',
      time: new Date(now.getTime() - 1000 * 60 * 60 * 2), // 2小时前
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wangwu',
    },
    {
      id: '4',
      type: 'message' as const,
      user: '赵六',
      action: '回复了你的消息',
      time: new Date(now.getTime() - 1000 * 60 * 60 * 5), // 5小时前
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhaoliu',
    },
  ];
};

// 活动数据类型
export type ActivityData = ReturnType<typeof getActivityData>[0];

// 用户资料菜单项
export const USER_PROFILE_MENU = [
  {
    key: 'profile',
    label: '个人资料',
    icon: '👤',
  },
  {
    key: 'settings',
    label: '设置',
    icon: '⚙️',
  },
  {
    key: 'help',
    label: '帮助与反馈',
    icon: '❓',
  },
  {
    key: 'logout',
    label: '退出登录',
    icon: '🚪',
    danger: true,
  },
];

// 响应式断点
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

// 主题配置
export const THEME_CONFIG = {
  colors: {
    primary: '#2563eb',
    secondary: '#6b7280',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#06b6d4',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
  },
};