"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { NavTabs } from "@/components/ui/nav-tabs";
import { MomentItem } from "@/components/moments/MomentItem";
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
  const [visible, setVisible] = useState<0 | 1 | 2>(0);
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
    <div className="font-display bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-200">
      <div className="flex flex-col min-h-screen">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6">
          <div className="flex items-center gap-8">
            <nav className="flex items-center gap-6">
              <a className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary" href="/chat">聊天</a>
              <a className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary" href="/contacts">通讯录</a>
              <a className="text-sm font-medium text-primary" href="/moments">朋友圈</a>
              <a className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary" href="/me">我的</a>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
              <svg fill="currentColor" height="20px" viewBox="0 0 256 256" width="20px" xmlns="http://www.w3.org/2000/svg">
                <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path>
              </svg>
            </button>
            <button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
              <svg fill="currentColor" height="20px" viewBox="0 0 256 256" width="20px" xmlns="http://www.w3.org/2000/svg">
                <path d="M128,80a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160Zm88-29.84q.06-2.16,0-4.32l14.92-18.64a8,8,0,0,0,1.48-7.06,107.21,107.21,0,0,0-10.88-26.25,8,8,0,0,0-6-3.93l-23.72-2.64q-1.48-1.56-3-3L186,40.54a8,8,0,0,0-3.94-6,107.71,107.71,0,0,0-26.25-10.87,8,8,0,0,0-7.06,1.49L130.16,40Q128,40,125.84,40L107.2,25.11a8,8,0,0,0-7.06-1.48A107.6,107.6,0,0,0,73.89,34.51a8,8,0,0,0-3.93,6L67.32,64.27q-1.56,1.49-3,3L40.54,70a8,8,0,0,0-6,3.94,107.71,107.71,0,0,0-10.87,26.25,8,8,0,0,0,1.49,7.06L40,125.84Q40,128,40,130.16L25.11,148.8a8,8,0,0,0-1.48,7.06,107.21,107.21,0,0,0,10.88,26.25,8,8,0,0,0,6,3.93l23.72,2.64q1.49,1.56,3,3L70,215.46a8,8,0,0,0,3.94,6,107.71,107.71,0,0,0,26.25,10.87,8,8,0,0,0,7.06-1.49L125.84,216q2.16.06,4.32,0l18.64,14.92a8,8,0,0,0,7.06,1.48,107.21,107.21,0,0,0,26.25-10.88,8,8,0,0,0,3.93-6l2.64-23.72q1.56-1.48,3-3L215.46,186a8,8,0,0,0,6-3.94,107.71,107.71,0,0,0,10.87-26.25,8,8,0,0,0-1.49-7.06Zm-16.1-6.5a73.93,73.93,0,0,1,0,8.68,8,8,0,0,0,1.74,5.48l14.19,17.73a91.57,91.57,0,0,1-6.23,15L187,173.11a8,8,0,0,0-5.1,2.64,74.11,74.11,0,0,1-6.14,6.14,8,8,0,0,0-2.64,5.1l-2.51,22.58a91.32,91.32,0,0,1-15,6.23l-17.74-14.19a8,8,0,0,0-5-1.75h-.48a73.93,73.93,0,0,1-8.68,0,8,8,0,0,0-5.48,1.74L100.45,215.8a91.57,91.57,0,0,1-15-6.23L82.89,187a8,8,0,0,0-2.64-5.1,74.11,74.11,0,0,1-6.14-6.14,8,8,0,0,0-5.1-2.64L46.43,170.6a91.32,91.32,0,0,1-6.23-15l14.19-17.74a8,8,0,0,0,1.74-5.48,73.93,73.93,0,0,1,0-8.68,8,8,0,0,0-1.74-5.48L40.2,100.45a91.57,91.57,0,0,1,6.23-15L69,82.89a8,8,0,0,0,5.1-2.64,74.11,74.11,0,0,1,6.14-6.14A8,8,0,0,0,82.89,69L85.4,46.43a91.32,91.32,0,0,1,15-6.23l17.74,14.19a8,8,0,0,0,5.48,1.74,73.93,73.93,0,0,1,8.68,0,8,8,0,0,0,5.48-1.74L155.55,40.2a91.57,91.57,0,0,1,15,6.23L173.11,69a8,8,0,0,0,2.64,5.1,74.11,74.11,0,0,1,6.14,6.14,8,8,0,0,0,5.1,2.64l22.58,2.51a91.32,91.32,0,0,1,6.23,15l-14.19,17.74A8,8,0,0,0,199.87,123.66Z"></path>
              </svg>
            </button>
            {currentUser?.avatar && (
              <div className="size-10 rounded-full bg-cover bg-center" style={{ backgroundImage: `url(${currentUser.avatar})` }}></div>
            )}
          </div>
        </header>

        <div className="flex flex-1">
          <aside className="w-80 flex-shrink-0 bg-white dark:bg-[#182430] border-r border-slate-200 dark:border-slate-800 p-4">
            <ul className="space-y-1">
              <li>
                <a
                  className={`block rounded-lg px-4 py-2.5 text-sm font-bold cursor-pointer ${
                    activeTab === "my" ? "bg-primary/10 text-primary" : "font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                  }`}
                  onClick={() => setActiveTab("my")}
                >
                  我的朋友圈
                </a>
              </li>
              <li>
                <a
                  className={`block rounded-lg px-4 py-2.5 text-sm cursor-pointer ${
                    activeTab === "timeline" ? "bg-primary/10 text-primary font-bold" : "font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                  }`}
                  onClick={() => setActiveTab("timeline")}
                >
                  朋友动态
                </a>
              </li>
            </ul>
          </aside>

          <main className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-3xl mx-auto">
              <div className="bg-white dark:bg-[#182430] rounded-lg p-4 mb-6 shadow-sm">
                <div className="flex gap-4">
                  <div className="size-10 rounded-full bg-cover bg-center flex-shrink-0" style={{ backgroundImage: `url(${currentUser?.avatar || '/default-avatar.png'})` }}></div>
                  <div className="flex-1">
                    <textarea
                      className="form-textarea w-full resize-none bg-background-light dark:bg-background-dark border-slate-300 dark:border-slate-700 rounded-lg p-3 focus:ring-primary focus:border-primary text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      placeholder="想说的话"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                    />
                    <div className="flex justify-between items-center mt-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleImageSelect}
                          className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-primary/10 hover:text-primary"
                        >
                          <svg fill="currentColor" height="20px" viewBox="0 0 256 256" width="20px" xmlns="http://www.w3.org/2000/svg">
                            <path d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40Zm0,16V158.75l-26.07-26.06a16,16,0,0,0-22.63,0l-20,20-44-44a16,16,0,0,0-22.62,0L40,149.37V56ZM40,172l52-52,80,80H40Zm176,28H194.63l-36-36,20-20L216,181.38V200ZM144,100a12,12,0,1,1,12,12A12,12,0,0,1,144,100Z"></path>
                          </svg>
                        </button>
                        <span className="text-xs text-slate-400 dark:text-slate-500">{images.length}/9 张图片</span>
                      </div>
                      <button
                        onClick={handlePublish}
                        className="bg-primary text-white text-sm font-bold py-2 px-6 rounded-lg hover:bg-primary/90 transition-colors"
                      >
                        发布
                      </button>
                    </div>

                    {images.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 mt-3">
                        {images.map((img, index) => (
                          <div key={index} className="relative aspect-square rounded-lg bg-cover bg-center" style={{ backgroundImage: `url(${img})` }}>
                            <button className="absolute -top-2 -right-2 rounded-full bg-red-500 p-1 text-white" onClick={() => removeImage(index)}>
                              <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

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
                  <div className="py-12 text-center text-slate-400">加载中...</div>
                ) : moments.length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    {activeTab === "timeline" ? "暂无朋友动态" : "还没有发布任何动态"}
                  </div>
                ) : (
                  moments.map((moment) => (
                    <div key={moment.id} className="bg-white dark:bg-[#182430] rounded-lg shadow-sm overflow-hidden">
                      <div className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="size-10 rounded-full bg-cover bg-center" style={{ backgroundImage: `url(${moment.user?.avatar || '/default-avatar.png'})` }}></div>
                          <div>
                            <p className="font-bold text-slate-800 dark:text-slate-200">{moment.user?.nickname || '用户'}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {moment.created_at ? new Date(moment.created_at).toLocaleString('zh-CN') : ''}
                            </p>
                          </div>
                        </div>
                        <p className="mb-3 text-sm">{moment.content}</p>
                      </div>

                      {moment.images && JSON.parse(moment.images).length > 0 && (
                        <div className="grid grid-cols-3 gap-1">
                          {JSON.parse(moment.images).slice(0, 9).map((img: string, index: number) => (
                            <div key={index} className="aspect-square bg-cover bg-center" style={{ backgroundImage: `url(${img})` }}></div>
                          ))}
                        </div>
                      )}

                      <div className="p-4 border-t border-slate-100 dark:border-slate-700">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            {(() => {
                              const isLiked = moment.likes?.some(like => like.user_id === currentUser?.user_id) || false;
                              return (
                                <button
                                  onClick={() => isLiked ? handleUnlike(moment.id) : handleLike(moment.id)}
                                  className={`flex items-center gap-1 text-sm transition-colors ${
                                    isLiked ? 'text-red-500' : 'text-slate-500 hover:text-red-500'
                                  }`}
                                >
                                  <span className="material-symbols-outlined text-base">
                                    {isLiked ? 'favorite' : 'favorite_border'}
                                  </span>
                                  {moment.like_count || 0}
                                </button>
                              );
                            })()}
                            <button className="flex items-center gap-1 text-sm text-slate-500 hover:text-primary transition-colors">
                              <span className="material-symbols-outlined text-base">comment</span>
                              {moment.comment_count || 0}
                            </button>
                          </div>
                          {moment.user_id === currentUser?.user_id && (
                            <button
                              onClick={() => handleDelete(moment.id)}
                              className="text-sm text-red-500 hover:text-red-600 transition-colors"
                            >
                              删除
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
