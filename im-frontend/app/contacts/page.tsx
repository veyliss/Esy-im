"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Card, Descriptions, Empty, Input, Space, Tag, Typography } from "antd";
import { CopyOutlined, DeleteOutlined, MessageOutlined, SaveOutlined } from "@ant-design/icons";
import { useAuthStore } from "@/lib/store";
import { useContactStore } from "@/lib/store/contact";
import { useChatStore } from "@/lib/store/chat";
import { FriendAPI } from "@/lib/api/friend";
import { MessageAPI } from "@/lib/api/message";
import { UserAPI } from "@/lib/api/user";
import { handleApiError, createUserFriendlyErrorMessage } from "@/lib/utils/errors";
import type { User } from "@/lib/types/api";
import { useRouter } from "next/navigation";
import { wsClient } from "@/lib/websocket/client";
import { Im4Button, Im4Empty, Im4Search, Im4SessionItem, Im4Shell, Im4Status } from "@/components/im4";
import { MobileDetailHeader } from "@/components/workspace/mobile-detail-header";
import { UserAvatar } from "@/components/ui/user-avatar";
import { ErrorAlert } from "@/components/ui/error-alert";
import { useAppInteractions } from "@/components/ui/app-interactions";
import { FriendRequestItem } from "@/components/contacts/FriendRequestItem";
import { AddFriendModal } from "@/components/contacts/AddFriendModal";

