"use client";

import { App as AntdApp } from "antd";
import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";

type ToastTone = "success" | "error" | "info" | "warning";

type ConfirmOptions = {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  tone?: "default" | "danger";
};

type InteractionContextValue = {
  toast: (message: string, options?: { title?: string; tone?: ToastTone }) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const InteractionContext = createContext<InteractionContextValue | null>(null);

export function AppInteractionProvider({ children }: { children: ReactNode }) {
  const { message, modal } = AntdApp.useApp();

  const toast = useCallback(
    (content: string, options?: { title?: string; tone?: ToastTone }) => {
      message.open({
        type: options?.tone || "info",
        content: options?.title ? (
          <span className="ant-app-message-content">
            <strong>{options.title}</strong>
            <span>{content}</span>
          </span>
        ) : (
          content
        ),
        duration: 3.2,
      });
    },
    [message]
  );

  const confirm = useCallback(
    (options: ConfirmOptions) => {
      return new Promise<boolean>((resolve) => {
        let settled = false;
        const settle = (value: boolean) => {
          if (settled) return;
          settled = true;
          resolve(value);
        };

        modal.confirm({
          title: options.title,
          content: options.message,
          okText: options.confirmText || "确认",
          cancelText: options.cancelText || "取消",
          okButtonProps: {
            danger: options.tone === "danger",
          },
          className: "ant-app-confirm",
          onOk: () => settle(true),
          onCancel: () => settle(false),
        });
      });
    },
    [modal]
  );

  const value = useMemo(() => ({ toast, confirm }), [toast, confirm]);

  return <InteractionContext.Provider value={value}>{children}</InteractionContext.Provider>;
}

export function useAppInteractions() {
  const context = useContext(InteractionContext);
  if (!context) {
    throw new Error("useAppInteractions must be used within AppInteractionProvider");
  }
  return context;
}
