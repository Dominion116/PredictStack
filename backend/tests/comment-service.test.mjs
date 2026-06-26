import { describe, it, expect, beforeEach, vi } from 'vitest';
import { initCommentService, listComments, createComment, deleteComment } from '../services/comment-service.mjs';

function makeMockCol(initialDocs = []) {
  const docs = [...initialDocs];
  return {
    docs,
    find: vi.fn(() => ({
      sort: () => ({ skip: () => ({ limit: () => ({ toArray: async () => docs }) }) }),
    })),
    countDocuments: vi.fn(async () => docs.length),
    insertOne: vi.fn(async doc => {
      docs.push(doc);
      return { insertedId: 'new-id' };
    }),
    findOne: vi.fn(async ({ _id }) => docs.find(d => d._id?.toString() === _id?.toString()) ?? null),
    updateOne: vi.fn(async (filter, update) => {
      const doc = docs.find(d => d._id?.toString() === filter._id?.toString());
      if (doc && update.$set) Object.assign(doc, update.$set);
    }),
  };
}

describe('listComments', () => {
  it('returns empty when service not initialized', async () => {
    initCommentService(null);
    const result = await listComments(1);
    expect(result).toEqual({ comments: [], total: 0 });
  });

  it('redacts deleted comment bodies', async () => {
    const col = makeMockCol([
      { _id: '1', marketId: 1, authorAddress: 'SP1', body: 'hello', deletedAt: '2025-01-01', parentId: null },
    ]);
    initCommentService(col);
    const { comments } = await listComments(1);
    expect(comments[0].body).toBe('[deleted]');
  });

  it('does not redact live comments', async () => {
    const col = makeMockCol([
      { _id: '2', marketId: 1, authorAddress: 'SP1', body: 'hello', deletedAt: null, parentId: null },
    ]);
    initCommentService(col);
    const { comments } = await listComments(1);
    expect(comments[0].body).toBe('hello');
  });
});

describe('createComment', () => {
  beforeEach(() => {
    initCommentService(makeMockCol());
  });

  it('throws when body is empty', async () => {
    await expect(createComment(1, 'SP1', '')).rejects.toThrow(/required/i);
  });

  it('throws when body exceeds 500 chars', async () => {
    await expect(createComment(1, 'SP1', 'x'.repeat(501))).rejects.toThrow(/500/);
  });

  it('inserts and returns a comment document', async () => {
    const comment = await createComment(1, 'SP1ABC', 'Great prediction!');
    expect(comment.body).toBe('Great prediction!');
    expect(comment.authorAddress).toBe('SP1ABC');
    expect(comment.marketId).toBe(1);
  });
});

describe('deleteComment', () => {
  it('returns not-found for missing comment', async () => {
    initCommentService(makeMockCol());
    const result = await deleteComment('000000000000000000000001', 'SP1', []);
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/not found/i);
  });
});
