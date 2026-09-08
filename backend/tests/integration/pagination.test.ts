import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import {
  api,
  closeDatabase,
  createEquipment,
  createUser,
  resetDatabase,
  seedRecords,
} from './helpers.js';
import { Equipment } from '../../src/models/index.js';

interface ListResponse {
  data: Array<{ id: string; status: string }>;
  pageInfo: { limit: number; hasNextPage: boolean; nextCursor: string | null };
}

let equipmentId: string;

beforeEach(async () => {
  await resetDatabase();
  await createUser();
  equipmentId = (await createEquipment()).id;
});

afterAll(closeDatabase);

/** Walks every page of the keyset list and returns the ids in the order seen. */
async function collectAllPages(limit: number, query: Record<string, string> = {}) {
  const ids: string[] = [];
  let cursor: string | null = null;
  let pages = 0;

  do {
    const response = await api()
      .get(`/api/equipment/${equipmentId}/cleaning-records`)
      .query({ limit, ...query, ...(cursor ? { cursor } : {}) })
      .expect(200);

    const body = response.body as ListResponse;
    ids.push(...body.data.map((r) => r.id));
    cursor = body.pageInfo.nextCursor;
    pages += 1;
    expect(pages).toBeLessThan(20); // guards against a cursor that never advances
  } while (cursor);

  return { ids, pages };
}

describe('keyset pagination of cleaning records', () => {
  it('returns newest first and pages through every record exactly once', async () => {
    const created = await seedRecords(
      equipmentId,
      Array.from({ length: 7 }, (_, i) => ({
        cleanedAt: `2024-05-0${i + 1}T08:00:00.000Z`,
      })),
    );
    const expected = [...created]
      .sort((a, b) => b.cleanedAt.getTime() - a.cleanedAt.getTime())
      .map((r) => r.id);

    const { ids, pages } = await collectAllPages(3);

    expect(pages).toBe(3);
    expect(ids).toEqual(expected);
    expect(new Set(ids).size).toBe(7);
  });

  it('does not skip or repeat rows that share a cleanedAt timestamp', async () => {
    // The interesting case for keyset pagination: ties in the sort column, with
    // the page boundary falling in the middle of them.
    await seedRecords(
      equipmentId,
      Array.from({ length: 6 }, () => ({ cleanedAt: '2024-05-01T08:00:00.000Z' })),
    );

    const { ids } = await collectAllPages(2);

    expect(ids).toHaveLength(6);
    expect(new Set(ids).size).toBe(6);
    // Ties are broken by id descending, so the whole list is strictly ordered.
    expect([...ids].sort().reverse()).toEqual(ids);
  });

  it('reports hasNextPage and stops handing out cursors on the last page', async () => {
    await seedRecords(equipmentId, [
      { cleanedAt: '2024-05-01T08:00:00.000Z' },
      { cleanedAt: '2024-05-02T08:00:00.000Z' },
    ]);

    const first = await api()
      .get(`/api/equipment/${equipmentId}/cleaning-records`)
      .query({ limit: 1 })
      .expect(200);
    expect(first.body.pageInfo.hasNextPage).toBe(true);
    expect(first.body.pageInfo.nextCursor).toBeTruthy();

    const second = await api()
      .get(`/api/equipment/${equipmentId}/cleaning-records`)
      .query({ limit: 1, cursor: first.body.pageInfo.nextCursor })
      .expect(200);
    expect(second.body.data).toHaveLength(1);
    expect(second.body.pageInfo.hasNextPage).toBe(false);
    expect(second.body.pageInfo.nextCursor).toBeNull();
  });

  it('keeps the status filter applied across pages', async () => {
    await seedRecords(equipmentId, [
      { cleanedAt: '2024-05-01T08:00:00.000Z', status: 'verified' },
      { cleanedAt: '2024-05-02T08:00:00.000Z', status: 'pending' },
      { cleanedAt: '2024-05-03T08:00:00.000Z', status: 'verified' },
      { cleanedAt: '2024-05-04T08:00:00.000Z', status: 'pending' },
      { cleanedAt: '2024-05-05T08:00:00.000Z', status: 'verified' },
    ]);

    const { ids, pages } = await collectAllPages(2, { status: 'verified' });

    expect(pages).toBe(2);
    expect(ids).toHaveLength(3);

    const all = await api()
      .get(`/api/equipment/${equipmentId}/cleaning-records`)
      .query({ status: 'verified' })
      .expect(200);
    expect(all.body.data.every((r: { status: string }) => r.status === 'verified')).toBe(true);
  });

  it('only returns records belonging to the requested equipment', async () => {
    const other = await createEquipment({ code: 'FBD-40', name: 'Fluid Bed Dryer' });
    await seedRecords(equipmentId, [{ cleanedAt: '2024-05-01T08:00:00.000Z' }]);
    await seedRecords(other.id, [
      { cleanedAt: '2024-05-02T08:00:00.000Z' },
      { cleanedAt: '2024-05-03T08:00:00.000Z' },
    ]);

    const { body } = await api()
      .get(`/api/equipment/${equipmentId}/cleaning-records`)
      .expect(200);

    expect(body.data).toHaveLength(1);
  });

  it('rejects a malformed cursor and an out-of-range limit', async () => {
    await api()
      .get(`/api/equipment/${equipmentId}/cleaning-records`)
      .query({ cursor: 'garbage' })
      .expect(400);

    await api()
      .get(`/api/equipment/${equipmentId}/cleaning-records`)
      .query({ limit: 500 })
      .expect(400);
  });

  it('404s instead of returning an empty page for unknown equipment', async () => {
    await api()
      .get('/api/equipment/11111111-1111-4111-8111-111111111111/cleaning-records')
      .expect(404);
  });
});

