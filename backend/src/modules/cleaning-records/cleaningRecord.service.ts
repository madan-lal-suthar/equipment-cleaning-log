import { CleaningRecord, sequelize } from '../../models/index.js';
import type { AuditLog } from '../../models/AuditLog.js';
import { NotFoundError } from '../../lib/errors.js';
import {
  buildKeysetPage,
  cursorWhere,
  decodeCursor,
  type KeysetPage,
} from '../../lib/pagination.js';
import type { CurrentUser } from '../../middleware/currentUser.js';
import {
  AUDIT_ENTITY_CLEANING_RECORD,
  listAuditEntries,
  writeAuditEntry,
} from '../audit/audit.service.js';
import { getEquipmentOrFail } from '../equipment/equipment.service.js';
import type {
  CreateCleaningRecordInput,
  ListCleaningRecordsQuery,
  UpdateCleaningRecordInput,
} from './cleaningRecord.schemas.js';

/**
 * The business fields the audit trail tracks. Ids and timestamps are excluded:
 * they are either immutable or bookkeeping, and would add noise to the trail.
 */
export const AUDITED_FIELDS = ['cleanedBy', 'cleanedAt', 'method', 'notes', 'status'] as const;

type AuditedRecord = Pick<CleaningRecord, (typeof AUDITED_FIELDS)[number]>;

/**
 * Keyset pagination over (cleanedAt DESC, id DESC). One extra row is fetched to
 * decide `hasNextPage` without a second round-trip.
 */
export async function listCleaningRecords(
  equipmentId: string,
  query: ListCleaningRecordsQuery,
): Promise<KeysetPage<CleaningRecord>> {
  await getEquipmentOrFail(equipmentId); // 404 rather than an empty page for an unknown equipment

  const { limit, cursor, status } = query;

  const rows = await CleaningRecord.findAll({
    where: {
      equipmentId,
      ...(status && { status }),
      ...(cursor ? cursorWhere(decodeCursor(cursor)) : {}),
    },
    order: [
      ['cleanedAt', 'DESC'],
      ['id', 'DESC'],
    ],
    limit: limit + 1,
  });

  return buildKeysetPage(rows, limit);
}

export async function getCleaningRecordOrFail(id: string): Promise<CleaningRecord> {
  const record = await CleaningRecord.findByPk(id);
  if (!record) throw new NotFoundError('Cleaning record');
  return record;
}

/**
 * Create + audit entry in one transaction: a cleaning record must never exist
 * without the audit row that explains where it came from.
 */
export async function createCleaningRecord(
  equipmentId: string,
  input: CreateCleaningRecordInput,
  actor: CurrentUser,
): Promise<CleaningRecord> {
  await getEquipmentOrFail(equipmentId);

  return sequelize.transaction(async (transaction) => {
    const record = await CleaningRecord.create(
      {
        equipmentId,
        cleanedBy: input.cleanedBy ?? actor.name,
        cleanedAt: input.cleanedAt,
        method: input.method,
        notes: input.notes ?? null,
        status: input.status ?? 'pending',
      },
      { transaction },
    );

    await writeAuditEntry<AuditedRecord>({
      entityType: AUDIT_ENTITY_CLEANING_RECORD,
      entityId: record.id,
      action: 'create',
      actor,
      before: null,
      after: pickAudited(record),
      trackedFields: AUDITED_FIELDS,
      transaction,
    });

    return record;
  });
}

/**
 * Update + audit entry in one transaction. The row is locked FOR UPDATE while
 * the before-snapshot is taken, so two concurrent edits cannot produce a diff
 * against stale values.
 */
export async function updateCleaningRecord(
  id: string,
  input: UpdateCleaningRecordInput,
  actor: CurrentUser,
): Promise<CleaningRecord> {
  return sequelize.transaction(async (transaction) => {
    const record = await CleaningRecord.findByPk(id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!record) throw new NotFoundError('Cleaning record');

    const before = pickAudited(record);
    await record.update(input, { transaction });

    await writeAuditEntry<AuditedRecord>({
      entityType: AUDIT_ENTITY_CLEANING_RECORD,
      entityId: record.id,
      action: 'update',
      actor,
      before,
      // Diffed against what was actually persisted, not against the raw input.
      after: pickAudited(record, Object.keys(input) as (keyof AuditedRecord)[]),
      trackedFields: AUDITED_FIELDS,
      transaction,
    });

    return record;
  });
}

export async function getCleaningRecordAudit(id: string): Promise<AuditLog[]> {
  await getCleaningRecordOrFail(id);
  return listAuditEntries(AUDIT_ENTITY_CLEANING_RECORD, id);
}

/** Plain snapshot of the audited fields, optionally narrowed to submitted ones. */
function pickAudited(
  record: CleaningRecord,
  fields: readonly (keyof AuditedRecord)[] = AUDITED_FIELDS,
): AuditedRecord {
  const snapshot = {} as AuditedRecord;
  for (const field of fields) {
    if (!AUDITED_FIELDS.includes(field as (typeof AUDITED_FIELDS)[number])) continue;
    Object.assign(snapshot, { [field]: record.get(field) });
  }
  return snapshot;
}
