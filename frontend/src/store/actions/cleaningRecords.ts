import { cleaningRecordsApi } from '../../api/resources';
import { currentCursor } from '../../lib/cursorStack';
import { toErrorInfo, type ApiErrorInfo } from '../../lib/errors';
import {
  RECORD_CREATE_FAILURE,
  RECORD_CREATE_REQUEST,
  RECORD_CREATE_SUCCESS,
  RECORD_UPDATE_FAILURE,
  RECORD_UPDATE_REQUEST,
  RECORD_UPDATE_SUCCESS,
  RECORDS_FAILURE,
  RECORDS_REQUEST,
  RECORDS_SUCCESS,
} from '../actionTypes';
import { nextRequestId } from '../requestId';
import type { AppThunk } from '../types';
import type { CleaningRecord, CleaningRecordInput, KeysetPage } from '../../types';
import { fetchAuditTrail } from './audit';
import { resetRecordsPaging, setEditingRecord, setRecordAdding } from './ui';

export const RECORDS_PAGE_SIZE = 10;

export interface RecordsRequestAction {
  type: typeof RECORDS_REQUEST;
  requestId: number;
}
export interface RecordsSuccessAction {
  type: typeof RECORDS_SUCCESS;
  requestId: number;
  payload: KeysetPage<CleaningRecord>;
}
export interface RecordsFailureAction {
  type: typeof RECORDS_FAILURE;
  requestId: number;
  payload: ApiErrorInfo;
}
export interface RecordCreateRequestAction {
  type: typeof RECORD_CREATE_REQUEST;
}
export interface RecordCreateSuccessAction {
  type: typeof RECORD_CREATE_SUCCESS;
}
export interface RecordCreateFailureAction {
  type: typeof RECORD_CREATE_FAILURE;
  payload: ApiErrorInfo;
}
export interface RecordUpdateRequestAction {
  type: typeof RECORD_UPDATE_REQUEST;
}
export interface RecordUpdateSuccessAction {
  type: typeof RECORD_UPDATE_SUCCESS;
}
export interface RecordUpdateFailureAction {
  type: typeof RECORD_UPDATE_FAILURE;
  payload: ApiErrorInfo;
}

export type CleaningRecordsAction =
  | RecordsRequestAction
  | RecordsSuccessAction
  | RecordsFailureAction
  | RecordCreateRequestAction
  | RecordCreateSuccessAction
  | RecordCreateFailureAction
  | RecordUpdateRequestAction
  | RecordUpdateSuccessAction
  | RecordUpdateFailureAction;

export const fetchCleaningRecords = (): AppThunk<Promise<void>> => async (dispatch, getState) => {
  const { selectedEquipmentId, records } = getState().ui;
  if (!selectedEquipmentId) return;

  const requestId = nextRequestId();

  dispatch({ type: RECORDS_REQUEST, requestId });
  try {
    const result = await cleaningRecordsApi.list(selectedEquipmentId, {
      limit: RECORDS_PAGE_SIZE,
      cursor: currentCursor(records.cursorStack),
      status: records.status,
    });
    dispatch({ type: RECORDS_SUCCESS, requestId, payload: result });
  } catch (error) {
    dispatch({ type: RECORDS_FAILURE, requestId, payload: toErrorInfo(error) });
  }
};

/**
 * Stands in for React Query's `invalidateQueries`: reload the list, and the
 * open audit trail too when the write touched the record it is showing.
 */
const refresh =
  (recordId: string): AppThunk<Promise<void>> =>
  async (dispatch, getState) => {
    await dispatch(fetchCleaningRecords());
    if (getState().ui.records.auditRecordId === recordId) {
      await dispatch(fetchAuditTrail(recordId));
    }
  };

export const createCleaningRecord =
  (input: CleaningRecordInput): AppThunk<Promise<void>> =>
  async (dispatch, getState) => {
    const { users, ui } = getState();
    if (!users.currentUserId || !ui.selectedEquipmentId) return;

    dispatch({ type: RECORD_CREATE_REQUEST });
    try {
      const record = await cleaningRecordsApi.create(
        ui.selectedEquipmentId,
        input,
        users.currentUserId,
      );
      dispatch({ type: RECORD_CREATE_SUCCESS });
      dispatch(setRecordAdding(false));
      // A new record can land on the first page, so restart the cursor walk.
      dispatch(resetRecordsPaging());
      await dispatch(refresh(record.id));
    } catch (error) {
      dispatch({ type: RECORD_CREATE_FAILURE, payload: toErrorInfo(error) });
    }
  };

export const updateCleaningRecord =
  (id: string, input: Partial<CleaningRecordInput>): AppThunk<Promise<void>> =>
  async (dispatch, getState) => {
    const userId = getState().users.currentUserId;
    if (!userId) return;

    dispatch({ type: RECORD_UPDATE_REQUEST });
    try {
      const record = await cleaningRecordsApi.update(id, input, userId);
      dispatch({ type: RECORD_UPDATE_SUCCESS });
      dispatch(setEditingRecord(null));
      await dispatch(refresh(record.id));
    } catch (error) {
      dispatch({ type: RECORD_UPDATE_FAILURE, payload: toErrorInfo(error) });
    }
  };
