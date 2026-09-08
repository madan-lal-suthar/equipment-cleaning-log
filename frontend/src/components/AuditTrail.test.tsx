import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AuditTrail } from './AuditTrail';
import type { AuditEntry } from '../types';

const entry = (overrides: Partial<AuditEntry> = {}): AuditEntry => ({
  id: 'audit-1',
  entityType: 'cleaning_record',
  entityId: 'record-1',
  action: 'update',
  changedById: 'user-1',
  changedByName: 'Asha Menon',
  changedAt: '2024-05-01T08:00:00.000Z',
  changes: [{ field: 'status', from: 'pending', to: 'verified' }],
  ...overrides,
});

describe('AuditTrail', () => {
  it('shows who changed what, as old -> new', () => {
    render(<AuditTrail entries={[entry()]} />);

    expect(screen.getByText('Asha Menon')).toBeInTheDocument();
    expect(screen.getByText('update')).toBeInTheDocument();

    const change = screen.getByText('Status').closest('li')!;
    expect(within(change).getByText('pending')).toBeInTheDocument();
    expect(within(change).getByText('verified')).toBeInTheDocument();
  });

  it('renders an em dash for a value that was empty or was cleared', () => {
    render(
      <AuditTrail
        entries={[
          entry({
            changes: [
              { field: 'notes', from: null, to: 'Swab sample taken' },
              { field: 'method', from: 'Manual wipe-down', to: null },
            ],
          }),
        ]}
      />,
    );

    const created = screen.getByText('Notes').closest('li')!;
    expect(within(created).getByText('—')).toBeInTheDocument();
    expect(within(created).getByText('Swab sample taken')).toBeInTheDocument();

    const cleared = screen.getByText('Method').closest('li')!;
    expect(within(cleared).getByText('—')).toBeInTheDocument();
  });

  it('lists every entry of a multi-step history', () => {
    render(
      <AuditTrail
        entries={[
          entry({ id: 'audit-2', action: 'update', changedByName: 'Daniel Okafor' }),
          entry({
            id: 'audit-1',
            action: 'create',
            changes: [{ field: 'method', from: null, to: 'Clean-in-place (CIP)' }],
          }),
        ]}
      />,
    );

    expect(screen.getAllByRole('listitem').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('create')).toBeInTheDocument();
    expect(screen.getByText('Daniel Okafor')).toBeInTheDocument();
  });

  it('shows an empty state and a loading state', () => {
    const { rerender } = render(<AuditTrail entries={[]} />);
    expect(screen.getByText(/no audit entries/i)).toBeInTheDocument();

    rerender(<AuditTrail entries={[]} isLoading />);
    expect(screen.getByText(/loading audit trail/i)).toBeInTheDocument();
  });
});
