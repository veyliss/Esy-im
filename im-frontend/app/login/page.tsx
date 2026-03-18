"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { AuthAPI } from "@/lib/api/auth";
import { handleApiError } from "@/lib/utils/errors";

type MainTabKey = "login" | "register";
type LoginTabKey = "email" | "account";

type TabButtonProps = {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
};

type FieldProps = {
  label: string;
  children: React.ReactNode;
};

type PrimaryButtonProps = {
  loading?: boolean;
  loadingText: string;
  text: string;
  disabled?: boolean;
  onClick: () => void;
};

type CodeButtonProps = {
  disabled: boolean;
  countdown: number;
  onClick: () => void;
};

type AuthInputProps = {
  placeholder: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  onEnter?: () => void;
  withCodeButton?: boolean;
  codeButtonProps?: CodeButtonProps;
};

const cardClassName =
  "w-full max-w-md mx-4 sm:mx-0 rounded-xl bg-white p-4 shadow-lg dark:bg-slate-900 sm:p-8";

const inputClassName =
  "form-input flex h-14 w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg border border-[#cfdbe7] bg-background-light p-[15px] text-base font-normal leading-normal text-gray-800 placeholder:text-gray-400 focus:border-primary focus:outline-0 focus:ring-2 focus:ring-primary/50 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-200 dark:placeholder-gray-500";

const primaryButtonClassName =
  "mt-4 flex h-14 w-full items-center justify-center rounded-lg bg-primary px-4 text-base font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50";

function MainTabButton({ active, children, onClick }: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 cursor-pointer flex-col items-center justify-center border-b-[3px] pb-[13px] pt-4 transition-colors ${
        active
          ? "border-b-primary text-primary"
          : "border-b-transparent text-gray-500 dark:text-gray-400"
      }`}
    >
      <p className="text-sm font-bold leading-normal tracking-[0.015em]">{children}</p>
    </button>
  );
}

function ToggleTabButton({ active, children, onClick }: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-full grow items-center justify-center overflow-hidden rounded-lg px-2 text-sm font-medium leading-normal transition-colors ${
        active
          ? "bg-white text-primary shadow-[0_0_4px_rgba(0,0,0,0.1)] dark:bg-slate-950"
          : "text-gray-500 dark:text-gray-400"
      }`}
    >
      <span className="truncate">{children}</span>
    </button>
  );
}

