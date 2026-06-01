"use client";

import { useEffect, type ReactNode } from "react";
import clsx from "clsx";

interface CommandDialogProps {
  open?: boolean;
  title: string;
  description?: string;
  icon: string;
  labelledBy: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
  footer?: ReactNode;
}

export function CommandDialog({
  open = true,
  title,
  description,
  icon,
  labelledBy,
  onClose,
  children,
  wide = false,
  footer,
}: CommandDialogProps) {
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="command-dialog-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={clsx("command-dialog", wide && "is-wide")}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={description ? `${labelledBy}-description` : undefined}
      >
        <div className="command-dialog-head">
          <div className="command-dialog-title">
            <span className="command-dialog-icon">
              <span className="material-symbols-outlined text-xl">{icon}</span>
            </span>
            <span>
              <h2 id={labelledBy}>{title}</h2>
              {description ? <p id={`${labelledBy}-description`}>{description}</p> : null}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="command-dialog-close"
            aria-label="关闭"
            title="关闭"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="command-dialog-body">{children}</div>
        {footer ? <div className="command-dialog-footer">{footer}</div> : null}
      </div>
    </div>
  );
}
