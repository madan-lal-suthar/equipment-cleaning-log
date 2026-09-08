import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../../src/app.js';
import { AuditLog, CleaningRecord, Equipment, User, sequelize } from '../../src/models/index.js';

export const app: Express = createApp();
export const api = () => request(app);

export async function resetDatabase(): Promise<void> {
  await AuditLog.destroy({ where: {}, truncate: true, cascade: true });
  await CleaningRecord.destroy({ where: {}, truncate: true, cascade: true });
  await Equipment.destroy({ where: {}, truncate: true, cascade: true });
  await User.destroy({ where: {}, truncate: true, cascade: true });
}

export async function closeDatabase(): Promise<void> {
  await sequelize.close();
}

export async function createUser(name = 'Asha Menon'): Promise<User> {
  return User.create({ name, email: `${name.toLowerCase().replace(/\s+/g, '.')}@example.com` });
}

export async function createEquipment(overrides: Partial<{ name: string; code: string }> = {}) {
  return Equipment.create({
    name: overrides.name ?? 'Granulator GR-200',
    code: overrides.code ?? `GR-${Math.random().toString(36).slice(2, 8)}`,
  });
}

/** Inserts records directly, bypassing the API, to set up pagination fixtures. */
export async function seedRecords(
  equipmentId: string,
  rows: Array<{ cleanedAt: string; status?: 'pending' | 'verified'; method?: string }>,
) {
  return CleaningRecord.bulkCreate(
    rows.map((row) => ({
      equipmentId,
      cleanedBy: 'Asha Menon',
      cleanedAt: new Date(row.cleanedAt),
      method: row.method ?? 'Clean-in-place (CIP)',
      notes: null,
      status: row.status ?? ('pending' as const),
    })),
    { returning: true },
  );
}
