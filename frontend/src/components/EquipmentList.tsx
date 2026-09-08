import { useEffect } from 'react';
import {
  createEquipment,
  fetchEquipment,
  removeEquipment,
  selectEquipment,
  setEditingEquipment,
  setEquipmentAdding,
  setEquipmentFilters,
  setEquipmentPage,
  setEquipmentPendingDelete,
  toggleEquipmentStatus,
  updateEquipment,
} from '../store/actions';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectCurrentUser } from '../store/selectors';
import type { EquipmentStatus } from '../types';
import { EquipmentForm } from './EquipmentForm';

/**
 * Equipment list with offset pagination, a status filter, and the full CRUD
 * surface the API exposes: create, rename, retire/reactivate and delete.
 */
export function EquipmentList() {
  const dispatch = useAppDispatch();

  const selectedId = useAppSelector((state) => state.ui.selectedEquipmentId);
  const { page, status, search, isAdding, editing, pendingDelete } = useAppSelector(
    (state) => state.ui.equipment,
  );
  const {
    items,
    pageInfo,
    isLoading,
    error,
    isCreating,
    createError,
    isTogglingStatus,
    isUpdating,
    updateError,
    isDeleting,
    deleteError,
  } = useAppSelector((state) => state.equipment);
  const currentUser = useAppSelector(selectCurrentUser);

  // Replaces React Query's query key. Any change to the parameters the list is
  // keyed on refetches it; stale responses are dropped by request id.
  useEffect(() => {
    void dispatch(fetchEquipment());
  }, [dispatch, page, status, search]);

  return (
    <section className="panel equipment-list">
      <header className="panel__head">
        <h2>Equipment</h2>
        <button
          type="button"
          onClick={() => dispatch(setEquipmentAdding(!isAdding))}
          disabled={!currentUser}
        >
          {isAdding ? 'Close' : 'New'}
        </button>
      </header>

      {isAdding && (
        <EquipmentForm
          isSaving={isCreating}
          error={createError}
          onSubmit={(input) => void dispatch(createEquipment(input))}
          onCancel={() => dispatch(setEquipmentAdding(false))}
        />
      )}

      <div className="filters">
        <input
          type="search"
          placeholder="Search name or code"
          value={search}
          onChange={(e) => dispatch(setEquipmentFilters({ search: e.target.value }))}
        />
        <select
          value={status}
          aria-label="Filter equipment by status"
          onChange={(e) =>
            dispatch(setEquipmentFilters({ status: e.target.value as EquipmentStatus | '' }))
          }
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="retired">Retired</option>
        </select>
      </div>

      {isLoading && <p className="muted">Loading equipment…</p>}
      {error && (
        <p role="alert" className="error">
          {error.message}
        </p>
      )}

      <ul className="equipment-items">
        {items.map((item) =>
          editing?.id === item.id ? (
            // The row is replaced by its form, so the name being changed is not
            // also sitting immediately above the input changing it.
            <li key={item.id}>
              <EquipmentForm
                equipment={item}
                isSaving={isUpdating}
                error={updateError}
                onSubmit={(input) => void dispatch(updateEquipment(item.id, input))}
                onCancel={() => dispatch(setEditingEquipment(null))}
              />
            </li>
          ) : (
            <li key={item.id}>
              <button
                type="button"
                className={`equipment-item ${selectedId === item.id ? 'is-selected' : ''}`}
                onClick={() => dispatch(selectEquipment(item.id))}
                aria-current={selectedId === item.id}
              >
                <span className="equipment-item__name">{item.name}</span>
                <span className="equipment-item__code">{item.code}</span>
                <span className={`badge badge--${item.status}`}>{item.status}</span>
              </button>

              <div className="equipment-item__actions">
                <button
                  type="button"
                  className="link"
                  disabled={!currentUser || isTogglingStatus}
                  onClick={() =>
                    void dispatch(
                      toggleEquipmentStatus(
                        item.id,
                        item.status === 'active' ? 'retired' : 'active',
                      ),
                    )
                  }
                >
                  {item.status === 'active' ? 'Retire' : 'Reactivate'}
                </button>
                <button
                  type="button"
                  className="link"
                  disabled={!currentUser}
                  onClick={() => dispatch(setEditingEquipment(item))}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="link link--danger"
                  disabled={!currentUser}
                  onClick={() => dispatch(setEquipmentPendingDelete(item))}
                >
                  Delete
                </button>
              </div>

              {/* Deleting cascades to the cleaning records, so the consequence
                  is spelled out before the click that causes it. The audit rows
                  themselves survive in the database but stop being reachable
                  through the API, which is what the second sentence means. */}
              {pendingDelete?.id === item.id && (
                <div role="alertdialog" aria-label="Confirm delete" className="confirm">
                  <p>
                    Delete <strong>{item.name}</strong>? Its cleaning records are deleted with
                    it, and their audit history stops being viewable. This cannot be undone.
                  </p>
                  {deleteError && (
                    <p role="alert" className="error">
                      {deleteError.message}
                    </p>
                  )}
                  <div className="form__actions">
                    <button
                      type="button"
                      className="danger"
                      disabled={isDeleting}
                      onClick={() => void dispatch(removeEquipment(item.id))}
                    >
                      {isDeleting ? 'Deleting…' : 'Delete'}
                    </button>
                    <button
                      type="button"
                      className="secondary"
                      disabled={isDeleting}
                      onClick={() => dispatch(setEquipmentPendingDelete(null))}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </li>
          ),
        )}
      </ul>

      {/* `pageInfo` is null until the first response, so this cannot flash
          before the list has ever loaded. */}
      {pageInfo && items.length === 0 && <p className="muted">No equipment matches.</p>}

      {pageInfo && (
        <nav className="pager">
          <button
            type="button"
            onClick={() => dispatch(setEquipmentPage(page - 1))}
            disabled={page <= 1}
          >
            Previous
          </button>
          <span className="muted">
            Page {pageInfo.page} of {pageInfo.totalPages} · {pageInfo.totalItems} total
          </span>
          <button
            type="button"
            onClick={() => dispatch(setEquipmentPage(page + 1))}
            disabled={!pageInfo.hasNextPage}
          >
            Next
          </button>
        </nav>
      )}
    </section>
  );
}
