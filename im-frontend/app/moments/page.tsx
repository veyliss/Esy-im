"use client";

import { useEffect, useState, useRef } from "react";
import { MomentItem } from "@/components/moments/MomentItem";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { ActionBar, EmptyPanel, SectionCard, SectionTitle, SidebarSection } from "@/components/workspace/section";
import { UserAvatar } from "@/components/ui/user-avatar";
import { ErrorAlert } from "@/components/ui/error-alert";
import { PageLoading } from "@/components/ui/loading-states";
import { useAuthStore } from "@/lib/store";
import { useMomentStore } from "@/lib/store/moment";
import { MomentAPI } from "@/lib/api/moment";
import { UserAPI } from "@/lib/api/user";
import { handleApiError, createUserFriendlyErrorMessage } from "@/lib/utils/errors";
import type { User } from "@/lib/types/api";

export default function MomentsPage() {
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
    if (!confirm("确定要删除这条动态吗？")) return;

    try {
      const res = await MomentAPI.deleteMoment(momentId);
      if (res.data.code === 0) {
        removeMoment(momentId);
        if (activeTab === "my") {
          await loadMyMoments();
        }
      }
    } catch (e) {
      const apiError = handleApiError(e);
      setError(createUserFriendlyErrorMessage(apiError));
    }
  };

  // 处理图片上传（模拟）
  const handleImageSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // 这里应该上传图片到服务器，返回URL
    // 目前使用占位符
    const newImages = Array.from(files).map((file, index) => {
      return `https://via.placeholder.com/400?text=Image${images.length + index + 1}`;
    });

    setImages([...images, ...newImages].slice(0, 9));
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const moments = activeTab === "timeline" ? timeline : myMoments;

  return (
    <WorkspaceShell
      active="moments"
      navVariant="modern"
      headerDescription="统一朋友圈导航与发布入口，保留动态流业务逻辑。"
      rightSlot={<UserAvatar src={currentUser?.avatar} name={currentUser?.nickname || "我"} size="sm" border />}
      sidebar={
        <div className="flex h-full flex-col p-4">
          <SidebarSection title="时间流视图" className="flex-1">
            <button
              type="button"
              className={`w-full rounded-2xl px-4 py-3 text-left text-sm font-medium transition-colors ${
                activeTab === "my"
                  ? "bg-primary/10 text-primary dark:bg-primary/20"
                  : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
              onClick={() => setActiveTab("my")}
            >
              我的朋友圈
            </button>
            <button
              type="button"
              className={`w-full rounded-2xl px-4 py-3 text-left text-sm font-medium transition-colors ${
                activeTab === "timeline"
                  ? "bg-primary/10 text-primary dark:bg-primary/20"
                  : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
              onClick={() => setActiveTab("timeline")}
            >
              朋友动态
            </button>
          </SidebarSection>
        </div>
      }
      main={
        <div className="h-full overflow-y-auto p-6">
          <div className="mx-auto max-w-3xl space-y-6">
            <ErrorAlert error={error} onClose={() => setError(null)} className="mb-4" />
            <SectionCard>
              <div className="flex gap-4">
                <UserAvatar
                  src={currentUser?.avatar || "/default-avatar.png"}
                  name={currentUser?.nickname || "我"}
                  size="md"
                  border
                  className="shrink-0"
                />
                <div className="flex-1">
                  <SectionTitle
                    title={activeTab === "timeline" ? "发布动态" : "记录此刻"}
                    description={activeTab === "timeline" ? "分享给朋友可见的内容" : "管理你自己的动态内容"}
                    className="mb-4"
                  />
                  <textarea
                    className="ui-textarea w-full resize-none rounded-2xl p-4 text-sm"
                    placeholder="想说的话"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                  <ActionBar className="mt-3 justify-between">
                    <button
                      onClick={handleImageSelect}
                      type="button"
                      className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      添加图片 {images.length > 0 ? `(${images.length}/9)` : ""}
                    </button>
                    <button
                      onClick={handlePublish}
                      className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
                    >
                      发布
                    </button>
                  </ActionBar>

                  {images.length > 0 ? (
                    <div className="mt-3 grid grid-cols-3 gap-2">
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
                  className="min-h-[240px] border-solid bg-white/80 dark:bg-slate-900/70"
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
