"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Switch } from "antd";
import {
  CameraOutlined,
  EditOutlined,
  IdcardOutlined,
  MailOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  UploadOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Im4Button, Im4Shell, Im4Status } from "@/components/im4";
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

type UserPreferences = {
  desktopNotifications: boolean;
  compactMessages: boolean;
};

const defaultPreferences: UserPreferences = {
  desktopNotifications: true,
  compactMessages: false,
};

const preferencesStorageKey = "esy-im:user-preferences";

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
  const [desktopNotifications, setDesktopNotifications] = useState(true);
  const [compactMessages, setCompactMessages] = useState(false);
  const [savedPreferences, setSavedPreferences] = useState<UserPreferences>(defaultPreferences);

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

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(preferencesStorageKey);
      const parsed = raw ? (JSON.parse(raw) as Partial<UserPreferences>) : {};
      const nextPreferences = {
        ...defaultPreferences,
        ...parsed,
      };
      setSavedPreferences(nextPreferences);
      setDesktopNotifications(nextPreferences.desktopNotifications);
      setCompactMessages(nextPreferences.compactMessages);
    } catch {
      setSavedPreferences(defaultPreferences);
      setDesktopNotifications(defaultPreferences.desktopNotifications);
      setCompactMessages(defaultPreferences.compactMessages);
    }
  }, []);

  const hasPasswordInput = Boolean(newPassword || confirmPassword);
  const hasProfileChanges = Boolean(
    currentUser &&
      (nickname.trim() !== (currentUser.nickname || "") || avatar !== (currentUser.avatar || "")),
  );
  const hasPreferenceChanges =
    desktopNotifications !== savedPreferences.desktopNotifications ||
    compactMessages !== savedPreferences.compactMessages;
  const hasChanges = hasProfileChanges || hasPasswordInput || hasPreferenceChanges;

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
    setDesktopNotifications(savedPreferences.desktopNotifications);
    setCompactMessages(savedPreferences.compactMessages);
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

  const handleDesktopNotificationsChange = async (enabled: boolean) => {
    if (enabled && !("Notification" in window)) {
      toast("当前浏览器不支持桌面通知", { tone: "warning" });
      setDesktopNotifications(false);
      return;
    }

    if (enabled && Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      if (permission === "denied") {
        toast("浏览器通知权限已被拒绝", { tone: "warning" });
        setDesktopNotifications(false);
        return;
      }
    }

    setDesktopNotifications(enabled);
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
      if (hasProfileChanges) {
        const profileRes = await UserAPI.updateProfile({
          nickname: nickname.trim(),
          avatar: avatar || undefined,
        });

        if (profileRes.data.code !== 0) {
          throw new Error(profileRes.data.msg || "个人信息更新失败");
        }
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

      if (hasPreferenceChanges) {
        const nextPreferences = { desktopNotifications, compactMessages };
        window.localStorage.setItem(preferencesStorageKey, JSON.stringify(nextPreferences));
        setSavedPreferences(nextPreferences);
      }

      if (hasProfileChanges) {
        const userRes = await UserAPI.getMe();
        if (userRes.data.code === 0) {
          const user = userRes.data.data;
          setCurrentUser(user);
          setNickname(user.nickname || "");
          setAvatar(user.avatar || "");
        }
      }

      setNewPassword("");
      setConfirmPassword("");
      setError(null);
      toast(hasPreferenceChanges && !hasProfileChanges && !hasPasswordInput ? "偏好已保存" : "资料已保存", { tone: "success" });
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

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const settingsPanel = (
    <div className="im4-session-panel">
      <div className="im4-session-head">
        <div className="im4-session-title">
          <div>
            <h1>我的</h1>
            <p>资料、安全和偏好集中管理。</p>
          </div>
          {hasChanges ? <Im4Status tone="warning">未保存</Im4Status> : null}
        </div>
      </div>

      <div className="im4-session-list">
        <h2 className="im4-session-section-label">设置目录</h2>
        <Button
          type="text"
          className="im4-contact-request is-active"
          onClick={() => scrollToSection("profile-section")}
        >
          <span>我的资料</span>
          <small>头像、昵称和展示信息</small>
        </Button>
        <Button
          type="text"
          className="im4-contact-request"
          onClick={() => scrollToSection("account-section")}
        >
          <span>账号信息</span>
          <small>用户 ID、邮箱和创建时间</small>
        </Button>
        <Button
          type="text"
          className="im4-contact-request"
          onClick={() => scrollToSection("security-section")}
        >
          <span>账号与安全</span>
          <small>密码与登录状态</small>
        </Button>
        <Button
          type="text"
          className="im4-contact-request"
          onClick={() => scrollToSection("preference-section")}
        >
          <span>偏好设置</span>
          <small>通知和显示习惯</small>
        </Button>
      </div>

      <div className="im4-me-footer">
        <Im4Button tone="danger" onClick={handleLogout} disabled={logoutLoading}>
          {logoutLoading ? "退出中..." : "退出登录"}
        </Im4Button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <Im4Shell
        active="me"
        title="我的"
        subtitle="资料和设置"
        detailActive
        sessionPanel={
          <div className="im4-session-panel">
            <div className="im4-session-head">
              <div className="im4-session-title">
                <div>
                  <h1>我的</h1>
                  <p>正在同步个人资料。</p>
                </div>
              </div>
            </div>
          </div>
        }
      >
          <div className="me-loading-wrap">
            <PageLoading message="加载个人资料..." size="md" />
          </div>
      </Im4Shell>
    );
  }

  return (
    <Im4Shell
      active="me"
      title="我的"
      subtitle="资料、安全和偏好"
      detailActive
      rightSlot={
        hasChanges ? <Im4Status tone="warning">有未保存修改</Im4Status> : null
      }
      sessionPanel={settingsPanel}
      avatarSrc={avatar || currentUser?.avatar}
      avatarName={nickname || currentUser?.nickname || "我"}
    >
        <div className="me-page workspace-main-panel">
          <div className="me-page-inner">
            <ErrorAlert error={error} onClose={() => setError(null)} className="mb-4" />

            <section className="me-hero" id="profile-section">
              <div className="me-avatar-block">
                <Button type="text" onClick={handleAvatarClick} className="me-avatar-button" aria-label="修改头像" title="修改头像">
                  <UserAvatar
                    src={avatar || currentUser?.avatar || "/default-avatar.png"}
                    name={nickname || currentUser?.nickname || "我"}
                    size="3xl"
                    border
                  />
                  <span className="me-avatar-edit">
                    <CameraOutlined />
                  </span>
                </Button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              </div>

              <div className="me-hero-copy">
                <span className="me-eyebrow">个人资料</span>
                <h1>{nickname || currentUser?.nickname || "未设置昵称"}</h1>
                <p>这里管理你在聊天、通讯录和群聊中展示的资料。</p>
                <div className="me-hero-meta">
                  <span>
                    <UserOutlined />
                    {currentUser?.user_id || "未设置 ID"}
                  </span>
                  <span>
                    <MailOutlined />
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
                  <span className="me-panel-icon"><EditOutlined /></span>
                  <div>
                    <h2 id="me-profile-title">编辑资料</h2>
                    <p>头像和昵称会显示在聊天气泡、通讯录和群聊成员列表中。</p>
                  </div>
                </div>

                <div className="me-form-grid">
                  <label className="me-field">
                    <span>昵称</span>
                    <Input
                      value={nickname}
                      onChange={(event) => setNickname(event.target.value)}
                      placeholder="请输入昵称"
                      maxLength={30}
                      size="large"
                    />
                    <small>{nickname.length}/30</small>
                  </label>

                  <label className="me-field">
                    <span>头像</span>
                    <Button type="text" onClick={handleAvatarClick} className="me-avatar-picker">
                      <span>选择本地图片</span>
                      <UploadOutlined />
                    </Button>
                    <small>支持常见图片格式，建议小于 2MB</small>
                  </label>
                </div>
              </section>

              <section className="me-panel" id="account-section" aria-labelledby="me-account-title">
                <div className="me-panel-head">
                  <span className="me-panel-icon"><IdcardOutlined /></span>
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
                  <span className="me-panel-icon"><SafetyCertificateOutlined /></span>
                  <div>
                    <h2 id="me-security-title">账号与安全</h2>
                    <p>修改密码后会自动退出当前登录，需要重新登录。</p>
                  </div>
                </div>

                <div className="me-form-grid">
                  <label className="me-field">
                    <span>新密码</span>
                    <Input.Password
                      placeholder="请输入新密码（最少8位）"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      size="large"
                    />
                  </label>

                  <label className="me-field">
                    <span>确认密码</span>
                    <Input.Password
                      placeholder="请再次输入密码"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      size="large"
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

              <section className="me-panel is-wide" id="preference-section" aria-labelledby="me-preference-title">
                <div className="me-panel-head">
                  <span className="me-panel-icon"><SettingOutlined /></span>
                  <div>
                    <h2 id="me-preference-title">偏好设置</h2>
                    <p>这些设置先保存在当前前端会话中，后续可以接入后端持久化。</p>
                  </div>
                </div>

                <div className="me-preference-list">
                  <label>
                    <span>
                      <strong>桌面通知</strong>
                      <small>收到新消息时显示浏览器通知提醒。</small>
                    </span>
                    <Switch
                      checked={desktopNotifications}
                      onChange={(checked) => {
                        void handleDesktopNotificationsChange(checked);
                      }}
                    />
                  </label>
                  <label>
                    <span>
                      <strong>紧凑消息列表</strong>
                      <small>提高会话列表密度，适合小屏或高频切换。</small>
                    </span>
                    <Switch
                      checked={compactMessages}
                      onChange={(checked) => setCompactMessages(checked)}
                    />
                  </label>
                </div>
              </section>
            </div>

            <div className="me-save-bar">
              <div>
                <strong>{hasChanges ? "有未保存修改" : "资料与偏好已同步"}</strong>
                <span>
                  {hasPasswordInput
                    ? "保存后需要重新登录"
                    : hasPreferenceChanges
                      ? "偏好设置会保存在当前浏览器"
                      : "修改资料或偏好后记得保存"}
                </span>
              </div>
              <div className="me-save-actions">
                <Button onClick={handleCancel} disabled={saving || !hasChanges}>
                  取消
                </Button>
                <Button type="primary" onClick={handleSave} disabled={saving || !hasChanges} loading={saving}>
                  {saving ? "保存中..." : "保存修改"}
                </Button>
              </div>
            </div>
          </div>
        </div>
    </Im4Shell>
  );
}
