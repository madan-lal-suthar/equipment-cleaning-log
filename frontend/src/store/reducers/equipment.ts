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
import type { AppAction } from '../actions';
import type { ApiErrorInfo } from '../../lib/errors';
import type { Equipment, OffsetPage } from '../../types';

export interface EquipmentState {
  items: Equipment[];
  pageInfo: OffsetPage<Equipment>['pageInfo'] | null;
  isLoading: boolean;
  error: ApiErrorInfo | null;
  /** Id of the list request whose response is still wanted — see `requestId.ts`. */
  latestRequestId: number;
  isCreating: boolean;
  createError: ApiErrorInfo | null;
  isTogglingStatus: boolean;
  isUpdating: boolean;
  updateError: ApiErrorInfo | null;
  isDeleting: boolean;
  deleteError: ApiErrorInfo | null;
}

const initialState: EquipmentState = {
  items: [],
  pageInfo: null,
  isLoading: false,
  error: null,
  latestRequestId: 0,
  isCreating: false,
  createError: null,
  isTogglingStatus: false,
  isUpdating: false,
  updateError: null,
  isDeleting: false,
  deleteError: null,
};

export function equipmentReducer(
  state: EquipmentState = initialState,
  action: AppAction,
): EquipmentState {
  switch (action.type) {
    case EQUIPMENT_REQUEST:
      return { ...state, isLoading: true, error: null, latestRequestId: action.requestId };

    case EQUIPMENT_SUCCESS:
      if (action.requestId !== state.latestRequestId) return state;
      return {
        ...state,
        isLoading: false,
        items: action.payload.data,
        pageInfo: action.payload.pageInfo,
      };

    case EQUIPMENT_FAILURE:
      if (action.requestId !== state.latestRequestId) return state;
      return { ...state, isLoading: false, error: action.payload };

    case EQUIPMENT_CREATE_REQUEST:
      return { ...state, isCreating: true, createError: null };

    case EQUIPMENT_CREATE_SUCCESS:
      // Held until the refetch lands so the newly selected equipment's name is
      // available to the records panel immediately.
      return { ...state, isCreating: false, items: [action.payload, ...state.items] };

    case EQUIPMENT_CREATE_FAILURE:
      return { ...state, isCreating: false, createError: action.payload };

    case EQUIPMENT_TOGGLE_REQUEST:
      return { ...state, isTogglingStatus: true };

    case EQUIPMENT_TOGGLE_SETTLED:
      return { ...state, isTogglingStatus: false, error: action.payload ?? state.error };

    case EQUIPMENT_UPDATE_REQUEST:
      return { ...state, isUpdating: true, updateError: null };

    case EQUIPMENT_UPDATE_SUCCESS:
      // Patched in place so the row (and the records panel heading, which reads
      // the name through a selector) updates before the refetch returns.
      return {
        ...state,
        isUpdating: false,
        items: state.items.map((item) => (item.id === action.payload.id ? action.payload : item)),
      };

    case EQUIPMENT_UPDATE_FAILURE:
      return { ...state, isUpdating: false, updateError: action.payload };

    case EQUIPMENT_DELETE_REQUEST:
      return { ...state, isDeleting: true, deleteError: null };

    case EQUIPMENT_DELETE_SUCCESS:
      return {
        ...state,
        isDeleting: false,
        items: state.items.filter((item) => item.id !== action.payload),
      };

    case EQUIPMENT_DELETE_FAILURE:
      return { ...state, isDeleting: false, deleteError: action.payload };

    default:
      return state;
  }
}
