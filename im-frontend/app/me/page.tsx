"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Avatar, Badge, Button, Card, Descriptions, Input, List, Modal, Progress, Skeleton, Space, Switch, Typography } from "antd";
import {
  BellOutlined,
  BgColorsOutlined,
  CameraOutlined,
  ClockCircleOutlined,
  IdcardOutlined,
  KeyOutlined,
  MailOutlined,
  RightOutlined,
  SafetyCertificateOutlined,
  UploadOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Im4Button, Im4Shell, Im4Status } from "@/components/im4";
import { useThemeMode } from "@/components/ui/antd-provider";
import { ErrorAlert } from "@/components/ui/error-alert";
import { useAppInteractions } from "@/components/ui/app-interactions";
import { useAuthStore } from "@/lib/store";
import { AuthAPI } from "@/lib/api/auth";
import { UserAPI } from "@/lib/api/user";
import { UploadAPI } from "@/lib/api/upload";
import { handleApiError, createUserFriendlyErrorMessage } from "@/lib/utils/errors";
import type { User } from "@/lib/types/api";

const { Text, Title } = Typography;

function formatDate(value?: string) {
  if (!value) return "未记录";
  return new Date(value).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function passwordStrength(password: string) {
  if (!password) return { score: 0, label: "未设置", color: "#d9d9d9", percent: 0 };
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  if (score <= 1) return { score, label: "偏弱", color: "#ef4444", percent: 33 };
  if (score <= 3) return { score, label: "可用", color: "#f59e0b", percent: 66 };
  return { score, label: "较强", color: "#10b981", percent: 100 };
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
  const { isDark, toggle: toggleTheme } = useThemeMode();
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
    } catch {
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

  const avatarSrc = avatar || currentUser?.avatar || "/default-avatar.png";

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
        <div style={{ padding: 24 }}>
          <Skeleton active avatar={{ size: 64 }} paragraph={{ rows: 4 }} />
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
        <Button type="link" onClick={() => setEditProfileOpen(true)}>
          编辑资料
        </Button>
      }
    >
      <div style={{ padding: "24px 28px", maxWidth: 720, display: "flex", flexDirection: "column", gap: 20 }}>
        <ErrorAlert error={error} onClose={() => setError(null)} />

        {/* Profile header card */}
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Badge count={<span style={{ cursor: "pointer" }} onClick={handleAvatarClick}><CameraOutlined style={{ fontSize: 12, color: "#fff", background: "#2563eb", borderRadius: "50%", padding: 4 }} /></span>}>
              <Avatar
                size={72}
                src={avatarSrc}
                style={{ cursor: "pointer" }}
                onClick={handleAvatarClick}
              />
            </Badge>
            <div style={{ flex: 1 }}>
              <Title level={4} style={{ margin: 0 }}>{currentUser?.nickname || "未设置昵称"}</Title>
              <Text type="secondary">微信号：{currentUser?.user_id || "未设置"}</Text>
            </div>
          </div>
          <Space style={{ marginTop: 12 }} wrap>
            <Text type="secondary"><MailOutlined /> {currentUser?.email || "未绑定邮箱"}</Text>
            <Text type="secondary"><ClockCircleOutlined /> {formatDate(currentUser?.created_at)}</Text>
          </Space>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
        </Card>

        {/* Section: Account info */}
        <Card title={<><IdcardOutlined /> 账号信息</>} size="small">
          <Descriptions column={1} size="small">
            <Descriptions.Item label="用户 ID">{currentUser?.user_id || "未设置"}</Descriptions.Item>
            <Descriptions.Item label="邮箱">{currentUser?.email || "未绑定"}</Descriptions.Item>
            <Descriptions.Item label="创建时间">{formatDate(currentUser?.created_at)}</Descriptions.Item>
            <Descriptions.Item label="最近更新">{formatDate(currentUser?.updated_at)}</Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Section: Security */}
        <Card title={<><SafetyCertificateOutlined /> 账号与安全</>} size="small">
          <List split={false} size="small">
            <List.Item
              style={{ padding: "8px 0", cursor: "pointer" }}
              onClick={() => setEditPasswordOpen(true)}
              extra={<RightOutlined style={{ color: "#94a3b8" }} />}
            >
              <span>修改密码</span>
            </List.Item>
            <List.Item style={{ padding: "8px 0" }}>
              <span>登录状态</span>
              <span style={{ color: "#10b981", fontWeight: 500, marginLeft: "auto" }}>在线</span>
            </List.Item>
          </List>
        </Card>

        {/* Section: Preferences */}
        <Card title={<><BellOutlined /> 偏好设置</>} size="small">
          <List split={false} size="small">
            <List.Item
              style={{ padding: "10px 0" }}
              extra={<Switch checked={isDark} onChange={toggleTheme} size="small" />}
            >
              <List.Item.Meta
                title={<span><BgColorsOutlined /> 深色模式</span>}
                description="切换暗色主题，减少眼睛疲劳"
              />
            </List.Item>
            <List.Item
              style={{ padding: "10px 0" }}
              extra={<Switch checked={desktopNotifications} onChange={(checked) => { void handleDesktopNotificationsChange(checked); }} size="small" />}
            >
              <List.Item.Meta
                title="桌面通知"
                description="收到新消息时显示浏览器通知提醒"
              />
            </List.Item>
            <List.Item
              style={{ padding: "10px 0" }}
              extra={<Switch checked={compactMessages} onChange={setCompactMessages} size="small" />}
            >
              <List.Item.Meta
                title="紧凑消息列表"
                description="提高会话列表密度，适合小屏或高频切换"
              />
            </List.Item>
          </List>
          {hasPreferenceChanges ? (
            <Button type="primary" block style={{ marginTop: 8 }} onClick={handleSavePreferences}>
              保存偏好设置
            </Button>
          ) : null}
        </Card>

        {/* Logout button */}
        <Button danger block size="large" onClick={handleLogout} loading={logoutLoading}>
          {logoutLoading ? "退出中..." : "退出登录"}
        </Button>
      </div>

      {/* Edit Profile Modal */}
      <Modal
        open={editProfileOpen}
        onCancel={() => {
          setNickname(currentUser?.nickname || "");
          setAvatar(currentUser?.avatar || "");
          setEditProfileOpen(false);
        }}
        title="编辑资料"
        footer={
          <Space>
            <Button onClick={() => {
              setNickname(currentUser?.nickname || "");
              setAvatar(currentUser?.avatar || "");
              setEditProfileOpen(false);
            }}>
              取消
            </Button>
            <Button type="primary" disabled={saving || !hasProfileChanges} loading={saving} onClick={handleSaveProfile}>
              保存
            </Button>
          </Space>
        }
        centered
        width="min(460px, calc(100vw - 24px))"
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "16px 0" }}>
          <Badge count={<span style={{ cursor: "pointer" }} onClick={handleAvatarClick}><CameraOutlined style={{ fontSize: 14, color: "#fff", background: "#2563eb", borderRadius: "50%", padding: 5 }} /></span>}>
            <Avatar
              size={80}
              src={avatarSrc}
              style={{ cursor: "pointer" }}
              onClick={handleAvatarClick}
            />
          </Badge>
          <Text type="secondary">点击更换头像</Text>
          <div style={{ width: "100%" }}>
            <Text strong style={{ display: "block", marginBottom: 6 }}>昵称</Text>
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
      </Modal>

      {/* Edit Password Modal */}
      <Modal
        open={editPasswordOpen}
        onCancel={() => { setNewPassword(""); setConfirmPassword(""); setEditPasswordOpen(false); }}
        title="修改密码"
        footer={
          <Space>
            <Button onClick={() => { setNewPassword(""); setConfirmPassword(""); setEditPasswordOpen(false); }}>
              取消
            </Button>
            <Button
              type="primary"
              disabled={saving || !hasPasswordInput || newPassword.length < 8 || newPassword !== confirmPassword}
              loading={saving}
              onClick={handleSavePassword}
            >
              确认修改
            </Button>
          </Space>
        }
        centered
        width="min(460px, calc(100vw - 24px))"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "16px 0" }}>
          <Text type="secondary">修改密码后会自动退出当前登录，需要重新登录。</Text>
          <div>
            <Text strong style={{ display: "block", marginBottom: 6 }}>新密码</Text>
            <Input.Password
              placeholder="请输入新密码（最少8位）"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              size="large"
            />
          </div>
          <div>
            <Text strong style={{ display: "block", marginBottom: 6 }}>确认密码</Text>
            <Input.Password
              placeholder="请再次输入密码"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              size="large"
            />
          </div>
          {newPassword ? (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <Text type="secondary">密码强度</Text>
                <Text strong style={{ color: strength.color }}>{strength.label}</Text>
              </div>
              <Progress
                percent={strength.percent}
                strokeColor={strength.color}
                showInfo={false}
                size="small"
              />
            </div>
          ) : null}
        </div>
      </Modal>
    </Im4Shell>
  );
}

