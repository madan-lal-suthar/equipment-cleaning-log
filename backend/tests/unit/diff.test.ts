import { describe, expect, it } from 'vitest';
import { diffFields, normaliseValue } from '../../src/modules/audit/diff.js';

interface Record {
  cleanedBy: string;
  cleanedAt: Date;
  method: string;
  notes: string | null;
  status: 'pending' | 'verified';
}

const FIELDS = ['cleanedBy', 'cleanedAt', 'method', 'notes', 'status'] as const;

const base: Record = {
  cleanedBy: 'Asha Menon',
  cleanedAt: new Date('2024-05-01T08:00:00.000Z'),
  method: 'Clean-in-place (CIP)',
  notes: null,
  status: 'pending',
};

describe('normaliseValue', () => {
  it('turns undefined into null and Dates into ISO strings', () => {
    expect(normaliseValue(undefined)).toBeNull();
    expect(normaliseValue(new Date('2024-05-01T08:00:00.000Z'))).toBe('2024-05-01T08:00:00.000Z');
    expect(normaliseValue('pending')).toBe('pending');
  });
});

describe('diffFields on create', () => {
  it('records every populated field as null -> value', () => {
    const changes = diffFields<Record>(null, base, FIELDS);

    expect(changes).toEqual([
      { field: 'cleanedBy', from: null, to: 'Asha Menon' },
      { field: 'cleanedAt', from: null, to: '2024-05-01T08:00:00.000Z' },
      { field: 'method', from: null, to: 'Clean-in-place (CIP)' },
      { field: 'status', from: null, to: 'pending' },
    ]);
  });

  it('omits fields that were left empty', () => {
    const changes = diffFields<Record>(null, base, FIELDS);
    expect(changes.map((c) => c.field)).not.toContain('notes');
  });
});

describe('diffFields on update', () => {
  it('reports only the fields that actually changed', () => {
    const changes = diffFields<Record>(base, { status: 'verified', method: base.method }, FIELDS);

    expect(changes).toEqual([{ field: 'status', from: 'pending', to: 'verified' }]);
  });

  it('returns an empty diff when nothing changed', () => {
    expect(diffFields<Record>(base, { ...base }, FIELDS)).toEqual([]);
  });

  it('ignores fields that were not submitted', () => {
    const changes = diffFields<Record>(base, { method: 'Manual wipe-down' }, FIELDS);

    expect(changes).toEqual([
      { field: 'method', from: 'Clean-in-place (CIP)', to: 'Manual wipe-down' },
    ]);
  });

  it('treats a Date and its ISO string as equal', () => {
    const changes = diffFields<Record>(
      base,
      { cleanedAt: new Date('2024-05-01T08:00:00.000Z') },
      FIELDS,
    );

    expect(changes).toEqual([]);
  });

  it('records a real timestamp change', () => {
    const changes = diffFields<Record>(
      base,
      { cleanedAt: new Date('2024-05-02T09:30:00.000Z') },
      FIELDS,
    );

    expect(changes).toEqual([
      {
        field: 'cleanedAt',
        from: '2024-05-01T08:00:00.000Z',
        to: '2024-05-02T09:30:00.000Z',
      },
    ]);
  });

  it('captures clearing a value (value -> null)', () => {
    const withNotes: Record = { ...base, notes: 'Residue check passed' };
    const changes = diffFields<Record>(withNotes, { notes: null }, FIELDS);

    expect(changes).toEqual([{ field: 'notes', from: 'Residue check passed', to: null }]);
  });

  it('captures setting a previously empty value (null -> value)', () => {
    const changes = diffFields<Record>(base, { notes: 'Swab sample taken' }, FIELDS);

    expect(changes).toEqual([{ field: 'notes', from: null, to: 'Swab sample taken' }]);
  });

  it('never reports untracked fields', () => {
    const changes = diffFields<Record & { updatedAt: Date }>(
      { ...base, updatedAt: new Date('2024-05-01T08:00:00.000Z') },
      { updatedAt: new Date('2024-06-01T08:00:00.000Z'), status: 'verified' },
      FIELDS,
    );

    expect(changes).toEqual([{ field: 'status', from: 'pending', to: 'verified' }]);
  });
});
