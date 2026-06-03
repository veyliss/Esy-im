/**
 * 好友请求项组件
 */

import { Button, Card, Space, Tag, Typography } from "antd";
import type { FriendRequest } from "@/lib/types/api";
import { formatConversationTime } from "@/lib/utils/time";
import { UserAvatar } from "@/components/ui/user-avatar";

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
    <Card className="ant-request-card" size="small">
      <div className="ant-request-row">
        <div className="ant-request-avatar">
          <UserAvatar
            src={user?.avatar || "/default-avatar.png"}
            name={user?.nickname || "用户"}
            size="lg"
            border
          />
          {isPending ? <span>!</span> : null}
        </div>
        <div className="ant-request-main">
          <div className="ant-request-head">
          <Typography.Text strong ellipsis>
            {user?.nickname || "未知用户"}
          </Typography.Text>
          <Tag color={isAccepted ? "success" : isRejected ? "error" : "warning"}>
            {getStatusText()}
          </Tag>
          </div>
        <Typography.Text type="secondary" ellipsis>
          {request.message || "请求添加你为好友"}
        </Typography.Text>
        <Typography.Text type="secondary" className="ant-request-time">
          {formatConversationTime(request.created_at)}
        </Typography.Text>
        </div>
      {type === "received" && isPending && (
          <Space direction="vertical" size={8} className="ant-request-actions">
          <Button
            size="small"
            type="primary"
            onClick={() => onAccept?.(request.id)}
          >
            同意
          </Button>
          <Button
            danger
            size="small"
            onClick={() => onReject?.(request.id)}
          >
            拒绝
          </Button>
          </Space>
      )}
      </div>
    </Card>
  );
}
