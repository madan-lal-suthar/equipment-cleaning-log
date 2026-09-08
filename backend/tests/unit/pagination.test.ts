import { describe, expect, it } from 'vitest';
import {
  buildKeysetPage,
  buildOffsetPage,
  decodeCursor,
  encodeCursor,
} from '../../src/lib/pagination.js';
import { BadRequestError } from '../../src/lib/errors.js';

const row = (id: string, cleanedAt: string) => ({ id, cleanedAt: new Date(cleanedAt) });

describe('cursor encoding', () => {
  it('round-trips a cursor', () => {
    const cursor = { cleanedAt: '2024-05-01T08:00:00.000Z', id: 'a3e1c2d4-0000-4000-8000-000000000001' };
    expect(decodeCursor(encodeCursor(cursor))).toEqual(cursor);
  });

  it('rejects a cursor that is not valid base64 JSON', () => {
    expect(() => decodeCursor('not-a-cursor')).toThrow(BadRequestError);
  });

  it('rejects a structurally wrong cursor', () => {
    const bad = Buffer.from(JSON.stringify({ id: 42 }), 'utf8').toString('base64url');
    expect(() => decodeCursor(bad)).toThrow(BadRequestError);
  });

  it('rejects a cursor holding an unparseable date', () => {
    const bad = Buffer.from(
      JSON.stringify({ id: 'x', cleanedAt: 'yesterday' }),
      'utf8',
    ).toString('base64url');
    expect(() => decodeCursor(bad)).toThrow(BadRequestError);
  });
});

describe('buildKeysetPage', () => {
  it('trims the extra look-ahead row and exposes a next cursor', () => {
    const rows = [
      row('id-3', '2024-05-03T08:00:00.000Z'),
      row('id-2', '2024-05-02T08:00:00.000Z'),
      row('id-1', '2024-05-01T08:00:00.000Z'),
    ];

    const page = buildKeysetPage(rows, 2);

    expect(page.data.map((r) => r.id)).toEqual(['id-3', 'id-2']);
    expect(page.pageInfo.hasNextPage).toBe(true);
    // The cursor points at the last row *kept*, not the look-ahead row.
    expect(decodeCursor(page.pageInfo.nextCursor!)).toEqual({
      id: 'id-2',
      cleanedAt: '2024-05-02T08:00:00.000Z',
    });
  });

  it('reports the last page when no extra row came back', () => {
    const page = buildKeysetPage([row('id-1', '2024-05-01T08:00:00.000Z')], 2);

    expect(page.data).toHaveLength(1);
    expect(page.pageInfo.hasNextPage).toBe(false);
    expect(page.pageInfo.nextCursor).toBeNull();
  });

  it('handles an empty result set', () => {
    const page = buildKeysetPage([], 20);

    expect(page.data).toEqual([]);
    expect(page.pageInfo).toEqual({ limit: 20, hasNextPage: false, nextCursor: null });
  });
});

describe('buildOffsetPage', () => {
  it('computes page metadata', () => {
    const page = buildOffsetPage(['a', 'b'], 5, 2, 2);

    expect(page.pageInfo).toEqual({
      page: 2,
      pageSize: 2,
      totalItems: 5,
      totalPages: 3,
      hasNextPage: true,
    });
  });

  it('has no next page on the final page', () => {
    expect(buildOffsetPage(['e'], 5, 3, 2).pageInfo.hasNextPage).toBe(false);
  });

  it('reports a single empty page when there are no rows', () => {
    expect(buildOffsetPage([], 0, 1, 20).pageInfo).toEqual({
      page: 1,
      pageSize: 20,
      totalItems: 0,
      totalPages: 1,
      hasNextPage: false,
    });
  });
});
