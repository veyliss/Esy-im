"use client";

import "@ant-design/v5-patch-for-react-19";
import { App, ConfigProvider, theme } from "antd";
import type { ReactNode } from "react";

export function AntdProvider({ children }: { children: ReactNode }) {
  return (
    <ConfigProvider
      wave={{ disabled: true }}
      theme={{
        cssVar: { key: "esy-im" },
        hashed: false,
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: "#2563eb",
          colorInfo: "#2563eb",
          colorSuccess: "#10b981",
          colorWarning: "#f59e0b",
          colorError: "#ef4444",
          colorTextBase: "#0f172a",
          colorBgBase: "#ffffff",
          colorBgLayout: "#f6f8fb",
          colorBorder: "#d9e2ef",
          borderRadius: 8,
          borderRadiusLG: 8,
          motion: false,
          wireframe: false,
          fontFamily:
            'Inter, "Noto Sans SC", "Noto Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        },
        components: {
          Alert: {
            borderRadiusLG: 8,
            withDescriptionIconSize: 18,
          },
          Button: {
            borderRadius: 8,
            controlHeightLG: 46,
            fontWeight: 700,
            primaryShadow: "0 6px 16px rgba(37, 99, 235, 0.14)",
          },
          Checkbox: {
            colorPrimary: "#2563eb",
            borderRadiusSM: 4,
          },
          Form: {
            itemMarginBottom: 18,
            labelColor: "#334155",
            labelFontSize: 13,
          },
          Input: {
            activeBorderColor: "#2563eb",
            activeShadow: "0 0 0 3px rgba(37, 99, 235, 0.12)",
            borderRadius: 8,
            controlHeightLG: 46,
            hoverBorderColor: "#93b4f4",
            paddingInlineLG: 14,
          },
          Segmented: {
            borderRadius: 8,
            itemSelectedBg: "#ffffff",
            itemSelectedColor: "#1d4ed8",
            trackBg: "#edf2f8",
          },
        },
      }}
    >
      <App>{children}</App>
    </ConfigProvider>
  );
}
