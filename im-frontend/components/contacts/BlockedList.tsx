"use client";

import { Card, Empty, List, Button, Space, Typography } from "antd";
import { UserAvatar } from "@/components/ui/user-avatar";
import type { BlockedUser } from "@/lib/types/api";

interface BlockedListProps {
  blockedList: BlockedUser[];
  onUnblock: (blockId: number) => void;
}

export function BlockedList({ blockedList, onUnblock }: BlockedListProps) {
  if (blockedList.length === 0) {
    return (
      <Card className="ant-linked-card">
        <Empty description="暂无拉黑用户" />
      </Card>
    );
  }

  return (
    <Card className="ant-linked-card" title={`黑名单 · ${blockedList.length}`}>
      <List
        dataSource={blockedList}
        renderItem={(item) => (
          <List.Item
            key={item.id}
            actions={[
              <Button
                key="unblock"
                size="small"
                onClick={() => onUnblock(item.id)}
              >
                解除拉黑
              </Button>
            ]}
          >
            <List.Item.Meta
              avatar={
                <UserAvatar
                  src={item.blocked_user?.avatar || "/default-avatar.png"}
                  name={item.blocked_user?.nickname || `用户${item.blocked_user_id}`}
                  size="md"
                  border
                />
              }
              title={item.blocked_user?.nickname || `用户${item.blocked_user_id}`}
              description={
                <Space direction="vertical" size={0}>
                  <Typography.Text type="secondary">用户 ID：{item.blocked_user_id}</Typography.Text>
                  <Typography.Text type="secondary" className="text-xs">
                    拉黑于 {new Date(item.created_at).toLocaleDateString("zh-CN")}
                  </Typography.Text>
                </Space>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  );
}
