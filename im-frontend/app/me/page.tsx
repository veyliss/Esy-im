"use client";

import { NavTabs } from "@/components/ui/nav-tabs";
import { useAuthStore } from "@/lib/store";
import { AuthAPI } from "@/lib/api/auth";
import { UserAPI } from "@/lib/api/user";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import type { User } from "@/lib/types/api";

export default function MePage() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const { clearToken } = useAuthStore();
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // 表单状态
  const [nickname, setNickname] = useState("");
  const [avatar, setAvatar] = useState("");
  const [saving, setSaving] = useState(false);
  
  // 修改密码状态
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 加载用户信息
  useEffect(() => {
    const loadUserInfo = async () => {
      setLoading(true);
      try {
        const res = await UserAPI.getMe();
        if (res.data.code === 0) {
          const user = res.data.data;
          setCurrentUser(user);
          setNickname(user.nickname || "");
          setAvatar(user.avatar || "");
        }
      } catch (error) {
        console.error("加载用户信息失败:", error);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      loadUserInfo();
    }
  }, [token]);

  // 保存修改
  const handleSave = async () => {
    await handleSaveAll();
  };

  // 取消修改
  const handleCancel = () => {
    if (!currentUser) return;
    
    setNickname(currentUser.nickname || "");
    setAvatar(currentUser.avatar || "");
    setNewPassword("");
    setConfirmPassword("");
  };

  // 修改头像（模拟）
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 这里应该上传头像到服务器，返回URL
    // 目前使用占位符
    const placeholderUrl = `https://via.placeholder.com/128?text=${encodeURIComponent(nickname.slice(0, 1))}`;
    setAvatar(placeholderUrl);
  };
  
  // 保存所有修改（个人信息 + 密码）
  const handleSaveAll = async () => {
    if (saving) return;

    // 验证个人信息
    if (!nickname.trim()) {
      alert("昵称不能为空");
      return;
    }

    // 如果输入了密码，验证密码
    if (newPassword || confirmPassword) {
      if (!newPassword.trim()) {
        alert("新密码不能为空");
        return;
      }

      if (newPassword.length < 8) {
        alert("密码长度不能少于8位");
        return;
      }

      if (newPassword !== confirmPassword) {
        alert("两次密码输入不一致");
        return;
      }
    }

    setSaving(true);
    try {
      // 更新个人信息
      const profileRes = await UserAPI.updateProfile({
        nickname: nickname.trim(),
        avatar: avatar || undefined,
      });

      if (profileRes.data.code !== 0) {
        throw new Error(profileRes.data.msg || "个人信息更新失败");
      }

      // 如果有密码修改，也执行密码修改
      if (newPassword && confirmPassword) {
        const passwordRes = await AuthAPI.setPassword({
          password: newPassword,
        });

        if (passwordRes.data.code === 0) {
          alert("个人信息和密码修改成功，请重新登录");
          clearToken();
          router.push("/login");
          return;
        }
      }

      alert("保存成功");
      // 重新加载用户信息
      const userRes = await UserAPI.getMe();
      if (userRes.data.code === 0) {
        const user = userRes.data.data;
        setCurrentUser(user);
        setNickname(user.nickname || "");
        setAvatar(user.avatar || "");
      }
      // 清空密码输入
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      const errorMsg = (error as { response?: { data?: { msg?: string } } }).response?.data?.msg;
      alert(errorMsg || "保存失败");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    if (logoutLoading) return;
    
    const confirmed = confirm("确定要退出登录吗？");
    if (!confirmed) return;

    setLogoutLoading(true);
    try {
      // 调用后端登出接口
      await AuthAPI.logout();
    } catch (error) {
      console.warn("登出请求失败，但仍然清除本地 token", error);
    } finally {
      // 无论后端接口是否成功，都清除本地 token
      clearToken();
      setLogoutLoading(false);
      // 跳转到登录页
      router.push("/login");
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-3 text-slate-500 dark:text-slate-400">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="font-display bg-background-light dark:bg-background-dark">
      <div className="flex h-screen w-full flex-col">
        <div className="flex h-full min-h-0 flex-col">
          <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6">
            <div className="flex items-center gap-8">
              <nav className="flex items-center gap-6">
                <a className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary" href="/chat">聊天</a>
                <a className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary" href="/contacts">通讯录</a>
                <a className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary" href="/moments">朋友圈</a>
                <a className="text-sm font-medium text-primary" href="/me">我的</a>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <button className="flex h-8 w-8 items-center justify-center rounded-lg text-black/60 hover:bg-black/5 hover:text-black dark:text-white/60 dark:hover:bg-white/5 dark:hover:text-white">
                <span className="material-symbols-outlined text-xl">notifications</span>
              </button>
              {currentUser?.avatar && (
                <div className="h-8 w-8 rounded-full bg-cover bg-center" style={{ backgroundImage: `url(${currentUser.avatar})` }}></div>
              )}
            </div>
          </header>

          <main className="flex flex-1 overflow-hidden">
            <div className="w-72 shrink-0 border-r border-black/10 dark:border-white/10">
              <div className="flex h-full flex-col justify-between p-4">
                <div className="flex flex-col gap-1">
                  <a className="flex items-center gap-3 rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary dark:bg-primary/20" href="#">
                    <span className="material-symbols-outlined text-lg">person</span>
                    <span>我的资料</span>
                  </a>
                  <a className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-black/60 hover:bg-black/5 dark:text-white/60 dark:hover:bg-white/5" href="#">
                    <span className="material-symbols-outlined text-lg">security</span>
                    <span>账号与安全</span>
                  </a>
                  <a className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-black/60 hover:bg-black/5 dark:text-white/60 dark:hover:bg-white/5" href="#">
                    <span className="material-symbols-outlined text-lg">visibility</span>
                    <span>隐私设置</span>
                  </a>
                  <a className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-black/60 hover:bg-black/5 dark:text-white/60 dark:hover:bg-white/5" href="#">
                    <span className="material-symbols-outlined text-lg">notifications</span>
                    <span>通知设置</span>
                  </a>
                  <a className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-black/60 hover:bg-black/5 dark:text-white/60 dark:hover:bg-white/5" href="#">
                    <span className="material-symbols-outlined text-lg">settings</span>
                    <span>通用设置</span>
                  </a>
                  <a className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-black/60 hover:bg-black/5 dark:text-white/60 dark:hover:bg-white/5" href="#">
                    <span className="material-symbols-outlined text-lg">info</span>
                    <span>关于我们</span>
                  </a>
                </div>
                <div className="flex flex-col">
                  <a
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-black/60 hover:bg-black/5 dark:text-white/60 dark:hover:bg-white/5 cursor-pointer"
                    onClick={handleLogout}
                  >
                    <span className="material-symbols-outlined text-lg">logout</span>
                    <span>退出登录</span>
                  </a>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-8">
              <div className="mx-auto max-w-4xl">
                <div className="py-8 text-center">
                  <div className="relative mx-auto inline-block">
                    <div className="h-32 w-32 rounded-full bg-cover bg-center" style={{ backgroundImage: `url(${avatar || currentUser?.avatar || '/default-avatar.png'})` }}></div>
                    <button
                      onClick={handleAvatarClick}
                      className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white"
                    >
                      <span className="material-symbols-outlined text-lg">edit</span>
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                  </div>
                  <div className="mt-4">
                    <h2 className="text-2xl font-bold text-black dark:text-white">{currentUser?.nickname}</h2>
                    <p className="mt-1 text-sm text-black/60 dark:text-white/60">User ID: {currentUser?.user_id}</p>
                    <p className="text-sm text-black/60 dark:text-white/60">Region: San Francisco</p>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-black dark:text-white">个人信息</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-black/60 dark:text-white/60 mb-2">昵称</label>
                        <input
                          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-black dark:text-white focus:border-primary focus:outline-none"
                          value={nickname}
                          onChange={(e) => setNickname(e.target.value)}
                          placeholder="请输入昵称"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-black/60 dark:text-white/60 mb-2">邮箱</label>
                        <input
                          className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-4 py-3 text-slate-500 dark:text-slate-400"
                          value={currentUser?.email || ""}
                          disabled
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-black dark:text-white">修改密码</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-black/60 dark:text-white/60 mb-2">新密码</label>
                        <input
                          type="password"
                          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-black dark:text-white focus:border-primary focus:outline-none"
                          placeholder="请输入新密码（最少8位）"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-black/60 dark:text-white/60 mb-2">确认密码</label>
                        <input
                          type="password"
                          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-black dark:text-white focus:border-primary focus:outline-none"
                          placeholder="请再次输入密码"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center gap-4 pt-8">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 disabled:opacity-50"
                    >
                      {saving ? "保存中..." : "保存修改"}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={saving}
                      className="rounded-lg bg-slate-200 dark:bg-slate-700 px-6 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600"
                    >
                      取消
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
