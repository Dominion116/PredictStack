'use client';

import { useState } from 'react';
import { Comment } from '@/api/comments';
import { CommentForm } from './CommentForm';

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function shortAddress(address: string) {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

interface Props {
  comment: Comment;
  connectedAddress?: string | null;
  onReply: (body: string, parentId: string) => Promise<unknown>;
  onDelete: (commentId: string) => Promise<void>;
  replies?: Comment[];
}

export function CommentItem({ comment, connectedAddress, onReply, onDelete, replies = [] }: Props) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const isDeleted = Boolean(comment.deletedAt);
  const canDelete = connectedAddress && connectedAddress === comment.authorAddress && !isDeleted;

  return (
    <div className="py-3">
      <div className="flex items-start gap-2">
        <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium shrink-0">
          {comment.authorAddress.slice(2, 4).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium font-mono text-muted-foreground">
              {shortAddress(comment.authorAddress)}
            </span>
            <time className="text-xs text-muted-foreground">{relativeTime(comment.createdAt)}</time>
          </div>
          <p className={`text-sm mt-0.5 ${isDeleted ? 'text-muted-foreground italic' : 'text-foreground'}`}>
            {comment.body}
          </p>
          {!isDeleted && (
            <div className="flex gap-3 mt-1">
              {connectedAddress && (
                <button
                  className="text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setShowReplyForm(v => !v)}
                >
                  Reply
                </button>
              )}
              {canDelete && (
                <button
                  className="text-xs text-destructive hover:underline"
                  onClick={() => onDelete(comment._id)}
                >
                  Delete
                </button>
              )}
            </div>
          )}
          {showReplyForm && (
            <div className="mt-2">
              <CommentForm
                authorAddress={connectedAddress!}
                parentId={comment._id}
                onSubmit={async (body, parentId) => {
                  await onReply(body, parentId!);
                  setShowReplyForm(false);
                }}
                onCancel={() => setShowReplyForm(false)}
                placeholder={`Reply to ${shortAddress(comment.authorAddress)}…`}
              />
            </div>
          )}
        </div>
      </div>

      {replies.length > 0 && (
        <div className="ml-9 mt-2 border-l border-border pl-3 space-y-2">
          {replies.map(reply => (
            <CommentItem
              key={reply._id}
              comment={reply}
              connectedAddress={connectedAddress}
              onReply={onReply}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
