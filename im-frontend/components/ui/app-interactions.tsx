"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import clsx from "clsx";

type ToastTone = "success" | "error" | "info" | "warning";

type Toast = {
  id: number;
  title?: string;
  message: string;
  tone: ToastTone;
};

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
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmState, setConfirmState] = useState<(ConfirmOptions & { resolve: (value: boolean) => void }) | null>(null);

  const toast = useCallback((message: string, options?: { title?: string; tone?: ToastTone }) => {
    const id = Date.now() + Math.random();
    const nextToast: Toast = {
      id,
      message,
      title: options?.title,
      tone: options?.tone || "info",
    };

    setToasts((current) => [...current, nextToast].slice(-4));
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 3200);
  }, []);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({ ...options, resolve });
    });
  }, []);

  const closeConfirm = (value: boolean) => {
    confirmState?.resolve(value);
    setConfirmState(null);
  };

  const value = useMemo(() => ({ toast, confirm }), [toast, confirm]);

  return (
    <InteractionContext.Provider value={value}>
      {children}

      <div className="app-toast-region" aria-live="polite" aria-label="通知">
        {toasts.map((item) => (
          <div key={item.id} className={clsx("app-toast", `is-${item.tone}`)}>
            <span className="material-symbols-outlined app-toast-icon">
              {item.tone === "success" ? "check_circle" : item.tone === "error" ? "error" : item.tone === "warning" ? "warning" : "info"}
            </span>
            <span className="min-w-0">
              {item.title ? <strong>{item.title}</strong> : null}
              <span>{item.message}</span>
            </span>
          </div>
        ))}
      </div>

      {confirmState ? (
        <div className="app-confirm-overlay transition-opacity duration-200" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeConfirm(false);
        }}>
          <div className="app-confirm-dialog animate-fade-in-scale" role="dialog" aria-modal="true" aria-labelledby="app-confirm-title">
            <div className={clsx("app-confirm-icon", confirmState.tone === "danger" && "is-danger")}>
              <span className="material-symbols-outlined">
                {confirmState.tone === "danger" ? "report" : "help"}
              </span>
            </div>
            <div className="app-confirm-copy">
              <h2 id="app-confirm-title">{confirmState.title}</h2>
              {confirmState.message ? <p>{confirmState.message}</p> : null}
            </div>
            <div className="app-confirm-actions">
              <button type="button" className="app-confirm-secondary" onClick={() => closeConfirm(false)}>
                {confirmState.cancelText || "取消"}
              </button>
              <button
                type="button"
                className={clsx("app-confirm-primary", confirmState.tone === "danger" && "is-danger")}
                onClick={() => closeConfirm(true)}
              >
                {confirmState.confirmText || "确认"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </InteractionContext.Provider>
  );
}

export function useAppInteractions() {
  const context = useContext(InteractionContext);
  if (!context) {
    throw new Error("useAppInteractions must be used within AppInteractionProvider");
  }
  return context;
}
