import type { ReactNode } from "react";
import clsx from "clsx";

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

export function MainTabButton({ active, children, onClick }: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "flex-1 flex items-center justify-center pb-[13px] pt-4 border-b-[3px] cursor-pointer transition-colors duration-150",
        active
          ? "border-b-primary text-primary"
          : "border-b-transparent text-gray-500 dark:text-gray-400"
      )}
    >
      <span className="text-sm font-bold leading-normal tracking-[0.015em]">{children}</span>
    </button>
  );
}

// New segmented control style - used for login method switching
export function SegmentedTab({ options, active, onChange }: {
  options: { key: string; label: string }[];
  active: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="flex h-10 flex-1 items-center justify-center rounded-lg bg-[#e7edf3] dark:bg-slate-800 p-1">
      {options.map((option) => (
        <label
          key={option.key}
          className={clsx(
            "flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-lg px-2 text-sm font-medium leading-normal transition-all duration-150",
            active === option.key
              ? "bg-white dark:bg-slate-950 shadow-[0_0_4px_rgba(0,0,0,0.1)] text-primary"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          )}
        >
          <span className="truncate">{option.label}</span>
          <input
            className="invisible w-0"
            type="radio"
            name="login-type"
            value={option.key}
            checked={active === option.key}
            onChange={() => onChange(option.key)}
          />
        </label>
      ))}
    </div>
  );
}

export function ToggleTabButton({ active, children, onClick }: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "flex h-full grow items-center justify-center overflow-hidden rounded-lg px-2 text-sm font-medium leading-normal cursor-pointer transition-all duration-150",
        active
          ? "bg-white dark:bg-slate-950 shadow-[0_0_4px_rgba(0,0,0,0.1)] text-primary"
          : "text-gray-500 dark:text-gray-400"
      )}
    >
      <span className="truncate">{children}</span>
    </button>
  );
}

// Keep UnderlineTabButton for backward compatibility but it won't be used
export function UnderlineTabButton({ active, children, onClick }: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "px-4 py-2 text-sm font-medium border-b-2 transition-colors duration-150",
        active
          ? "border-primary text-primary"
          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600"
      )}
    >
      {children}
    </button>
  );
}

export function FormField({ label, children }: FieldProps) {
  return (
    <label className="flex flex-col">
      <p className="text-gray-800 dark:text-gray-200 text-base font-medium leading-normal pb-2">
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
      className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 text-sm font-medium text-primary hover:text-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
        className={clsx(
          "form-input w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-gray-800 dark:text-gray-200 focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#cfdbe7] dark:border-slate-700 bg-background-light dark:bg-slate-800 focus:border-primary h-14 placeholder:text-gray-400 dark:placeholder-gray-500 p-[15px] text-base font-normal leading-normal",
          withCodeButton && "pr-32"
        )}
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
      className="w-full flex items-center justify-center rounded-lg bg-primary text-white h-14 px-4 text-base font-semibold hover:bg-primary/90 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
    >
      {loading ? loadingText : text}
    </button>
  );
}
