"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Checkbox, Form, Input, Segmented, Space } from "antd";
import { useAuthStore } from "@/lib/store";
import { AuthAPI } from "@/lib/api/auth";
import { handleApiError } from "@/lib/utils/errors";

type MainTabKey = "login" | "register";
type LoginTabKey = "email" | "account";

type PasswordLoginValues = {
  account: string;
  password: string;
  remember?: boolean;
};

type EmailLoginValues = {
  email: string;
  code: string;
};

type RegisterValues = {
  userId: string;
  nickname?: string;
  email: string;
  code: string;
};

const mainTabOptions = [
  { label: "登录", value: "login" },
  { label: "注册", value: "register" },
];

const loginTabOptions = [
  { label: "邮箱验证码", value: "email" },
  { label: "账号密码", value: "account" },
];

export default function LoginPage() {
  const router = useRouter();
  const { setToken, token, clearToken } = useAuthStore();
  const [passwordForm] = Form.useForm<PasswordLoginValues>();
  const [emailLoginForm] = Form.useForm<EmailLoginValues>();
  const [registerForm] = Form.useForm<RegisterValues>();

  const [mainTab, setMainTab] = useState<MainTabKey>("login");
  const [loginTab, setLoginTab] = useState<LoginTabKey>("email");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [sendLoading, setSendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const hasCheckedStoredTokenRef = useRef(false);
  const emailLoginAddress = Form.useWatch("email", emailLoginForm);
  const registerAddress = Form.useWatch("email", registerForm);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    if (params.get("tab") === "register" || params.get("mode") === "register") {
      setMainTab("register");
    }

    const rememberedAccount = localStorage.getItem("remember_account");
    const rememberedEmail = localStorage.getItem("remember_email");
    if (rememberedAccount) {
      passwordForm.setFieldsValue({ account: rememberedAccount, remember: true });
    }
    if (rememberedEmail) {
      emailLoginForm.setFieldsValue({ email: rememberedEmail });
    }
  }, [emailLoginForm, passwordForm]);

  useEffect(() => {
    if (!token) return;

    if (!hasCheckedStoredTokenRef.current) {
      hasCheckedStoredTokenRef.current = true;

      const verifyStoredToken = async () => {
        try {
          await AuthAPI.getCurrentUser();
          router.replace("/chat");
        } catch {
          clearToken();
        }
      };

      verifyStoredToken();
      return;
    }

    router.replace("/chat");
  }, [token, router, clearToken]);

  useEffect(() => {
    if (countdown <= 0) return;

    const timer = window.setTimeout(() => setCountdown((current) => current - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [countdown]);

  const clearMessages = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const switchMainTab = (value: MainTabKey) => {
    clearMessages();
    setMainTab(value);
  };

  const switchLoginTab = (value: LoginTabKey) => {
    clearMessages();
    setLoginTab(value);
  };

  const onSendEmailCode = async (targetEmail?: string) => {
    const email = targetEmail?.trim();
    if (!email) {
      setErrorMsg("请输入邮箱地址");
      return;
    }

    try {
      setSendLoading(true);
      setErrorMsg(null);
      await AuthAPI.sendEmailCode(email);
      setCountdown(60);
      setSuccessMsg("验证码已发送，请查收邮箱");
      window.setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      const apiError = handleApiError(err);
      setErrorMsg(apiError.message);
    } finally {
      setSendLoading(false);
    }
  };

  const onPasswordLogin = async (values: PasswordLoginValues) => {
    setErrorMsg(null);
    setLoading(true);

    try {
      const response = await AuthAPI.loginByPassword({
        email: values.account.trim(),
        password: values.password,
      });
      const accessToken = response?.data?.data?.token || "";
      if (!accessToken) {
        setErrorMsg("登录失败：未获取到访问令牌");
        return;
      }

      if (values.remember) {
        localStorage.setItem("remember_account", values.account.trim());
      } else {
        localStorage.removeItem("remember_account");
      }

      setToken(accessToken);
      router.replace("/chat");
    } catch (err) {
      const apiError = handleApiError(err);
      setErrorMsg(apiError.message);
    } finally {
      setLoading(false);
    }
  };

  const onEmailLogin = async (values: EmailLoginValues) => {
    setErrorMsg(null);
    setLoading(true);

    try {
      const response = await AuthAPI.loginByCode({
        email: values.email.trim(),
        code: values.code.trim(),
      });
      const accessToken = response?.data?.data?.token || "";
      if (!accessToken) {
        setErrorMsg("登录失败：未获取到访问令牌");
        return;
      }

      localStorage.setItem("remember_email", values.email.trim());
      setToken(accessToken);
      router.replace("/chat");
    } catch (err) {
      const apiError = handleApiError(err);
      setErrorMsg(apiError.message);
    } finally {
      setLoading(false);
    }
  };

  const onRegister = async (values: RegisterValues) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const userId = values.userId.trim();
      const email = values.email.trim();

      await AuthAPI.registerByCode({
        user_id: userId,
        nickname: values.nickname?.trim() || userId,
        email,
        code: values.code.trim(),
      });

      setSuccessMsg("注册成功，已为你切回登录");
      setMainTab("login");
      setLoginTab("email");
      emailLoginForm.setFieldsValue({ email, code: "" });
      registerForm.resetFields(["code"]);
    } catch (err) {
      const apiError = handleApiError(err);
      setErrorMsg(apiError.message);
    } finally {
      setLoading(false);
    }
  };

  const codeButtonLabel = countdown > 0 ? `${countdown} 秒` : "发送验证码";

  const renderCodeAddon = (email?: string) => (
    <Button
      className="ant-auth-code-button"
      disabled={sendLoading || countdown > 0}
      loading={sendLoading}
      onClick={() => onSendEmailCode(email)}
    >
      {codeButtonLabel}
    </Button>
  );

  return (
    <main className="ant-auth-page">
      <section className="ant-auth-product" aria-label="Esy-IM 入口">
        <div className="ant-auth-brand">
          <span className="ant-auth-logo">E</span>
          <span>Esy-IM</span>
        </div>

        <div className="ant-auth-product-copy">
          <p>CHAT · CONTACTS · MOMENTS</p>
          <h1>进入你的即时通讯工作台</h1>
          <span>会话、好友、群组和动态统一收纳，登录后直接进入最近消息。</span>
        </div>

        <div className="ant-auth-preview" aria-hidden="true">
          <div className="ant-auth-preview-sidebar">
            <div className="ant-auth-preview-title">
              <span>消息</span>
              <em>在线</em>
            </div>
            <div className="ant-auth-preview-item is-active">
              <i>产</i>
              <span>
                <strong>产品讨论组</strong>
                <small>新版界面已经准备好了</small>
              </span>
              <b>2</b>
            </div>
            <div className="ant-auth-preview-item">
              <i>S</i>
              <span>
                <strong>Sophia</strong>
                <small>会议纪要发你了</small>
              </span>
            </div>
            <div className="ant-auth-preview-item">
              <i>友</i>
              <span>
                <strong>好友请求</strong>
                <small>有新的联系人申请</small>
              </span>
              <b>1</b>
            </div>
          </div>

          <div className="ant-auth-preview-chat">
            <div className="ant-auth-preview-head">
              <span>
                <strong>产品讨论组</strong>
                <small>8 位成员在线</small>
              </span>
              <i />
            </div>
            <div className="ant-auth-bubble is-in">新的 IM 首页保留欢迎入口就好。</div>
            <div className="ant-auth-bubble is-out">收到，登录和注册会直接进入对应流程。</div>
            <div className="ant-auth-bubble is-in is-short">样式按应用界面来。</div>
            <div className="ant-auth-composer">
              <span>输入消息</span>
              <strong>send</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="ant-auth-panel" aria-label="账号入口">
        <div className="ant-auth-panel-head">
          <span>欢迎回来</span>
          <h2>{mainTab === "login" ? "登录账号" : "创建账号"}</h2>
        </div>

        <Segmented
          block
          className="ant-auth-main-tabs"
          options={mainTabOptions}
          value={mainTab}
          onChange={(value) => switchMainTab(value as MainTabKey)}
        />

        {mainTab === "login" ? (
          <Segmented
            block
            className="ant-auth-login-tabs"
            options={loginTabOptions}
            value={loginTab}
            onChange={(value) => switchLoginTab(value as LoginTabKey)}
          />
        ) : null}

        <div className="ant-auth-alerts">
          {errorMsg ? <Alert showIcon message={errorMsg} type="error" /> : null}
          {successMsg ? <Alert showIcon message={successMsg} type="success" /> : null}
        </div>

        {mainTab === "login" && loginTab === "account" ? (
          <Form
            className="ant-auth-form"
            form={passwordForm}
            layout="vertical"
            requiredMark={false}
            onFinish={onPasswordLogin}
          >
            <Form.Item name="account" label="账号或邮箱" rules={[{ required: true, message: "请输入账号或邮箱" }]}>
              <Input autoComplete="username" placeholder="请输入账号 ID 或邮箱" size="large" />
            </Form.Item>

            <Form.Item name="password" label="密码" rules={[{ required: true, message: "请输入密码" }]}>
              <Input.Password autoComplete="current-password" placeholder="请输入密码" size="large" />
            </Form.Item>

            <div className="ant-auth-form-row">
              <Form.Item name="remember" valuePropName="checked">
                <Checkbox>记住账号</Checkbox>
              </Form.Item>
              <Button type="link" onClick={() => switchLoginTab("email")}>
                用验证码登录
              </Button>
            </div>

            <Button block htmlType="submit" loading={loading} size="large" type="primary">
              登录
            </Button>
          </Form>
        ) : null}

        {mainTab === "login" && loginTab === "email" ? (
          <Form
            className="ant-auth-form"
            form={emailLoginForm}
            layout="vertical"
            requiredMark={false}
            onFinish={onEmailLogin}
          >
            <Form.Item
              name="email"
              label="邮箱"
              rules={[
                { required: true, message: "请输入邮箱地址" },
                { type: "email", message: "邮箱格式不正确" },
              ]}
            >
              <Input autoComplete="email" placeholder="请输入邮箱地址" size="large" type="email" />
            </Form.Item>

            <Form.Item label="验证码">
              <Space.Compact className="w-full">
                <Form.Item name="code" noStyle rules={[{ required: true, message: "请输入验证码" }]}>
                  <Input placeholder="请输入邮箱验证码" size="large" />
                </Form.Item>
                {renderCodeAddon(emailLoginAddress)}
              </Space.Compact>
            </Form.Item>

            <Button block htmlType="submit" loading={loading} size="large" type="primary">
              登录
            </Button>
          </Form>
        ) : null}

        {mainTab === "register" ? (
          <Form
            className="ant-auth-form"
            form={registerForm}
            layout="vertical"
            requiredMark={false}
            onFinish={onRegister}
          >
            <Form.Item
              name="userId"
              label="账号 ID"
              rules={[
                { required: true, message: "请输入账号 ID" },
                { min: 3, message: "账号 ID 至少 3 位" },
              ]}
            >
              <Input autoComplete="username" placeholder="用于登录和好友搜索" size="large" />
            </Form.Item>

            <Form.Item name="nickname" label="昵称">
              <Input autoComplete="nickname" placeholder="不填则默认使用账号 ID" size="large" />
            </Form.Item>

            <Form.Item
              name="email"
              label="邮箱"
              rules={[
                { required: true, message: "请输入邮箱地址" },
                { type: "email", message: "邮箱格式不正确" },
              ]}
            >
              <Input autoComplete="email" placeholder="请输入邮箱地址" size="large" type="email" />
            </Form.Item>

            <Form.Item label="验证码">
              <Space.Compact className="w-full">
                <Form.Item name="code" noStyle rules={[{ required: true, message: "请输入验证码" }]}>
                  <Input placeholder="请输入邮箱验证码" size="large" />
                </Form.Item>
                {renderCodeAddon(registerAddress)}
              </Space.Compact>
            </Form.Item>

            <Button block htmlType="submit" loading={loading} size="large" type="primary">
              创建账号
            </Button>
          </Form>
        ) : null}
      </section>
    </main>
  );
}
