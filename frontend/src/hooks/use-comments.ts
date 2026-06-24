'use client';

import { useCallback, useEffect, useState } from 'react';
import { getComments, postComment, deleteComment, Comment } from '@/api/comments';

export function useComments(marketId: number | string, limit = 20) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getComments(marketId, p, limit);
      setComments(data.comments);
      setTotal(data.total);
      setPage(p);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, [marketId, limit]);

  useEffect(() => { fetchPage(1); }, [fetchPage]);

  const addComment = useCallback(async (
    authorAddress: string,
    body: string,
    parentId?: string | null,
  ) => {
    setSubmitting(true);
    setError(null);
    try {
      const { comment } = await postComment(marketId, authorAddress, body, parentId);
      // Optimistically prepend the new comment
      setComments(prev => [comment, ...prev]);
      setTotal(prev => prev + 1);
      return comment;
    } catch (err: any) {
      setError(err.message ?? 'Failed to post comment');
      return null;
    } finally {
      setSubmitting(false);
    }
  }, [marketId]);

  const removeComment = useCallback(async (commentId: string, requestingAddress: string) => {
    try {
      await deleteComment(marketId, commentId, requestingAddress);
      // Optimistically mark as deleted
      setComments(prev =>
        prev.map(c => c._id === commentId ? { ...c, body: '[deleted]', deletedAt: new Date().toISOString() } : c)
      );
    } catch (err: any) {
      setError(err.message ?? 'Failed to delete comment');
    }
  }, [marketId]);

  return {
    comments,
    total,
    page,
    loading,
    submitting,
    error,
    goToPage: fetchPage,
    addComment,
    removeComment,
  };
}
