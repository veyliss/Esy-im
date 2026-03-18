"use client";

import { useEffect, useState, useRef } from "react";
import { MomentItem } from "@/components/moments/MomentItem";
import { AppShell } from "@/components/layout/app-shell";
import { UserAvatar } from "@/components/ui/user-avatar";
import { EmptyState } from "@/components/ui/error-alert";
import { PageLoading } from "@/components/ui/loading-states";
import { useAuthStore } from "@/lib/store";
import { useMomentStore } from "@/lib/store/moment";
import { MomentAPI } from "@/lib/api/moment";
import { UserAPI } from "@/lib/api/user";
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
      alert("请输入内容或添加图片");
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
        alert("发布成功");
        setContent("");
        setImages([]);
        setLocation("");
        // 重新加载时间线
        await loadTimeline();
      }
    } catch (error) {
      const errorMsg = (error as { response?: { data?: { msg?: string } } }).response?.data?.msg;
      alert(errorMsg || "发布失败");
    }
  };

  // 点赞
  const handleLike = async (momentId: number) => {
    try {
      const res = await MomentAPI.likeMoment(momentId);
      if (res.data.code === 0) {
        // 重新加载对应的数据
        if (activeTab === "timeline") {
          await loadTimeline();
        } else {
          await loadMyMoments();
        }
      }
    } catch (error) {
      const errorMsg = (error as { response?: { data?: { msg?: string } } }).response?.data?.msg;
      alert(errorMsg || "点赞失败");
    }
  };

  // 取消点赞
  const handleUnlike = async (momentId: number) => {
    try {
      const res = await MomentAPI.unlikeMoment(momentId);
      if (res.data.code === 0) {
        // 重新加载对应的数据
        if (activeTab === "timeline") {
          await loadTimeline();
        } else {
          await loadMyMoments();
        }
      }
    } catch (error) {
      const errorMsg = (error as { response?: { data?: { msg?: string } } }).response?.data?.msg;
      alert(errorMsg || "取消点赞失败");
    }
  };

  // 评论
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
        // 重新加载对应的数据
        if (activeTab === "timeline") {
          await loadTimeline();
        } else {
          await loadMyMoments();
        }
      }
    } catch (error) {
      const errorMsg = (error as { response?: { data?: { msg?: string } } }).response?.data?.msg;
      alert(errorMsg || "评论失败");
    }
  };

  // 删除动态
  const handleDelete = async (momentId: number) => {
    if (!confirm("确定要删除这条动态吗？")) return;

    try {
      const res = await MomentAPI.deleteMoment(momentId);
      if (res.data.code === 0) {
        alert("删除成功");
        removeMoment(momentId);
        // 如果在"我的动态"页面，也需要更新
        if (activeTab === "my") {
          await loadMyMoments();
        }
      }
    } catch (error) {
      const errorMsg = (error as { response?: { data?: { msg?: string } } }).response?.data?.msg;
      alert(errorMsg || "删除失败");
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
    <AppShell
      active="moments"
      navVariant="modern"
      rightSlot={
        <>
          <button
            type="button"
            aria-label="搜索朋友圈"
            title="搜索"
            className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <svg fill="currentColor" height="20px" viewBox="0 0 256 256" width="20px" xmlns="http://www.w3.org/2000/svg">
              <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path>
            </svg>
          </button>
          <button
            type="button"
            aria-label="朋友圈筛选"
            title="筛选"
            className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <svg fill="currentColor" height="20px" viewBox="0 0 256 256" width="20px" xmlns="http://www.w3.org/2000/svg">
              <path d="M128,80a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160Z"></path>
            </svg>
          </button>
          <UserAvatar src={currentUser?.avatar} name={currentUser?.nickname || "我"} size="sm" border />
        </>
      }
      headerDescription="统一朋友圈导航与发布入口，保留动态流业务逻辑。"
    >
      <div className="flex min-h-[72vh] overflow-hidden rounded-3xl border border-white/70 bg-white/85 shadow-xl shadow-slate-200/50 dark:border-slate-700/70 dark:bg-slate-900/80 dark:shadow-black/30">
        <aside className="w-72 shrink-0 border-r border-slate-200/70 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/70">
          <ul className="space-y-2">
            <li>
              <button
                type="button"
                className={`w-full rounded-xl px-4 py-2.5 text-left text-sm font-medium transition-colors ${
                  activeTab === "my"
                    ? "bg-primary/10 text-primary dark:bg-primary/20"
                    : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                }`}
                onClick={() => setActiveTab("my")}
              >
                我的朋友圈
              </button>
            </li>
            <li>
              <button
                type="button"
                className={`w-full rounded-xl px-4 py-2.5 text-left text-sm font-medium transition-colors ${
                  activeTab === "timeline"
                    ? "bg-primary/10 text-primary dark:bg-primary/20"
                    : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                }`}
                onClick={() => setActiveTab("timeline")}
              >
                朋友动态
              </button>
            </li>
          </ul>
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-3xl">
            <div className="mb-6 rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
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
                    className="ui-textarea w-full resize-none rounded-xl p-3 text-sm"
                    placeholder="想说的话"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleImageSelect}
                        aria-label="上传动态图片"
                        title="上传图片"
                        className="rounded-full p-2 text-slate-500 transition-colors hover:bg-primary/10 hover:text-primary dark:text-slate-400"
                      >
                        <svg fill="currentColor" height="20px" viewBox="0 0 256 256" width="20px" xmlns="http://www.w3.org/2000/svg">
                          <path d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40Zm0,16V158.75l-26.07-26.06a16,16,0,0,0-22.63,0l-20,20-44-44a16,16,0,0,0-22.62,0L40,149.37V56ZM40,172l52-52,80,80H40Zm176,28H194.63l-36-36,20-20L216,181.38V200ZM144,100a12,12,0,1,1,12,12A12,12,0,0,1,144,100Z"></path>
                        </svg>
                      </button>
                      <span className="text-xs text-slate-400 dark:text-slate-500">{images.length}/9 张图片</span>
                    </div>
                    <button
                      onClick={handlePublish}
                      className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
                    >
                      发布
                    </button>
                  </div>

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
            </div>

            <div className="space-y-6">
              {loading ? (
                <PageLoading message="加载动态中..." size="md" />
              ) : moments.length === 0 ? (
                <EmptyState
                  title={activeTab === "timeline" ? "暂无朋友动态" : "还没有发布任何动态"}
                  description={activeTab === "timeline" ? "稍后再来看看" : "发布第一条动态吧"}
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
        </main>
      </div>
    </AppShell>
  );
}
