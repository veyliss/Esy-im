/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { Avatar, Button, Card, Input, List, Modal, Space, Tag, Typography } from "antd";
import { DeleteOutlined, EnvironmentOutlined, LikeFilled, LikeOutlined, MessageOutlined } from "@ant-design/icons";
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
  const authorName = moment.user?.nickname || "用户";
  const imageLayout = images.length === 1 ? "is-single" : images.length === 2 ? "is-pair" : "is-grid";

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
    <Card className="moment-item ant-moment-card" styles={{ body: { padding: 0 } }}>
      <div className="ant-moment-main">
        <div className="ant-moment-header">
          <Space align="center" size={12}>
            <Avatar src={moment.user?.avatar || undefined} size={42}>{authorName.slice(0, 1).toUpperCase()}</Avatar>
            <div className="ant-moment-author">
              <Typography.Text strong>{authorName}</Typography.Text>
              <Typography.Text type="secondary">{formatTime(moment.created_at)}</Typography.Text>
            </div>
          </Space>
          {currentUser?.user_id === moment.user_id && (
            <Button
              aria-label="删除动态"
              danger
              icon={<DeleteOutlined />}
              shape="circle"
              title="删除动态"
              type="text"
              onClick={() => onDelete(moment.id)}
            />
          )}
        </div>

        {moment.content ? (
          <Typography.Paragraph className="ant-moment-content">
            {moment.content}
          </Typography.Paragraph>
        ) : null}

        {moment.location && (
          <Tag className="ant-moment-location" icon={<EnvironmentOutlined />}>
            {moment.location}
          </Tag>
        )}
      </div>

      {images.length > 0 && (
        <div className={`ant-moment-image-strip ${imageLayout}`}>
          {images.map((img: string, index: number) => (
            <Button
              type="text"
              key={index}
              className="moment-image-button"
              style={{ backgroundImage: `url(${img})` }}
              onClick={() => setPreviewImage(img)}
              aria-label="预览图片"
            />
          ))}
        </div>
      )}

      <div className="ant-moment-footer">
        <Space className="ant-moment-action-row" size={4}>
          <Button
            onClick={handleLikeClick}
            icon={isLiked ? <LikeFilled /> : <LikeOutlined />}
            className={`moment-action-button ${
              isLiked
                ? "is-active"
                : ""
            }`}
            type="text"
          >
            <span>{moment.like_count || 0}</span>
          </Button>
          <Button
            onClick={() => setShowCommentInput(!showCommentInput)}
            className="moment-action-button"
            icon={<MessageOutlined />}
            type="text"
          >
            <span>{moment.comment_count || 0}</span>
          </Button>
        </Space>

        {moment.likes && moment.likes.length > 0 && (
          <div className="ant-moment-meta">
            <LikeFilled />
            <Typography.Text type="secondary">
              {moment.likes
                .map((like: MomentLike) => like.user?.nickname)
                .join("、")}
            </Typography.Text>
          </div>
        )}

        {moment.comments && moment.comments.length > 0 && (
          <List
            className="ant-moment-comments"
            dataSource={moment.comments}
            renderItem={(comment: MomentComment) => (
              <List.Item className="ant-moment-comment">
                <List.Item.Meta
                  avatar={<Avatar src={comment.user?.avatar || undefined} size={24}>{comment.user?.nickname?.slice(0, 1) || "用"}</Avatar>}
                  title={
                    <span>
                      <Typography.Text strong>{comment.user?.nickname}</Typography.Text>
                      {comment.reply_to?.user ? (
                        <>
                          <Typography.Text type="secondary"> 回复 </Typography.Text>
                          <Typography.Text strong>{comment.reply_to.user.nickname}</Typography.Text>
                        </>
                      ) : null}
                    </span>
                  }
                  description={<Typography.Text type="secondary">{comment.content}</Typography.Text>}
                />
                <Button
                  className="ant-moment-reply"
                  size="small"
                  type="link"
                  onClick={() => handleReply(comment)}
                >
                  回复
                </Button>
              </List.Item>
            )}
          />
        )}

        {showCommentInput && (
          <div className="ant-moment-comment-form">
            {replyTo && (
              <div className="ant-moment-replying">
                <Typography.Text type="secondary">回复 @{replyTo.user?.nickname}</Typography.Text>
                <Button
                  size="small"
                  type="link"
                  onClick={() => {
                    setReplyTo(null);
                    setCommentContent("");
                  }}
                >
                  取消
                </Button>
              </div>
            )}
            <Space.Compact className="ant-moment-comment-input">
              <Input
                placeholder="写评论..."
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCommentSubmit();
                  }
                }}
              />
              <Button
                type="primary"
                onClick={handleCommentSubmit}
              >
                发送
              </Button>
            </Space.Compact>
          </div>
        )}
      </div>

      <Modal
        className="ant-app-image-modal"
        footer={null}
        open={Boolean(previewImage)}
        width="min(920px, calc(100vw - 32px))"
        onCancel={() => setPreviewImage(null)}
      >
        {previewImage ? <img src={previewImage} alt="动态图片预览" /> : null}
      </Modal>
    </Card>
  );
}
