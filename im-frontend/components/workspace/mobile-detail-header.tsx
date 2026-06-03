import type { ReactNode } from "react";
import { Button } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import clsx from "clsx";

interface MobileDetailHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  onBack: () => void;
  action?: ReactNode;
  className?: string;
}

export function MobileDetailHeader({
  title,
  description,
  onBack,
  action,
  className,
}: MobileDetailHeaderProps) {
  return (
    <div className={clsx("mobile-detail-header", className)}>
      <Button
        type="text"
        className="mobile-detail-back"
        onClick={onBack}
        aria-label="返回列表"
        title="返回"
        icon={<ArrowLeftOutlined />}
        shape="circle"
      />
      <div className="min-w-0 flex-1">
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
