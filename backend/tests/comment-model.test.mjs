import { describe, it, expect } from 'vitest';
import { buildComment, validateCommentBody } from '../models/comment.mjs';

describe('validateCommentBody', () => {
  it('returns ok for a valid comment', () => {
    const result = validateCommentBody('Hello world');
    expect(result.ok).toBe(true);
    expect(result.text).toBe('Hello world');
  });

  it('trims whitespace', () => {
    const result = validateCommentBody('  trimmed  ');
    expect(result.text).toBe('trimmed');
  });

  it('rejects empty string', () => {
    const result = validateCommentBody('');
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/required/i);
  });

  it('rejects whitespace-only string', () => {
    const result = validateCommentBody('   ');
    expect(result.ok).toBe(false);
  });

  it('rejects body over 500 characters', () => {
    const result = validateCommentBody('a'.repeat(501));
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/500/);
  });

  it('accepts exactly 500 characters', () => {
    const result = validateCommentBody('a'.repeat(500));
    expect(result.ok).toBe(true);
  });
});

describe('buildComment', () => {
  it('creates a comment document with all required fields', () => {
    const comment = buildComment(1, 'SP1ABC', 'Great market!');
    expect(comment.marketId).toBe(1);
    expect(comment.authorAddress).toBe('SP1ABC');
    expect(comment.body).toBe('Great market!');
    expect(comment.parentId).toBeNull();
    expect(comment.deletedAt).toBeNull();
    expect(comment.createdAt).toBeTruthy();
    expect(comment.updatedAt).toBeTruthy();
  });

  it('sets parentId when provided', () => {
    const comment = buildComment(1, 'SP1ABC', 'Reply!', 'parent-id-123');
    expect(comment.parentId).toBe('parent-id-123');
  });

  it('coerces marketId to number', () => {
    const comment = buildComment('5', 'SP1ABC', 'test');
    expect(comment.marketId).toBe(5);
  });
});
