import { formatDateTime, formatFieldName, formatFieldValue } from '../lib/format';
import type { AuditEntry } from '../types';

interface Props {
  entries: AuditEntry[];
  isLoading?: boolean;
}

/**
 * Field-level history for one cleaning record, newest first: who changed it,
 * when, and every old -> new pair.
 */
export function AuditTrail({ entries, isLoading = false }: Props) {
  if (isLoading) return <p className="muted">Loading audit trail…</p>;

  if (entries.length === 0) {
    return <p className="muted">No audit entries for this record yet.</p>;
  }

  return (
    <ol className="audit-trail">
      {entries.map((entry) => (
        <li key={entry.id} className="audit-entry">
          <div className="audit-entry__head">
            <span className={`badge badge--${entry.action}`}>{entry.action}</span>
            <strong>{entry.changedByName}</strong>
            <time dateTime={entry.changedAt} className="muted">
              {formatDateTime(entry.changedAt)}
            </time>
          </div>

          <ul className="audit-changes">
            {entry.changes.map((change) => (
              <li key={`${entry.id}-${change.field}`}>
                <span className="audit-changes__field">{formatFieldName(change.field)}</span>
                <span className="audit-changes__from">
                  {formatFieldValue(change.field, change.from)}
                </span>
                <span aria-hidden="true" className="audit-changes__arrow">
                  →
                </span>
                <span className="audit-changes__to">
                  {formatFieldValue(change.field, change.to)}
                </span>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}
