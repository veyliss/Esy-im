"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { TopBarActions, TopStatusPill } from "@/components/layout/top-actions";
import { SidebarItem, SidebarSection, SidebarToolbar, WorkspaceSidebar, WorkspaceSidebarHeader } from "@/components/workspace/section";
import { UserAvatar } from "@/components/ui/user-avatar";
import { ErrorAlert } from "@/components/ui/error-alert";
import { PageLoading } from "@/components/ui/loading-states";
import { useAppInteractions } from "@/components/ui/app-interactions";
import { useAuthStore } from "@/lib/store";
import { AuthAPI } from "@/lib/api/auth";
import { UserAPI } from "@/lib/api/user";
import { handleApiError, createUserFriendlyErrorMessage } from "@/lib/utils/errors";
import type { User } from "@/lib/types/api";

function formatDate(value?: string) {
  if (!value) return "未记录";
  return new Date(value).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function passwordStrength(password: string) {
  if (!password) return { score: 0, label: "未设置", tone: "muted" as const };

  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) return { score, label: "偏弱", tone: "danger" as const };
  if (score <= 3) return { score, label: "可用", tone: "warning" as const };
  return { score, label: "较强", tone: "success" as const };
}

export default function MePage() {
  const { confirm, toast } = useAppInteractions();
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const { clearToken } = useAuthStore();
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [nickname, setNickname] = useState("");
  const [avatar, setAvatar] = useState("");
  const [saving, setSaving] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

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
        const apiError = handleApiError(error);
        setError(createUserFriendlyErrorMessage(apiError));
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      loadUserInfo();
    } else {
      setLoading(false);
    }
  }, [token]);

  const hasPasswordInput = Boolean(newPassword || confirmPassword);
  const hasProfileChanges = Boolean(
    currentUser &&
      (nickname.trim() !== (currentUser.nickname || "") || avatar !== (currentUser.avatar || "")),
  );
  const hasChanges = hasProfileChanges || hasPasswordInput;

  const strength = useMemo(() => passwordStrength(newPassword), [newPassword]);

  const profileCompletion = useMemo(() => {
    const checks = [Boolean(currentUser?.nickname), Boolean(currentUser?.avatar), Boolean(currentUser?.email), Boolean(currentUser?.user_id)];
    const done = checks.filter(Boolean).length;
    return Math.round((done / checks.length) * 100);
  }, [currentUser]);

  const handleCancel = () => {
    if (!currentUser) return;

    setNickname(currentUser.nickname || "");
    setAvatar(currentUser.avatar || "");
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("请选择图片文件");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("头像图片不能超过 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setAvatar(String(reader.result || ""));
    reader.onerror = () => setError("头像读取失败，请重新选择");
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const handleSave = async () => {
    if (saving) return;

    if (!nickname.trim()) {
      setError("昵称不能为空");
      return;
    }

    if (hasPasswordInput) {
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

      if (hasPasswordInput) {
        const passwordRes = await AuthAPI.setPassword({
          password: newPassword,
        });

        if (passwordRes.data.code === 0) {
          toast("密码已更新，请重新登录", { tone: "success" });
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
      toast("资料已保存", { tone: "success" });
    } catch (error) {
      const apiError = handleApiError(error);
      setError(createUserFriendlyErrorMessage(apiError));
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    if (logoutLoading) return;

    const confirmed = await confirm({
      title: "退出登录",
      message: "退出后需要重新登录才能继续使用即时通讯系统。",
      confirmText: "退出",
      tone: "danger",
    });
    if (!confirmed) return;

    setLogoutLoading(true);
    try {
      await AuthAPI.logout();
    } catch (error) {
      console.warn("登出请求失败，但仍然清除本地 token", error);
    } finally {
      clearToken();
      setLogoutLoading(false);
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
          <div className="me-loading-wrap">
            <PageLoading message="加载个人资料..." size="md" />
          </div>
        }
      />
    );
  }

  return (
    <WorkspaceShell
      active="me"
      navVariant="modern"
      mobileDetailActive={false}
      rightSlot={
        <TopBarActions avatarSrc={avatar || currentUser?.avatar} avatarName={nickname || currentUser?.nickname || "我"}>
          {hasChanges ? <TopStatusPill tone="warning">有未保存修改</TopStatusPill> : null}
        </TopBarActions>
      }
      sidebar={
        <WorkspaceSidebar>
          <SidebarToolbar>
            <WorkspaceSidebarHeader
              eyebrow="设置"
              title="我的"
              description="资料、账号安全和退出登录集中在这里。"
            />
          </SidebarToolbar>
          <SidebarSection title="设置目录" className="flex-1" bodyClassName="space-y-1">
            <SidebarItem
              active
              leading={<span className="material-symbols-outlined text-lg">person</span>}
              title="我的资料"
              description="头像、昵称、账号信息"
              onClick={() => document.getElementById("profile-section")?.scrollIntoView({ behavior: "smooth" })}
            />
            <SidebarItem
              leading={<span className="material-symbols-outlined text-lg">badge</span>}
              title="账号信息"
              description="用户 ID、邮箱、创建时间"
              onClick={() => document.getElementById("account-section")?.scrollIntoView({ behavior: "smooth" })}
            />
            <SidebarItem
              leading={<span className="material-symbols-outlined text-lg">shield_lock</span>}
              title="账号与安全"
              description="修改密码与登录安全"
              onClick={() => document.getElementById("security-section")?.scrollIntoView({ behavior: "smooth" })}
            />
          </SidebarSection>

          <div className="me-sidebar-footer">
            <button type="button" onClick={handleLogout} disabled={logoutLoading} className="me-logout-button">
              <span className="material-symbols-outlined text-lg">logout</span>
              <span>{logoutLoading ? "退出中..." : "退出登录"}</span>
            </button>
          </div>
        </WorkspaceSidebar>
      }
      main={
        <div className="me-page workspace-main-panel">
          <div className="me-page-inner">
            <ErrorAlert error={error} onClose={() => setError(null)} className="mb-4" />

            <section className="me-hero" id="profile-section">
              <div className="me-avatar-block">
                <button type="button" onClick={handleAvatarClick} className="me-avatar-button" aria-label="修改头像" title="修改头像">
                  <UserAvatar
                    src={avatar || currentUser?.avatar || "/default-avatar.png"}
                    name={nickname || currentUser?.nickname || "我"}
                    size="3xl"
                    border
                  />
                  <span className="me-avatar-edit">
                    <span className="material-symbols-outlined text-lg">photo_camera</span>
                  </span>
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              </div>

              <div className="me-hero-copy">
                <span className="me-eyebrow">个人资料</span>
                <h1>{nickname || currentUser?.nickname || "未设置昵称"}</h1>
                <p>这里管理你在聊天、通讯录和群聊中展示的资料。</p>
                <div className="me-hero-meta">
                  <span>
                    <span className="material-symbols-outlined">alternate_email</span>
                    {currentUser?.user_id || "未设置 ID"}
                  </span>
                  <span>
                    <span className="material-symbols-outlined">mail</span>
                    {currentUser?.email || "未绑定邮箱"}
                  </span>
                </div>
              </div>

              <div className="me-profile-score" aria-label={`资料完整度 ${profileCompletion}%`}>
                <span>资料完整度</span>
                <strong>{profileCompletion}%</strong>
                <div>
                  <i style={{ width: `${profileCompletion}%` }} />
                </div>
              </div>
            </section>

            <div className="me-grid">
              <section className="me-panel" aria-labelledby="me-profile-title">
                <div className="me-panel-head">
                  <span className="material-symbols-outlined">edit_square</span>
                  <div>
                    <h2 id="me-profile-title">编辑资料</h2>
                    <p>头像和昵称会显示在聊天气泡、通讯录和群聊成员列表中。</p>
                  </div>
                </div>

                <div className="me-form-grid">
                  <label className="me-field">
                    <span>昵称</span>
                    <input
                      className="ui-input"
                      value={nickname}
                      onChange={(event) => setNickname(event.target.value)}
                      placeholder="请输入昵称"
                      maxLength={30}
                    />
                    <small>{nickname.length}/30</small>
                  </label>

                  <label className="me-field">
                    <span>头像</span>
                    <button type="button" onClick={handleAvatarClick} className="me-avatar-picker">
                      <span>选择本地图片</span>
                      <span className="material-symbols-outlined text-lg">upload</span>
                    </button>
                    <small>支持常见图片格式，建议小于 2MB</small>
                  </label>
                </div>
              </section>

              <section className="me-panel" id="account-section" aria-labelledby="me-account-title">
                <div className="me-panel-head">
                  <span className="material-symbols-outlined">badge</span>
                  <div>
                    <h2 id="me-account-title">账号信息</h2>
                    <p>这些信息用于登录识别，不在这里直接修改。</p>
                  </div>
                </div>

                <div className="me-info-list">
                  <div>
                    <span>用户 ID</span>
                    <strong>{currentUser?.user_id || "未设置"}</strong>
                  </div>
                  <div>
                    <span>邮箱</span>
                    <strong>{currentUser?.email || "未绑定"}</strong>
                  </div>
                  <div>
                    <span>创建时间</span>
                    <strong>{formatDate(currentUser?.created_at)}</strong>
                  </div>
                  <div>
                    <span>最近更新</span>
                    <strong>{formatDate(currentUser?.updated_at)}</strong>
                  </div>
                </div>
              </section>

              <section className="me-panel is-wide" id="security-section" aria-labelledby="me-security-title">
                <div className="me-panel-head">
                  <span className="material-symbols-outlined">shield_lock</span>
                  <div>
                    <h2 id="me-security-title">账号与安全</h2>
                    <p>修改密码后会自动退出当前登录，需要重新登录。</p>
                  </div>
                </div>

                <div className="me-form-grid">
                  <label className="me-field">
                    <span>新密码</span>
                    <input
                      type="password"
                      className="ui-input"
                      placeholder="请输入新密码（最少8位）"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                    />
                  </label>

                  <label className="me-field">
                    <span>确认密码</span>
                    <input
                      type="password"
                      className="ui-input"
                      placeholder="请再次输入密码"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                    />
                  </label>
                </div>

                <div className="me-password-meter">
                  <div>
                    <span>密码强度</span>
                    <strong className={`is-${strength.tone}`}>{strength.label}</strong>
                  </div>
                  <div className="me-password-bars" aria-hidden="true">
                    {[1, 2, 3, 4].map((item) => (
                      <i key={item} className={item <= strength.score ? `is-${strength.tone}` : ""} />
                    ))}
                  </div>
                </div>
              </section>
            </div>

            <div className="me-save-bar">
              <div>
                <strong>{hasChanges ? "有未保存修改" : "资料已同步"}</strong>
                <span>{hasPasswordInput ? "保存后需要重新登录" : "修改资料后记得保存"}</span>
              </div>
              <div className="me-save-actions">
                <button type="button" onClick={handleCancel} disabled={saving || !hasChanges} className="im-secondary-button">
                  取消
                </button>
                <button type="button" onClick={handleSave} disabled={saving || !hasChanges} className="im-primary-button">
                  {saving ? "保存中..." : "保存修改"}
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    />
  );
}
