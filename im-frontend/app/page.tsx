"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const previewConversations = [
  { name: "产品讨论组", message: "新版界面已经准备好了", unread: "2", active: true },
  { name: "Sophia", message: "今天的会议纪要发你了", unread: "" },
  { name: "好友请求", message: "有新的联系人申请", unread: "1" },
];

export default function WelcomePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <main className="welcome-page">
      <div className="welcome-grid" />

      <div className="welcome-shell">
        <header className="welcome-header">
          <span className="text-sm font-extrabold text-primary tracking-wide">ESY-IM</span>
          <button className="welcome-header-button active:scale-[0.97] cursor-pointer" type="button" onClick={() => router.push("/login")}>
            登录
          </button>
        </header>

        <section className={`welcome-hero ${mounted ? "is-mounted" : ""}`}>
          <div className="welcome-copy">
            <p className="welcome-eyebrow">CHAT · CONTACTS · MOMENTS</p>
            <h1 className="gradient-text">欢迎使用即时通讯系统</h1>
            <p className="welcome-description">
              登录后进入你的聊天工作台，继续会话、管理通讯录、加入群聊并查看朋友圈动态。
            </p>

            <div className="welcome-actions">
              <button className="welcome-primary active:scale-[0.97] cursor-pointer" type="button" onClick={() => router.push("/login")}>
                登录账号
              </button>
              <button className="welcome-secondary active:scale-[0.97] cursor-pointer" type="button" onClick={() => router.push("/login?tab=register")}>
                注册新账号
              </button>
            </div>
          </div>

          <div className="welcome-preview" aria-hidden="true">
            <div className="preview-sidebar">
              <div className="preview-title">
                <span>消息</span>
                <small>12 在线</small>
              </div>
              <div className="preview-list">
                {previewConversations.map((item) => (
                  <div className={`preview-row ${item.active ? "active" : ""}`} key={item.name}>
                    <div className="preview-avatar">{item.name.slice(0, 1)}</div>
                    <div className="preview-meta">
                      <strong>{item.name}</strong>
                      <span>{item.message}</span>
                    </div>
                    {item.unread ? <em>{item.unread}</em> : null}
                  </div>
                ))}
              </div>
            </div>

            <div className="preview-chat">
              <div className="preview-chat-head">
                <div>
                  <strong>产品讨论组</strong>
                  <span>8 位成员在线</span>
                </div>
                <i />
              </div>
              <div className="preview-messages">
                <p className="bubble incoming">新的 IM 首页保留欢迎入口就好。</p>
                <p className="bubble outgoing">收到，登录和注册会直接进入对应流程。</p>
                <p className="bubble incoming short">样式按应用界面来。</p>
              </div>
              <div className="preview-input">
                <span>输入消息</span>
                <b>→</b>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
