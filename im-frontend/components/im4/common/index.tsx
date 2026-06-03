"use client";

import { Button, Empty, Input, Segmented, Tag, Tooltip } from "antd";
import clsx from "clsx";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { ButtonProps, InputProps } from "antd";

interface Im4IconButtonProps extends Omit<ButtonProps, "type" | "icon" | "children"> {
  active?: boolean;
  label: string;
  icon: string;
  type?: ButtonHTMLAttributes<HTMLButtonElement>["type"];
}

export function Im4IconButton({
  active = false,
  label,
  icon,
  className,
  type = "button",
  ...props
}: Im4IconButtonProps) {
  return (
    <Tooltip mouseEnterDelay={0.35} title={label}>
      <Button
        {...props}
        aria-label={label}
        className={clsx("im4-icon-button ant-im4-icon-button", active && "is-active", className)}
        htmlType={type}
        icon={<span className="material-symbols-outlined">{icon}</span>}
        shape="circle"
        type={active ? "primary" : "text"}
      />
    </Tooltip>
  );
}

interface Im4SearchProps extends Omit<InputProps, "prefix" | "size"> {
  onClear?: () => void;
}

export function Im4Search({ value, onClear, className, onChange, ...props }: Im4SearchProps) {
  return (
    <Input
      {...props}
      allowClear
      className={clsx("im4-search ant-im4-search", className)}
      onChange={(event) => {
        if (event.target.value === "") onClear?.();
        onChange?.(event);
      }}
      prefix={<span className="material-symbols-outlined" aria-hidden="true">search</span>}
      size="large"
      value={value}
    />
  );
}

interface Im4SegmentedProps<T extends string> {
  active: T;
  items: Array<{ key: T; label: string; count?: number }>;
  onChange: (key: T) => void;
  label: string;
}

export function Im4Segmented<T extends string>({ active, items, onChange, label }: Im4SegmentedProps<T>) {
  return (
    <Segmented
      aria-label={label}
      block
      className="im4-segmented ant-im4-segmented"
      options={items.map((item) => ({
        value: item.key,
        label: (
          <span className="ant-im4-segmented-label">
            <span>{item.label}</span>
            {typeof item.count === "number" ? <strong>{item.count}</strong> : null}
          </span>
        ),
      }))}
      value={active}
      onChange={(value) => onChange(value as T)}
    />
  );
}

interface Im4EmptyProps {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function Im4Empty({ title, description, action, className }: Im4EmptyProps) {
  return (
    <Empty
      className={clsx("im4-empty ant-im4-empty", className)}
      description={
        <span>
          <strong>{title}</strong>
          {description ? <small>{description}</small> : null}
        </span>
      }
    >
      {action ? <div className="im4-empty-actions">{action}</div> : null}
    </Empty>
  );
}

interface Im4ButtonProps extends Omit<ButtonProps, "type" | "children"> {
  tone?: "default" | "primary" | "danger";
  children: ReactNode;
  type?: ButtonHTMLAttributes<HTMLButtonElement>["type"];
}

export function Im4Button({
  tone = "default",
  className,
  children,
  type = "button",
  ...props
}: Im4ButtonProps) {
  return (
    <Button
      {...props}
      className={clsx("im4-button ant-im4-button", `is-${tone}`, className)}
      danger={tone === "danger"}
      htmlType={type}
      type={tone === "primary" ? "primary" : "default"}
    >
      {children}
    </Button>
  );
}

interface Im4StatusProps {
  tone?: "online" | "warning" | "default" | "primary";
  children: ReactNode;
}

const statusColorMap: Record<NonNullable<Im4StatusProps["tone"]>, string> = {
  default: "default",
  online: "success",
  primary: "processing",
  warning: "warning",
};

export function Im4Status({ tone = "default", children }: Im4StatusProps) {
  return (
    <Tag className={clsx("im4-status ant-im4-status", `is-${tone}`)} color={statusColorMap[tone]}>
      {children}
    </Tag>
  );
}
