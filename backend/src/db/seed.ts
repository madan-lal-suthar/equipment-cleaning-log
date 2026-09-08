import { sequelize, CleaningRecord, Equipment, User } from '../models/index.js';
import { AuditLog } from '../models/AuditLog.js';
import { AUDIT_ENTITY_CLEANING_RECORD } from '../modules/audit/audit.service.js';

const METHODS = ['Clean-in-place (CIP)', 'Manual wipe-down', 'Solvent rinse', 'Autoclave'];

/**
 * Idempotent-ish demo data: wipes the domain tables and re-inserts a small,
 * deterministic-looking data set with enough cleaning records to page through.
 */
async function seed(): Promise<void> {
  await sequelize.transaction(async (transaction) => {
    await AuditLog.destroy({ where: {}, transaction });
    await CleaningRecord.destroy({ where: {}, transaction });
    await Equipment.destroy({ where: {}, transaction });
    await User.destroy({ where: {}, transaction });

    const users = await User.bulkCreate(
      [
        { name: 'Asha Menon', email: 'asha.menon@example.com' },
        { name: 'Daniel Okafor', email: 'daniel.okafor@example.com' },
        { name: 'Priya Raman', email: 'priya.raman@example.com' },
      ],
      { transaction, returning: true },
    );

    const equipment = await Equipment.bulkCreate(
      [
        { name: 'Granulator GR-200', code: 'GR-200', status: 'active' as const },
        { name: 'Fluid Bed Dryer FBD-40', code: 'FBD-40', status: 'active' as const },
        { name: 'Tablet Press TP-12', code: 'TP-12', status: 'active' as const },
        { name: 'Coating Pan CP-5', code: 'CP-5', status: 'retired' as const },
      ],
      { transaction, returning: true },
    );

    // 25 records on the first machine so the default page size (20) pages twice.
    const perEquipment = [25, 8, 3, 0];
    const now = Date.now();

    for (const [index, item] of equipment.entries()) {
      const count = perEquipment[index] ?? 0;

      for (let i = 0; i < count; i += 1) {
        const actor = users[i % users.length]!;
        const cleanedAt = new Date(now - (i + 1) * 6 * 60 * 60 * 1000);
        const status = i % 3 === 0 ? ('verified' as const) : ('pending' as const);

        const record = await CleaningRecord.create(
          {
            equipmentId: item.id,
            cleanedBy: actor.name,
            cleanedAt,
            method: METHODS[i % METHODS.length]!,
            notes: i % 4 === 0 ? 'Routine changeover cleaning.' : null,
            status,
          },
          { transaction },
        );

        await AuditLog.create(
          {
            entityType: AUDIT_ENTITY_CLEANING_RECORD,
            entityId: record.id,
            action: 'create',
            changedById: actor.id,
            changedByName: actor.name,
            changedAt: cleanedAt,
            changes: [
              { field: 'cleanedBy', from: null, to: record.cleanedBy },
              { field: 'cleanedAt', from: null, to: cleanedAt.toISOString() },
              { field: 'method', from: null, to: record.method },
              ...(record.notes ? [{ field: 'notes', from: null, to: record.notes }] : []),
              { field: 'status', from: null, to: 'pending' },
            ],
          },
          { transaction },
        );

        // Give the verified records a second entry, so the UI shows a real
        // old -> new transition out of the box.
        if (status === 'verified') {
          await AuditLog.create(
            {
              entityType: AUDIT_ENTITY_CLEANING_RECORD,
              entityId: record.id,
              action: 'update',
              changedById: users[(i + 1) % users.length]!.id,
              changedByName: users[(i + 1) % users.length]!.name,
              changedAt: new Date(cleanedAt.getTime() + 45 * 60 * 1000),
              changes: [{ field: 'status', from: 'pending', to: 'verified' }],
            },
            { transaction },
          );
        }
      }
    }

    console.log(
      `Seeded ${users.length} users, ${equipment.length} equipment and ${perEquipment.reduce((a, b) => a + b, 0)} cleaning records.`,
    );
    console.log(`Sign in as: ${users.map((u) => `${u.name} <${u.id}>`).join(', ')}`);
  });

  await sequelize.close();
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
