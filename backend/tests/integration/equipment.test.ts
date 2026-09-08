import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { api, closeDatabase, createEquipment, createUser, resetDatabase } from './helpers.js';
import { AuditLog, CleaningRecord, Equipment } from '../../src/models/index.js';

let userId: string;

beforeEach(async () => {
  await resetDatabase();
  userId = (await createUser()).id;
});

afterAll(closeDatabase);

const asUser = () => ({ 'X-User-Id': userId });

describe('equipment CRUD', () => {
  it('creates, reads, updates and deletes a piece of equipment', async () => {
    const created = await api()
      .post('/api/equipment')
      .set(asUser())
      .send({ name: 'Granulator GR-200', code: 'GR-200' })
      .expect(201);

    const { id } = created.body.data;
    expect(created.body.data).toMatchObject({
      name: 'Granulator GR-200',
      code: 'GR-200',
      status: 'active', // defaulted, not supplied
    });

    const read = await api().get(`/api/equipment/${id}`).expect(200);
    expect(read.body.data.id).toBe(id);

    const updated = await api()
      .patch(`/api/equipment/${id}`)
      .set(asUser())
      .send({ name: 'Granulator GR-201', status: 'retired' })
      .expect(200);
    expect(updated.body.data).toMatchObject({
      name: 'Granulator GR-201',
      code: 'GR-200', // untouched fields survive a partial update
      status: 'retired',
    });

    await api().delete(`/api/equipment/${id}`).set(asUser()).expect(204);
    await api().get(`/api/equipment/${id}`).expect(404);
  });

  it('trims a name and code before storing them', async () => {
    const { body } = await api()
      .post('/api/equipment')
      .set(asUser())
      .send({ name: '  Tablet Press TP-12  ', code: '  TP-12  ' })
      .expect(201);

    expect(body.data.name).toBe('Tablet Press TP-12');
    expect(body.data.code).toBe('TP-12');
  });

  it('reports validation failures per field', async () => {
    const { body } = await api()
      .post('/api/equipment')
      .set(asUser())
      .send({ name: '   ', code: '' })
      .expect(400);

    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.details).toEqual(
      expect.arrayContaining([
        { path: 'name', message: 'Name is required' },
        { path: 'code', message: 'Code is required' },
      ]),
    );
  });

  it('rejects a duplicate code against the offending field', async () => {
    await createEquipment({ code: 'GR-200' });

    const { body } = await api()
      .post('/api/equipment')
      .set(asUser())
      .send({ name: 'Another Granulator', code: 'GR-200' })
      .expect(409);

    expect(body.error.code).toBe('CONFLICT');
    expect(body.error.details).toEqual([
      { path: 'code', message: 'This code is already used by another record' },
    ]);
  });

  it('rejects a PATCH that changes nothing', async () => {
    const { id } = await createEquipment();

    const { body } = await api().patch(`/api/equipment/${id}`).set(asUser()).send({}).expect(400);

    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('404s on reading, updating or deleting an unknown id', async () => {
    const missing = '00000000-0000-4000-8000-000000000000';

    await api().get(`/api/equipment/${missing}`).expect(404);
    await api().patch(`/api/equipment/${missing}`).set(asUser()).send({ name: 'X' }).expect(404);
    await api().delete(`/api/equipment/${missing}`).set(asUser()).expect(404);
  });

  it('400s on an id that is not a uuid', async () => {
    await api().get('/api/equipment/not-a-uuid').expect(400);
  });

  it('requires a user for every write but not for reads', async () => {
    const { id } = await createEquipment();

    await api().post('/api/equipment').send({ name: 'N', code: 'C' }).expect(401);
    await api().patch(`/api/equipment/${id}`).send({ name: 'N' }).expect(401);
    await api().delete(`/api/equipment/${id}`).expect(401);

    await api().get('/api/equipment').expect(200);
    await api().get(`/api/equipment/${id}`).expect(200);
  });

  // The cascade is the destructive part of delete, and the audit trail is
  // deliberately *not* part of it: `audit_logs.entity_id` carries no foreign
  // key, so history outlives the row it describes. That is the whole point of
  // an append-only trail — a delete must not be able to rewrite the past.
  it('cascades to the cleaning records but leaves their audit history intact', async () => {
    const { id } = await createEquipment();

    const record = await api()
      .post(`/api/equipment/${id}/cleaning-records`)
      .set(asUser())
      .send({ cleanedAt: new Date().toISOString(), method: 'Autoclave' })
      .expect(201);
    const recordId = record.body.data.id;

    expect(await CleaningRecord.count({ where: { equipmentId: id } })).toBe(1);
    expect(await AuditLog.count({ where: { entityId: recordId } })).toBe(1);

    await api().delete(`/api/equipment/${id}`).set(asUser()).expect(204);

    expect(await Equipment.count({ where: { id } })).toBe(0);
    expect(await CleaningRecord.count({ where: { equipmentId: id } })).toBe(0);
    expect(await AuditLog.count({ where: { entityId: recordId } })).toBe(1);
  });

  /**
   * Documents a known inconsistency rather than endorsing it: the audit rows
   * outlive the delete in the database, but `getCleaningRecordAudit` resolves
   * the record before reading them, so the surviving history cannot be reached
   * through the API. Retained and unreadable is the worst of both options —
   * see "left out" in NOTES.md.
   */
  it('retains audit rows after a delete, but the endpoint can no longer reach them', async () => {
    const { id } = await createEquipment();

    const record = await api()
      .post(`/api/equipment/${id}/cleaning-records`)
      .set(asUser())
      .send({ cleanedAt: new Date().toISOString(), method: 'Autoclave' })
      .expect(201);
    const recordId = record.body.data.id;

    await api().delete(`/api/equipment/${id}`).set(asUser()).expect(204);

    // The rows are still there...
    expect(await AuditLog.count({ where: { entityId: recordId } })).toBe(1);

    // ...but both the record and its history now 404.
    await api().get(`/api/cleaning-records/${recordId}`).expect(404);
    await api().get(`/api/cleaning-records/${recordId}/audit`).expect(404);
  });

  it('leaves other equipment untouched when one is deleted', async () => {
    const doomed = await createEquipment({ code: 'DOOM-1' });
    const survivor = await createEquipment({ code: 'KEEP-1' });

    await api().delete(`/api/equipment/${doomed.id}`).set(asUser()).expect(204);

    await api().get(`/api/equipment/${survivor.id}`).expect(200);
  });
});
