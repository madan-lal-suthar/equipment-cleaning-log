import {
  EQUIPMENT_SELECTED,
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
import type { AppAction } from '../actions';
import type { ApiErrorInfo } from '../../lib/errors';
import type { CleaningRecord, KeysetPage } from '../../types';

export interface CleaningRecordsState {
  items: CleaningRecord[];
  pageInfo: KeysetPage<CleaningRecord>['pageInfo'] | null;
  isLoading: boolean;
  error: ApiErrorInfo | null;
  latestRequestId: number;
  isCreating: boolean;
  createError: ApiErrorInfo | null;
  isUpdating: boolean;
  updateError: ApiErrorInfo | null;
}

const initialState: CleaningRecordsState = {
  items: [],
  pageInfo: null,
  isLoading: false,
  error: null,
  latestRequestId: 0,
  isCreating: false,
  createError: null,
  isUpdating: false,
  updateError: null,
};

export function cleaningRecordsReducer(
  state: CleaningRecordsState = initialState,
  action: AppAction,
): CleaningRecordsState {
  switch (action.type) {
    // Picking different equipment must not leave the previous one's rows on
    // screen while the new list loads. React Query got this from the `key`
    // prop remounting the panel.
    case EQUIPMENT_SELECTED:
      return initialState;

    case RECORDS_REQUEST:
      return { ...state, isLoading: true, error: null, latestRequestId: action.requestId };

    case RECORDS_SUCCESS:
      if (action.requestId !== state.latestRequestId) return state;
      return {
        ...state,
        isLoading: false,
        items: action.payload.data,
        pageInfo: action.payload.pageInfo,
      };

    case RECORDS_FAILURE:
      if (action.requestId !== state.latestRequestId) return state;
      return { ...state, isLoading: false, error: action.payload };

    case RECORD_CREATE_REQUEST:
      return { ...state, isCreating: true, createError: null };

    case RECORD_CREATE_SUCCESS:
      return { ...state, isCreating: false };

    case RECORD_CREATE_FAILURE:
      return { ...state, isCreating: false, createError: action.payload };

    case RECORD_UPDATE_REQUEST:
      return { ...state, isUpdating: true, updateError: null };

    case RECORD_UPDATE_SUCCESS:
      return { ...state, isUpdating: false };

    case RECORD_UPDATE_FAILURE:
      return { ...state, isUpdating: false, updateError: action.payload };

    default:
      return state;
  }
}
