"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Descriptions, Empty, Input, List, Modal, Skeleton, Space, Tag, Typography } from "antd";
import { CopyOutlined, LogoutOutlined, MessageOutlined, SearchOutlined, PlusOutlined, SoundOutlined } from "@ant-design/icons";
import { useGroupStore } from "@/lib/store/group";
import { GroupAPI } from "@/lib/api/group";
import { FriendAPI } from "@/lib/api/friend";
import { handleApiError, createUserFriendlyErrorMessage } from "@/lib/utils/errors";
import type { Group, Friend, GroupAnnouncement } from "@/lib/types/api";
import { MobileDetailHeader } from "@/components/workspace/mobile-detail-header";
import { UserAvatar } from "@/components/ui/user-avatar";
import { ErrorAlert } from "@/components/ui/error-alert";
import { useAppInteractions } from "@/components/ui/app-interactions";

export function GroupDetail({ group, onLeave, onBack }: { group: Group; onLeave?: () => void; onBack?: () => void }) {
  const { confirm, toast } = useAppInteractions();
  const router = useRouter();
  const { groupMembers, setGroupMembers, announcements, setAnnouncements } = useGroupStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [memberKeyword, setMemberKeyword] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [inviteKeyword, setInviteKeyword] = useState("");
  const [inviting, setInviting] = useState(false);
  const [showAnnouncementEditor, setShowAnnouncementEditor] = useState(false);
  const [announcementContent, setAnnouncementContent] = useState("");
  const [announcementLoading, setAnnouncementLoading] = useState(false);

  const members = useMemo(() => groupMembers[group.group_id] || [], [groupMembers, group.group_id]);
  const groupAnnouncements = useMemo(() => announcements[group.group_id] || [], [announcements, group.group_id]);
  const filteredMembers = useMemo(() => {
    const keyword = memberKeyword.trim().toLowerCase();
    if (!keyword) return members;
    return members.filter((member) => {
      const displayName = member.nickname || member.user?.nickname || `用户${member.user_id}`;
      return displayName.toLowerCase().includes(keyword) || member.user_id.toLowerCase().includes(keyword);
    });
  }, [memberKeyword, members]);

  const filteredFriends = useMemo(() => {
    const keyword = inviteKeyword.trim().toLowerCase();
    if (!keyword) return friends;
    return friends.filter((f) => {
      const name = f.remark || f.friend_user?.nickname || `用户${f.friend_id}`;
      return name.toLowerCase().includes(keyword);
    });
  }, [inviteKeyword, friends]);

  const memberUserIds = useMemo(() => new Set(members.map((m) => m.user_id)), [members]);

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

  const loadAnnouncements = async () => {
    try {
      const res = await GroupAPI.getAnnouncements(group.group_id);
      if (res.data.code === 0) {
        setAnnouncements(group.group_id, res.data.data);
      }
    } catch (error) {
      console.error("加载群公告失败:", error);
    }
  };

  const loadFriends = async () => {
    try {
      const res = await FriendAPI.getFriendList();
      if (res.data.code === 0) setFriends(res.data.data);
    } catch (error) {
      console.error("加载好友列表失败:", error);
    }
  };

  useEffect(() => {
    loadGroupMembers();
    loadAnnouncements();
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

  const handleInviteUser = async (friendId: string) => {
    setInviting(true);
    try {
      const res = await GroupAPI.inviteUser(group.group_id, friendId);
      if (res.data.code === 0) {
        toast("邀请已发送", { tone: "success" });
      }
    } catch (error) {
      const apiError = handleApiError(error);
      toast(createUserFriendlyErrorMessage(apiError), { tone: "error" });
    } finally {
      setInviting(false);
    }
  };

  const handleOpenInvite = () => {
    loadFriends();
    setShowInviteModal(true);
  };

  const handleCreateAnnouncement = async () => {
    if (!announcementContent.trim()) return;
    setAnnouncementLoading(true);
    try {
      const res = await GroupAPI.createAnnouncement(group.group_id, { content: announcementContent.trim() });
      if (res.data.code === 0) {
        toast("公告已发布", { tone: "success" });
        setAnnouncementContent("");
        setShowAnnouncementEditor(false);
        await loadAnnouncements();
      }
    } catch (error) {
      const apiError = handleApiError(error);
      toast(createUserFriendlyErrorMessage(apiError), { tone: "error" });
    } finally {
      setAnnouncementLoading(false);
    }
  };

  const handleDeleteAnnouncement = async (id: number) => {
    try {
      const res = await GroupAPI.deleteAnnouncement(id);
      if (res.data.code === 0) {
        toast("公告已删除", { tone: "success" });
        await loadAnnouncements();
      }
    } catch (error) {
      const apiError = handleApiError(error);
      toast(createUserFriendlyErrorMessage(apiError), { tone: "error" });
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

        <Card
          className="ant-linked-card"
          title={
            <Space>
              <SoundOutlined />
              群公告 · {groupAnnouncements.length}
            </Space>
          }
          extra={
            <Button size="small" type="primary" onClick={() => setShowAnnouncementEditor(true)}>
              发布公告
            </Button>
          }
        >
          {groupAnnouncements.length === 0 ? (
            <Typography.Paragraph type="secondary">
              {group.description || "暂无群公告"}
            </Typography.Paragraph>
          ) : (
            <List
              size="small"
              dataSource={groupAnnouncements}
              renderItem={(item: GroupAnnouncement) => (
                <List.Item
                  actions={[
                    <Button key="del" size="small" danger type="text" onClick={() => handleDeleteAnnouncement(item.id)}>
                      删除
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    title={item.content.slice(0, 80)}
                    description={
                      <Space size={4}>
                        {item.is_pinned ? <Tag color="gold">置顶</Tag> : null}
                        <Typography.Text type="secondary" className="text-xs">
                          {new Date(item.created_at).toLocaleDateString("zh-CN")}
                        </Typography.Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          )}
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
            <Space>
              <Button size="small" icon={<PlusOutlined />} onClick={handleOpenInvite}>
                邀请
              </Button>
              <Input
                allowClear
                className="ant-linked-search"
                placeholder="搜索成员"
                prefix={<SearchOutlined />}
                value={memberKeyword}
                onChange={(event) => setMemberKeyword(event.target.value)}
              />
            </Space>
          }
        >
          {loading ? (
            <>
              <Skeleton active avatar paragraph={{ rows: 1 }} style={{ marginBottom: 12 }} />
              <Skeleton active avatar paragraph={{ rows: 1 }} style={{ marginBottom: 12 }} />
              <Skeleton active avatar paragraph={{ rows: 1 }} />
            </>
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

      {/* Invite Modal */}
      <Modal
        title="邀请好友入群"
        open={showInviteModal}
        onCancel={() => setShowInviteModal(false)}
        footer={null}
        width={420}
      >
        <Input
          placeholder="搜索好友..."
          value={inviteKeyword}
          onChange={(e) => setInviteKeyword(e.target.value)}
          allowClear
          className="mb-3"
        />
        <div className="max-h-[400px] overflow-y-auto">
          {filteredFriends.length === 0 ? (
            <Empty description="暂无可邀请的好友" />
          ) : (
            <List
              size="small"
              dataSource={filteredFriends}
              renderItem={(friend) => {
                const isMember = memberUserIds.has(friend.friend_id);
                return (
                  <List.Item
                    actions={[
                      isMember ? (
                        <Tag color="default">已在群中</Tag>
                      ) : (
                        <Button
                          size="small"
                          type="primary"
                          loading={inviting}
                          onClick={() => handleInviteUser(friend.friend_id)}
                        >
                          邀请
                        </Button>
                      ),
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <UserAvatar
                          src={friend.friend_user?.avatar || "/default-avatar.png"}
                          name={friend.remark || friend.friend_user?.nickname || `用户${friend.friend_id}`}
                          size="sm"
                          border
                        />
                      }
                      title={friend.remark || friend.friend_user?.nickname || `用户${friend.friend_id}`}
                    />
                  </List.Item>
                );
              }}
            />
          )}
        </div>
      </Modal>

      {/* Announcement Editor Modal */}
      <Modal
        title="发布公告"
        open={showAnnouncementEditor}
        onCancel={() => { setShowAnnouncementEditor(false); setAnnouncementContent(""); }}
        onOk={handleCreateAnnouncement}
        okText="发布"
        okButtonProps={{ loading: announcementLoading, disabled: !announcementContent.trim() }}
        cancelText="取消"
      >
        <Input.TextArea
          rows={4}
          maxLength={500}
          showCount
          placeholder="输入公告内容..."
          value={announcementContent}
          onChange={(e) => setAnnouncementContent(e.target.value)}
        />
      </Modal>
    </div>
  );
}
