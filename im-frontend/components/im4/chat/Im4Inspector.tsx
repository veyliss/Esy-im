import { UserAvatar } from "@/components/ui/user-avatar";
import { Button, Card, Descriptions, Space, Typography } from "antd";
import { CloseOutlined } from "@ant-design/icons";

interface Im4InspectorProps {
  name: string;
  avatar?: string;
  type: "private" | "group";
  unreadCount: number;
  messageCount: number;
  pinned?: boolean;
  muted?: boolean;
  groupId?: string;
  memberCount?: number;
  onClose: () => void;
  onTogglePinned: () => void;
  onToggleMuted: () => void;
  onOpenDetail: () => void;
  onHideConversation: () => void;
}

export function Im4Inspector({
  name,
  avatar,
  type,
  unreadCount,
  messageCount,
  pinned = false,
  muted = false,
  groupId,
  memberCount,
  onClose,
  onTogglePinned,
  onToggleMuted,
  onOpenDetail,
  onHideConversation,
}: Im4InspectorProps) {
  return (
    <div className="im4-inspector ant-im4-inspector">
      <div className="im4-inspector-head ant-im4-inspector-head">
        <Typography.Text strong>{type === "group" ? "群聊上下文" : "联系人上下文"}</Typography.Text>
        <Button aria-label="关闭资料" icon={<CloseOutlined />} shape="circle" title="关闭资料" type="text" onClick={onClose} />
      </div>
      <Card className="ant-im4-inspector-card ant-im4-inspector-profile">
        <UserAvatar src={avatar} name={name} size="2xl" shape={type === "group" ? "rounded" : "circle"} border />
        <Typography.Title level={3}>{name}</Typography.Title>
        <Typography.Text type="secondary">{type === "group" && groupId ? `群号：${groupId}` : "私聊会话"}</Typography.Text>
      </Card>
      <Card className="ant-im4-inspector-card">
        <Descriptions column={1} size="small">
          <Descriptions.Item label="未读">{unreadCount || "无"}</Descriptions.Item>
          <Descriptions.Item label="消息">{messageCount}</Descriptions.Item>
          {typeof memberCount === "number" ? <Descriptions.Item label="成员">{memberCount}</Descriptions.Item> : null}
        </Descriptions>
      </Card>
      <Card className="ant-im4-inspector-card">
        <Space direction="vertical" className="ant-im4-inspector-actions">
          <Button onClick={onTogglePinned}>{pinned ? "取消置顶" : "置顶会话"}</Button>
          <Button onClick={onToggleMuted}>{muted ? "取消免打扰" : "免打扰"}</Button>
          <Button onClick={onOpenDetail}>{type === "group" ? "群聊详情" : "联系人详情"}</Button>
          <Button danger onClick={onHideConversation}>隐藏会话</Button>
        </Space>
      </Card>
    </div>
  );
}

export default Im4Inspector;