export default function ContactsPage() {
  const { confirm, toast } = useAppInteractions();
  const router = useRouter();
  const token = useAuthStore((state) => state.token);

  const {
    friends,
    setFriends,
    receivedRequests,
    setReceivedRequests,
    sentRequests,
    setSentRequests,
    selectedFriend,
    setSelectedFriend,
    pendingRequestCount,
    setPendingRequestCount,
  } = useContactStore();

  const { setCurrentConversation } = useChatStore();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeRightTab, setActiveRightTab] = useState<"detail" | "requests">("detail");
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [remark, setRemark] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [contactFilter, setContactFilter] = useState("");

  useEffect(() => {
    if (token) {
      UserAPI.getMe().then((res) => {
        if (res.data.code === 0) setCurrentUser(res.data.data);
      }).catch(() => {});
    }
  }, [token]);

  const loadFriends = async () => {
    try {
      const res = await FriendAPI.getFriendList();
      if (res.data.code === 0) setFriends(res.data.data);
    } catch (e) {
      console.error("加载好友列表失败:", e);
    }
  };

  const loadReceivedRequests = async () => {
    try {
      const res = await FriendAPI.getReceivedRequests();
      if (res.data.code === 0) {
        setReceivedRequests(res.data.data);
        setPendingRequestCount(res.data.data.filter((r) => r.status === 0).length);
      }
    } catch (e) {
      console.error("加载好友请求失败:", e);
    }
  };

  const loadSentRequests = async () => {
    try {
      const res = await FriendAPI.getSentRequests();
      if (res.data.code === 0) setSentRequests(res.data.data);
    } catch (e) {
      console.error("加载发出的请求失败:", e);
    }
  };

  useEffect(() => {
    if (token) {
      loadFriends();
      loadReceivedRequests();
      loadSentRequests();

      wsClient.connect(token);

      const handleFriendRequest = () => {
        loadReceivedRequests();
        setActiveRightTab("requests");
      };

      const handleFriendAccepted = () => {
        loadFriends();
        loadSentRequests();
      };

      wsClient.onFriendRequest(handleFriendRequest);
      wsClient.onFriendAccepted(handleFriendAccepted);

      return () => {
        wsClient.offFriendRequest(handleFriendRequest);
        wsClient.offFriendAccepted(handleFriendAccepted);
      };
    }
    // Contacts bootstrap and realtime subscriptions are tied to auth token changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (selectedFriend) setRemark(selectedFriend.remark || "");
  }, [selectedFriend]);

  useEffect(() => {
    if (!selectedFriend && pendingRequestCount > 0) {
      setActiveRightTab("requests");
    }
  }, [pendingRequestCount, selectedFriend]);

  const handleAcceptRequest = async (requestId: number) => {
    try {
      const res = await FriendAPI.acceptRequest({ request_id: requestId });
      if (res.data.code === 0) {
        await loadFriends();
        await loadReceivedRequests();
        toast("已接受好友申请", { tone: "success" });
      }
    } catch (e) {
      const apiError = handleApiError(e);
      setError(createUserFriendlyErrorMessage(apiError));
    }
  };

  const handleRejectRequest = async (requestId: number) => {
    try {
      const res = await FriendAPI.rejectRequest({ request_id: requestId });
      if (res.data.code === 0) {
        await loadReceivedRequests();
        toast("已拒绝好友申请", { tone: "success" });
      }
    } catch (e) {
      const apiError = handleApiError(e);
      setError(createUserFriendlyErrorMessage(apiError));
    }
  };

  const handleUpdateRemark = async () => {
    if (!selectedFriend) return;
    try {
      const res = await FriendAPI.updateRemark({
        friend_id: selectedFriend.friend_id,
        remark: remark.trim(),
      });
      if (res.data.code === 0) {
        await loadFriends();
        toast("备注已保存", { tone: "success" });
      }
    } catch (e) {
      const apiError = handleApiError(e);
      setError(createUserFriendlyErrorMessage(apiError));
    }
  };

  const handleDeleteFriend = async () => {
    if (!selectedFriend) return;
    const confirmed = await confirm({
      title: "删除联系人",
      message: "删除后将从通讯录移除该好友，聊天记录不会自动清空。",
      confirmText: "删除",
      tone: "danger",
    });
    if (!confirmed) return;

    try {
      const res = await FriendAPI.deleteFriend(selectedFriend.friend_id);
      if (res.data.code === 0) {
        setSelectedFriend(null);
        await loadFriends();
        toast("联系人已删除", { tone: "success" });
      }
    } catch (e) {
      const apiError = handleApiError(e);
      setError(createUserFriendlyErrorMessage(apiError));
    }
  };

  const handleSendMessage = async () => {
    if (!selectedFriend) return;
    try {
      const res = await MessageAPI.getOrCreateConversation({
        friend_user_id: selectedFriend.friend_id,
      });
      if (res.data.code === 0) {
        setCurrentConversation(res.data.data);
        router.push("/chat");
      }
    } catch (e) {
      const apiError = handleApiError(e);
      setError(createUserFriendlyErrorMessage(apiError));
    }
  };

  const handleCopyFriendId = async () => {
    if (!friendUser?.user_id) return;
    try {
      await navigator.clipboard.writeText(friendUser.user_id);
      toast("用户 ID 已复制", { tone: "success" });
    } catch {
      setError("复制失败，请手动复制用户 ID");
    }
  };

  const selectFriend = (friend: (typeof friends)[number]) => {
    setSelectedFriend(friend);
    setActiveRightTab("detail");
  };

  const friendUser = selectedFriend?.friend_user;
  const filterKeyword = contactFilter.trim().toLowerCase();

  const filteredFriends = useMemo(() => {
    if (!filterKeyword) return friends;
    return friends.filter((friend) => {
      const fu = friend.friend_user;
      const displayName = friend.remark || fu?.nickname || `用户${fu?.user_id || ""}`;
      return displayName.toLowerCase().includes(filterKeyword) || String(fu?.user_id || "").includes(filterKeyword);
    });
  }, [filterKeyword, friends]);

  const groupedFriends = useMemo(() => {
    return filteredFriends.reduce<Array<{ key: string; items: typeof filteredFriends }>>((groups, friend) => {
      const fu = friend.friend_user;
      const displayName = friend.remark || fu?.nickname || `用户${fu?.user_id || ""}`;
      const firstChar = displayName.trim().charAt(0).toUpperCase();
      const key = /[A-Z]/.test(firstChar) ? firstChar : "#";
      const group = groups.find((item) => item.key === key);

      if (group) {
        group.items.push(friend);
      } else {
        groups.push({ key, items: [friend] });
      }

      return groups.sort((a, b) => {
        if (a.key === "#") return 1;
        if (b.key === "#") return -1;
        return a.key.localeCompare(b.key);
      });
    }, []);
  }, [filteredFriends]);

  const openRequests = () => {
    setSelectedFriend(null);
    setActiveRightTab("requests");
  };

  const backToList = () => {
    setSelectedFriend(null);
    setActiveRightTab("detail");
  };

  const sessionPanel = (
    <div className="im4-session-panel">
      <div className="im4-session-head">
        <div className="im4-session-title">
          <div>
            <h1>通讯录</h1>
            <p>添加好友、处理申请，并快速发起私聊。</p>
          </div>
          {pendingRequestCount > 0 ? (
            <span className="im4-session-badge">{pendingRequestCount > 99 ? "99+" : pendingRequestCount}</span>
          ) : null}
        </div>
        <Im4Search
          type="text"
          placeholder="搜索好友"
          value={contactFilter}
          onChange={(e) => setContactFilter(e.target.value)}
          onClear={() => setContactFilter("")}
        />
        <div className="im4-contact-actions">
          <Im4Button tone="primary" onClick={() => setShowAddFriend(true)}>添加好友</Im4Button>
          <Im4Button onClick={openRequests}>好友申请</Im4Button>
        </div>
      </div>

      <div className="im4-session-list">
        <Button
          type="text"
          className={`im4-contact-request ${activeRightTab === "requests" ? "is-active" : ""}`}
          onClick={openRequests}
        >
          <span>新的朋友</span>
          <small>好友申请与记录</small>
          {pendingRequestCount > 0 ? <em>{pendingRequestCount > 99 ? "99+" : pendingRequestCount}</em> : null}
        </Button>

        <h2 className="im4-session-section-label">我的好友 · {filteredFriends.length}</h2>
        {filteredFriends.length === 0 ? (
          <Im4Empty
            title={filterKeyword ? "未找到相关好友" : "暂无好友"}
            description={filterKeyword ? "尝试其他关键词" : "点击上方添加好友"}
            action={!filterKeyword ? <Im4Button onClick={() => setShowAddFriend(true)}>添加好友</Im4Button> : null}
          />
        ) : (
          groupedFriends.map((group) => (
            <div key={group.key} className="im4-alpha-group">
              <h3>{group.key}</h3>
              {group.items.map((friend) => {
                const fu = friend.friend_user;
                const displayName = friend.remark || fu?.nickname || `用户${fu?.user_id}`;
                return (
                  <Im4SessionItem
                    key={friend.id}
                    active={selectedFriend?.id === friend.id}
                    type="private"
                    name={displayName}
                    avatar={fu?.avatar || "/default-avatar.png"}
                    lastMessage={`用户 ID：${fu?.user_id || "-"}`}
                    onClick={() => selectFriend(friend)}
                  />
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <>
      <Im4Shell
        active="contacts"
        title="通讯录"
        subtitle="好友、申请和一对一会话"
        detailActive={activeRightTab === "requests" || Boolean(selectedFriend)}
        sessionPanel={sessionPanel}
        avatarSrc={currentUser?.avatar}
        avatarName={currentUser?.nickname || "我"}
        rightSlot={pendingRequestCount > 0 ? <Im4Status tone="primary">申请 {pendingRequestCount > 99 ? "99+" : pendingRequestCount}</Im4Status> : null}
      >
          <div className="workspace-main-panel">
            <ErrorAlert error={error} onClose={() => setError(null)} className="mx-8 mt-6" />

            {activeRightTab === "requests" ? (
              <div className="im-detail-inner ant-linked-page">
                <MobileDetailHeader
                  title="新的朋友"
                  description="好友申请与记录"
                  onBack={backToList}
                />
                <Card
                  className="ant-linked-card"
                  title="新的朋友"
                  extra={pendingRequestCount > 0 ? <Tag color="processing">待处理 {pendingRequestCount}</Tag> : null}
                >
                  <Typography.Paragraph type="secondary">
                    处理收到的好友请求，或查看已发出的申请。
                  </Typography.Paragraph>
                </Card>

                <Card className="ant-linked-card" title="收到的请求">
                  <div className="ant-linked-stack">
                    {receivedRequests.length === 0 ? (
                      <Empty description="暂无收到的请求" />
                    ) : (
                      receivedRequests.map((req) => (
                        <FriendRequestItem
                          key={req.id}
                          request={req}
                          type="received"
                          onAccept={handleAcceptRequest}
                          onReject={handleRejectRequest}
                        />
                      ))
                    )}
                  </div>
                </Card>

                <Card className="ant-linked-card" title="我发出的请求">
                  <div className="ant-linked-stack">
                    {sentRequests.length === 0 ? (
                      <Empty description="暂无发出的请求" />
                    ) : (
                      sentRequests.map((req) => (
                        <FriendRequestItem key={req.id} request={req} type="sent" />
                      ))
                    )}
                  </div>
                </Card>
              </div>
            ) : selectedFriend && friendUser ? (
              <div className="im-detail-inner ant-linked-page">
                <MobileDetailHeader
                  title={selectedFriend.remark || friendUser.nickname || "好友详情"}
                  description={`用户 ID：${friendUser.user_id}`}
                  onBack={backToList}
                />
                <Card className="ant-linked-card ant-contact-profile-card">
                  <div className="ant-contact-profile">
                    <UserAvatar
                      src={friendUser.avatar || "/default-avatar.png"}
                      name={friendUser.nickname}
                      size="3xl"
                      status="online"
                      showStatus
                      border
                    />
                    <div className="ant-contact-profile-main">
                      <Typography.Title level={2}>{selectedFriend.remark || friendUser.nickname}</Typography.Title>
                      <Typography.Text type="secondary">昵称：{friendUser.nickname || "未设置"}</Typography.Text>
                      <Space wrap>
                        <Tag color="success">好友</Tag>
                        <Tag color="processing">用户 ID：{friendUser.user_id}</Tag>
                      </Space>
                    </div>
                  </div>
                </Card>

                <Card className="ant-linked-card" title="基础信息">
                  <Descriptions column={1} size="small" className="ant-linked-descriptions">
                    <Descriptions.Item label="用户 ID">{friendUser.user_id}</Descriptions.Item>
                    <Descriptions.Item label="邮箱">{friendUser.email || "未填写"}</Descriptions.Item>
                    <Descriptions.Item label="关系">好友</Descriptions.Item>
                  </Descriptions>
                </Card>

                <Card className="ant-linked-card" title="备注信息">
                  <Input
                    placeholder="添加备注"
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    size="large"
                  />
                </Card>

                <Card className="ant-linked-card ant-linked-action-card">
                  <Space wrap>
                  <Button
                    icon={<MessageOutlined />}
                    onClick={handleSendMessage}
                    type="primary"
                  >
                    发送消息
                  </Button>
                  <Button
                    icon={<SaveOutlined />}
                    onClick={handleUpdateRemark}
                  >
                    保存备注
                  </Button>
                  <Button
                    icon={<CopyOutlined />}
                    onClick={handleCopyFriendId}
                  >
                    复制 ID
                  </Button>
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={handleDeleteFriend}
                  >
                    删除联系人
                  </Button>
                  </Space>
                </Card>
              </div>
            ) : (
              <div className="workspace-empty-wrap">
                <Im4Empty
                  title="从左侧选择好友查看详情"
                  description="也可以使用上方入口添加新的好友"
                  action={
                    <Im4Button onClick={() => setShowAddFriend(true)}>
                      添加好友
                    </Im4Button>
                  }
                  className="min-h-[520px] w-full"
                />
              </div>
            )}
          </div>
      </Im4Shell>

      {showAddFriend && (
        <AddFriendModal
          currentUserNickname={currentUser?.nickname}
          onClose={() => setShowAddFriend(false)}
          onSuccess={async () => {
            setShowAddFriend(false);
            await loadSentRequests();
            setActiveRightTab("requests");
          }}
        />
      )}
    </>
  );
}
