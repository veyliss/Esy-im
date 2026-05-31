import { useState } from "react";
import type { Moment, User, MomentLike, MomentComment } from "@/lib/types/api";
import { formatTime } from "@/lib/utils/time";
import { UserAvatar } from "@/components/ui/user-avatar";

interface MomentItemProps {
  moment: Moment;
  currentUser: User | null;
  onLike: (momentId: number) => void;
  onUnlike: (momentId: number) => void;
  onComment: (momentId: number, content: string, replyToId?: number | null) => void;
  onDelete: (momentId: number) => void;
}

export function MomentItem({
  moment,
  currentUser,
  onLike,
  onUnlike,
  onComment,
  onDelete,
}: MomentItemProps) {
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentContent, setCommentContent] = useState("");
  const [replyTo, setReplyTo] = useState<MomentComment | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const images = (() => {
    if (!moment.images) return [];
    try {
      const parsed = JSON.parse(moment.images);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();
  const isLiked = moment.likes?.some(
    (like: MomentLike) => like.user_id === currentUser?.user_id
  );

  const handleLikeClick = () => {
    if (isLiked) {
      onUnlike(moment.id);
    } else {
      onLike(moment.id);
    }
  };

  const handleCommentSubmit = () => {
    if (!commentContent.trim()) return;

    onComment(moment.id, commentContent.trim(), replyTo?.id || null);
    setCommentContent("");
    setReplyTo(null);
    setShowCommentInput(false);
  };

  const handleReply = (comment: MomentComment) => {
    setReplyTo(comment);
    setShowCommentInput(true);
    setCommentContent(`@${comment.user?.nickname || "用户"} `);
  };

  return (
    <article className="moment-item im-panel overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="p-5">
        <div className="mb-3 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <UserAvatar
              src={moment.user?.avatar || "/default-avatar.png"}
              name={moment.user?.nickname || "用户"}
              size="md"
              border
            />
            <div>
              <p className="font-bold text-slate-800 dark:text-slate-200">
                {moment.user?.nickname}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {formatTime(moment.created_at)}
              </p>
            </div>
          </div>
          {currentUser?.user_id === moment.user_id && (
            <button
              type="button"
              onClick={() => onDelete(moment.id)}
              className="workspace-icon-button"
              aria-label="删除动态"
              title="删除动态"
            >
              <span className="material-symbols-outlined text-lg">delete</span>
            </button>
          )}
        </div>

        <p className="mb-4 whitespace-pre-wrap text-[15px] leading-6 text-slate-700 dark:text-slate-300">
          {moment.content}
        </p>

        {moment.location && (
          <div className="mb-3 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <span className="material-symbols-outlined text-sm">location_on</span>
            <span>{moment.location}</span>
          </div>
        )}
      </div>

      {images.length > 0 && (
        <div className={`grid gap-1 bg-slate-100 p-px dark:bg-slate-800 ${images.length === 1 ? "" : "grid-cols-3"}`}>
          {images.map((img: string, index: number) => (
            <button
              type="button"
              key={index}
              className={`moment-image-button ${images.length === 1 ? "aspect-video" : "aspect-square"}`}
              style={{ backgroundImage: `url(${img})` }}
              onClick={() => setPreviewImage(img)}
              aria-label="预览图片"
            />
          ))}
        </div>
      )}

      <div className="border-t border-slate-200 p-2 dark:border-slate-800">
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={handleLikeClick}
            className={`moment-action-button ${
              isLiked
                ? "is-active"
                : ""
            }`}
          >
            <span className="material-symbols-outlined text-lg">
              {isLiked ? "thumb_up" : "thumb_up"}
            </span>
            <span>{moment.like_count || 0}</span>
          </button>
          <button
            type="button"
            onClick={() => setShowCommentInput(!showCommentInput)}
            className="moment-action-button"
          >
            <span className="material-symbols-outlined text-lg">chat_bubble</span>
            <span>{moment.comment_count || 0}</span>
          </button>
        </div>

        {moment.likes && moment.likes.length > 0 && (
          <div className="moment-meta mt-3 border-t border-slate-200 pt-3 dark:border-slate-800">
            <div className="flex items-center gap-2 text-sm">
              <span className="material-symbols-outlined text-primary text-base">
                thumb_up
              </span>
              <span className="text-slate-600 dark:text-slate-400">
                {moment.likes
                  .map((like: MomentLike) => like.user?.nickname)
                  .join("、")}
              </span>
            </div>
          </div>
        )}

        {moment.comments && moment.comments.length > 0 && (
          <div className="mt-3 space-y-2 border-t border-slate-200 pt-3 dark:border-slate-800">
            {moment.comments.map((comment: MomentComment) => (
              <div key={comment.id} className="text-sm">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {comment.user?.nickname}
                </span>
                {comment.reply_to?.user && (
                  <>
                    <span className="text-slate-500 dark:text-slate-400"> 回复 </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {comment.reply_to.user.nickname}
                    </span>
                  </>
                )}
                <span className="text-slate-600 dark:text-slate-400">
                  : {comment.content}
                </span>
                <button
                  type="button"
                  onClick={() => handleReply(comment)}
                  className="ml-2 text-xs text-primary hover:underline"
                >
                  回复
                </button>
              </div>
            ))}
          </div>
        )}

        {showCommentInput && (
          <div className="mt-3 border-t border-slate-200 pt-3 dark:border-slate-800">
            {replyTo && (
              <div className="mb-2 text-xs text-slate-500 dark:text-slate-400">
                回复 @{replyTo.user?.nickname}
                <button
                  type="button"
                  onClick={() => {
                    setReplyTo(null);
                    setCommentContent("");
                  }}
                  className="ml-2 text-primary hover:underline"
                >
                  取消
                </button>
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="写评论..."
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCommentSubmit();
                  }
                }}
                className="ui-input flex-1 rounded-lg px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={handleCommentSubmit}
                className="im-primary-button"
              >
                发送
              </button>
            </div>
          </div>
        )}
      </div>

      {previewImage ? (
        <div className="moment-preview-overlay" role="dialog" aria-modal="true" onClick={() => setPreviewImage(null)}>
          <button
            type="button"
            className="moment-preview-close"
            onClick={() => setPreviewImage(null)}
            aria-label="关闭预览"
            title="关闭"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewImage} alt="动态图片预览" onClick={(event) => event.stopPropagation()} />
        </div>
      ) : null}
    </article>
  );
}
