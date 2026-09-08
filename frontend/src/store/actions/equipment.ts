import { equipmentApi } from '../../api/resources';
import { toErrorInfo, type ApiErrorInfo } from '../../lib/errors';
import {
  EQUIPMENT_CREATE_FAILURE,
  EQUIPMENT_CREATE_REQUEST,
  EQUIPMENT_CREATE_SUCCESS,
  EQUIPMENT_DELETE_FAILURE,
  EQUIPMENT_DELETE_REQUEST,
  EQUIPMENT_DELETE_SUCCESS,
  EQUIPMENT_FAILURE,
  EQUIPMENT_REQUEST,
  EQUIPMENT_SUCCESS,
  EQUIPMENT_TOGGLE_REQUEST,
  EQUIPMENT_TOGGLE_SETTLED,
  EQUIPMENT_UPDATE_FAILURE,
  EQUIPMENT_UPDATE_REQUEST,
  EQUIPMENT_UPDATE_SUCCESS,
} from '../actionTypes';
import { nextRequestId } from '../requestId';
import type { AppThunk } from '../types';
import type { Equipment, EquipmentStatus, OffsetPage } from '../../types';
import {
  selectEquipment,
  setEditingEquipment,
  setEquipmentAdding,
  setEquipmentPage,
  setEquipmentPendingDelete,
} from './ui';

export const EQUIPMENT_PAGE_SIZE = 10;

export interface EquipmentRequestAction {
  type: typeof EQUIPMENT_REQUEST;
  requestId: number;
}
export interface EquipmentSuccessAction {
  type: typeof EQUIPMENT_SUCCESS;
  requestId: number;
  payload: OffsetPage<Equipment>;
}
export interface EquipmentFailureAction {
  type: typeof EQUIPMENT_FAILURE;
  requestId: number;
  payload: ApiErrorInfo;
}
export interface EquipmentCreateRequestAction {
  type: typeof EQUIPMENT_CREATE_REQUEST;
}
export interface EquipmentCreateSuccessAction {
  type: typeof EQUIPMENT_CREATE_SUCCESS;
  payload: Equipment;
}
export interface EquipmentCreateFailureAction {
  type: typeof EQUIPMENT_CREATE_FAILURE;
  payload: ApiErrorInfo;
}
export interface EquipmentToggleRequestAction {
  type: typeof EQUIPMENT_TOGGLE_REQUEST;
}
export interface EquipmentToggleSettledAction {
  type: typeof EQUIPMENT_TOGGLE_SETTLED;
  /** Absent on success; the list's error banner shows it when present. */
  payload: ApiErrorInfo | null;
}
export interface EquipmentUpdateRequestAction {
  type: typeof EQUIPMENT_UPDATE_REQUEST;
}
export interface EquipmentUpdateSuccessAction {
  type: typeof EQUIPMENT_UPDATE_SUCCESS;
  payload: Equipment;
}
export interface EquipmentUpdateFailureAction {
  type: typeof EQUIPMENT_UPDATE_FAILURE;
  payload: ApiErrorInfo;
}
export interface EquipmentDeleteRequestAction {
  type: typeof EQUIPMENT_DELETE_REQUEST;
}
export interface EquipmentDeleteSuccessAction {
  type: typeof EQUIPMENT_DELETE_SUCCESS;
  /** Id of the deleted row, so the list can drop it before the refetch lands. */
  payload: string;
}
export interface EquipmentDeleteFailureAction {
  type: typeof EQUIPMENT_DELETE_FAILURE;
  payload: ApiErrorInfo;
}

export type EquipmentAction =
  | EquipmentRequestAction
  | EquipmentSuccessAction
  | EquipmentFailureAction
  | EquipmentCreateRequestAction
  | EquipmentCreateSuccessAction
  | EquipmentCreateFailureAction
  | EquipmentToggleRequestAction
  | EquipmentToggleSettledAction
  | EquipmentUpdateRequestAction
  | EquipmentUpdateSuccessAction
  | EquipmentUpdateFailureAction
  | EquipmentDeleteRequestAction
  | EquipmentDeleteSuccessAction
  | EquipmentDeleteFailureAction;

/**
 * Reads its own parameters out of the store rather than taking them as
 * arguments, so callers that only want "reload the list as it is now" — the
 * mutation handlers below — do not have to thread the current page and
 * filters through themselves.
 */
