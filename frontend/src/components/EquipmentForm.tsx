import { useState, type FormEvent } from 'react';
import type { ApiErrorInfo } from '../lib/errors';
import type { Equipment } from '../types';

interface Props {
  /** Present when editing, absent when adding. */
  equipment?: Equipment;
  isSaving: boolean;
  error: ApiErrorInfo | null;
  onSubmit: (input: { name: string; code: string }) => void;
  onCancel: () => void;
}

/**
 * The inline name/code form, shared by "New" and by editing a row.
 *
 * Both need the same field-level error handling, so they use one component
 * rather than two copies that drift apart.
 */
export function EquipmentForm({ equipment, isSaving, error, onSubmit, onCancel }: Props) {
  const [name, setName] = useState(equipment?.name ?? '');
  const [code, setCode] = useState(equipment?.code ?? '');

  // The API reports validation and uniqueness failures per field
  // (`{ path, message }`), so each message is shown against the input that
  // caused it; `message` is only a fallback for failures with no field.
  const fieldErrors = error?.fieldErrors ?? {};
  const generalError = error && Object.keys(fieldErrors).length === 0 ? error.message : null;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit({ name: name.trim(), code: code.trim() });
  }

  return (
    <form className="form form--inline" onSubmit={handleSubmit}>
      <div className="form__field">
        <input
          placeholder="Name"
          aria-label="Equipment name"
          aria-invalid={Boolean(fieldErrors.name)}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        {fieldErrors.name && <span className="error">{fieldErrors.name}</span>}
      </div>

      <div className="form__field">
        <input
          placeholder="Code"
          aria-label="Equipment code"
          aria-invalid={Boolean(fieldErrors.code)}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
        />
        {fieldErrors.code && <span className="error">{fieldErrors.code}</span>}
      </div>

      <div className="form__actions">
        <button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving…' : equipment ? 'Save' : 'Add'}
        </button>
        <button type="button" className="secondary" onClick={onCancel} disabled={isSaving}>
          Cancel
        </button>
      </div>

      {generalError && (
        <p role="alert" className="error form__error">
          {generalError}
        </p>
      )}
    </form>
  );
}
