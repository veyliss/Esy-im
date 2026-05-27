"use client";

import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { TopBarActions, TopIconButton } from "@/components/layout/top-actions";
import { ActionBar, SectionTitle, SidebarItem, SidebarSection, WorkspaceSidebar } from "@/components/workspace/section";
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

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setAvatar(String(reader.result || ""));
    reader.onerror = () => setError("头像读取失败，请重新选择");
    reader.readAsDataURL(file);
    e.target.value = "";
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
        sidebar={<div className="h-full bg-white/60 dark:bg-slate-900/40" />}
        main={
          <div className="h-full overflow-y-auto px-8 py-8">
            <div className="mx-auto max-w-4xl rounded-lg border border-slate-200 bg-white/85 px-6 py-12 dark:border-slate-800 dark:bg-slate-900/70">
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
      rightSlot={
        <TopBarActions avatarSrc={currentUser?.avatar} avatarName={currentUser?.nickname || "我"}>
          <TopIconButton icon="notifications" label="通知" />
          <TopIconButton icon="settings" label="设置" />
        </TopBarActions>
      }
      sidebar={
        <WorkspaceSidebar>
          <SidebarSection title="设置" className="flex-1" bodyClassName="space-y-1">
            <SidebarItem active leading={<span className="material-symbols-outlined text-lg">person</span>} title="我的资料" />
            <SidebarItem leading={<span className="material-symbols-outlined text-lg">security</span>} title="账号与安全" />
            <SidebarItem leading={<span className="material-symbols-outlined text-lg">visibility</span>} title="隐私设置" />
            <SidebarItem leading={<span className="material-symbols-outlined text-lg">notifications</span>} title="通知设置" />
            <SidebarItem leading={<span className="material-symbols-outlined text-lg">settings</span>} title="通用设置" />
            <SidebarItem leading={<span className="material-symbols-outlined text-lg">info</span>} title="关于我们" />
          </SidebarSection>

          <SidebarItem
            className="m-5 w-[calc(100%-40px)]"
            onClick={handleLogout}
            leading={<span className="material-symbols-outlined text-lg">logout</span>}
            title={logoutLoading ? "退出中..." : "退出登录"}
          />
        </WorkspaceSidebar>
      }
      main={
        <div className="workspace-main-panel">
          <div className="mx-auto max-w-5xl px-9 py-8">
            <ErrorAlert error={error} onClose={() => setError(null)} className="mb-4" />

            <section className="border-b border-slate-200 py-8 text-center dark:border-slate-800">
              <div className="relative mx-auto inline-block">
                <UserAvatar
                  src={avatar || currentUser?.avatar || "/default-avatar.png"}
                  name={currentUser?.nickname || "我"}
                  size="3xl"
                  border
                />
                <button
                  type="button"
                  onClick={handleAvatarClick}
                  className="absolute bottom-0 right-0 flex size-8 items-center justify-center rounded-full bg-primary text-white shadow-sm"
                  aria-label="修改头像"
                  title="修改头像"
                >
                  <span className="material-symbols-outlined text-lg">edit</span>
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              </div>
              <div className="mt-4">
                <h2 className="text-2xl font-bold text-slate-950 dark:text-white">{currentUser?.nickname || "未设置昵称"}</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">用户 ID：{currentUser?.user_id}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">邮箱：{currentUser?.email || "未绑定"}</p>
              </div>
            </section>

            <div className="mt-8 space-y-10">
              <section>
                <SectionTitle title="个人信息" />
                <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">昵称</span>
                    <input
                      className="ui-input w-full rounded-lg px-4 py-3"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="请输入昵称"
                    />
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">头像</span>
                    <button
                      type="button"
                      onClick={handleAvatarClick}
                      className="flex h-[50px] items-center justify-between rounded-lg border border-slate-300 bg-white px-4 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-background-dark dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <span>更换头像</span>
                      <span className="material-symbols-outlined text-lg text-slate-400">edit</span>
                    </button>
                  </label>
                </div>
              </section>

              <section>
                <SectionTitle title="账号信息" />
                <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">用户 ID</span>
                    <input
                      className="ui-input w-full rounded-lg px-4 py-3 text-slate-500 dark:text-slate-400"
                      value={currentUser?.user_id || ""}
                      disabled
                    />
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">邮箱</span>
                    <input
                      className="ui-input w-full rounded-lg px-4 py-3 text-slate-500 dark:text-slate-400"
                      value={currentUser?.email || ""}
                      disabled
                    />
                  </label>
                </div>
              </section>

              <section>
                <SectionTitle title="账号与安全" description="设置新密码后需要重新登录。" />
                <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">新密码</span>
                    <input
                      type="password"
                      className="ui-input w-full rounded-lg px-4 py-3"
                      placeholder="请输入新密码（最少8位）"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">确认密码</span>
                    <input
                      type="password"
                      className="ui-input w-full rounded-lg px-4 py-3"
                      placeholder="请再次输入密码"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </label>
                </div>
              </section>

              <ActionBar className="sticky bottom-0 justify-end border-t border-slate-200 bg-white/95 py-5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={saving}
                  className="rounded-lg bg-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {saving ? "保存中..." : "保存修改"}
                </button>
              </ActionBar>
            </div>
          </div>
        </div>
      }
    />
  );
}
