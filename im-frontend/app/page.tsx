"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function WelcomePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <main className="welcome-page relative min-h-screen font-display bg-slate-50 dark:bg-slate-950 flex items-center justify-center overflow-hidden px-6">
        <div className="pointer-events-none absolute inset-0 opacity-80">
          <div className="floating-blob absolute -top-24 -left-10 w-80 h-80 bg-primary/20 blur-[110px]" />
          <div className="floating-blob floating-blob--reverse absolute bottom-0 right-0 w-[420px] h-[420px] bg-blue-400/30 blur-[140px]" />
          <div className="orbit-ring absolute inset-16 rounded-[50%] border border-white/40 dark:border-slate-800/40 opacity-20" />
        </div>

        <div className={`relative w-full max-w-3xl text-center space-y-10 transition-all duration-700 ease-out ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}>
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-6xl font-semibold text-slate-900 dark:text-white drop-shadow-sm">
              欢迎来到 Esy-IM
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
              在这里与团队与好友保持实时连接，跨设备同步消息，随时继续未完的对话。
            </p>
          </div>

          <div className="flex justify-center">
            <button
              onClick={() => router.push("/login")}
              className="group relative inline-flex items-center justify-center overflow-hidden rounded-full border border-white/30 bg-gradient-to-r from-primary via-blue-500 to-indigo-500 px-16 py-5 text-xl font-semibold text-white shadow-[0_20px_40px_rgba(37,99,235,0.35)] transition-all duration-500 hover:shadow-[0_30px_60px_rgba(37,99,235,0.45)] hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40"
            >
              <span className="absolute inset-[2px] rounded-full bg-gradient-to-r from-blue-50/10 to-white/5 opacity-0 transition group-hover:opacity-100" />
              <span
                className="relative flex items-center gap-3 tracking-wide"
                style={{ padding: "10px 15px" }}
              >
                前往登录
                <span className="material-symbols-outlined text-2xl transition-transform duration-300 group-hover:translate-x-1">
                  arrow_forward
                </span>
              </span>
            </button>
          </div>
        </div>
      </main>

      <style jsx>{`
        .welcome-page {
          background: radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.12), transparent 50%),
            radial-gradient(circle at 80% 0%, rgba(99, 102, 241, 0.15), transparent 40%),
            #f8fafc;
          background-size: 200% 200%;
          animation: gradientShift 18s ease-in-out infinite alternate;
        }

        @media (prefers-color-scheme: dark) {
          .welcome-page {
            background: radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.25), transparent 45%),
              radial-gradient(circle at 80% 0%, rgba(129, 140, 248, 0.28), transparent 40%),
              #020617;
          }
        }

        .floating-blob {
          animation: blobFloat 14s ease-in-out infinite;
        }

        .floating-blob--reverse {
          animation-duration: 18s;
          animation-direction: alternate-reverse;
        }

        .orbit-ring {
          animation: orbitSpin 30s linear infinite;
        }

        @keyframes gradientShift {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        @keyframes blobFloat {
          0% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          50% {
            transform: translate3d(40px, -20px, 0) scale(1.05);
          }
          100% {
            transform: translate3d(-20px, 10px, 0) scale(0.98);
          }
        }

        @keyframes orbitSpin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  );
}
