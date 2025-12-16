/**
 * 好友列表项组件
 */

import Image from "next/image";
import type { Friend } from "@/lib/types/api";

interface FriendItemProps {
  friend: Friend;
  isActive: boolean;
  onClick: () => void;
}

export function FriendItem({ friend, isActive, onClick }: FriendItemProps) {
  const friendUser = friend.friend_user;

  return (
    <a
      className={`flex items-center gap-3 rounded-xl p-3 transition-all cursor-pointer ${
        isActive
          ? "bg-primary/10 dark:bg-primary/20 text-primary shadow-sm"
          : "hover:bg-slate-100 dark:hover:bg-slate-800 hover:shadow-sm"
      }`}
      onClick={onClick}
    >
      <div className="relative inline-block">
        <Image
          className="size-11 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700"
          src={friendUser?.avatar || "https://via.placeholder.com/44"}
          alt={friendUser?.nickname || "好友"}
          width={44}
          height={44}
        />
        {/* 在线状态指示器 */}
        <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-white dark:ring-slate-900"></span>
      </div>
      <div className="flex-1 min-w-0">
        <p className={`truncate text-sm font-medium ${
          isActive ? "font-semibold text-primary" : "text-slate-800 dark:text-slate-200"
        }`}>
          {friend.remark || friendUser?.nickname || "未知用户"}
        </p>
        {friend.remark && friendUser?.nickname && (
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
            {friendUser.nickname}
          </p>
        )}
      </div>
      {isActive && (
        <span className="material-symbols-outlined text-primary text-lg">
          check_circle
        </span>
      )}
    </a>
  );
}
