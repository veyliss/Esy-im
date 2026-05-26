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
  "form-input flex h-14 w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg border border-[#cfdbe7] bg-background-light p-[15px] text-base font-normal leading-normal text-gray-800 placeholder:text-gray-400 focus:border-primary focus:outline-0 focus:ring-2 focus:ring-primary/50 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-200 dark:placeholder-gray-500";

const primaryButtonClassName =
  "mt-4 flex h-14 w-full items-center justify-center rounded-lg bg-primary px-4 text-base font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50";

export function MainTabButton({ active, children, onClick }: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 cursor-pointer flex-col items-center justify-center border-b-[3px] pb-[13px] pt-4 transition-colors ${
        active
          ? "border-b-primary text-primary"
          : "border-b-transparent text-gray-500 dark:text-gray-400"
      }`}
    >
      <p className="text-sm font-bold leading-normal tracking-[0.015em]">{children}</p>
    </button>
  );
}

export function ToggleTabButton({ active, children, onClick }: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-full grow items-center justify-center overflow-hidden rounded-lg px-2 text-sm font-medium leading-normal transition-colors ${
        active
          ? "bg-white text-primary shadow-[0_0_4px_rgba(0,0,0,0.1)] dark:bg-slate-950"
          : "text-gray-500 dark:text-gray-400"
      }`}
    >
      <span className="truncate">{children}</span>
    </button>
  );
}

export function UnderlineTabButton({ active, children, onClick }: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
        active
          ? "border-primary text-primary"
          : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300"
      }`}
    >
      {children}
    </button>
  );
}

export function FormField({ label, children }: FieldProps) {
  return (
    <label className="flex flex-col">
      <p className="pb-2 text-base font-medium leading-normal text-gray-800 dark:text-slate-200">
        {label}
      </p>
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
      className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 text-sm font-medium text-primary hover:text-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
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
        className={`${inputClassName} ${withCodeButton ? "pr-32" : ""}`.trim()}
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
