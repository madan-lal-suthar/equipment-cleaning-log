import type { Transaction } from 'sequelize';
import { AuditLog, type AuditAction, type FieldChange } from '../../models/AuditLog.js';
import type { CurrentUser } from '../../middleware/currentUser.js';
import { diffFields } from './diff.js';

export const AUDIT_ENTITY_CLEANING_RECORD = 'cleaning_record';

interface WriteAuditParams<T extends object> {
  entityType: string;
  entityId: string;
  action: AuditAction;
  actor: CurrentUser;
  before: T | null;
  after: Partial<T>;
  trackedFields: readonly (keyof T & string)[];
  transaction?: Transaction;
}

/**
 * Computes the diff and appends one audit entry. Returns the entry, or `null`
 * when an update turned out to be a no-op — writing "nothing changed" rows
 * would only add noise to the trail.
 *
 * Always call this inside the same transaction as the entity write, so a record
 * can never be persisted without its audit entry.
 */
export async function writeAuditEntry<T extends object>({
  entityType,
  entityId,
  action,
  actor,
  before,
  after,
  trackedFields,
  transaction,
}: WriteAuditParams<T>): Promise<AuditLog | null> {
  const changes: FieldChange[] = diffFields(before, after, trackedFields);

  if (action === 'update' && changes.length === 0) return null;

  return AuditLog.create(
    {
      entityType,
      entityId,
      action,
      changedById: actor.id,
      changedByName: actor.name,
      changes,
      changedAt: new Date(),
    },
    { transaction },
  );
}

export async function listAuditEntries(
  entityType: string,
  entityId: string,
): Promise<AuditLog[]> {
  return AuditLog.findAll({
    where: { entityType, entityId },
    order: [
      ['changedAt', 'DESC'],
      ['id', 'DESC'],
    ],
  });
}
