"use client";

import { useEffect, useState, useRef } from "react";
import { Segmented, Modal, Radio } from "antd";
import {
  CameraOutlined,
  CloseOutlined,
  EnvironmentOutlined,
  PictureOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import clsx from "clsx";
import { MomentItem } from "@/components/moments/MomentItem";
import { Im4Button, Im4Shell, Im4Empty } from "@/components/im4";
import { ErrorAlert } from "@/components/ui/error-alert";
import { PageLoading } from "@/components/ui/loading-states";
import { useAppInteractions } from "@/components/ui/app-interactions";
import { useAuthStore } from "@/lib/store";
import { useMomentStore } from "@/lib/store/moment";
import { MomentAPI } from "@/lib/api/moment";
import { UserAPI } from "@/lib/api/user";
import { UploadAPI } from "@/lib/api/upload";
import { handleApiError, createUserFriendlyErrorMessage } from "@/lib/utils/errors";
import type { User } from "@/lib/types/api";

const momentsDraftKey = "esy-im:moments-draft";

export default function MomentsPage() {
  const { confirm, toast } = useAppInteractions();
  const token = useAuthStore((state) => state.token);
  const {
    timeline,
    setTimeline,
    removeMoment,
    myMoments,
    setMyMoments,
    loading,
    setLoading,
  } = useMomentStore();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<"timeline" | "my">("timeline");
  const [composerOpen, setComposerOpen] = useState(false);
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [location, setLocation] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState<0 | 1 | 2>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const feedRef = useRef<HTMLDivElement>(null);

  // Load current user
  useEffect(() => {
    const load = async () => {
      try {
        const res = await UserAPI.getMe();
        if (res.data.code === 0) setCurrentUser(res.data.data);
      } catch {
        /* ignore */
      }
    };
    if (token) load();
  }, [token]);

  // Restore draft
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

  // Persist draft
  useEffect(() => {
    if (content.trim() || location.trim()) {
      window.localStorage.setItem(momentsDraftKey, JSON.stringify({ content, location }));
    } else {
      window.localStorage.removeItem(momentsDraftKey);
    }
  }, [content, location]);

  // Data loading
  const loadTimeline = async () => {
    setLoading(true);
    try {
      const res = await MomentAPI.getTimeline();
      if (res.data.code === 0) setTimeline(res.data.data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  const loadMyMoments = async () => {
    setLoading(true);
    try {
      const res = await MomentAPI.getMyMoments();
      if (res.data.code === 0) setMyMoments(res.data.data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      if (activeTab === "timeline") { loadTimeline(); } else { loadMyMoments(); }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, activeTab]);

  // Publish
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
        setComposerOpen(false);
        await loadTimeline();
        setActiveTab("timeline");
        toast("动态已发布", { tone: "success" });
      }
    } catch (e) {
      const apiError = handleApiError(e);
      setError(createUserFriendlyErrorMessage(apiError));
    } finally {
      setPublishing(false);
    }
  };

  // Interactions
  const handleLike = async (momentId: number) => {
    try {
      const res = await MomentAPI.likeMoment(momentId);
      if (res.data.code === 0) {
        if (activeTab === "timeline") { await loadTimeline(); } else { await loadMyMoments(); }
      }
    } catch (e) {
      setError(createUserFriendlyErrorMessage(handleApiError(e)));
    }
  };

  const handleUnlike = async (momentId: number) => {
    try {
      const res = await MomentAPI.unlikeMoment(momentId);
      if (res.data.code === 0) {
        if (activeTab === "timeline") { await loadTimeline(); } else { await loadMyMoments(); }
      }
    } catch (e) {
      setError(createUserFriendlyErrorMessage(handleApiError(e)));
    }
  };

  const handleComment = async (momentId: number, text: string, replyToId?: number | null) => {
    try {
      const res = await MomentAPI.commentMoment(momentId, { content: text, reply_to_id: replyToId });
      if (res.data.code === 0) {
        if (activeTab === "timeline") { await loadTimeline(); } else { await loadMyMoments(); }
      }
    } catch (e) {
      setError(createUserFriendlyErrorMessage(handleApiError(e)));
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
        if (activeTab === "my") await loadMyMoments();
        toast("动态已删除", { tone: "success" });
      }
    } catch (e) {
      setError(createUserFriendlyErrorMessage(handleApiError(e)));
    }
  };

  // Image handling
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    try {
      const remaining = Math.max(0, 9 - images.length);
      const picked = Array.from(files).slice(0, remaining);
      if (files.length > remaining) toast("最多只能添加 9 张图片", { tone: "warning" });
      const urls = await Promise.all(picked.map((f) => UploadAPI.uploadImage(f).then((r) => r.data.data.url)));
      setImages((prev) => [...prev, ...urls].slice(0, 9));
      e.target.value = "";
    } catch (e) {
      setError(createUserFriendlyErrorMessage(handleApiError(e)));
    }
  };

  const removeImage = (index: number) => setImages((prev) => prev.filter((_, i) => i !== index));
  const clearComposer = () => {
    setContent("");
    setImages([]);
    setLocation("");
    window.localStorage.removeItem(momentsDraftKey);
  };

  const refresh = () => (activeTab === "timeline" ? loadTimeline() : loadMyMoments());
  const moments = activeTab === "timeline" ? timeline : myMoments;
  const displayName = currentUser?.nickname || "我";

  // Session panel (left sidebar)
  const sessionPanel = (
    <div className="im4-session-panel">
      <div className="im4-session-head">
        <div className="im4-session-title">
          <div>
            <h1>朋友圈</h1>
            <p>分享近况，查看朋友动态</p>
          </div>
        </div>
      </div>
      <div className="im4-session-list">
        <div className="wx-session-user">
          <img src={currentUser?.avatar || "/default-avatar.png"} alt={displayName} />
          <div>
            <strong>{displayName}</strong>
            <small>{currentUser?.user_id}</small>
          </div>
        </div>

        <div className="wx-session-tabs">
          <button
            type="button"
            className={clsx("wx-session-tab", activeTab === "timeline" && "is-active")}
            onClick={() => setActiveTab("timeline")}
          >
            朋友动态
            <em>{timeline.length}</em>
          </button>
          <button
            type="button"
            className={clsx("wx-session-tab", activeTab === "my" && "is-active")}
            onClick={() => setActiveTab("my")}
          >
            我的朋友圈
            <em>{myMoments.length}</em>
          </button>
        </div>

        <button
          type="button"
          className="wx-session-compose-btn"
          onClick={() => setComposerOpen(true)}
        >
          <CameraOutlined /> 发布动态
        </button>
      </div>
    </div>
  );

  return (
    <Im4Shell
      active="moments"
      title="朋友圈"
      subtitle={activeTab === "timeline" ? "朋友动态" : "我的朋友圈"}
      detailActive
      sessionPanel={sessionPanel}
      avatarSrc={currentUser?.avatar}
      avatarName={currentUser?.nickname || "我"}
      rightSlot={
        <button type="button" className="wx-mobile-compose-btn" onClick={() => setComposerOpen(true)} aria-label="发布动态">
          <CameraOutlined />
        </button>
      }
    >
      <div className="wx-moments-page" ref={feedRef}>
        {/* Cover header */}
        <div className="wx-moments-cover">
          <div className="wx-moments-cover-bg" />
          <div className="wx-moments-cover-info">
            <span className="wx-moments-cover-name">{displayName}</span>
            <img
              src={currentUser?.avatar || "/default-avatar.png"}
              alt={displayName}
              className="wx-moments-cover-avatar"
            />
          </div>
        </div>

        {/* Tab bar (mobile) */}
        <div className="wx-moments-toolbar">
          <Segmented
            className="wx-moments-tabs"
            options={[
              { label: "朋友动态", value: "timeline" },
              { label: "我的", value: "my" },
            ]}
            value={activeTab}
            onChange={(v) => setActiveTab(v as "timeline" | "my")}
          />
          <button type="button" className="wx-moments-refresh" onClick={refresh} aria-label="刷新">
            <ReloadOutlined spin={loading} />
          </button>
        </div>

        <ErrorAlert error={error} onClose={() => setError(null)} className="mx-4 mt-2" />

        {/* Feed */}
        <div className="wx-moments-feed">
          {loading && moments.length === 0 ? (
            <PageLoading message="加载动态中..." size="md" />
          ) : moments.length === 0 ? (
            <Im4Empty
              title={activeTab === "timeline" ? "暂无朋友动态" : "还没有发布任何动态"}
              description={activeTab === "timeline" ? "稍后再来看看" : "点击下方按钮发布第一条动态"}
              action={
                activeTab === "my" ? (
                  <Im4Button onClick={() => setComposerOpen(true)}>发布动态</Im4Button>
                ) : null
              }
            />
          ) : (
            moments.map((m) => (
              <MomentItem
                key={m.id}
                moment={m}
                currentUser={currentUser}
                onLike={handleLike}
                onUnlike={handleUnlike}
                onComment={handleComment}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>

        {/* Mobile floating compose button */}
        <button
          type="button"
          className="wx-fab-compose"
          onClick={() => setComposerOpen(true)}
          aria-label="发布动态"
        >
          <CameraOutlined />
        </button>
      </div>

      {/* Composer modal */}
      <Modal
        open={composerOpen}
        onCancel={() => setComposerOpen(false)}
        footer={null}
        closable={false}
        centered
        width="min(560px, calc(100vw - 24px))"
        className="wx-composer-modal"
        destroyOnClose
      >
        <div className="wx-composer">
          <div className="wx-composer-head">
            <span className="wx-composer-title">发布动态</span>
            <button type="button" className="wx-composer-close" onClick={() => setComposerOpen(false)}>
              <CloseOutlined />
            </button>
          </div>

          <div className="wx-composer-body">
            <textarea
              className="wx-composer-textarea"
              placeholder="分享这一刻的想法..."
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, 500))}
              maxLength={500}
              rows={5}
            />

            {images.length > 0 ? (
              <div className="wx-composer-images">
                {images.map((url, i) => (
                  <div key={i} className="wx-composer-image" style={{ backgroundImage: `url(${url})` }}>
                    <button type="button" onClick={() => removeImage(i)} aria-label="移除图片">
                      <CloseOutlined />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="wx-composer-location">
              <EnvironmentOutlined />
              <input
                type="text"
                placeholder="添加位置"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>

          <div className="wx-composer-foot">
            <div className="wx-composer-tools">
              <button
                type="button"
                className="wx-composer-tool"
                onClick={() => fileInputRef.current?.click()}
              >
                <PictureOutlined />
                <span>{images.length > 0 ? `${images.length}/9` : "图片"}</span>
              </button>
              {content.trim() || location.trim() || images.length > 0 ? (
                <button type="button" className="wx-composer-tool" onClick={clearComposer}>
                  清空
                </button>
              ) : null}
            </div>
            <div className="wx-composer-actions">
              <Radio.Group
                size="small"
                value={visible}
                onChange={(e) => setVisible(e.target.value)}
                optionType="button"
                buttonStyle="solid"
              >
                <Radio.Button value={0}>所有人</Radio.Button>
                <Radio.Button value={1}>仅好友</Radio.Button>
                <Radio.Button value={2}>私密</Radio.Button>
              </Radio.Group>
              <span className="wx-composer-count">{content.length}/500</span>
              <button
                type="button"
                className="wx-composer-send"
                disabled={publishing || (!content.trim() && images.length === 0)}
                onClick={handlePublish}
              >
                {publishing ? "发布中..." : "发布"}
              </button>
            </div>
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
      </Modal>
    </Im4Shell>
  );
}