export const fetchEquipment = (): AppThunk<Promise<void>> => async (dispatch, getState) => {
  const { page, status, search } = getState().ui.equipment;
  const requestId = nextRequestId();

  dispatch({ type: EQUIPMENT_REQUEST, requestId });
  try {
    const result = await equipmentApi.list({
      page,
      pageSize: EQUIPMENT_PAGE_SIZE,
      status,
      // Trimmed here rather than in the reducer so the box keeps showing
      // exactly what was typed; a whitespace-only term is simply no filter.
      search: search.trim(),
    });
    dispatch({ type: EQUIPMENT_SUCCESS, requestId, payload: result });
  } catch (error) {
    dispatch({ type: EQUIPMENT_FAILURE, requestId, payload: toErrorInfo(error) });
  }
};

export const createEquipment =
  (input: { name: string; code: string }): AppThunk<Promise<void>> =>
  async (dispatch, getState) => {
    const userId = getState().users.currentUserId;
    if (!userId) return;

    dispatch({ type: EQUIPMENT_CREATE_REQUEST });
    try {
      const created = await equipmentApi.create(input, userId);
      dispatch({ type: EQUIPMENT_CREATE_SUCCESS, payload: created });
      dispatch(setEquipmentAdding(false));
      dispatch(selectEquipment(created.id));
      await dispatch(fetchEquipment());
    } catch (error) {
      dispatch({ type: EQUIPMENT_CREATE_FAILURE, payload: toErrorInfo(error) });
    }
  };

export const toggleEquipmentStatus =
  (id: string, status: EquipmentStatus): AppThunk<Promise<void>> =>
  async (dispatch, getState) => {
    const userId = getState().users.currentUserId;
    if (!userId) return;

    dispatch({ type: EQUIPMENT_TOGGLE_REQUEST });
    try {
      await equipmentApi.update(id, { status }, userId);
      dispatch({ type: EQUIPMENT_TOGGLE_SETTLED, payload: null });
      await dispatch(fetchEquipment());
    } catch (error) {
      dispatch({ type: EQUIPMENT_TOGGLE_SETTLED, payload: toErrorInfo(error) });
    }
  };

/**
 * Renames a piece of equipment / edits its code. The status toggle above stays
 * separate: it is a one-click action on the row, not a form submission, and the
 * two should not share a pending flag or an error slot.
 */
export const updateEquipment =
  (id: string, input: { name: string; code: string }): AppThunk<Promise<void>> =>
  async (dispatch, getState) => {
    const userId = getState().users.currentUserId;
    if (!userId) return;

    dispatch({ type: EQUIPMENT_UPDATE_REQUEST });
    try {
      const updated = await equipmentApi.update(id, input, userId);
      dispatch({ type: EQUIPMENT_UPDATE_SUCCESS, payload: updated });
      dispatch(setEditingEquipment(null));
      await dispatch(fetchEquipment());
    } catch (error) {
      // The form stays open on failure so the rejected values can be corrected.
      dispatch({ type: EQUIPMENT_UPDATE_FAILURE, payload: toErrorInfo(error) });
    }
  };

/**
 * Deletes equipment, and with it every cleaning record and audit row that hung
 * off it — the confirmation in the UI is what makes that consequence explicit.
 */
export const removeEquipment =
  (id: string): AppThunk<Promise<void>> =>
  async (dispatch, getState) => {
    const state = getState();
    const userId = state.users.currentUserId;
    if (!userId) return;

    dispatch({ type: EQUIPMENT_DELETE_REQUEST });
    try {
      await equipmentApi.remove(id, userId);
      dispatch({ type: EQUIPMENT_DELETE_SUCCESS, payload: id });
      dispatch(setEquipmentPendingDelete(null));

      // The records panel is scoped to the equipment that just stopped
      // existing, so it has to let go of it before the refetch.
      if (state.ui.selectedEquipmentId === id) dispatch(selectEquipment(null));

      // Deleting the last row of the last page would otherwise strand the user
      // on an empty page they cannot page back from.
      const { page } = getState().ui.equipment;
      const wasLastOnPage = state.equipment.items.length === 1 && page > 1;
      if (wasLastOnPage) dispatch(setEquipmentPage(page - 1));

      await dispatch(fetchEquipment());
    } catch (error) {
      dispatch({ type: EQUIPMENT_DELETE_FAILURE, payload: toErrorInfo(error) });
    }
  };
