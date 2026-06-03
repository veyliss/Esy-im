"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Descriptions, Empty, Input, List, Space, Tag, Typography } from "antd";
import { CopyOutlined, LogoutOutlined, MessageOutlined, SearchOutlined } from "@ant-design/icons";
import { useGroupStore } from "@/lib/store/group";
import { GroupAPI } from "@/lib/api/group";
import { handleApiError, createUserFriendlyErrorMessage } from "@/lib/utils/errors";
import type { Group } from "@/lib/types/api";
import { MobileDetailHeader } from "@/components/workspace/mobile-detail-header";
import { UserAvatar } from "@/components/ui/user-avatar";
import { ErrorAlert } from "@/components/ui/error-alert";
import { PageLoading } from "@/components/ui/loading-states";
import { useAppInteractions } from "@/components/ui/app-interactions";

export function GroupDetail({ group, onLeave, onBack }: { group: Group; onLeave?: () => void; onBack?: () => void }) {
  const { confirm, toast } = useAppInteractions();
  const router = useRouter();
  const { groupMembers, setGroupMembers } = useGroupStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [memberKeyword, setMemberKeyword] = useState("");

  const members = useMemo(() => groupMembers[group.group_id] || [], [groupMembers, group.group_id]);
  const filteredMembers = useMemo(() => {
    const keyword = memberKeyword.trim().toLowerCase();
    if (!keyword) return members;
    return members.filter((member) => {
      const displayName = member.nickname || member.user?.nickname || `用户${member.user_id}`;
      return displayName.toLowerCase().includes(keyword) || member.user_id.toLowerCase().includes(keyword);
    });
  }, [memberKeyword, members]);

  const loadGroupMembers = async () => {
    try {
      setLoading(true);
      const res = await GroupAPI.getGroupMembers(group.group_id);
      if (res.data.code === 0) {
        setGroupMembers(group.group_id, res.data.data);
      }
      setError(null);
    } catch (error) {
      console.error("加载群成员失败:", error);
      const apiError = handleApiError(error);
      setError(createUserFriendlyErrorMessage(apiError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroupMembers();
    // Member list refreshes when the selected group changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group.group_id]);

  const handleLeave = async () => {
    const confirmed = await confirm({
      title: "退出群聊",
      message: "退出后你将不再接收该群的新消息，需要重新加入才能恢复。",
      confirmText: "退出",
      tone: "danger",
    });
    if (!confirmed) return;

    try {
      const res = await GroupAPI.leaveGroup(group.group_id);
      if (res.data.code === 0) {
        onLeave?.();
        toast("已退出群聊", { tone: "success" });
      }
    } catch (error) {
      const apiError = handleApiError(error);
      setError(createUserFriendlyErrorMessage(apiError));
    }
  };

  const handleSendMessage = () => {
    toast("正在打开群聊", { tone: "info" });
    router.push("/chat");
  };

  const handleCopyGroupId = async () => {
    try {
      await navigator.clipboard.writeText(group.group_id);
      toast("群号已复制", { tone: "success" });
    } catch {
      setError("复制失败，请手动复制群号");
    }
  };

  return (
    <div className="im-detail-page ant-linked-page ant-group-detail-page">
      <div className="im-detail-inner ant-linked-page">
        {onBack ? (
          <MobileDetailHeader
            title={group.name}
            description={`群号：${group.group_id}`}
            onBack={onBack}
          />
        ) : null}
        <Card className="ant-linked-card ant-group-profile-card">
          <div className="ant-group-profile">
            <UserAvatar
              src={group.avatar || "/default-group-avatar.png"}
              name={group.name}
              size="2xl"
              shape="rounded"
              border
            />
            <div className="ant-group-profile-main">
              <Typography.Title level={2}>{group.name}</Typography.Title>
              <Typography.Text type="secondary">
                {group.member_count} 人 · 群号：{group.group_id}
              </Typography.Text>
              <Typography.Paragraph type="secondary">
                {group.description || "暂无群描述"}
              </Typography.Paragraph>
              <Space wrap>
                <Tag color={group.is_public ? "processing" : "default"}>{group.is_public ? "公开群" : "私密群"}</Tag>
                <Tag color={group.join_approval ? "warning" : "success"}>{group.join_approval ? "入群需审核" : "直接加入"}</Tag>
              </Space>
            </div>
          </div>
          <Space wrap className="ant-linked-actions">
          <Button type="primary" icon={<MessageOutlined />} onClick={handleSendMessage}>
            发消息
          </Button>
          <Button icon={<CopyOutlined />} onClick={handleCopyGroupId}>
            复制群号
          </Button>
          <Button
            danger
            icon={<LogoutOutlined />}
            onClick={handleLeave}
          >
            退出群聊
          </Button>
          </Space>
        </Card>

        <Card className="ant-linked-card" title="群公告">
          <Typography.Paragraph type="secondary">
            {group.description || "暂无群公告"}
          </Typography.Paragraph>
          <Descriptions column={3} size="small" className="ant-linked-descriptions ant-group-descriptions">
            <Descriptions.Item label="入群审核">{group.join_approval ? "已开启" : "未开启"}</Descriptions.Item>
            <Descriptions.Item label="公开搜索">{group.is_public ? "允许" : "不允许"}</Descriptions.Item>
            <Descriptions.Item label="群容量">{group.member_count}/{group.max_members}</Descriptions.Item>
          </Descriptions>
        </Card>

        <Card
          className="ant-linked-card"
          title={`群成员 · ${filteredMembers.length}`}
          extra={
            <Input
              allowClear
              className="ant-linked-search"
              placeholder="搜索成员昵称或用户 ID"
              prefix={<SearchOutlined />}
              value={memberKeyword}
              onChange={(event) => setMemberKeyword(event.target.value)}
            />
          }
        >
          {loading ? (
            <PageLoading message="加载群成员中..." size="sm" />
          ) : filteredMembers.length === 0 ? (
            <Empty description={memberKeyword.trim() ? "未找到相关成员" : "暂无成员信息"} />
          ) : (
            <List
              className="ant-linked-list"
              dataSource={filteredMembers}
              renderItem={(member) => (
                <List.Item key={member.user_id}>
                  <List.Item.Meta
                    avatar={
                <UserAvatar
                  src={member.user?.avatar || "/default-avatar.png"}
                  name={member.nickname || member.user?.nickname || `用户${member.user_id}`}
                  size="md"
                  border
                />
                    }
                    title={member.nickname || member.user?.nickname || `用户${member.user_id}`}
                    description={
                      <Space wrap size={[6, 4]}>
                        <Tag color={member.role === 3 ? "gold" : member.role === 2 ? "success" : "default"}>
                          {member.role === 3 ? "群主" : member.role === 2 ? "管理员" : "成员"}
                        </Tag>
                        {member.is_muted ? <Tag color="warning">已禁言</Tag> : null}
                        <Typography.Text type="secondary">{member.user_id}</Typography.Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Card>
      </div>

      <ErrorAlert error={error} onClose={() => setError(null)} className="mx-6 mb-4" />
    </div>
  );
}
