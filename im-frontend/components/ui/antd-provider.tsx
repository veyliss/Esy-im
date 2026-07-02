"use client";

import "@ant-design/v5-patch-for-react-19";
import { App, ConfigProvider, theme } from "antd";
import { useEffect, useState, type ReactNode } from "react";

/** Detect whether user prefers dark color scheme and sync `.dark` class. */
function useDarkMode(): boolean {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem("esy-im:theme");
    if (stored) return stored === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("esy-im:theme", isDark ? "dark" : "light");
  }, [isDark]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      const stored = localStorage.getItem("esy-im:theme");
      if (!stored) setIsDark(e.matches);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return isDark;
}

/** Expose dark mode toggle for other components (settings page etc.). */
export function useThemeMode() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem("esy-im:theme");
    if (stored) return stored === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("esy-im:theme", isDark ? "dark" : "light");
  }, [isDark]);

  return {
    isDark,
    toggle: () => setIsDark((v) => !v),
    setTheme: (dark: boolean) => setIsDark(dark),
  };
}

const sharedTokens = {
  borderRadius: 8,
  borderRadiusLG: 12,
  borderRadiusSM: 6,
  fontFamily:
    'Inter, "Noto Sans SC", "Noto Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

export function AntdProvider({ children }: { children: ReactNode }) {
  const isDark = useDarkMode();

  return (
    <ConfigProvider
      wave={{ disabled: true }}
      theme={{
        cssVar: { key: "esy-im" },
        hashed: false,
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          ...sharedTokens,
          colorPrimary: "#2563eb",
          colorInfo: "#2563eb",
          colorSuccess: "#10B981",
          colorWarning: "#F59E0B",
          colorError: "#EF4444",
          colorTextBase: isDark ? "#e5e5e5" : "#0F172A",
          colorBgBase: isDark ? "#0f0f0f" : "#ffffff",
          colorBgLayout: isDark ? "#0f0f0f" : "#F8FAFC",
          colorBorder: isDark ? "#2e2e2e" : "#E2E8F0",
          wireframe: false,
          motion: false,
        },
        components: {
          Alert: {
            borderRadiusLG: 8,
            withDescriptionIconSize: 18,
          },
          Button: {
            borderRadius: 8,
            controlHeightLG: 44,
            fontWeight: 700,
            primaryShadow: "0 4px 12px rgba(37, 99, 235, 0.2)",
          },
          Checkbox: {
            colorPrimary: "#2563eb",
            borderRadiusSM: 4,
          },
          Form: {
            itemMarginBottom: 16,
            labelColor: isDark ? "#a3a3a3" : "#334155",
            labelFontSize: 13,
          },
          Input: {
            activeBorderColor: "#2563eb",
            activeShadow: "0 0 0 3px rgba(37, 99, 235, 0.12)",
            borderRadius: 8,
            controlHeightLG: 44,
            hoverBorderColor: "#60A5FA",
            paddingInlineLG: 14,
          },
          Segmented: {
            borderRadius: 8,
            itemSelectedBg: isDark ? "#262626" : "#ffffff",
            itemSelectedColor: "#2563eb",
            trackBg: isDark ? "#1e1e1e" : "#F1F5F9",
          },
          Switch: {
            colorPrimary: "#2563eb",
            trackHeight: 22,
          },
          Modal: {
            borderRadiusLG: 12,
            titleFontSize: 18,
            headerBg: "transparent",
          },
          Card: {
            borderRadiusLG: 12,
            paddingLG: 20,
          },
          Tag: {
            borderRadiusSM: 6,
          },
          Avatar: {
            borderRadius: 8,
          },
          Skeleton: {
            borderRadiusSM: 6,
          },
          Divider: {
            colorSplit: "#e2e8f0",
          },
          Badge: {
            dotSize: 8,
          },
          Empty: {
            fontSize: 14,
          },
          List: {
            itemPaddingSM: "10px 0",
          },
        },
      }}
    >
      <App>{children}</App>
    </ConfigProvider>
  );
}
