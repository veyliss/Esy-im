"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { AuthAPI } from "@/lib/api/auth";
import { handleApiError } from "@/lib/utils/errors";

type MainTabKey = "login" | "register";
type LoginTabKey = "email" | "account";

export default function LoginPage() {
  const router = useRouter();
  const { setToken, token, clearToken } = useAuthStore();

  // 验证 token 是否有效
  useEffect(() => {
    const verifyCurrentToken = async () => {
      if (token) {
        try {
          await AuthAPI.getCurrentUser();
          router.replace("/chat");
        } catch {
          console.log("Token 已过期或无效，已清除");
          clearToken();
        }
      }
    };
    verifyCurrentToken();
  }, [token, router, clearToken]);

  const [mainTab, setMainTab] = useState<MainTabKey>("login");
  const [loginTab, setLoginTab] = useState<LoginTabKey>("email");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // 账号密码登录
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);

  // 邮箱验证码登录
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sendLoading, setSendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // 注册
  const [regUserId, setRegUserId] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regCode, setRegCode] = useState("");

  useEffect(() => {
    let timer: number | undefined;
    if (countdown > 0) {
      timer = window.setTimeout(() => setCountdown((c) => c - 1), 1000);
    }
    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [countdown]);

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
      setTimeout(() => setSuccessMsg(null), 3000);
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
      let res;
      if (loginTab === "account") {
        if (!account || !password) {
          setErrorMsg("请输入账号与密码");
          return;
        }
        // 这里改成 email 字段，值仍然是 account（可以是 userid 或邮箱）
        res = await AuthAPI.loginByPassword({ email: account, password });
      } else {
        if (!email || !code) {
          setErrorMsg("请输入邮箱与验证码");
          return;
        }
        res = await AuthAPI.loginByCode({ email, code });
      }
      
      const accessToken = res?.data?.data?.token || "";
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
      setTimeout(() => {
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

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-background-light dark:bg-background-dark font-display overflow-x-hidden">
      <div className="w-full max-w-md mx-4 sm:mx-0 bg-white dark:bg-slate-900 rounded-xl shadow-lg p-4 sm:p-8">
        <div className="flex flex-col flex-1">
          {/* 主Tab - 登录/注册 */}
          <div className="pb-3">
            <div className="flex border-b border-[#cfdbe7] dark:border-slate-700 px-4 gap-8">
              <button
                onClick={() => setMainTab("login")}
                className={`flex flex-col items-center justify-center border-b-[3px] pb-[13px] pt-4 flex-1 cursor-pointer transition-colors ${
                  mainTab === "login"
                    ? "border-b-primary text-primary"
                    : "border-b-transparent text-gray-500 dark:text-gray-400"
                }`}
              >
                <p className="text-sm font-bold leading-normal tracking-[0.015em]">登录</p>
              </button>
              <button
                onClick={() => setMainTab("register")}
                className={`flex flex-col items-center justify-center border-b-[3px] pb-[13px] pt-4 flex-1 cursor-pointer transition-colors ${
                  mainTab === "register"
                    ? "border-b-primary text-primary"
                    : "border-b-transparent text-gray-500 dark:text-gray-400"
                }`}
              >
                <p className="text-sm font-bold leading-normal tracking-[0.015em]">注册</p>
              </button>
            </div>
          </div>

          {/* 错误和成功提示 */}
          {errorMsg && (
            <div className="mx-8 mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 text-sm">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="mx-8 mb-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 text-sm">
              {successMsg}
            </div>
          )}

          {/* 登录内容 */}
          {mainTab === "login" && (
            <div>
              {/* 登录子Tab - Toggle开关样式 */}
              <div className="px-8 py-3 mt-5">
                <div className="flex h-10 flex-1 items-center justify-center rounded-lg bg-[#e7edf3] dark:bg-slate-800 p-1">
                  <label className="flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-lg px-2 has-[:checked]:bg-white has-[:checked]:dark:bg-slate-950 has-[:checked]:shadow-[0_0_4px_rgba(0,0,0,0.1)] has-[:checked]:text-primary text-gray-500 dark:text-gray-400 text-sm font-medium leading-normal">
                    <span className="truncate">账号密码登录</span>
                    <input
                      className="invisible w-0"
                      type="radio"
                      name="login-type"
                      value="account"
                      checked={loginTab === "account"}
                      onChange={() => setLoginTab("account")}
                    />
                  </label>
                  <label className="flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-lg px-2 has-[:checked]:bg-white has-[:checked]:dark:bg-slate-950 has-[:checked]:shadow-[0_0_4px_rgba(0,0,0,0.1)] has-[:checked]:text-primary text-gray-500 dark:text-gray-400 text-sm font-medium leading-normal">
                    <span className="truncate">邮箱登录</span>
                    <input
                      className="invisible w-0"
                      type="radio"
                      name="login-type"
                      value="email"
                      checked={loginTab === "email"}
                      onChange={() => setLoginTab("email")}
                    />
                  </label>
                </div>
              </div>

              {/* 账号密码登录表单 */}
              {loginTab === "account" && (
                <div className="px-8 py-3 space-y-6">
                  <label className="flex flex-col">
                    <p className="text-gray-800 dark:text-slate-200 text-lg font-semibold leading-normal pb-2.5">账号</p>
                    <input
                      className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-gray-900 dark:text-slate-100 focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#cfdbe7] dark:border-slate-600 bg-white dark:bg-slate-800/50 focus:border-primary hover:border-gray-400 dark:hover:border-slate-500 h-12 placeholder:text-gray-400 dark:placeholder:text-slate-500 px-4 py-3 text-lg font-normal leading-normal transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="请输入您的账号"
                      type="text"
                      value={account}
                      onChange={(e) => setAccount(e.target.value)}
                    />
                  </label>
                  <label className="flex flex-col">
                    <p className="text-gray-800 dark:text-slate-200 text-lg font-semibold leading-normal pb-2.5">密码</p>
                    <input
                      className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-gray-900 dark:text-slate-100 focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#cfdbe7] dark:border-slate-600 bg-white dark:bg-slate-800/50 focus:border-primary hover:border-gray-400 dark:hover:border-slate-500 h-12 placeholder:text-gray-400 dark:placeholder:text-slate-500 px-4 py-3 text-lg font-normal leading-normal transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="请输入您的密码"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && onLogin()}
                    />
                  </label>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        className="form-checkbox rounded text-primary focus:ring-primary/50 border-gray-300 dark:border-slate-600 bg-background-light dark:bg-slate-800 dark:checked:bg-primary"
                        id="remember-me"
                        type="checkbox"
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                      />
                      <label
                        className="ml-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer"
                        htmlFor="remember-me"
                      >
                        记住密码
                      </label>
                    </div>
                    <a className="text-sm text-primary hover:text-primary/90" href="#">
                      忘记密码？
                    </a>
                  </div>
                  <button
                    onClick={onLogin}
                    disabled={loading}
                    className="w-full flex items-center justify-center rounded-xl bg-primary text-white h-12 px-4 text-lg font-bold hover:bg-primary/90 active:bg-primary/80 transition-all duration-200 mt-6 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow"
                  >
                    {loading ? "登录中..." : "登录"}
                  </button>
                </div>
              )}

              {/* 邮箱登录表单 */}
              {loginTab === "email" && (
                <div className="px-8 py-3 space-y-6">
                  <label className="flex flex-col">
                    <p className="text-gray-800 dark:text-slate-200 text-lg font-semibold leading-normal pb-2.5">邮箱</p>
                    <input
                      className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-gray-900 dark:text-slate-100 focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#cfdbe7] dark:border-slate-600 bg-white dark:bg-slate-800/50 focus:border-primary hover:border-gray-400 dark:hover:border-slate-500 h-12 placeholder:text-gray-400 dark:placeholder:text-slate-500 px-4 py-3 text-lg font-normal leading-normal transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="请输入您的邮箱"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </label>
                  <div className="flex flex-col">
                    <p className="text-gray-800 dark:text-slate-200 text-lg font-semibold leading-normal pb-2.5">验证码</p>
                    <div className="relative">
                      <input
                        className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-gray-900 dark:text-slate-100 focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#cfdbe7] dark:border-slate-600 bg-white dark:bg-slate-800/50 focus:border-primary hover:border-gray-400 dark:hover:border-slate-500 h-12 placeholder:text-gray-400 dark:placeholder:text-slate-500 px-4 py-3 pr-32 text-lg font-normal leading-normal transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="请输入验证码"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && onLogin()}
                      />
                      <button
                        onClick={() => onSendEmailCode(email)}
                        disabled={sendLoading || countdown > 0}
                        className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 text-base font-semibold text-primary hover:text-primary/80 active:text-primary/70 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 rounded-lg hover:bg-primary/5"
                      >
                        {countdown > 0 ? `${countdown}秒` : "发送验证码"}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-end">
                    <a className="text-sm text-primary hover:text-primary/90" href="#">
                      忘记密码？
                    </a>
                  </div>
                  <button
                    onClick={onLogin}
                    disabled={loading}
                    className="w-full flex items-center justify-center rounded-xl bg-primary text-white h-12 px-4 text-lg font-bold hover:bg-primary/90 active:bg-primary/80 transition-all duration-200 mt-6 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow"
                  >
                    {loading ? "登录中..." : "登录"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 注册内容 */}
          {mainTab === "register" && (
            <div className="px-8 py-3 mt-5 space-y-6">
              <label className="flex flex-col">
                <p className="text-gray-800 dark:text-slate-200 text-lg font-semibold leading-normal pb-2.5">账号</p>
                <input
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-gray-900 dark:text-slate-100 focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#cfdbe7] dark:border-slate-600 bg-white dark:bg-slate-800/50 focus:border-primary hover:border-gray-400 dark:hover:border-slate-500 h-12 placeholder:text-gray-400 dark:placeholder:text-slate-500 px-4 py-3 text-lg font-normal leading-normal transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="请输入您的账号"
                  type="text"
                  value={regUserId}
                  onChange={(e) => setRegUserId(e.target.value)}
                />
              </label>
              <label className="flex flex-col">
                <p className="text-gray-800 dark:text-slate-200 text-lg font-semibold leading-normal pb-2.5">邮箱</p>
                <input
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-gray-900 dark:text-slate-100 focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#cfdbe7] dark:border-slate-600 bg-white dark:bg-slate-800/50 focus:border-primary hover:border-gray-400 dark:hover:border-slate-500 h-12 placeholder:text-gray-400 dark:placeholder:text-slate-500 px-4 py-3 text-lg font-normal leading-normal transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="请输入您的邮箱地址"
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                />
              </label>
              <label className="flex flex-col">
                <p className="text-gray-800 dark:text-slate-200 text-lg font-semibold leading-normal pb-2.5">验证码</p>
                <div className="relative">
                  <input
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-gray-900 dark:text-slate-100 focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#cfdbe7] dark:border-slate-600 bg-white dark:bg-slate-800/50 focus:border-primary hover:border-gray-400 dark:hover:border-slate-500 h-12 placeholder:text-gray-400 dark:placeholder:text-slate-500 px-4 py-3 pr-32 text-lg font-normal leading-normal transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="请输入验证码"
                    value={regCode}
                    onChange={(e) => setRegCode(e.target.value)}
                  />
                  <button
                    onClick={() => onSendEmailCode(regEmail)}
                    disabled={sendLoading || countdown > 0}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 text-base font-semibold text-primary hover:text-primary/80 active:text-primary/70 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 rounded-lg hover:bg-primary/5"
                  >
                    {countdown > 0 ? `${countdown}秒` : "发送验证码"}
                  </button>
                </div>
              </label>
              <button
                onClick={onRegister}
                disabled={loading}
                className="w-full flex items-center justify-center rounded-xl bg-primary text-white h-12 px-4 text-lg font-bold hover:bg-primary/90 active:bg-primary/80 transition-all duration-200 mt-6 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow"
              >
                {loading ? "注册中..." : "注册"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
