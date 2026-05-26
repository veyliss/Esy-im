import type { ReactNode } from "react";

type TabButtonProps = {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
};

type FieldProps = {
  label: string;
  children: ReactNode;
};

type CodeButtonProps = {
  disabled: boolean;
  countdown: number;
  onClick: () => void;
};

type AuthInputProps = {
  placeholder: string;
  type?: string;
  name?: string;
  autoComplete?: string;
  value: string;
  onChange: (value: string) => void;
  onEnter?: () => void;
  withCodeButton?: boolean;
  codeButtonProps?: CodeButtonProps;
};

type PrimaryButtonProps = {
  loading?: boolean;
  loadingText: string;
  text: string;
  disabled?: boolean;
  onClick: () => void;
};

const inputClassName =
  "auth-input form-input";

const primaryButtonClassName =
  "auth-primary-button";

export function MainTabButton({ active, children, onClick }: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`auth-main-tab ${active ? "is-active" : ""}`}
    >
      <span>{children}</span>
    </button>
  );
}

export function ToggleTabButton({ active, children, onClick }: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`auth-toggle-tab ${active ? "is-active" : ""}`}
    >
      <span>{children}</span>
    </button>
  );
}

export function UnderlineTabButton({ active, children, onClick }: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`auth-underline-tab ${active ? "is-active" : ""}`}
    >
      {children}
    </button>
  );
}

export function FormField({ label, children }: FieldProps) {
  return (
    <label className="auth-field">
      <p>{label}</p>
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
      className="auth-code-button"
    >
      {countdown > 0 ? `${countdown}秒` : "发送验证码"}
    </button>
  );
}

export function AuthInput({
  placeholder,
  type = "text",
  name,
  autoComplete,
  value,
  onChange,
  onEnter,
  withCodeButton = false,
  codeButtonProps,
}: AuthInputProps) {
  return (
    <div className="relative">
      <input
        className={`${inputClassName} ${withCodeButton ? "has-code-button" : ""}`.trim()}
        placeholder={placeholder}
        type={type}
        name={name}
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") onEnter?.();
        }}
      />
      {withCodeButton && codeButtonProps ? <CodeButton {...codeButtonProps} /> : null}
    </div>
  );
}

export function PrimaryButton({ loading, loadingText, text, disabled, onClick }: PrimaryButtonProps) {
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
