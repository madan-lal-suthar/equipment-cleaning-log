import { cleaningRecordsApi } from '../../api/resources';
import { toErrorInfo, type ApiErrorInfo } from '../../lib/errors';
import { AUDIT_FAILURE, AUDIT_REQUEST, AUDIT_SUCCESS } from '../actionTypes';
import { nextRequestId } from '../requestId';
import type { AppThunk } from '../types';
import type { AuditEntry } from '../../types';

export interface AuditRequestAction {
  type: typeof AUDIT_REQUEST;
  requestId: number;
}
export interface AuditSuccessAction {
  type: typeof AUDIT_SUCCESS;
  requestId: number;
  payload: AuditEntry[];
}
export interface AuditFailureAction {
  type: typeof AUDIT_FAILURE;
  requestId: number;
  payload: ApiErrorInfo;
}

export type AuditAction = AuditRequestAction | AuditSuccessAction | AuditFailureAction;

/**
 * Loads one record's history. Replaces React Query's `enabled: id !== null`
 * gate — the caller simply does not dispatch when no row is expanded.
 */
export const fetchAuditTrail =
  (recordId: string): AppThunk<Promise<void>> =>
  async (dispatch) => {
    const requestId = nextRequestId();

    dispatch({ type: AUDIT_REQUEST, requestId });
    try {
      const entries = await cleaningRecordsApi.audit(recordId);
      dispatch({ type: AUDIT_SUCCESS, requestId, payload: entries });
    } catch (error) {
      dispatch({ type: AUDIT_FAILURE, requestId, payload: toErrorInfo(error) });
    }
  };
