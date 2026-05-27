"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { AuthAPI } from "@/lib/api/auth";
import { handleApiError } from "@/lib/utils/errors";
import {
  MainTabButton,
  SegmentedTab,
  FormField,
  AuthInput,
  PrimaryButton,
} from "@/components/login/LoginFormComponents";

type MainTabKey = "login" | "register";
type LoginTabKey = "email" | "account";

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
      <div className="px-4 py-3 mt-5">
        <SegmentedTab
          options={[
            { key: "email", label: "邮箱登录" },
            { key: "account", label: "账号密码登录" },
          ]}
          active={loginTab}
          onChange={(key) => switchLoginTab(key as LoginTabKey)}
        />
      </div>
    );
  };

  const renderAccountLoginForm = () => (
    <div className="flex flex-col gap-5 px-4 pb-5">
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
        <div className="flex items-center gap-2">
          <input
            id="remember-me"
            type="checkbox"
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/50"
          />
          <label htmlFor="remember-me" className="text-sm text-gray-600 dark:text-gray-400">
            记住密码
          </label>
        </div>
        <a className="text-sm text-primary hover:text-primary/90" href="#">
          忘记密码？
        </a>
      </div>

      <PrimaryButton loading={loading} loadingText="登录中..." text="登录" disabled={loading} onClick={onLogin} />
    </div>
  );

  const renderEmailLoginForm = () => (
    <div className="flex flex-col gap-5 px-4 pb-5">
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
        <a className="text-sm text-primary hover:text-primary/90" href="#">
          忘记密码？
        </a>
      </div>

      <PrimaryButton loading={loading} loadingText="登录中..." text="登录" disabled={loading} onClick={onLogin} />
    </div>
  );

  const renderRegisterForm = () => (
    <div className="flex flex-col gap-5 px-4 pb-5">
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
    <main
      className="min-h-screen w-full flex flex-col items-center justify-center overflow-x-hidden px-4 py-8 bg-background-light dark:bg-background-dark"
      style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}
    >
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-extrabold text-primary">Esy-IM</h1>
        <p className="text-sm text-slate-500 mt-1">即时通讯系统</p>
      </div>

      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-lg p-4 sm:p-8">
        <div className="flex flex-1 flex-col">
          <div className="pb-3">
            <div className="flex border-b border-[#cfdbe7] dark:border-slate-700 px-4 gap-8">
              <MainTabButton active={mainTab === "login"} onClick={() => switchMainTab("login")}>
                登录
              </MainTabButton>
              <MainTabButton active={mainTab === "register"} onClick={() => switchMainTab("register")}>
                注册
              </MainTabButton>
            </div>
          </div>

          {errorMsg && (
            <div className="mx-4 mb-4 rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30 px-4 py-3 text-sm text-red-600 dark:text-red-400">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="mx-4 mb-4 rounded-lg border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30 px-4 py-3 text-sm text-green-600 dark:text-green-400">
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
