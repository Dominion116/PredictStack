import { backendFetch } from './client';

export interface Comment {
  _id: string;
  marketId: number;
  authorAddress: string;
  body: string;
  parentId: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CommentsResponse {
  comments: Comment[];
  total: number;
  page: number;
  limit: number;
}

export async function getComments(
  marketId: number | string,
  page = 1,
  limit = 20,
): Promise<CommentsResponse> {
  return backendFetch<CommentsResponse>(
    `/api/markets/${marketId}/comments?page=${page}&limit=${limit}`,
  );
}

export async function postComment(
  marketId: number | string,
  authorAddress: string,
  body: string,
  parentId?: string | null,
): Promise<{ comment: Comment }> {
  return backendFetch<{ comment: Comment }>(`/api/markets/${marketId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ authorAddress, body, parentId: parentId ?? null }),
  });
}

export async function deleteComment(
  marketId: number | string,
  commentId: string,
  requestingAddress: string,
): Promise<{ success: boolean }> {
  return backendFetch<{ success: boolean }>(
    `/api/markets/${marketId}/comments/${commentId}`,
    {
      method: 'DELETE',
      body: JSON.stringify({ requestingAddress }),
    },
  );
}
