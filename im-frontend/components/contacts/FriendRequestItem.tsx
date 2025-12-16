/**
 * 好友请求项组件
 */

import Image from "next/image";
import type { FriendRequest } from "@/lib/types/api";
import { formatConversationTime } from "@/lib/utils/time";

interface FriendRequestItemProps {
  request: FriendRequest;
  type: "received" | "sent";
  onAccept?: (requestId: number) => void;
  onReject?: (requestId: number) => void;
}

export function FriendRequestItem({
  request,
  type,
  onAccept,
  onReject,
}: FriendRequestItemProps) {
  const user = type === "received" ? request.from_user : request.to_user;
  const isPending = request.status === 0;
  const isAccepted = request.status === 1;
  const isRejected = request.status === 2;

  const getStatusText = () => {
    if (isAccepted) return "已同意";
    if (isRejected) return "已拒绝";
    return type === "received" ? "待处理" : "等待对方处理";
  };

  // const getStatusColor = () => {
  //   if (isAccepted) return "text-green-600 dark:text-green-400";
  //   if (isRejected) return "text-red-600 dark:text-red-400";
  //   return "text-orange-600 dark:text-orange-400";
  // };

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-md transition-all">
      <div className="relative">
        <Image
          className="size-12 rounded-full object-cover border-2 border-slate-200 dark:border-slate-600"
          src={user?.avatar || "https://via.placeholder.com/48"}
          alt={user?.nickname || "用户"}
          width={48}
          height={48}
        />
        {isPending && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white font-bold">
            !
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold text-slate-900 dark:text-white truncate">
            {user?.nickname || "未知用户"}
          </p>
          <span className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${
            isAccepted 
              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" 
              : isRejected 
              ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
              : "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400"
          }`}>
            {getStatusText()}
          </span>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 truncate mt-1.5">
          {request.message || "请求添加你为好友"}
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          {formatConversationTime(request.created_at)}
        </p>
      </div>
      {type === "received" && isPending && (
        <div className="flex flex-col gap-2 shrink-0">
          <button
            onClick={() => onAccept?.(request.id)}
            className="px-5 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 hover:shadow-md transition-all"
          >
            同意
          </button>
          <button
            onClick={() => onReject?.(request.id)}
            className="px-5 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
          >
            拒绝
          </button>
        </div>
      )}
    </div>
  );
}