describe('offset pagination of equipment', () => {
  beforeEach(async () => {
    await Equipment.destroy({ where: {}, truncate: true, cascade: true });
    await Equipment.bulkCreate(
      Array.from({ length: 5 }, (_, i) => ({
        name: `Machine ${String.fromCharCode(65 + i)}`,
        code: `EQ-${i}`,
        status: i % 2 === 0 ? ('active' as const) : ('retired' as const),
      })),
    );
  });

  it('returns page metadata and the right slice', async () => {
    const { body } = await api().get('/api/equipment').query({ page: 2, pageSize: 2 }).expect(200);

    expect(body.data.map((e: { name: string }) => e.name)).toEqual(['Machine C', 'Machine D']);
    expect(body.pageInfo).toEqual({
      page: 2,
      pageSize: 2,
      totalItems: 5,
      totalPages: 3,
      hasNextPage: true,
    });
  });

  it('counts only the filtered rows', async () => {
    const { body } = await api()
      .get('/api/equipment')
      .query({ status: 'retired', pageSize: 10 })
      .expect(200);

    expect(body.data).toHaveLength(2);
    expect(body.pageInfo.totalItems).toBe(2);
    expect(body.pageInfo.hasNextPage).toBe(false);
  });

  it('returns an empty final page past the end', async () => {
    const { body } = await api().get('/api/equipment').query({ page: 9, pageSize: 2 }).expect(200);

    expect(body.data).toEqual([]);
    expect(body.pageInfo.hasNextPage).toBe(false);
  });

  it('applies the search filter and counts only what matches', async () => {
    const { body } = await api()
      .get('/api/equipment')
      .query({ search: 'Machine B', pageSize: 10 })
      .expect(200);

    expect(body.data.map((e: { name: string }) => e.name)).toEqual(['Machine B']);
    expect(body.pageInfo.totalItems).toBe(1);
  });

  // A stray space in the search box used to 400 the whole list, because
  // `.trim().min(1)` rejected a term that trimmed away to nothing.
  it.each([
    ['empty', ''],
    ['a single space', ' '],
    ['only whitespace', '   '],
  ])('treats a search of %s as no filter rather than a bad request', async (_label, search) => {
    const { body } = await api()
      .get('/api/equipment')
      .query({ search, pageSize: 10 })
      .expect(200);

    expect(body.data).toHaveLength(5);
    expect(body.pageInfo.totalItems).toBe(5);
  });

  it('trims a search term before matching', async () => {
    const { body } = await api()
      .get('/api/equipment')
      .query({ search: '  Machine C  ', pageSize: 10 })
      .expect(200);

    expect(body.data.map((e: { name: string }) => e.name)).toEqual(['Machine C']);
  });
});
