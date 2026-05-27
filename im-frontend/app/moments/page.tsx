"use client";

import { useEffect, useState, useRef } from "react";
import { MomentItem } from "@/components/moments/MomentItem";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { TopBarActions, TopIconButton } from "@/components/layout/top-actions";
import { ActionBar, EmptyPanel, SectionCard, SidebarItem, SidebarSection, SidebarToolbar, WorkspaceSidebar } from "@/components/workspace/section";
import { UserAvatar } from "@/components/ui/user-avatar";
import { ErrorAlert } from "@/components/ui/error-alert";
import { PageLoading } from "@/components/ui/loading-states";
import { useAppInteractions } from "@/components/ui/app-interactions";
import { useAuthStore } from "@/lib/store";
import { useMomentStore } from "@/lib/store/moment";
import { MomentAPI } from "@/lib/api/moment";
import { UserAPI } from "@/lib/api/user";
import { handleApiError, createUserFriendlyErrorMessage } from "@/lib/utils/errors";
import type { User } from "@/lib/types/api";

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
    if (!content.trim() && images.length === 0) {
      setError("请输入内容或添加图片");
      return;
    }

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
        await loadTimeline();
        toast("动态已发布", { tone: "success" });
      }
    } catch (e) {
      const apiError = handleApiError(e);
      setError(createUserFriendlyErrorMessage(apiError));
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

  const moments = activeTab === "timeline" ? timeline : myMoments;

  return (
    <WorkspaceShell
      active="moments"
      navVariant="modern"
      rightSlot={
        <TopBarActions avatarSrc={currentUser?.avatar} avatarName={currentUser?.nickname || "我"}>
          <TopIconButton icon="add_photo_alternate" label="发布图片" onClick={handleImageSelect} />
          <TopIconButton
            icon="refresh"
            label="刷新动态"
            onClick={() => {
              if (activeTab === "timeline") {
                loadTimeline();
              } else {
                loadMyMoments();
              }
            }}
          />
        </TopBarActions>
      }
      mainClassName="bg-background-light dark:bg-background-dark"
      sidebar={
        <WorkspaceSidebar>
          <SidebarToolbar>
            <div className="moments-profile-card">
              <UserAvatar
                src={currentUser?.avatar || "/default-avatar.png"}
                name={currentUser?.nickname || "我"}
                size="md"
                border
              />
              <div className="min-w-0">
                <p>{currentUser?.nickname || "我"}</p>
                <span>分享近况与朋友动态</span>
              </div>
            </div>
          </SidebarToolbar>
          <SidebarSection title="时间流视图" className="flex-1">
            <SidebarItem
              type="button"
              active={activeTab === "my"}
              leading={<span className="material-symbols-outlined text-lg">account_circle</span>}
              title="我的朋友圈"
              description="查看我发布的动态"
              onClick={() => setActiveTab("my")}
            />
            <SidebarItem
              type="button"
              active={activeTab === "timeline"}
              leading={<span className="material-symbols-outlined text-lg">dynamic_feed</span>}
              title="朋友动态"
              description="查看好友分享"
              onClick={() => setActiveTab("timeline")}
            />
          </SidebarSection>
        </WorkspaceSidebar>
      }
      main={
        <div className="moments-main h-full overflow-y-auto">
          <div className="mx-auto max-w-3xl space-y-7">
            <ErrorAlert error={error} onClose={() => setError(null)} className="mb-4" />
            <SectionCard className="moments-composer">
              <div className="flex gap-4">
                <UserAvatar
                  src={currentUser?.avatar || "/default-avatar.png"}
                  name={currentUser?.nickname || "我"}
                  size="md"
                  border
                  className="shrink-0"
                />
                <div className="flex-1">
                  <textarea
                    className="ui-textarea moments-composer-textarea w-full resize-none rounded-lg p-4 text-sm"
                    placeholder="分享这一刻"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                  <div className="mt-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-slate-400">location_on</span>
                    <input
                      className="moments-location-input"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="添加位置"
                    />
                  </div>
                  <ActionBar className="mt-3 justify-between">
                    <button
                      onClick={handleImageSelect}
                      type="button"
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-primary dark:text-slate-400 dark:hover:bg-slate-800"
                    >
                      <span className="material-symbols-outlined text-xl">image</span>
                      {images.length > 0 ? `${images.length}/9` : "图片"}
                    </button>
                    <button
                      type="button"
                      onClick={handlePublish}
                      disabled={!content.trim() && images.length === 0}
                      className="rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      发布
                    </button>
                  </ActionBar>

                  {images.length > 0 ? (
                    <div className="moments-preview-grid mt-3 grid grid-cols-3 gap-2">
                      {images.map((img, index) => (
                        <div
                          key={index}
                          className="relative aspect-square rounded-lg bg-cover bg-center"
                          style={{ backgroundImage: `url(${img})` }}
                        >
                          <button
                            type="button"
                            className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white"
                            onClick={() => removeImage(index)}
                            aria-label="移除图片"
                            title="移除"
                          >
                            <span className="material-symbols-outlined text-sm">close</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}

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
            </SectionCard>

            <div className="space-y-6">
              {loading ? (
                <PageLoading message="加载动态中..." size="md" />
              ) : moments.length === 0 ? (
                <EmptyPanel
                  title={activeTab === "timeline" ? "暂无朋友动态" : "还没有发布任何动态"}
                  description={activeTab === "timeline" ? "稍后再来看看" : "发布第一条动态吧"}
                  className="min-h-[240px] border-0 bg-white dark:bg-slate-900"
                />
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
      }
    />
  );
}
