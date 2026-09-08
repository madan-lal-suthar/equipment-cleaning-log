import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import {
  api,
  closeDatabase,
  createEquipment,
  createUser,
  resetDatabase,
} from './helpers.js';
import type { User } from '../../src/models/index.js';

let user: User;
let equipmentId: string;

beforeEach(async () => {
  await resetDatabase();
  user = await createUser();
  equipmentId = (await createEquipment()).id;
});

afterAll(closeDatabase);

async function createRecord(body: Record<string, unknown> = {}) {
  const response = await api()
    .post(`/api/equipment/${equipmentId}/cleaning-records`)
    .set('X-User-Id', user.id)
    .send({
      cleanedAt: '2024-05-01T08:00:00.000Z',
      method: 'Clean-in-place (CIP)',
      ...body,
    });

  expect(response.status).toBe(201);
  return response.body.data;
}

describe('audit trail', () => {
  it('writes a create entry naming the actor and every populated field', async () => {
    const record = await createRecord({ notes: 'Residue check passed' });

    const { body } = await api().get(`/api/cleaning-records/${record.id}/audit`).expect(200);

    expect(body.data).toHaveLength(1);
    const [entry] = body.data;
    expect(entry.action).toBe('create');
    expect(entry.changedById).toBe(user.id);
    expect(entry.changedByName).toBe('Asha Menon');
    expect(entry.changes).toEqual([
      { field: 'cleanedBy', from: null, to: 'Asha Menon' },
      { field: 'cleanedAt', from: null, to: '2024-05-01T08:00:00.000Z' },
      { field: 'method', from: null, to: 'Clean-in-place (CIP)' },
      { field: 'notes', from: null, to: 'Residue check passed' },
      { field: 'status', from: null, to: 'pending' },
    ]);
  });

  it('records only the changed fields on update, as old -> new', async () => {
    const record = await createRecord();

    await api()
      .patch(`/api/cleaning-records/${record.id}`)
      .set('X-User-Id', user.id)
      .send({ status: 'verified', method: 'Clean-in-place (CIP)', notes: 'Swab sample taken' })
      .expect(200);

    const { body } = await api().get(`/api/cleaning-records/${record.id}/audit`).expect(200);

    expect(body.data).toHaveLength(2);
    // Newest first.
    expect(body.data[0].action).toBe('update');
    expect(body.data[0].changes).toEqual([
      { field: 'notes', from: null, to: 'Swab sample taken' },
      { field: 'status', from: 'pending', to: 'verified' },
    ]);
    expect(body.data[1].action).toBe('create');
  });

  it('attributes an update to the user who made it, not the original author', async () => {
    const record = await createRecord();
    const reviewer = await createUser('Daniel Okafor');

    await api()
      .patch(`/api/cleaning-records/${record.id}`)
      .set('X-User-Id', reviewer.id)
      .send({ status: 'verified' })
      .expect(200);

    const { body } = await api().get(`/api/cleaning-records/${record.id}/audit`).expect(200);

    expect(body.data[0].changedByName).toBe('Daniel Okafor');
    expect(body.data[1].changedByName).toBe('Asha Menon');
  });

  it('does not write an entry when an update changes nothing', async () => {
    const record = await createRecord();

    await api()
      .patch(`/api/cleaning-records/${record.id}`)
      .set('X-User-Id', user.id)
      .send({ method: 'Clean-in-place (CIP)', status: 'pending' })
      .expect(200);

    const { body } = await api().get(`/api/cleaning-records/${record.id}/audit`).expect(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].action).toBe('create');
  });

  it('records clearing a field as value -> null', async () => {
    const record = await createRecord({ notes: 'Initial note' });

    await api()
      .patch(`/api/cleaning-records/${record.id}`)
      .set('X-User-Id', user.id)
      .send({ notes: null })
      .expect(200);

    const { body } = await api().get(`/api/cleaning-records/${record.id}/audit`).expect(200);
    expect(body.data[0].changes).toEqual([{ field: 'notes', from: 'Initial note', to: null }]);
  });

  it('leaves no record and no audit entry behind when the write is rejected', async () => {
    const before = await api().get(`/api/equipment/${equipmentId}/cleaning-records`).expect(200);

    await api()
      .post(`/api/equipment/${equipmentId}/cleaning-records`)
      .set('X-User-Id', user.id)
      .send({ cleanedAt: 'not-a-date', method: '' })
      .expect(400);

    const after = await api().get(`/api/equipment/${equipmentId}/cleaning-records`).expect(200);
    expect(after.body.data).toHaveLength(before.body.data.length);
  });

  it('requires a known user to write', async () => {
    await api()
      .post(`/api/equipment/${equipmentId}/cleaning-records`)
      .send({ cleanedAt: '2024-05-01T08:00:00.000Z', method: 'Manual wipe-down' })
      .expect(401);

    await api()
      .post(`/api/equipment/${equipmentId}/cleaning-records`)
      .set('X-User-Id', '11111111-1111-4111-8111-111111111111')
      .send({ cleanedAt: '2024-05-01T08:00:00.000Z', method: 'Manual wipe-down' })
      .expect(401);
  });

  it('404s for the audit trail of an unknown record', async () => {
    await api()
      .get('/api/cleaning-records/11111111-1111-4111-8111-111111111111/audit')
      .expect(404);
  });
});
