import { useEffect } from 'react';
import { formatDateTime } from '../lib/format';
import { isFirstPage } from '../lib/cursorStack';
import {
  createCleaningRecord,
  fetchAuditTrail,
  fetchCleaningRecords,
  goToNextRecordsPage,
  goToPreviousRecordsPage,
  setEditingRecord,
  setRecordAdding,
  setRecordsStatusFilter,
  toggleAuditRecord,
  updateCleaningRecord,
} from '../store/actions';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectCurrentUser, selectSelectedEquipmentName } from '../store/selectors';
import type { CleaningStatus } from '../types';
import { AuditTrail } from './AuditTrail';
import { CleaningRecordForm } from './CleaningRecordForm';

export function CleaningRecordsPanel() {
  const dispatch = useAppDispatch();

  const equipmentId = useAppSelector((state) => state.ui.selectedEquipmentId);
  const equipmentName = useAppSelector(selectSelectedEquipmentName);
  const currentUser = useAppSelector(selectCurrentUser);

  const { status, cursorStack, editing, isAdding, auditRecordId } = useAppSelector(
    (state) => state.ui.records,
  );
  const { items, pageInfo, isLoading, error, isCreating, createError, isUpdating, updateError } =
    useAppSelector((state) => state.cleaningRecords);
  const audit = useAppSelector((state) => state.audit);

  useEffect(() => {
    void dispatch(fetchCleaningRecords());
  }, [dispatch, equipmentId, status, cursorStack]);

  // React Query expressed this as `enabled: auditRecordId !== null`; here the
  // guard is simply not dispatching.
  useEffect(() => {
    if (auditRecordId !== null) void dispatch(fetchAuditTrail(auditRecordId));
  }, [dispatch, auditRecordId]);

  return (
    <section className="panel">
      <header className="panel__head">
        <div>
          <h2>Cleaning records</h2>
          <p className="muted">{equipmentName}</p>
        </div>
        <button type="button" onClick={() => dispatch(setRecordAdding(true))} disabled={!currentUser}>
          Add record
        </button>
      </header>

      <div className="filters">
        <select
          value={status}
          aria-label="Filter records by status"
          onChange={(e) => dispatch(setRecordsStatusFilter(e.target.value as CleaningStatus | ''))}
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
        </select>
      </div>

      {(isAdding || editing) && currentUser && (
        <CleaningRecordForm
          key={editing?.id ?? 'new'}
          record={editing ?? undefined}
          defaultCleanedBy={currentUser.name}
          isSaving={isCreating || isUpdating}
          error={editing ? updateError : createError}
          onCancel={() => {
            dispatch(setRecordAdding(false));
            dispatch(setEditingRecord(null));
          }}
          onSubmit={(input) => {
            void (editing
              ? dispatch(updateCleaningRecord(editing.id, input))
              : dispatch(createCleaningRecord(input)));
          }}
        />
      )}

      {isLoading && <p className="muted">Loading records…</p>}
      {error && (
        <p role="alert" className="error">
          {error.message}
        </p>
      )}

      {pageInfo && items.length === 0 && (
        <p className="muted">No cleaning records yet for this equipment.</p>
      )}

      {items.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Cleaned at</th>
                <th>Cleaned by</th>
                <th>Method</th>
                <th>Status</th>
                <th>Notes</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {items.map((record) => (
                <tr key={record.id}>
                  <td>{formatDateTime(record.cleanedAt)}</td>
                  <td>{record.cleanedBy}</td>
                  <td>{record.method}</td>
                  <td>
                    <span className={`badge badge--${record.status}`}>{record.status}</span>
                  </td>
                  <td className="notes-cell">{record.notes ?? '—'}</td>
                  <td className="actions-cell">
                    <button
                      type="button"
                      className="link"
                      disabled={!currentUser}
                      onClick={() => dispatch(setEditingRecord(record))}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="link"
                      onClick={() => dispatch(toggleAuditRecord(record.id))}
                    >
                      {auditRecordId === record.id ? 'Hide history' : 'History'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <nav className="pager">
        <button
          type="button"
          onClick={() => dispatch(goToPreviousRecordsPage())}
          disabled={isFirstPage(cursorStack)}
        >
          Previous
        </button>
        <span className="muted">Page {cursorStack.index + 1}</span>
        <button
          type="button"
          onClick={() => dispatch(goToNextRecordsPage(pageInfo?.nextCursor ?? null))}
          disabled={!pageInfo?.hasNextPage}
        >
          Next
        </button>
      </nav>

      {auditRecordId && (
        <aside className="panel panel--nested">
          <h3>Audit trail</h3>
          <AuditTrail entries={audit.entries} isLoading={audit.isLoading} />
        </aside>
      )}
    </section>
  );
}
