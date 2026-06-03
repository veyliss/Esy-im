"use client";

import { useEffect, useState, useRef } from "react";
import { Avatar, Badge, Button, Card, Empty, Input, Segmented, Space, Tooltip, Typography } from "antd";
import {
  CameraOutlined,
  CloseOutlined,
  EnvironmentOutlined,
  PictureOutlined,
  ReloadOutlined,
  SendOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { MomentItem } from "@/components/moments/MomentItem";
import { Im4Shell } from "@/components/im4";
import { ErrorAlert } from "@/components/ui/error-alert";
import { PageLoading } from "@/components/ui/loading-states";
import { useAppInteractions } from "@/components/ui/app-interactions";
import { useAuthStore } from "@/lib/store";
import { useMomentStore } from "@/lib/store/moment";
import { MomentAPI } from "@/lib/api/moment";
import { UserAPI } from "@/lib/api/user";
import { handleApiError, createUserFriendlyErrorMessage } from "@/lib/utils/errors";
import type { User } from "@/lib/types/api";

const momentsDraftKey = "esy-im:moments-draft";

export default function MomentsPage() {
  const { confirm, toast } = useAppInteractions();
  const token = useAuthStore((state) => state.token);
  const {
    timeline,
    setTimeline,
    // addMoment,
    // updateMoment,
    removeMoment,
    myMoments,
    setMyMoments,
    loading,
    setLoading,
  } = useMomentStore();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<"timeline" | "my">("timeline");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [location, setLocation] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const visible: 0 | 1 | 2 = 0;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const readImageAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

  // 加载当前用户信息
  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const res = await UserAPI.getMe();
        if (res.data.code === 0) {
          setCurrentUser(res.data.data);
        }
      } catch (error) {
        console.error("加载用户信息失败:", error);
      }
    };

    if (token) {
      loadCurrentUser();
    }
  }, [token]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(momentsDraftKey);
      if (!raw) return;
      const draft = JSON.parse(raw) as { content?: string; location?: string };
      setContent(draft.content || "");
      setLocation(draft.location || "");
    } catch {
      window.localStorage.removeItem(momentsDraftKey);
    }
  }, []);

  useEffect(() => {
    if (content.trim() || location.trim()) {
      window.localStorage.setItem(momentsDraftKey, JSON.stringify({ content, location }));
    } else {
      window.localStorage.removeItem(momentsDraftKey);
    }
  }, [content, location]);

  // 加载时间线
  const loadTimeline = async () => {
    setLoading(true);
    try {
      const res = await MomentAPI.getTimeline();
      if (res.data.code === 0) {
        setTimeline(res.data.data);
      }
    } catch (error) {
      console.error("加载时间线失败:", error);
    } finally {
      setLoading(false);
    }
  };

  // 加载我的动态
  const loadMyMoments = async () => {
    setLoading(true);
    try {
      const res = await MomentAPI.getMyMoments();
      if (res.data.code === 0) {
        setMyMoments(res.data.data);
      }
    } catch (error) {
      console.error("加载我的动态失败:", error);
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    if (token) {
      if (activeTab === "timeline") {
        loadTimeline();
      } else {
        loadMyMoments();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, activeTab]);

  // 发布动态
  const handlePublish = async () => {
    if (publishing) return;
    if (!content.trim() && images.length === 0) {
      setError("请输入内容或添加图片");
      return;
    }

    setPublishing(true);
    try {
      const res = await MomentAPI.createMoment({
        content: content.trim(),
        images: images.length > 0 ? JSON.stringify(images) : undefined,
        location: location || undefined,
        visible,
      });

      if (res.data.code === 0) {
        setContent("");
        setImages([]);
        setLocation("");
        window.localStorage.removeItem(momentsDraftKey);
        await loadTimeline();
        toast("动态已发布", { tone: "success" });
      }
    } catch (e) {
      const apiError = handleApiError(e);
      setError(createUserFriendlyErrorMessage(apiError));
    } finally {
      setPublishing(false);
    }
  };

  // 点赞
  const handleLike = async (momentId: number) => {
    try {
      const res = await MomentAPI.likeMoment(momentId);
      if (res.data.code === 0) {
        if (activeTab === "timeline") {
          await loadTimeline();
        } else {
          await loadMyMoments();
        }
      }
    } catch (e) {
      const apiError = handleApiError(e);
      setError(createUserFriendlyErrorMessage(apiError));
    }
  };

  const handleUnlike = async (momentId: number) => {
    try {
      const res = await MomentAPI.unlikeMoment(momentId);
      if (res.data.code === 0) {
        if (activeTab === "timeline") {
          await loadTimeline();
        } else {
          await loadMyMoments();
        }
      }
    } catch (e) {
      const apiError = handleApiError(e);
      setError(createUserFriendlyErrorMessage(apiError));
    }
  };

  const handleComment = async (
    momentId: number,
    commentContent: string,
    replyToId?: number | null
  ) => {
    try {
      const res = await MomentAPI.commentMoment(momentId, {
        content: commentContent,
        reply_to_id: replyToId,
      });

      if (res.data.code === 0) {
        if (activeTab === "timeline") {
          await loadTimeline();
        } else {
          await loadMyMoments();
        }
      }
    } catch (e) {
      const apiError = handleApiError(e);
      setError(createUserFriendlyErrorMessage(apiError));
    }
  };

  const handleDelete = async (momentId: number) => {
    const confirmed = await confirm({
      title: "删除动态",
      message: "删除后这条动态及其评论将不再显示。",
      confirmText: "删除",
      tone: "danger",
    });
    if (!confirmed) return;

    try {
      const res = await MomentAPI.deleteMoment(momentId);
      if (res.data.code === 0) {
        removeMoment(momentId);
        if (activeTab === "my") {
          await loadMyMoments();
        }
        toast("动态已删除", { tone: "success" });
      }
    } catch (e) {
      const apiError = handleApiError(e);
      setError(createUserFriendlyErrorMessage(apiError));
    }
  };

  const handleImageSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    try {
      const remainingSlots = Math.max(0, 9 - images.length);
      const pickedFiles = Array.from(files).slice(0, remainingSlots);
      if (files.length > remainingSlots) {
        toast("最多只能添加 9 张图片", { tone: "warning" });
      }
      const newImages = await Promise.all(pickedFiles.map(readImageAsDataUrl));
      setImages([...images, ...newImages].slice(0, 9));
      e.target.value = "";
    } catch {
      setError("图片读取失败，请重新选择");
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const clearComposer = () => {
    setContent("");
    setImages([]);
    setLocation("");
    window.localStorage.removeItem(momentsDraftKey);
  };

  const moments = activeTab === "timeline" ? timeline : myMoments;
  const displayName = currentUser?.nickname || "我";
  const avatarText = displayName.slice(0, 1).toUpperCase();
  const refreshMoments = () => {
    if (activeTab === "timeline") {
      loadTimeline();
    } else {
      loadMyMoments();
    }
  };

  const sessionPanel = (
    <div className="im4-session-panel ant-moment-session-panel">
      <Card className="ant-moment-profile-card" styles={{ body: { padding: 14 } }}>
        <Space align="center" size={12}>
          <Avatar src={currentUser?.avatar || undefined} size={44}>
            {avatarText}
          </Avatar>
          <div className="ant-moment-profile-text">
            <Typography.Text strong>{displayName}</Typography.Text>
            <Typography.Text type="secondary">分享近况与朋友动态</Typography.Text>
          </div>
        </Space>
      </Card>
      <div className="ant-moment-session-list">
        <Typography.Text className="ant-moment-session-label" type="secondary">时间流</Typography.Text>
        <Button
          type="text"
          className={`im4-contact-request ant-moment-session-item ${activeTab === "timeline" ? "is-active" : ""}`}
          onClick={() => setActiveTab("timeline")}
        >
          <span className="ant-moment-session-icon"><TeamOutlined /></span>
          <span className="ant-moment-session-copy">
            <strong>朋友动态</strong>
            <small>{timeline.length} 条可见动态</small>
          </span>
          <Badge count={timeline.length} overflowCount={99} />
        </Button>
        <Button
          type="text"
          className={`im4-contact-request ant-moment-session-item ${activeTab === "my" ? "is-active" : ""}`}
          onClick={() => setActiveTab("my")}
        >
          <span className="ant-moment-session-icon"><UserOutlined /></span>
          <span className="ant-moment-session-copy">
            <strong>我的朋友圈</strong>
            <small>{myMoments.length} 条我的动态</small>
          </span>
          <Badge count={myMoments.length} overflowCount={99} />
        </Button>
      </div>
    </div>
  );

  return (
    <Im4Shell
      active="moments"
      title="朋友圈"
      subtitle="朋友动态和我的分享"
      detailActive
      sessionPanel={sessionPanel}
      avatarSrc={currentUser?.avatar}
      avatarName={currentUser?.nickname || "我"}
      rightSlot={
        <Space size={8}>
          <Button
            aria-label="发布图片"
            className="im4-icon-button ant-im4-icon-button"
            icon={<PictureOutlined />}
            shape="circle"
            title="发布图片"
            type="text"
            onClick={handleImageSelect}
          />
          <Tooltip title="刷新动态">
            <Button
              aria-label="刷新动态"
              className="im4-icon-button ant-im4-icon-button"
              icon={<ReloadOutlined />}
              loading={loading}
              shape="circle"
              title="刷新动态"
              type="text"
              onClick={refreshMoments}
            />
          </Tooltip>
        </Space>
      }
    >
        <div className="im4-feed-page ant-moment-page">
          <div className="im4-feed-column ant-moment-shell">
            <div className="ant-moment-toolbar">
              <div className="ant-moment-title">
                <Typography.Title level={3}>朋友圈</Typography.Title>
                <Typography.Text type="secondary">
                  {activeTab === "timeline" ? `${timeline.length} 条朋友动态` : `${myMoments.length} 条我的动态`}
                </Typography.Text>
              </div>
              <Space className="ant-moment-toolbar-actions" size={10}>
                <Segmented
                  className="im3-mobile-tabs ant-moment-tabs"
                  options={[
                    { label: "朋友动态", value: "timeline" },
                    { label: "我的朋友圈", value: "my" },
                  ]}
                  value={activeTab}
                  onChange={(value) => setActiveTab(value as "timeline" | "my")}
                />
                <Tooltip title="刷新动态">
                  <Button icon={<ReloadOutlined />} loading={loading} shape="circle" type="text" onClick={refreshMoments} />
                </Tooltip>
              </Space>
            </div>
            <ErrorAlert error={error} onClose={() => setError(null)} className="mb-4" />
            <Card className="moment-composer ant-moment-composer" styles={{ body: { padding: 0 } }}>
              <div className="ant-moment-composer-head">
                <Space align="center" size={12}>
                  <Avatar src={currentUser?.avatar || undefined} size={40}>{avatarText}</Avatar>
                  <span className="ant-moment-composer-name">
                    <Typography.Text strong>{displayName}</Typography.Text>
                    <Typography.Text type="secondary">公开发布</Typography.Text>
                  </span>
                </Space>
                <Typography.Text className="moment-composer-count" type="secondary">{content.length}/500</Typography.Text>
              </div>
              <div className="ant-moment-composer-body">
                <div className="ant-moment-composer-main">
                  <Input.TextArea
                    className="ant-moment-editor"
                    placeholder="分享这一刻"
                    value={content}
                    onChange={(e) => setContent(e.target.value.slice(0, 500))}
                    autoSize={{ minRows: 4, maxRows: 8 }}
                    maxLength={500}
                  />
                  <div className="ant-moment-location-field">
                    <EnvironmentOutlined />
                    <Input
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="位置"
                      variant="borderless"
                    />
                  </div>
                  {images.length > 0 ? (
                    <div className="moment-image-grid ant-moment-draft-grid">
                      {images.map((img, index) => (
                        <div
                          key={index}
                          className="ant-moment-draft-image"
                          style={{ backgroundImage: `url(${img})` }}
                        >
                          <Button
                            danger
                            shape="circle"
                            size="small"
                            className="ant-moment-remove-image"
                            onClick={() => removeImage(index)}
                            aria-label="移除图片"
                            title="移除"
                            icon={<CloseOutlined />}
                          />
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <div className="moment-composer-actions ant-moment-composer-actions">
                    <Space className="moment-composer-tools" size={8} wrap>
                      <Button
                        onClick={handleImageSelect}
                        icon={<CameraOutlined />}
                      >
                        {images.length > 0 ? `${images.length}/9` : "图片"}
                      </Button>
                      {content.trim() || location.trim() || images.length > 0 ? (
                        <Button
                          onClick={clearComposer}
                          disabled={publishing}
                        >
                          清空
                        </Button>
                      ) : null}
                    </Space>
                    <Button
                      icon={<SendOutlined />}
                      onClick={handlePublish}
                      disabled={publishing || (!content.trim() && images.length === 0)}
                      loading={publishing}
                      type="primary"
                    >
                      发布
                    </Button>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </div>
            </Card>

            <div className="ant-moment-list">
              {loading ? (
                <PageLoading message="加载动态中..." size="md" />
              ) : moments.length === 0 ? (
                <Card className="ant-moment-empty-card" styles={{ body: { padding: 0 } }}>
                  <Empty
                    className="ant-moment-empty"
                    description={
                      <span>
                        <strong>{activeTab === "timeline" ? "暂无朋友动态" : "还没有发布任何动态"}</strong>
                        <small>{activeTab === "timeline" ? "稍后再来看看" : "发布第一条动态吧"}</small>
                      </span>
                    }
                  >
                    {activeTab === "my" ? (
                      <Button type="primary" onClick={() => setContent("今天想分享：")}>
                        写一条动态
                      </Button>
                    ) : null}
                  </Empty>
                </Card>
              ) : (
                moments.map((moment) => (
                  <MomentItem
                    key={moment.id}
                    moment={moment}
                    currentUser={currentUser}
                    onLike={handleLike}
                    onUnlike={handleUnlike}
                    onComment={handleComment}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </div>
          </div>
        </div>
    </Im4Shell>
  );
}
