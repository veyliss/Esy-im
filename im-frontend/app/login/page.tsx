"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { AuthAPI } from "@/lib/api/auth";
import { handleApiError } from "@/lib/utils/errors";
import {
  MainTabButton,
  UnderlineTabButton,
  FormField,
  AuthInput,
  PrimaryButton,
} from "@/components/login/LoginFormComponents";

type MainTabKey = "login" | "register";
type LoginTabKey = "email" | "account";

const cardClassName =
  "auth-card";

export default function LoginPage() {
  const router = useRouter();
  const { setToken, token, clearToken } = useAuthStore();

  const [mainTab, setMainTab] = useState<MainTabKey>("login");
  const [loginTab, setLoginTab] = useState<LoginTabKey>("email");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sendLoading, setSendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const [regUserId, setRegUserId] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regCode, setRegCode] = useState("");

  const hasCheckedStoredTokenRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    if (params.get("tab") === "register" || params.get("mode") === "register") {
      setMainTab("register");
    }
  }, []);

  useEffect(() => {
    if (!token) return;

    if (!hasCheckedStoredTokenRef.current) {
      hasCheckedStoredTokenRef.current = true;

      const verifyStoredToken = async () => {
        try {
          await AuthAPI.getCurrentUser();
          router.replace("/chat");
        } catch {
          console.log("Token 已过期或无效，已清除");
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

  const switchMainTab = (tab: MainTabKey) => {
    clearMessages();
    setMainTab(tab);
  };

  const switchLoginTab = (tab: LoginTabKey) => {
    clearMessages();
    setLoginTab(tab);
  };

  const onSendEmailCode = async (targetEmail: string) => {
    if (!targetEmail) {
      setErrorMsg("请输入邮箱地址");
      return;
    }

    try {
      setSendLoading(true);
      setErrorMsg(null);
      await AuthAPI.sendEmailCode(targetEmail);
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

  const onLogin = async () => {
    setErrorMsg(null);
    setLoading(true);

    try {
      let response;

      if (loginTab === "account") {
        if (!account || !password) {
          setErrorMsg("请输入账号与密码");
          return;
        }
        response = await AuthAPI.loginByPassword({ email: account, password });
      } else {
        if (!email || !code) {
          setErrorMsg("请输入邮箱与验证码");
          return;
        }
        response = await AuthAPI.loginByCode({ email, code });
      }

      const accessToken = response?.data?.data?.token || "";
      if (!accessToken) {
        setErrorMsg("登录失败：未获取到访问令牌");
        return;
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

  const onRegister = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (!regUserId || !regEmail || !regCode) {
        setErrorMsg("请输入账号/手机号、邮箱与验证码");
        return;
      }

      await AuthAPI.registerByCode({
        user_id: regUserId,
        nickname: regUserId,
        email: regEmail,
        code: regCode,
      });

      setSuccessMsg("注册成功！正在跳转登录...");
      window.setTimeout(() => {
        setMainTab("login");
        setLoginTab("email");
        setEmail(regEmail);
        setSuccessMsg(null);
      }, 2000);
    } catch (err) {
      const apiError = handleApiError(err);
      setErrorMsg(apiError.message);
    } finally {
      setLoading(false);
    }
  };

  const renderLoginSwitcher = () => {
    return (
      <div className="auth-login-switcher compact">
        <div className="auth-underline-group">
          <UnderlineTabButton active={loginTab === "email"} onClick={() => switchLoginTab("email")}>
            邮箱登录
          </UnderlineTabButton>
          <UnderlineTabButton active={loginTab === "account"} onClick={() => switchLoginTab("account")}>
            账号密码登录
          </UnderlineTabButton>
        </div>
      </div>
    );
  };

  const renderAccountLoginForm = () => (
    <div className="auth-form-stack">
      <FormField label="账号">
        <AuthInput
          placeholder="请输入您的账号"
          name="username"
          autoComplete="username"
          value={account}
          onChange={setAccount}
          onEnter={onLogin}
        />
      </FormField>

      <FormField label="密码">
        <AuthInput
          placeholder="请输入您的密码"
          type="password"
          name="current-password"
          autoComplete="current-password"
          value={password}
          onChange={setPassword}
          onEnter={onLogin}
        />
      </FormField>

      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <input
            id="remember-me"
            type="checkbox"
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
            className="auth-checkbox"
          />
          <label htmlFor="remember-me" className="auth-checkbox-label">
            记住密码
          </label>
        </div>
        <a className="auth-link" href="#">
          忘记密码？
        </a>
      </div>

      <PrimaryButton loading={loading} loadingText="登录中..." text="登录" disabled={loading} onClick={onLogin} />
    </div>
  );

  const renderEmailLoginForm = () => (
    <div className="auth-form-stack">
      <FormField label="邮箱">
        <AuthInput
          placeholder="请输入您的邮箱"
          type="email"
          value={email}
          onChange={setEmail}
          withCodeButton
          codeButtonProps={{
            disabled: sendLoading || countdown > 0,
            countdown,
            onClick: () => onSendEmailCode(email),
          }}
        />
      </FormField>

      <FormField label="验证码">
        <AuthInput placeholder="请输入验证码" value={code} onChange={setCode} onEnter={onLogin} />
      </FormField>

      <div className="mt-2 flex justify-end">
        <a className="auth-link" href="#">
          忘记密码？
        </a>
      </div>

      <PrimaryButton loading={loading} loadingText="登录中..." text="登录" disabled={loading} onClick={onLogin} />
    </div>
  );

  const renderRegisterForm = () => (
    <div className="auth-form-stack">
      <FormField label="账号/手机号">
        <AuthInput placeholder="请输入您的账号或手机号" value={regUserId} onChange={setRegUserId} />
      </FormField>

      <FormField label="邮箱">
        <AuthInput placeholder="请输入您的邮箱地址" type="email" value={regEmail} onChange={setRegEmail} />
      </FormField>

      <FormField label="验证码">
        <AuthInput
          placeholder="请输入验证码"
          value={regCode}
          onChange={setRegCode}
          withCodeButton
          codeButtonProps={{
            disabled: sendLoading || countdown > 0,
            countdown,
            onClick: () => onSendEmailCode(regEmail),
          }}
        />
      </FormField>

      <PrimaryButton loading={loading} loadingText="注册中..." text="注册" disabled={loading} onClick={onRegister} />
    </div>
  );

  return (
    <main className="auth-page">
      <div className="auth-brand-block">
        <div className="auth-logo">
          E
        </div>
        <h1>Esy-IM</h1>
        <p>即时通讯系统</p>
      </div>

      <div className={cardClassName}>
            <div className="flex flex-1 flex-col">
              <div className="pb-3">
                <div className="auth-main-tabs">
              <MainTabButton active={mainTab === "login"} onClick={() => switchMainTab("login")}>
                登录
              </MainTabButton>
              <MainTabButton active={mainTab === "register"} onClick={() => switchMainTab("register")}>
                注册
              </MainTabButton>
            </div>
          </div>

          {errorMsg && (
            <div className="auth-alert auth-alert-error">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="auth-alert auth-alert-success">
              {successMsg}
            </div>
          )}

          {mainTab === "login" ? (
            <div>
              {renderLoginSwitcher()}
              {loginTab === "account" ? renderAccountLoginForm() : renderEmailLoginForm()}
            </div>
          ) : (
            renderRegisterForm()
          )}
      </div>
      </div>
    </main>
  );
}
