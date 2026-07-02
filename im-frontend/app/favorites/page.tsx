"use client";

import { useEffect, useState } from "react";
import { Card, Empty, List, Button, Skeleton, Typography } from "antd";
import { StarOutlined, DeleteOutlined } from "@ant-design/icons";
import { useAuthStore } from "@/lib/store";
import { FavoriteAPI } from "@/lib/api/favorite";
import { Im4Shell } from "@/components/im4";
import { ErrorAlert } from "@/components/ui/error-alert";
import { useAppInteractions } from "@/components/ui/app-interactions";
import { handleApiError, createUserFriendlyErrorMessage } from "@/lib/utils/errors";
import { UserAvatar } from "@/components/ui/user-avatar";
import type { MessageFavorite, User } from "@/lib/types/api";
import { UserAPI } from "@/lib/api/user";

export default function FavoritesPage() {
  const { toast } = useAppInteractions();
  const token = useAuthStore((state) => state.token);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [favorites, setFavorites] = useState<MessageFavorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await UserAPI.getMe();
        if (res.data.code === 0) setCurrentUser(res.data.data);
      } catch { /* ignore */ }
    };
    if (token) load();
  }, [token]);

  const loadFavorites = async (p = 1) => {
    setLoading(true);
    try {
      const res = await FavoriteAPI.getFavorites(p, 20);
      if (res.data.code === 0) {
        setFavorites(res.data.data.list);
        setTotal(res.data.data.total);
        setPage(p);
      }
    } catch (err) {
      const apiError = handleApiError(err);
      setError(createUserFriendlyErrorMessage(apiError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadFavorites();
  }, [token]);

  const handleRemove = async (messageId: number) => {
    try {
      const res = await FavoriteAPI.removeFavorite(messageId);
      if (res.data.code === 0) {
        setFavorites(prev => prev.filter(f => f.message_id !== messageId));
        setTotal(prev => prev - 1);
        toast("已取消收藏", { tone: "success" });
      }
    } catch (err) {
      toast(createUserFriendlyErrorMessage(handleApiError(err)), { tone: "error" });
    }
  };

  const sessionPanel = (
    <div className="im4-session-panel">
      <div className="im4-session-head">
        <div className="im4-session-title">
          <div>
            <h1>收藏</h1>
            <p>已收藏的消息</p>
          </div>
        </div>
      </div>
      <div className="im4-session-list">
        <div className="wx-session-user">
          <img src={currentUser?.avatar || "/default-avatar.png"} alt={currentUser?.nickname || "我"} />
          <div>
            <strong>{currentUser?.nickname || "我"}</strong>
            <small>{total} 条收藏</small>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Im4Shell
      active="me"
      title="收藏"
      subtitle="已收藏的消息"
      detailActive
      sessionPanel={sessionPanel}
      avatarSrc={currentUser?.avatar}
      avatarName={currentUser?.nickname || "我"}
    >
      <div style={{ padding: "24px", maxWidth: 720, margin: "0 auto" }}>
        <ErrorAlert error={error} onClose={() => setError(null)} />

        {loading && favorites.length === 0 ? (
          <>
            <Skeleton active paragraph={{ rows: 3 }} style={{ marginBottom: 16 }} />
            <Skeleton active paragraph={{ rows: 3 }} style={{ marginBottom: 16 }} />
            <Skeleton active paragraph={{ rows: 3 }} />
          </>
        ) : favorites.length === 0 ? (
          <Empty description="暂无收藏消息">
            <Typography.Text type="secondary">
              在聊天中长按消息可添加到收藏
            </Typography.Text>
          </Empty>
        ) : (
          <List
            dataSource={favorites}
            renderItem={(item) => (
              <List.Item
                key={`${item.message_id}-${item.id}`}
                actions={[
                  <Button
                    key="remove"
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    size="small"
                    onClick={() => handleRemove(item.message_id)}
                  >
                    取消
                  </Button>
                ]}
              >
                <List.Item.Meta
                  avatar={<StarOutlined style={{ fontSize: 20, color: "#faad14" }} />}
                  title={
                    <span>
                      {item.from_user_id}
                      <Typography.Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                        {new Date(item.created_at).toLocaleDateString("zh-CN")}
                      </Typography.Text>
                    </span>
                  }
                  description={
                    <Typography.Paragraph
                      ellipsis={{ rows: 3 }}
                      style={{ marginBottom: 0 }}
                    >
                      {item.content || "[消息已删除]"}
                    </Typography.Paragraph>
                  }
                />
              </List.Item>
            )}
            pagination={{
              current: page,
              pageSize: 20,
              total,
              onChange: (p) => loadFavorites(p),
            }}
          />
        )}
      </div>
    </Im4Shell>
  );
}
