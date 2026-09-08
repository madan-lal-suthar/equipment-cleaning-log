import { useState, type FormEvent } from 'react';
import { toDateTimeLocalValue } from '../lib/format';
import type { ApiErrorInfo } from '../lib/errors';
import type { CleaningRecord, CleaningRecordInput, CleaningStatus } from '../types';

interface Props {
  /** Present when editing, absent when adding. */
  record?: CleaningRecord;
  defaultCleanedBy: string;
  isSaving: boolean;
  /** Already split into a message and per-field messages by `toErrorInfo`. */
  error: ApiErrorInfo | null;
  onSubmit: (input: CleaningRecordInput) => void;
  onCancel: () => void;
}

export function CleaningRecordForm({
  record,
  defaultCleanedBy,
  isSaving,
  error,
  onSubmit,
  onCancel,
}: Props) {
  const [cleanedBy, setCleanedBy] = useState(record?.cleanedBy ?? defaultCleanedBy);
  const [cleanedAt, setCleanedAt] = useState(
    toDateTimeLocalValue(record?.cleanedAt ?? new Date().toISOString()),
  );
  const [method, setMethod] = useState(record?.method ?? '');
  const [notes, setNotes] = useState(record?.notes ?? '');
  const [status, setStatus] = useState<CleaningStatus>(record?.status ?? 'pending');

  const fieldErrors = error?.fieldErrors ?? {};
  const generalError = error && Object.keys(fieldErrors).length === 0 ? error.message : null;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit({
      cleanedBy: cleanedBy.trim(),
      // The input is local wall time; the API stores UTC.
      cleanedAt: new Date(cleanedAt).toISOString(),
      method: method.trim(),
      notes: notes.trim() === '' ? null : notes.trim(),
      status,
    });
  }

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <h3>{record ? 'Edit cleaning record' : 'Add cleaning record'}</h3>

      {generalError && <p role="alert" className="error">{generalError}</p>}

      <label>
        Cleaned by
        <input value={cleanedBy} onChange={(e) => setCleanedBy(e.target.value)} required />
        {fieldErrors.cleanedBy && <span className="error">{fieldErrors.cleanedBy}</span>}
      </label>

      <label>
        Cleaned at
        <input
          type="datetime-local"
          value={cleanedAt}
          onChange={(e) => setCleanedAt(e.target.value)}
          required
        />
        {fieldErrors.cleanedAt && <span className="error">{fieldErrors.cleanedAt}</span>}
      </label>

      <label>
        Method
        <input
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          placeholder="e.g. Clean-in-place (CIP)"
          required
        />
        {fieldErrors.method && <span className="error">{fieldErrors.method}</span>}
      </label>

      <label>
        Notes
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
        {fieldErrors.notes && <span className="error">{fieldErrors.notes}</span>}
      </label>

      <label>
        Status
        <select value={status} onChange={(e) => setStatus(e.target.value as CleaningStatus)}>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
        </select>
      </label>

      <div className="form__actions">
        <button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving…' : record ? 'Save changes' : 'Add record'}
        </button>
        <button type="button" className="secondary" onClick={onCancel} disabled={isSaving}>
          Cancel
        </button>
      </div>
    </form>
  );
}
