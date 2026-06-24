'use client';

import { useComments } from '@/hooks/use-comments';
import { CommentForm } from './CommentForm';
import { CommentItem } from './CommentItem';
import { Comment } from '@/api/comments';

interface Props {
  marketId: number | string;
  connectedAddress?: string | null;
}

function buildThread(comments: Comment[]): { root: Comment; replies: Comment[] }[] {
  const roots = comments.filter(c => !c.parentId);
  return roots.map(root => ({
    root,
    replies: comments.filter(c => c.parentId === root._id),
  }));
}

function CommentSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex gap-2">
          <div className="w-7 h-7 rounded-full bg-muted shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-muted rounded w-24" />
            <div className="h-3 bg-muted rounded w-full" />
            <div className="h-3 bg-muted rounded w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CommentThread({ marketId, connectedAddress }: Props) {
  const { comments, total, page, loading, submitting, error, goToPage, addComment, removeComment } =
    useComments(marketId, 20);

  const thread = buildThread(comments);
  const totalPages = Math.ceil(total / 20);

  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold mb-4">
        Discussion{total > 0 ? ` (${total})` : ''}
      </h2>

      {connectedAddress && (
        <div className="mb-6">
          <CommentForm
            authorAddress={connectedAddress}
            onSubmit={(body) => addComment(connectedAddress, body, null)}
            placeholder="Share your analysis or prediction…"
          />
          {submitting && <p className="text-xs text-muted-foreground mt-1">Posting…</p>}
        </div>
      )}

      {error && <p className="text-sm text-destructive mb-4">{error}</p>}

      {loading && comments.length === 0 ? (
        <CommentSkeleton />
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No comments yet. Start the discussion!
        </p>
      ) : (
        <div className="divide-y divide-border">
          {thread.map(({ root, replies }) => (
            <CommentItem
              key={root._id}
              comment={root}
              replies={replies}
              connectedAddress={connectedAddress}
              onReply={(body, parentId) => addComment(connectedAddress!, body, parentId)}
              onDelete={(id) => removeComment(id, connectedAddress!)}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            className="px-3 py-1 text-sm border rounded disabled:opacity-40"
            disabled={page <= 1 || loading}
            onClick={() => goToPage(page - 1)}
          >
            Previous
          </button>
          <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
          <button
            className="px-3 py-1 text-sm border rounded disabled:opacity-40"
            disabled={page >= totalPages || loading}
            onClick={() => goToPage(page + 1)}
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
}
