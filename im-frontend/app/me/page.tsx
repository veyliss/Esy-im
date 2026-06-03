"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Descriptions, Form, Input, Progress, Space, Switch, Typography } from "antd";
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
        <div className="me-page ant-me-page workspace-main-panel">
          <div className="ant-me-page-inner">
            <ErrorAlert error={error} onClose={() => setError(null)} className="mb-4" />

            <Card className="ant-me-profile-card" id="profile-section">
              <div className="ant-me-profile">
                <Button type="text" onClick={handleAvatarClick} className="me-avatar-button ant-me-avatar-button" aria-label="修改头像" title="修改头像">
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

                <div className="ant-me-profile-main">
                  <Typography.Text type="secondary" strong>个人资料</Typography.Text>
                  <Typography.Title level={2}>{nickname || currentUser?.nickname || "未设置昵称"}</Typography.Title>
                  <Typography.Paragraph type="secondary" className="ant-me-profile-description">
                    这里管理你在聊天、通讯录和群聊中展示的资料。
                  </Typography.Paragraph>
                  <Space wrap className="ant-me-meta">
                    <Typography.Text><UserOutlined /> {currentUser?.user_id || "未设置 ID"}</Typography.Text>
                    <Typography.Text><MailOutlined /> {currentUser?.email || "未绑定邮箱"}</Typography.Text>
                  </Space>
                </div>

              </div>
            </Card>

            <div className="ant-me-grid">
              <Card
                className="ant-me-card"
                title={<Space><EditOutlined />编辑资料</Space>}
                extra={<Typography.Text type="secondary">{nickname.length}/30</Typography.Text>}
              >
                <Form layout="vertical" className="ant-me-form">
                  <Form.Item label="昵称" required>
                    <Input
                      value={nickname}
                      onChange={(event) => setNickname(event.target.value)}
                      placeholder="请输入昵称"
                      maxLength={30}
                      size="large"
                    />
                  </Form.Item>
                  <Form.Item label="头像" extra="支持常见图片格式，建议小于 2MB">
                    <Button size="large" icon={<UploadOutlined />} onClick={handleAvatarClick}>
                      选择本地图片
                    </Button>
                  </Form.Item>
                </Form>
              </Card>

              <Card
                className="ant-me-card"
                id="account-section"
                title={<Space><IdcardOutlined />账号信息</Space>}
              >
                <Descriptions column={1} size="small" className="ant-me-descriptions">
                  <Descriptions.Item label="用户 ID">{currentUser?.user_id || "未设置"}</Descriptions.Item>
                  <Descriptions.Item label="邮箱">{currentUser?.email || "未绑定"}</Descriptions.Item>
                  <Descriptions.Item label="创建时间">{formatDate(currentUser?.created_at)}</Descriptions.Item>
                  <Descriptions.Item label="最近更新">{formatDate(currentUser?.updated_at)}</Descriptions.Item>
                </Descriptions>
              </Card>

              <Card
                className="ant-me-card ant-me-card-wide"
                id="security-section"
                title={<Space><SafetyCertificateOutlined />账号与安全</Space>}
              >
                <Typography.Paragraph type="secondary">
                  修改密码后会自动退出当前登录，需要重新登录。
                </Typography.Paragraph>
                <Form layout="vertical" className="ant-me-form">
                  <div className="ant-me-form-grid">
                    <Form.Item label="新密码">
                      <Input.Password
                        placeholder="请输入新密码（最少8位）"
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                        size="large"
                      />
                    </Form.Item>
                    <Form.Item label="确认密码">
                      <Input.Password
                        placeholder="请再次输入密码"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        size="large"
                      />
                    </Form.Item>
                  </div>
                </Form>
                <div className="ant-me-password-strength">
                  <Typography.Text type="secondary">密码强度</Typography.Text>
                  <Typography.Text strong className={`is-${strength.tone}`}>{strength.label}</Typography.Text>
                  <Progress
                    percent={strength.score * 25}
                    showInfo={false}
                    strokeColor={strength.tone === "danger" ? "#ef4444" : strength.tone === "warning" ? "#f59e0b" : "#10b981"}
                  />
                </div>
              </Card>

              <Card
                className="ant-me-card ant-me-card-wide"
                id="preference-section"
                title={<Space><SettingOutlined />偏好设置</Space>}
              >
                <div className="ant-me-settings">
                  <div className="ant-me-setting-row">
                    <div>
                      <Typography.Text strong>桌面通知</Typography.Text>
                      <Typography.Text type="secondary">收到新消息时显示浏览器通知提醒。</Typography.Text>
                    </div>
                    <Switch
                      checked={desktopNotifications}
                      onChange={(checked) => {
                        void handleDesktopNotificationsChange(checked);
                      }}
                    />
                  </div>
                  <div className="ant-me-setting-row">
                    <div>
                      <Typography.Text strong>紧凑消息列表</Typography.Text>
                      <Typography.Text type="secondary">提高会话列表密度，适合小屏或高频切换。</Typography.Text>
                    </div>
                    <Switch
                      checked={compactMessages}
                      onChange={(checked) => setCompactMessages(checked)}
                    />
                  </div>
                </div>
              </Card>
            </div>

            <Card className="ant-me-save-bar">
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
            </Card>
          </div>
        </div>
    </Im4Shell>
  );
}
