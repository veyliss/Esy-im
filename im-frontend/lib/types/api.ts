/**
 * API 通用类型定义
 */

// ============ 通用响应类型 ============

export interface ApiResponse<T = unknown> {
  code: number;
  msg: string;
  data: T;
}

// ============ 分页类型 ============

export interface PaginationParams {
  page?: number;
  page_size?: number;
}

export interface PaginatedResponse<T> {
  list: T[];
  total: number;
  page: number;
  page_size: number;
}

// ============ 用户相关类型 ============

export interface User {
  id: number;
  user_id: string;
  email: string;
  nickname: string;
  avatar: string;
  created_at: string;
  updated_at: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

// ============ 好友相关类型 ============

export interface Friend {
  id: number;
  user_id: string;
  friend_id: string;
  remark: string;
  created_at: string;
  updated_at: string;
  friend_user?: User;
}

export interface FriendRequest {
  id: number;
  from_user_id: string;
  to_user_id: string;
  message: string;
  status: 0 | 1 | 2; // 0-待处理，1-已同意，2-已拒绝
  created_at: string;
  updated_at: string;
  from_user?: User;
  to_user?: User;
}

// ============ 朋友圈相关类型 ============

export interface Moment {
  id: number;
  user_id: string;
  content: string;
  images: string; // JSON字符串
  location: string;
  visible: 0 | 1 | 2; // 0-所有人，1-仅好友，2-私密
  like_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
  user?: User;
  likes?: MomentLike[];
  comments?: MomentComment[];
}

export interface MomentLike {
  id: number;
  moment_id: number;
  user_id: string;
  created_at: string;
  user?: User;
}

export interface MomentComment {
  id: number;
  moment_id: number;
  user_id: string;
  reply_to_id: number | null;
  content: string;
  created_at: string;
  updated_at: string;
  user?: User;
  reply_to?: MomentComment;
}

// ============ 消息相关类型 ============

export enum MessageType {
  TEXT = 1,
  IMAGE = 2,
  AUDIO = 3,
  VIDEO = 4,
  FILE = 5,
}

export interface Message {
  id: number;
  conversation_id: number;
  from_user_id: string;
  to_user_id: string;
  message_type: MessageType;
  content: string;
  media_url: string;
  is_read: boolean;
  read_at: string | null;
  is_recalled: boolean;
  recalled_at: string | null;
  created_at: string;
  updated_at: string;
  from_user?: User;
  to_user?: User;
}

export interface Conversation {
  id: number;
  user1_id: string;
  user2_id: string;
  last_message_id: number | null;
  last_message_time: string | null;
  user1_unread: number;
  user2_unread: number;
  created_at: string;
  updated_at: string;
  user1?: User;
  user2?: User;
  last_message?: Message;
}

// ============ WebSocket 消息类型 ============

export interface WSMessage<T = unknown> {
  type: 'message' | 'ping' | 'pong' | 'typing' | 'friend_request' | 'friend_accepted' | 'error';
  data?: T;
  timestamp: number;
}

export interface WSMessageData extends Message {
  from_user: User;
}

// ============ 群聊相关类型 ============

export interface Group {
  id: number;
  group_id: string;
  name: string;
  avatar: string;
  description: string;
  owner_id: string;
  max_members: number;
  member_count: number;
  is_public: boolean;
  join_approval: boolean;
  created_at: string;
  updated_at: string;
  owner?: User;
  members?: GroupMember[];
}

export interface GroupMember {
  id: number;
  group_id: string;
  user_id: string;
  role: GroupRole;
  nickname: string;
  joined_at: string;
  is_muted: boolean;
  muted_until: string | null;
  created_at: string;
  updated_at: string;
  group?: Group;
  user?: User;
}

export interface GroupMessage {
  id: number;
  group_id: string;
  from_user_id: string;
  message_type: GroupMessageType;
  content: string;
  media_url: string;
  at_users: string;
  is_recalled: boolean;
  recalled_at: string | null;
  created_at: string;
  updated_at: string;
  group?: Group;
  from_user?: User;
}

export interface GroupMessageRead {
  id: number;
  message_id: number;
  user_id: string;
  read_at: string;
  created_at: string;
  message?: GroupMessage;
  user?: User;
}

// 群聊角色枚举
export enum GroupRole {
  MEMBER = 1, // 普通成员
  ADMIN = 2,  // 管理员
  OWNER = 3,  // 群主
}

// 群消息类型枚举
export enum GroupMessageType {
  TEXT = 1,   // 文本消息
  IMAGE = 2,  // 图片消息
  AUDIO = 3,  // 语音消息
  VIDEO = 4,  // 视频消息
  FILE = 5,   // 文件消息
  SYSTEM = 6, // 系统消息
}

// ============ WebSocket 群聊消息类型 ============

export interface WSGroupMessage<T = unknown> {
  type: 'group_message' | 'group_member_join' | 'group_member_leave' | 'group_info_update' | 'ping' | 'pong' | 'error';
  data?: T;
  timestamp: number;
}

export interface WSGroupMessageData extends GroupMessage {
  from_user: User;
  group: Group;
}
