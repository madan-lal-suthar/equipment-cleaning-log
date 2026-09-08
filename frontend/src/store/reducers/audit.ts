import {
  AUDIT_FAILURE,
  AUDIT_RECORD_TOGGLED,
  AUDIT_REQUEST,
  AUDIT_SUCCESS,
  EQUIPMENT_SELECTED,
} from '../actionTypes';
import type { AppAction } from '../actions';
import type { ApiErrorInfo } from '../../lib/errors';
import type { AuditEntry } from '../../types';

export interface AuditState {
  entries: AuditEntry[];
  isLoading: boolean;
  error: ApiErrorInfo | null;
  latestRequestId: number;
}

const initialState: AuditState = {
  entries: [],
  isLoading: false,
  error: null,
  latestRequestId: 0,
};

export function auditReducer(state: AuditState = initialState, action: AppAction): AuditState {
  switch (action.type) {
    // Expanding a different row (or different equipment) must not show the
    // previous record's history while the new one loads.
    case AUDIT_RECORD_TOGGLED:
    case EQUIPMENT_SELECTED:
      return initialState;

    case AUDIT_REQUEST:
      return { ...state, isLoading: true, error: null, latestRequestId: action.requestId };

    case AUDIT_SUCCESS:
      if (action.requestId !== state.latestRequestId) return state;
      return { ...state, isLoading: false, entries: action.payload };

    case AUDIT_FAILURE:
      if (action.requestId !== state.latestRequestId) return state;
      return { ...state, isLoading: false, error: action.payload };

    default:
      return state;
  }
}
