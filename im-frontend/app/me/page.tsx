"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Input, Modal, Switch } from "antd";
import {
  BellOutlined,
  CameraOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  IdcardOutlined,
  KeyOutlined,
  MailOutlined,
  RightOutlined,
  SafetyCertificateOutlined,
  UploadOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Im4Button, Im4Shell, Im4Status } from "@/components/im4";
import { ErrorAlert } from "@/components/ui/error-alert";
import { PageLoading } from "@/components/ui/loading-states";
import { useAppInteractions } from "@/components/ui/app-interactions";
import { useAuthStore } from "@/lib/store";
import { AuthAPI } from "@/lib/api/auth";
import { UserAPI } from "@/lib/api/user";
import { UploadAPI } from "@/lib/api/upload";
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
  if (!password) return { score: 0, label: "未设置", color: "#d9d9d9" };
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  if (score <= 1) return { score, label: "偏弱", color: "#ef4444" };
  if (score <= 3) return { score, label: "可用", color: "#f59e0b" };
  return { score, label: "较强", color: "#10b981" };
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

  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [editPasswordOpen, setEditPasswordOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load user info
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
      } catch (err) {
        const apiError = handleApiError(err);
        setError(createUserFriendlyErrorMessage(apiError));
      } finally {
        setLoading(false);
      }
    };
    if (token) loadUserInfo();
    else setLoading(false);
  }, [token]);

  // Load preferences
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(preferencesStorageKey);
      const parsed = raw ? (JSON.parse(raw) as Partial<UserPreferences>) : {};
      const next = { ...defaultPreferences, ...parsed };
      setSavedPreferences(next);
      setDesktopNotifications(next.desktopNotifications);
      setCompactMessages(next.compactMessages);
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

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("请选择图片文件"); return; }
    if (file.size > 2 * 1024 * 1024) { setError("头像图片不能超过 2MB"); return; }
    event.target.value = "";
    try {
      const res = await UploadAPI.uploadImage(file);
      if (res.data.code === 0) {
        setAvatar(res.data.data.url);
      }
    } catch (err) {
      setError("头像上传失败，请重试");
    }
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

  // Save profile changes from modal
  const handleSaveProfile = async () => {
    if (saving) return;
    if (!nickname.trim()) { setError("昵称不能为空"); return; }
    setSaving(true);
    try {
      const res = await UserAPI.updateProfile({ nickname: nickname.trim(), avatar: avatar || undefined });
      if (res.data.code !== 0) throw new Error(res.data.msg || "个人信息更新失败");
      const userRes = await UserAPI.getMe();
      if (userRes.data.code === 0) {
        setCurrentUser(userRes.data.data);
        setNickname(userRes.data.data.nickname || "");
        setAvatar(userRes.data.data.avatar || "");
      }
      setError(null);
      setEditProfileOpen(false);
      toast("资料已保存", { tone: "success" });
    } catch (err) {
      setError(createUserFriendlyErrorMessage(handleApiError(err)));
    } finally {
      setSaving(false);
    }
  };

  // Save password
  const handleSavePassword = async () => {
    if (saving) return;
    if (!newPassword.trim()) { setError("新密码不能为空"); return; }
    if (newPassword.length < 8) { setError("密码长度不能少于8位"); return; }
    if (newPassword !== confirmPassword) { setError("两次密码输入不一致"); return; }
    setSaving(true);
    try {
      const res = await AuthAPI.setPassword({ password: newPassword });
      if (res.data.code === 0) {
        toast("密码已更新，请重新登录", { tone: "success" });
        clearToken();
        router.push("/login");
        return;
      }
    } catch (err) {
      setError(createUserFriendlyErrorMessage(handleApiError(err)));
    } finally {
      setSaving(false);
    }
  };

  // Save preferences
  const handleSavePreferences = async () => {
    const nextPreferences = { desktopNotifications, compactMessages };
    window.localStorage.setItem(preferencesStorageKey, JSON.stringify(nextPreferences));
    setSavedPreferences(nextPreferences);
    toast("偏好已保存", { tone: "success" });
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
    try { await AuthAPI.logout(); } catch { /* ignore */ }
    finally {
      clearToken();
      setLogoutLoading(false);
      router.push("/login");
    }
  };

  // Session panel (left sidebar)
  const settingsPanel = (
    <div className="im4-session-panel">
      <div className="im4-session-head">
        <div className="im4-session-title">
          <div>
            <h1>我的</h1>
            <p>资料、安全和偏好管理</p>
          </div>
          {hasChanges ? <Im4Status tone="warning">有修改</Im4Status> : null}
        </div>
      </div>
      <div className="im4-session-list">
        <h2 className="im4-session-section-label">快捷设置</h2>
        <button type="button" className="wx-me-nav-item" onClick={() => setEditProfileOpen(true)}>
          <UserOutlined /> <span>编辑资料</span>
        </button>
        <button type="button" className="wx-me-nav-item" onClick={() => setEditPasswordOpen(true)}>
          <KeyOutlined /> <span>修改密码</span>
        </button>
        <button type="button" className="wx-me-nav-item" onClick={handleSavePreferences}>
          <BellOutlined /> <span>保存偏好</span>
        </button>
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
                <div><h1>我的</h1><p>正在同步个人资料。</p></div>
              </div>
            </div>
          </div>
        }
      >
        <div className="wx-me-loading-wrap">
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
      sessionPanel={settingsPanel}
      avatarSrc={avatar || currentUser?.avatar}
      avatarName={nickname || currentUser?.nickname || "我"}
      rightSlot={
        <button type="button" className="wx-me-edit-btn" onClick={() => setEditProfileOpen(true)}>
          编辑资料
        </button>
      }
    >
      <div className="wx-me-page">
        <ErrorAlert error={error} onClose={() => setError(null)} className="wx-me-error" />

        {/* Profile header card (WeChat style) */}
        <div className="wx-me-profile-card">
          <div className="wx-me-profile-info">
            <div className="wx-me-profile-text">
              <span className="wx-me-label">个人资料</span>
              <h2 className="wx-me-name">{currentUser?.nickname || "未设置昵称"}</h2>
              <div className="wx-me-id-row">
                <span className="wx-me-id">微信号：{currentUser?.user_id || "未设置"}</span>
              </div>
            </div>
            <button type="button" className="wx-me-avatar-wrap" onClick={handleAvatarClick}>
              <img
                src={avatar || currentUser?.avatar || "/default-avatar.png"}
                alt={currentUser?.nickname || "头像"}
                className="wx-me-avatar-img"
              />
              <span className="wx-me-avatar-badge">
                <CameraOutlined />
              </span>
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
          </div>
          {/* Quick meta row */}
          <div className="wx-me-meta-row">
            <div className="wx-me-meta-tag"><MailOutlined /> {currentUser?.email || "未绑定邮箱"}</div>
            <div className="wx-me-meta-tag"><ClockCircleOutlined /> {formatDate(currentUser?.created_at)}</div>
          </div>
        </div>

        {/* Section: Account info */}
        <div className="wx-me-section" id="account-section">
          <div className="wx-me-section-title">
            <IdcardOutlined /> 账号信息
          </div>
          <div className="wx-me-section-body">
            <div className="wx-me-info-row">
              <span className="wx-me-info-label">用户 ID</span>
              <span className="wx-me-info-value">{currentUser?.user_id || "未设置"}</span>
            </div>
            <div className="wx-me-info-row">
              <span className="wx-me-info-label">邮箱</span>
              <span className="wx-me-info-value">{currentUser?.email || "未绑定"}</span>
            </div>
            <div className="wx-me-info-row">
              <span className="wx-me-info-label">创建时间</span>
              <span className="wx-me-info-value">{formatDate(currentUser?.created_at)}</span>
            </div>
            <div className="wx-me-info-row">
              <span className="wx-me-info-label">最近更新</span>
              <span className="wx-me-info-value">{formatDate(currentUser?.updated_at)}</span>
            </div>
          </div>
        </div>

        {/* Section: Security */}
        <div className="wx-me-section" id="security-section">
          <div className="wx-me-section-title">
            <SafetyCertificateOutlined /> 账号与安全
          </div>
          <div className="wx-me-section-body">
            <button type="button" className="wx-me-action-row" onClick={() => setEditPasswordOpen(true)}>
              <span className="wx-me-action-label">修改密码</span>
              <RightOutlined className="wx-me-arrow" />
            </button>
            <div className="wx-me-info-row">
              <span className="wx-me-info-label">登录状态</span>
              <span className="wx-me-info-value wx-me-status-online">在线</span>
            </div>
          </div>
        </div>

        {/* Section: Preferences */}
        <div className="wx-me-section" id="preference-section">
          <div className="wx-me-section-title">
            <BellOutlined /> 偏好设置
          </div>
          <div className="wx-me-section-body">
            <div className="wx-me-setting-row">
              <div className="wx-me-setting-text">
                <strong>桌面通知</strong>
                <small>收到新消息时显示浏览器通知提醒</small>
              </div>
              <Switch
                checked={desktopNotifications}
                onChange={(checked) => { void handleDesktopNotificationsChange(checked); }}
                size="small"
              />
            </div>
            <div className="wx-me-setting-row">
              <div className="wx-me-setting-text">
                <strong>紧凑消息列表</strong>
                <small>提高会话列表密度，适合小屏或高频切换</small>
              </div>
              <Switch
                checked={compactMessages}
                onChange={setCompactMessages}
                size="small"
              />
            </div>
            {hasPreferenceChanges ? (
              <button type="button" className="wx-me-save-pref-btn" onClick={handleSavePreferences}>
                保存偏好设置
              </button>
            ) : null}
          </div>
        </div>

        {/* Logout button (mobile-friendly inline) */}
        <div className="wx-me-logout-section">
          <button type="button" className="wx-me-logout-btn" onClick={handleLogout} disabled={logoutLoading}>
            {logoutLoading ? "退出中..." : "退出登录"}
          </button>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal
        open={editProfileOpen}
        onCancel={() => {
          // Reset to current values
          setNickname(currentUser?.nickname || "");
          setAvatar(currentUser?.avatar || "");
          setEditProfileOpen(false);
        }}
        footer={null}
        closable={false}
        centered
        width="min(460px, calc(100vw - 24px))"
        className="wx-me-edit-modal"
      >
        <div className="wx-me-modal">
          <div className="wx-me-modal-head">
            <span className="wx-me-modal-title">编辑资料</span>
            <button
              type="button"
              className="wx-me-modal-close"
              onClick={() => {
                setNickname(currentUser?.nickname || "");
                setAvatar(currentUser?.avatar || "");
                setEditProfileOpen(false);
              }}
            >
              <CloseOutlined />
            </button>
          </div>
          <div className="wx-me-modal-body">
            {/* Avatar editor */}
            <div className="wx-me-edit-avatar">
              <button type="button" onClick={handleAvatarClick}>
                <img
                  src={avatar || currentUser?.avatar || "/default-avatar.png"}
                  alt="头像"
                />
                <span className="wx-me-avatar-overlay"><UploadOutlined /></span>
              </button>
              <span className="wx-me-edit-avatar-hint">点击更换头像</span>
            </div>
            {/* Nickname input */}
            <div className="wx-me-edit-field">
              <label>昵称</label>
              <Input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="请输入昵称"
                maxLength={30}
                size="large"
                showCount
              />
            </div>
          </div>
          <div className="wx-me-modal-foot">
            <button
              type="button"
              className="wx-me-modal-cancel"
              onClick={() => {
                setNickname(currentUser?.nickname || "");
                setAvatar(currentUser?.avatar || "");
                setEditProfileOpen(false);
              }}
            >
              取消
            </button>
            <button
              type="button"
              className="wx-me-modal-save"
              disabled={saving || !hasProfileChanges}
              onClick={handleSaveProfile}
            >
              {saving ? "保存中..." : "保存"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Password Modal */}
      <Modal
        open={editPasswordOpen}
        onCancel={() => { setNewPassword(""); setConfirmPassword(""); setEditPasswordOpen(false); }}
        footer={null}
        closable={false}
        centered
        width="min(460px, calc(100vw - 24px))"
        className="wx-me-edit-modal"
      >
        <div className="wx-me-modal">
          <div className="wx-me-modal-head">
            <span className="wx-me-modal-title">修改密码</span>
            <button
              type="button"
              className="wx-me-modal-close"
              onClick={() => { setNewPassword(""); setConfirmPassword(""); setEditPasswordOpen(false); }}
            >
              <CloseOutlined />
            </button>
          </div>
          <div className="wx-me-modal-body">
            <p className="wx-me-modal-hint">修改密码后会自动退出当前登录，需要重新登录。</p>
            <div className="wx-me-edit-field">
              <label>新密码</label>
              <Input.Password
                placeholder="请输入新密码（最少8位）"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                size="large"
              />
            </div>
            <div className="wx-me-edit-field">
              <label>确认密码</label>
              <Input.Password
                placeholder="请再次输入密码"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                size="large"
              />
            </div>
            {/* Password strength */}
            {newPassword ? (
              <div className="wx-me-strength">
                <div className="wx-me-strength-header">
                  <span>密码强度</span>
                  <strong style={{ color: strength.color }}>{strength.label}</strong>
                </div>
                <div className="wx-me-strength-bar">
                  <div style={{ width: `${strength.score * 25}%`, background: strength.color }} />
                </div>
              </div>
            ) : null}
          </div>
          <div className="wx-me-modal-foot">
            <button
              type="button"
              className="wx-me-modal-cancel"
              onClick={() => { setNewPassword(""); setConfirmPassword(""); setEditPasswordOpen(false); }}
            >
              取消
            </button>
            <button
              type="button"
              className="wx-me-modal-save"
              disabled={saving || !hasPasswordInput || newPassword.length < 8 || newPassword !== confirmPassword}
              onClick={handleSavePassword}
            >
              {saving ? "保存中..." : "确认修改"}
            </button>
          </div>
        </div>
      </Modal>
    </Im4Shell>
  );
}
