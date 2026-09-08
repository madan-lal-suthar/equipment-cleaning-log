/** Presentation helpers shared by the table and the audit trail. */

const FIELD_LABELS: Record<string, string> = {
  cleanedBy: 'Cleaned by',
  cleanedAt: 'Cleaned at',
  method: 'Method',
  notes: 'Notes',
  status: 'Status',
};

export function formatFieldName(field: string): string {
  return (
    FIELD_LABELS[field] ??
    field.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())
  );
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Renders an audit value. Empty values become an em dash so a cleared field
 * reads as "Residue check passed → —" rather than "→ null".
 */
export function formatFieldValue(field: string, value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (field.toLowerCase().endsWith('at') && typeof value === 'string') {
    return formatDateTime(value);
  }
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

/** Value for a `<input type="datetime-local">`, which wants local wall time. */
export function toDateTimeLocalValue(iso: string): string {
  const date = new Date(iso);
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}
