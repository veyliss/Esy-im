"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CameraOutlined, ContactsOutlined, MessageOutlined, TeamOutlined, UserOutlined } from "@ant-design/icons";
import clsx from "clsx";
import { useEffect, type ReactNode } from "react";
import { UserAvatar } from "@/components/ui/user-avatar";
import type { NavKey } from "@/components/ui/nav-tabs";

interface Im4ShellProps {
  active: NavKey;
  title: string;
  subtitle?: ReactNode;
  sessionPanel: ReactNode;
  children: ReactNode;
  detailActive?: boolean;
  rightSlot?: ReactNode;
  inspector?: ReactNode;
  avatarSrc?: string;
  avatarName?: string;
  avatarStatus?: "online" | "offline" | "away" | "busy" | "invisible";
  className?: string;
}

const navItems: Array<{ key: NavKey; label: string; href: string; icon: ReactNode }> = [
  { key: "chat", label: "聊天", href: "/chat", icon: <MessageOutlined /> },
  { key: "contacts", label: "通讯录", href: "/contacts", icon: <ContactsOutlined /> },
  { key: "groups", label: "群聊", href: "/groups", icon: <TeamOutlined /> },
  { key: "moments", label: "朋友圈", href: "/moments", icon: <CameraOutlined /> },
  { key: "me", label: "我的", href: "/me", icon: <UserOutlined /> },
];

export function Im4Shell({
  active,
  title,
  subtitle,
  sessionPanel,
  children,
  detailActive = false,
  rightSlot,
  inspector,
  avatarSrc,
  avatarName = "我",
  avatarStatus,
  className,
}: Im4ShellProps) {
  const router = useRouter();

  useEffect(() => {
    navItems.forEach((item) => {
      if (item.key !== active) {
        router.prefetch(item.href);
      }
    });
  }, [active, router]);

  return (
    <div className={clsx("im4-shell", className)}>
      <aside className="im4-rail" aria-label="主导航">
        <nav>
          {navItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              aria-current={active === item.key ? "page" : undefined}
              className={clsx("im4-rail-link", active === item.key && "is-active")}
              title={item.label}
            >
              <span className="im4-rail-icon" aria-hidden="true">{item.icon}</span>
              <em>{item.label}</em>
            </Link>
          ))}
        </nav>
        <UserAvatar
          src={avatarSrc}
          name={avatarName}
          size="md"
          status={avatarStatus}
          showStatus={Boolean(avatarStatus)}
          border
          className="im4-rail-user"
        />
      </aside>

      <section className="im4-sessions">{sessionPanel}</section>

      <main className={clsx("im4-conversation", detailActive && "is-active")}>
        <header className="im4-mobile-titlebar">
          <div>
            <h1>{title}</h1>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <div>{rightSlot}</div>
        </header>
        {children}
      </main>

      {inspector ? <aside className="im4-inspector-pane">{inspector}</aside> : null}
    </div>
  );
}

export default Im4Shell;
