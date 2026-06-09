"use client";

import { useState, useCallback } from "react";
import { Modal } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import clsx from "clsx";

interface MomentImageGridProps {
  images: string[];
  className?: string;
}

const gridClass = (count: number) => {
  if (count === 1) return "wx-image-grid--single";
  if (count === 2) return "wx-image-grid--pair";
  if (count === 4) return "wx-image-grid--four";
  return "wx-image-grid--grid";
};

export function MomentImageGrid({ images, className }: MomentImageGridProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  const openPreview = useCallback((index: number) => {
    setPreviewIndex(index);
    setPreviewOpen(true);
  }, []);

  if (images.length === 0) return null;

  return (
    <>
      <div className={clsx("wx-image-grid", gridClass(images.length), className)}>
        {images.map((url, index) => (
          <button
            key={index}
            type="button"
            className="wx-image-cell"
            onClick={() => openPreview(index)}
            aria-label={`查看图片 ${index + 1}`}
          >
            <img src={url} alt="" loading="lazy" draggable={false} />
          </button>
        ))}
      </div>

      <Modal
        open={previewOpen}
        onCancel={() => setPreviewOpen(false)}
        footer={null}
        closable={false}
        centered
        width="auto"
        className="wx-image-preview-modal"
        styles={{
          content: { padding: 0, background: "transparent", boxShadow: "none" },
          wrapper: {},
        }}
      >
        <div className="wx-image-preview">
          <button
            type="button"
            className="wx-image-preview-close"
            onClick={() => setPreviewOpen(false)}
            aria-label="关闭预览"
          >
            <CloseOutlined />
          </button>
          <img
            src={images[previewIndex]}
            alt={`图片 ${previewIndex + 1}`}
            className="wx-image-preview-img"
          />
          {images.length > 1 ? (
            <div className="wx-image-preview-counter">
              {previewIndex + 1} / {images.length}
            </div>
          ) : null}
          {images.length > 1 ? (
            <div className="wx-image-preview-nav">
              <button
                type="button"
                disabled={previewIndex === 0}
                onClick={() => setPreviewIndex((i) => Math.max(0, i - 1))}
                aria-label="上一张"
              >
                ‹
              </button>
              <button
                type="button"
                disabled={previewIndex === images.length - 1}
                onClick={() => setPreviewIndex((i) => Math.min(images.length - 1, i + 1))}
                aria-label="下一张"
              >
                ›
              </button>
            </div>
          ) : null}
        </div>
      </Modal>
    </>
  );
}
