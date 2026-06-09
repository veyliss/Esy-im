"use client";

import { useState, useRef, useEffect } from "react";
import { Input, type InputRef } from "antd";
import {
  DeleteOutlined,
  EnvironmentOutlined,
  HeartOutlined,
  HeartFilled,
  MessageOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import clsx from "clsx";
import type { Moment, User, MomentLike, MomentComment } from "@/lib/types/api";
import { formatMomentTime } from "@/lib/utils/time";
import { MomentImageGrid } from "./MomentImageGrid";

interface MomentItemProps {
  moment: Moment;
  currentUser: User | null;
  onLike: (momentId: number) => void;
  onUnlike: (momentId: number) => void;
  onComment: (momentId: number, content: string, replyToId?: number | null) => void;
  onDelete: (momentId: number) => void;
}

function parseImages(raw?: string): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function MomentItem({
  moment,
  currentUser,
  onLike,
  onUnlike,
  onComment,
  onDelete,
}: MomentItemProps) {
  const [actionOpen, setActionOpen] = useState(false);
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState<MomentComment | null>(null);
  const actionRef = useRef<HTMLDivElement>(null);
  const commentInputRef = useRef<InputRef>(null);

  const images = parseImages(moment.images);
  const isLiked = moment.likes?.some((l: MomentLike) => l.user_id === currentUser?.user_id);
  const authorName = moment.user?.nickname || "用户";
  const isOwner = currentUser?.user_id === moment.user_id;

  // Close action popup when clicking outside
  useEffect(() => {
    if (!actionOpen) return;
    const handler = (e: MouseEvent) => {
      if (actionRef.current && !actionRef.current.contains(e.target as Node)) {
        setActionOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [actionOpen]);

  // Focus comment input when opened
  useEffect(() => {
    if (commentOpen) {
      const t = setTimeout(() => commentInputRef.current?.input?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [commentOpen]);

  const handleLike = () => {
    if (isLiked) onUnlike(moment.id);
    else onLike(moment.id);
    setActionOpen(false);
  };

  const handleToggleComment = () => {
    setCommentOpen((v) => !v);
    setActionOpen(false);
  };

  const handleSubmitComment = () => {
    const text = commentText.trim();
    if (!text) return;
    onComment(moment.id, text, replyTo?.id || null);
    setCommentText("");
    setReplyTo(null);
    setCommentOpen(false);
  };

  const handleReply = (comment: MomentComment) => {
    setReplyTo(comment);
    setCommentOpen(true);
    setCommentText("");
  };

  return (
    <div className="wx-moment-item">
      {/* Avatar */}
      <div className="wx-moment-avatar">
        <img
          src={moment.user?.avatar || "/default-avatar.png"}
          alt={authorName}
          loading="lazy"
        />
      </div>

      {/* Content area */}
      <div className="wx-moment-body">
        {/* Author name */}
        <div className="wx-moment-author">
          <span className="wx-moment-name">{authorName}</span>
        </div>

        {/* Text content */}
        {moment.content ? (
          <div className="wx-moment-text">{moment.content}</div>
        ) : null}

        {/* Location */}
        {moment.location ? (
          <div className="wx-moment-location">
            <EnvironmentOutlined /> {moment.location}
          </div>
        ) : null}

        {/* Image grid */}
        {images.length > 0 ? <MomentImageGrid images={images} /> : null}

        {/* Time + action bar */}
        <div className="wx-moment-meta">
          <span className="wx-moment-time">{formatMomentTime(moment.created_at)}</span>

          {/* Action trigger button */}
          <div className="wx-moment-action-wrap" ref={actionRef}>
            <button
              type="button"
              className={clsx("wx-moment-action-btn", actionOpen && "is-open")}
              onClick={() => setActionOpen((v) => !v)}
              aria-label="操作"
            >
              <MoreOutlined />
            </button>

            {/* Action popup (like / comment / delete) */}
            {actionOpen ? (
              <div className="wx-moment-action-popup">
                <button type="button" className="wx-action-popup-item" onClick={handleLike}>
                  {isLiked ? <HeartFilled className="is-liked" /> : <HeartOutlined />}
                  <span>{isLiked ? "取消" : "赞"}</span>
                </button>
                <button type="button" className="wx-action-popup-item" onClick={handleToggleComment}>
                  <MessageOutlined />
                  <span>评论</span>
                </button>
                {isOwner ? (
                  <button
                    type="button"
                    className="wx-action-popup-item is-danger"
                    onClick={() => {
                      setActionOpen(false);
                      onDelete(moment.id);
                    }}
                  >
                    <DeleteOutlined />
                    <span>删除</span>
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        {/* Likes + Comments combined section */}
        {(moment.likes?.length || moment.comments?.length) ? (
          <div className="wx-moment-interactions">
            {/* Likes */}
            {moment.likes && moment.likes.length > 0 ? (
              <div className="wx-moment-likes">
                <HeartFilled className="wx-like-icon" />
                <span className="wx-like-names">
                  {moment.likes.map((l: MomentLike, i: number) => (
                    <span key={l.id}>
                      {i > 0 ? "，" : ""}
                      <span className="wx-like-name">{l.user?.nickname || l.user_id}</span>
                    </span>
                  ))}
                </span>
              </div>
            ) : null}

            {/* Comments */}
            {moment.comments && moment.comments.length > 0 ? (
              <div className="wx-moment-comments">
                {moment.comments.map((c: MomentComment) => (
                  <div key={c.id} className="wx-comment-line" onClick={() => handleReply(c)}>
                    <span className="wx-comment-author">{c.user?.nickname || "用户"}</span>
                    {c.reply_to?.user ? (
                      <>
                        <span className="wx-comment-reply-label">回复</span>
                        <span className="wx-comment-reply-to">{c.reply_to.user.nickname}</span>
                      </>
                    ) : null}
                    <span className="wx-comment-colon">：</span>
                    <span className="wx-comment-text">{c.content}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Inline comment input */}
        {commentOpen ? (
          <div className="wx-moment-comment-input">
            {replyTo ? (
              <div className="wx-reply-hint">
                回复 <span>{replyTo.user?.nickname}</span>
                <button
                  type="button"
                  onClick={() => {
                    setReplyTo(null);
                    setCommentText("");
                  }}
                >
                  取消
                </button>
              </div>
            ) : null}
            <div className="wx-comment-input-row">
              <Input
                ref={commentInputRef}
                placeholder={replyTo ? `回复 ${replyTo.user?.nickname}...` : "写评论..."}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onPressEnter={handleSubmitComment}
                size="small"
              />
              <button
                type="button"
                className="wx-comment-send"
                disabled={!commentText.trim()}
                onClick={handleSubmitComment}
              >
                发送
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
