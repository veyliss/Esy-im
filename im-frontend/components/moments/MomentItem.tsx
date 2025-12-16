import { useState } from "react";
import type { Moment, User, MomentLike, MomentComment } from "@/lib/types/api";
import { formatTime } from "@/lib/utils/time";

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

  const images = moment.images ? JSON.parse(moment.images) : [];
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
    <div className="bg-white dark:bg-[#182430] rounded-2xl shadow-sm border border-slate-200/50 dark:border-slate-700/50 overflow-hidden hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <img
              src={moment.user?.avatar || "https://via.placeholder.com/40"}
              alt={moment.user?.nickname}
              className="size-10 rounded-full object-cover"
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
              onClick={() => onDelete(moment.id)}
              className="text-slate-400 hover:text-red-500 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">delete</span>
            </button>
          )}
        </div>

        {/* Content */}
        <p className="mb-4 text-sm leading-relaxed whitespace-pre-wrap">
          {moment.content}
        </p>

        {/* Location */}
        {moment.location && (
          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mb-3">
            <span className="material-symbols-outlined text-sm">location_on</span>
            <span>{moment.location}</span>
          </div>
        )}
      </div>

      {/* Images */}
      {images.length > 0 && (
        <div className={`grid gap-1 ${images.length === 1 ? "" : "grid-cols-3"}`}>
          {images.map((img: string, index: number) => (
            <div
              key={index}
              className={`${images.length === 1 ? "aspect-video" : "aspect-square"} bg-cover bg-center`}
              style={{ backgroundImage: `url(${img})` }}
            />
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800">
        <div className="flex justify-end gap-2">
          <button
            onClick={handleLikeClick}
            className={`flex items-center gap-1.5 text-sm py-1 px-3 rounded-full hover:bg-primary/10 transition-colors ${
              isLiked
                ? "text-primary"
                : "text-slate-600 dark:text-slate-300 hover:text-primary"
            }`}
          >
            <span className="material-symbols-outlined text-lg">
              {isLiked ? "thumb_up" : "thumb_up"}
            </span>
            <span>{moment.like_count || 0}</span>
          </button>
          <button
            onClick={() => setShowCommentInput(!showCommentInput)}
            className="flex items-center gap-1.5 text-sm py-1 px-3 rounded-full hover:bg-primary/10 text-slate-600 dark:text-slate-300 hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-lg">chat_bubble</span>
            <span>{moment.comment_count || 0}</span>
          </button>
        </div>

        {/* Likes */}
        {moment.likes && moment.likes.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800">
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

        {/* Comments */}
        {moment.comments && moment.comments.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
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
                  onClick={() => handleReply(comment)}
                  className="ml-2 text-xs text-primary hover:underline"
                >
                  回复
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Comment Input */}
        {showCommentInput && (
          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            {replyTo && (
              <div className="mb-2 text-xs text-slate-500 dark:text-slate-400">
                回复 @{replyTo.user?.nickname}
                <button
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
                className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-background-light dark:bg-background-dark focus:border-primary focus:ring-2 focus:ring-primary/20 px-3 py-2 text-sm transition-all"
              />
              <button
                onClick={handleCommentSubmit}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
              >
                发送
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
