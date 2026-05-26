"use client";

import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { ActionBar, SectionCard, SectionTitle, SidebarSection } from "@/components/workspace/section";
import { UserAvatar } from "@/components/ui/user-avatar";
import { ErrorAlert } from "@/components/ui/error-alert";
import { PageLoading } from "@/components/ui/loading-states";
import { useAuthStore } from "@/lib/store";
import { AuthAPI } from "@/lib/api/auth";
import { UserAPI } from "@/lib/api/user";
import { handleApiError, createUserFriendlyErrorMessage } from "@/lib/utils/errors";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import type { User } from "@/lib/types/api";

export default function MePage() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const { clearToken } = useAuthStore();
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
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

    if (!nickname.trim()) {
      setError("昵称不能为空");
      return;
    }

    if (newPassword || confirmPassword) {
      if (!newPassword.trim()) {
        setError("新密码不能为空");
        return;
      }

      if (newPassword.length < 8) {
        setError("密码长度不能少于8位");
        return;
      }

      if (newPassword !== confirmPassword) {
        setError("两次密码输入不一致");
        return;
      }
    }

    setSaving(true);
    try {
      const profileRes = await UserAPI.updateProfile({
        nickname: nickname.trim(),
        avatar: avatar || undefined,
      });

      if (profileRes.data.code !== 0) {
        throw new Error(profileRes.data.msg || "个人信息更新失败");
      }

      if (newPassword && confirmPassword) {
        const passwordRes = await AuthAPI.setPassword({
          password: newPassword,
        });

        if (passwordRes.data.code === 0) {
          clearToken();
          router.push("/login");
          return;
        }
      }

      const userRes = await UserAPI.getMe();
      if (userRes.data.code === 0) {
        const user = userRes.data.data;
        setCurrentUser(user);
        setNickname(user.nickname || "");
        setAvatar(user.avatar || "");
      }
      setNewPassword("");
      setConfirmPassword("");
      setError(null);
    } catch (e) {
      const apiError = handleApiError(e);
      setError(createUserFriendlyErrorMessage(apiError));
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
      <WorkspaceShell
        active="me"
        navVariant="modern"
        headerDescription="正在加载个人信息..."
        sidebar={<div className="h-full bg-white/60 dark:bg-slate-900/40" />}
        main={
          <div className="h-full overflow-y-auto p-8">
            <div className="mx-auto max-w-4xl rounded-[32px] border border-slate-200 bg-white/85 px-6 py-12 dark:border-slate-800 dark:bg-slate-900/70">
              <PageLoading message="加载中..." size="md" />
            </div>
          </div>
        }
      />
    );
  }

  return (
    <WorkspaceShell
      active="me"
      navVariant="modern"
      headerDescription="统一个人中心导航与设置布局，不改动账号业务逻辑。"
      rightSlot={<UserAvatar src={currentUser?.avatar} name={currentUser?.nickname || "我"} size="sm" border />}
      sidebar={
        <div className="flex h-full flex-col p-4">
          <SidebarSection title="个人中心" className="flex-1" bodyClassName="space-y-2">
            <a className="block rounded-2xl bg-primary/10 px-4 py-3 text-sm font-medium text-primary dark:bg-primary/20" href="#">
              我的资料
            </a>
            <a className="block rounded-2xl px-4 py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800" href="#">
              账号与安全
            </a>
            <a className="block rounded-2xl px-4 py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800" href="#">
              隐私设置
            </a>
            <a className="block rounded-2xl px-4 py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800" href="#">
              通用设置
            </a>
            <a className="block rounded-2xl px-4 py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800" href="#">
              关于我们
            </a>
          </SidebarSection>

          <button
            type="button"
            className="mt-4 rounded-2xl px-4 py-3 text-left text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            onClick={handleLogout}
          >
            {logoutLoading ? "退出中..." : "退出登录"}
          </button>
        </div>
      }
      main={
        <div className="h-full overflow-y-auto p-8">
          <div className="mx-auto max-w-4xl space-y-6">
            <ErrorAlert error={error} onClose={() => setError(null)} className="mb-4" />
            <SectionCard>
              <div className="py-4 text-center">
                <div className="relative mx-auto inline-block">
                  <UserAvatar
                    src={avatar || currentUser?.avatar || "/default-avatar.png"}
                    name={currentUser?.nickname || "我"}
                    size="2xl"
                    border
                  />
                  <button
                    onClick={handleAvatarClick}
                    className="absolute bottom-0 right-0 rounded-full bg-primary px-3 py-1 text-xs font-medium text-white"
                    aria-label="修改头像"
                    title="修改头像"
                  >
                    更换
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                </div>
                <div className="mt-4">
                  <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{currentUser?.nickname}</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">用户 ID：{currentUser?.user_id}</p>
                </div>
              </div>
            </SectionCard>

            <SectionCard>
              <div className="space-y-8">
                <div className="space-y-4">
                  <SectionTitle title="个人信息" />
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-600 dark:text-slate-300">昵称</label>
                      <input
                        className="ui-input w-full rounded-2xl px-4 py-3"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        placeholder="请输入昵称"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-600 dark:text-slate-300">邮箱</label>
                      <input
                        className="ui-input w-full rounded-2xl px-4 py-3 text-slate-500 dark:text-slate-400"
                        value={currentUser?.email || ""}
                        disabled
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <SectionTitle title="修改密码" />
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-600 dark:text-slate-300">新密码</label>
                      <input
                        type="password"
                        className="ui-input w-full rounded-2xl px-4 py-3"
                        placeholder="请输入新密码（最少8位）"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-600 dark:text-slate-300">确认密码</label>
                      <input
                        type="password"
                        className="ui-input w-full rounded-2xl px-4 py-3"
                        placeholder="请再次输入密码"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <ActionBar className="justify-center pt-4">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
                  >
                    {saving ? "保存中..." : "保存修改"}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={saving}
                    className="rounded-xl bg-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                  >
                    取消
                  </button>
                </ActionBar>
              </div>
            </SectionCard>
          </div>
        </div>
      }
    />
  );
}
