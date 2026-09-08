import type { FieldChange } from '../../models/AuditLog.js';

export type { FieldChange };

/**
 * Values are normalised before comparison so that equal-but-differently-typed
 * inputs (a Date vs. its ISO string, `undefined` vs. `null`) do not show up as
 * spurious changes in the audit trail.
 */
export function normaliseValue(value: unknown): unknown {
  if (value === undefined) return null;
  if (value instanceof Date) return value.toISOString();
  return value;
}

function isEqual(a: unknown, b: unknown): boolean {
  const left = normaliseValue(a);
  const right = normaliseValue(b);

  if (Object.is(left, right)) return true;
  // Objects/arrays (e.g. a JSONB column) are compared structurally.
  if (typeof left === 'object' && typeof right === 'object' && left !== null && right !== null) {
    return JSON.stringify(left) === JSON.stringify(right);
  }
  return false;
}

/**
 * Field-level diff between two snapshots of an entity.
 *
 * - `before === null` means a creation: every tracked field that has a value is
 *   reported as `null -> value`.
 * - Only the tracked fields are considered, so bookkeeping columns
 *   (`updatedAt`, ...) never pollute the trail.
 * - Fields absent from `after` are treated as "not submitted", not as "cleared",
 *   which matches the PATCH semantics of the update endpoint.
 */
export function diffFields<T extends object>(
  before: T | null,
  after: Partial<T>,
  trackedFields: readonly (keyof T & string)[],
): FieldChange[] {
  const changes: FieldChange[] = [];

  for (const field of trackedFields) {
    const to = normaliseValue(after[field]);

    if (before === null) {
      if (to === null) continue; // nothing meaningful to record on create
      changes.push({ field, from: null, to });
      continue;
    }

    if (!(field in after) || after[field] === undefined) continue;

    const from = normaliseValue(before[field]);
    if (!isEqual(from, to)) {
      changes.push({ field, from, to });
    }
  }

  return changes;
}