function UnderlineTabButton({ active, children, onClick }: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
        active
          ? "border-primary text-primary"
          : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300"
      }`}
    >
      {children}
    </button>
  );
}

function FormField({ label, children }: FieldProps) {
  return (
    <label className="flex flex-col">
      <p className="pb-2 text-base font-medium leading-normal text-gray-800 dark:text-slate-200">
        {label}
      </p>
      {children}
    </label>
  );
}

function CodeButton({ disabled, countdown, onClick }: CodeButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 text-sm font-medium text-primary hover:text-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {countdown > 0 ? `${countdown}秒` : "发送验证码"}
    </button>
  );
}

function AuthInput({
  placeholder,
  type = "text",
  value,
  onChange,
  onEnter,
  withCodeButton = false,
  codeButtonProps,
}: AuthInputProps) {
  return (
    <div className="relative">
      <input
        className={`${inputClassName} ${withCodeButton ? "pr-32" : ""}`.trim()}
        placeholder={placeholder}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            onEnter?.();
          }
        }}
      />
      {withCodeButton && codeButtonProps ? <CodeButton {...codeButtonProps} /> : null}
    </div>
  );
}

function PrimaryButton({
  loading,
  loadingText,
  text,
  disabled,
  onClick,
}: PrimaryButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={primaryButtonClassName}
    >
      {loading ? loadingText : text}
    </button>
  );
}

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

  useEffect(() => {
    const verifyCurrentToken = async () => {
      if (!token) return;

      try {
        await AuthAPI.getCurrentUser();
        router.replace("/chat");
      } catch {
        console.log("Token 已过期或无效，已清除");
        clearToken();
      }
    };

    verifyCurrentToken();
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
    if (loginTab === "account") {
      return (
        <div className="mt-5 px-4 py-3">
          <div className="flex h-10 flex-1 items-center justify-center rounded-lg bg-[#e7edf3] p-1 dark:bg-slate-800">
            <ToggleTabButton active={true} onClick={() => switchLoginTab("account")}>
              账号密码登录
            </ToggleTabButton>
            <ToggleTabButton active={false} onClick={() => switchLoginTab("email")}>
              邮箱登录
            </ToggleTabButton>
          </div>
        </div>
      );
    }

    return (
      <div className="px-4 pt-3">
        <div className="flex justify-center border-b border-gray-200 dark:border-slate-700">
          <UnderlineTabButton active={true} onClick={() => switchLoginTab("email")}>
            邮箱登录
          </UnderlineTabButton>
          <UnderlineTabButton active={false} onClick={() => switchLoginTab("account")}>
            账号密码登录
          </UnderlineTabButton>
        </div>
      </div>
    );
  };

  const renderAccountLoginForm = () => (
    <div className="mt-5 space-y-4 px-4 py-3">
      <FormField label="账号">
        <AuthInput
          placeholder="请输入您的账号"
          value={account}
          onChange={setAccount}
        />
      </FormField>

      <FormField label="密码">
        <AuthInput
          placeholder="请输入您的密码"
          type="password"
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
            className="form-checkbox rounded border-gray-300 bg-background-light text-primary focus:ring-primary/50 dark:border-slate-600 dark:bg-slate-800 dark:checked:bg-primary"
          />
          <label htmlFor="remember-me" className="ml-2 text-sm text-gray-600 dark:text-gray-400">
            记住密码
          </label>
        </div>
        <a className="text-sm text-primary hover:text-primary/90" href="#">
          忘记密码？
        </a>
      </div>

      <PrimaryButton
        loading={loading}
        loadingText="登录中..."
        text="登录"
        disabled={loading}
        onClick={onLogin}
      />
    </div>
  );

  const renderEmailLoginForm = () => (
    <div className="mt-5 space-y-4 px-4 py-3">
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
        <AuthInput
          placeholder="请输入验证码"
          value={code}
          onChange={setCode}
          onEnter={onLogin}
        />
      </FormField>

      <div className="mt-2 flex justify-end">
        <a className="text-sm text-primary hover:text-primary/90" href="#">
          忘记密码？
        </a>
      </div>

      <PrimaryButton
        loading={loading}
        loadingText="登录中..."
        text="登录"
        disabled={loading}
        onClick={onLogin}
      />
    </div>
  );

  const renderRegisterForm = () => (
    <div className="mt-5 space-y-4 px-4 py-3">
      <FormField label="账号/手机号">
        <AuthInput
          placeholder="请输入您的账号或手机号"
          value={regUserId}
          onChange={setRegUserId}
        />
      </FormField>

      <FormField label="邮箱">
        <AuthInput
          placeholder="请输入您的邮箱地址"
          type="email"
          value={regEmail}
          onChange={setRegEmail}
        />
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

      <PrimaryButton
        loading={loading}
        loadingText="注册中..."
        text="注册"
        disabled={loading}
        onClick={onRegister}
      />
    </div>
  );

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-x-hidden bg-background-light font-display dark:bg-background-dark">
      <div className={cardClassName}>
        <div className="flex flex-col flex-1">
          <div className="pb-3">
            <div className="flex gap-8 border-b border-[#cfdbe7] px-4 dark:border-slate-700">
              <MainTabButton active={mainTab === "login"} onClick={() => switchMainTab("login")}>
                登录
              </MainTabButton>
              <MainTabButton active={mainTab === "register"} onClick={() => switchMainTab("register")}>
                注册
              </MainTabButton>
            </div>
          </div>

          {errorMsg && (
            <div className="mx-8 mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="mx-8 mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
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
    </div>
  );
}
