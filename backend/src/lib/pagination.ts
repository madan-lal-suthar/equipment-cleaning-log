import { Op, type WhereOptions } from 'sequelize';
import { BadRequestError } from './errors.js';

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/** Position of the last row of a page, in the list's sort order. */
export interface Cursor {
  cleanedAt: string;
  id: string;
}

export interface KeysetPage<T> {
  data: T[];
  pageInfo: {
    limit: number;
    hasNextPage: boolean;
    nextCursor: string | null;
  };
}

export interface OffsetPage<T> {
  data: T[];
  pageInfo: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
  };
}

/**
 * Cursors are opaque to clients on purpose: base64url so nobody is tempted to
 * hand-craft one, but readable in a debugger. It is not a security boundary.
 */
export function encodeCursor(cursor: Cursor): string {
  return Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64url');
}

export function decodeCursor(raw: string): Cursor {
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'));
  } catch {
    throw new BadRequestError('Invalid cursor');
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    typeof (parsed as Cursor).id !== 'string' ||
    typeof (parsed as Cursor).cleanedAt !== 'string' ||
    Number.isNaN(Date.parse((parsed as Cursor).cleanedAt))
  ) {
    throw new BadRequestError('Invalid cursor');
  }

  return { cleanedAt: (parsed as Cursor).cleanedAt, id: (parsed as Cursor).id };
}

/**
 * Keyset predicate for the ordering (cleaned_at DESC, id DESC): everything
 * strictly "after" the cursor row. `id` breaks ties so records sharing a
 * timestamp are never skipped or repeated across pages.
 */
export function cursorWhere(cursor: Cursor): WhereOptions {
  const cleanedAt = new Date(cursor.cleanedAt);
  return {
    [Op.or]: [
      { cleanedAt: { [Op.lt]: cleanedAt } },
      { cleanedAt, id: { [Op.lt]: cursor.id } },
    ],
  };
}

/**
 * Fetches `limit + 1` rows so `hasNextPage` is known without a second query,
 * then trims the extra row and derives the cursor from the last kept row.
 */
export function buildKeysetPage<T extends { id: string; cleanedAt: Date }>(
  rows: T[],
  limit: number,
): KeysetPage<T> {
  const hasNextPage = rows.length > limit;
  const data = hasNextPage ? rows.slice(0, limit) : rows;
  const last = data.at(-1);

  return {
    data,
    pageInfo: {
      limit,
      hasNextPage,
      nextCursor:
        hasNextPage && last
          ? encodeCursor({ cleanedAt: last.cleanedAt.toISOString(), id: last.id })
          : null,
    },
  };
}

export function buildOffsetPage<T>(
  rows: T[],
  totalItems: number,
  page: number,
  pageSize: number,
): OffsetPage<T> {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  return {
    data: rows,
    pageInfo: { page, pageSize, totalItems, totalPages, hasNextPage: page < totalPages },
  };
}
