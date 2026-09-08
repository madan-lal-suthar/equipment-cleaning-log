import {
  goToNextPage,
  goToPreviousPage,
  initialCursorStack,
  type CursorStack,
} from '../../lib/cursorStack';
import {
  AUDIT_RECORD_TOGGLED,
  EQUIPMENT_ADDING_SET,
  EQUIPMENT_EDITING_SET,
  EQUIPMENT_FILTERS_SET,
  EQUIPMENT_PAGE_SET,
  EQUIPMENT_PENDING_DELETE_SET,
  EQUIPMENT_SELECTED,
  RECORD_ADDING_SET,
  RECORD_EDITING_SET,
  RECORDS_NEXT_PAGE,
  RECORDS_PAGE_RESET,
  RECORDS_PREV_PAGE,
  RECORDS_STATUS_FILTER_SET,
} from '../actionTypes';
import type { AppAction } from '../actions';
import type {
  CleaningRecord,
  CleaningStatus,
  Equipment,
  EquipmentStatus,
} from '../../types';

export interface EquipmentUiState {
  page: number;
  status: EquipmentStatus | '';
  search: string;
  isAdding: boolean;
  /** The row whose inline edit form is open. */
  editing: Equipment | null;
  /** The row whose delete confirmation is showing. */
  pendingDelete: Equipment | null;
}

export interface RecordsUiState {
  status: CleaningStatus | '';
  cursorStack: CursorStack;
  editing: CleaningRecord | null;
  isAdding: boolean;
  auditRecordId: string | null;
}

export interface UiState {
  selectedEquipmentId: string | null;
  equipment: EquipmentUiState;
  records: RecordsUiState;
}

const initialEquipmentUi: EquipmentUiState = {
  page: 1,
  status: '',
  search: '',
  isAdding: false,
  editing: null,
  pendingDelete: null,
};

const initialRecordsUi: RecordsUiState = {
  status: '',
  cursorStack: initialCursorStack,
  editing: null,
  isAdding: false,
  auditRecordId: null,
};

const initialState: UiState = {
  selectedEquipmentId: null,
  equipment: initialEquipmentUi,
  records: initialRecordsUi,
};

export function uiReducer(state: UiState = initialState, action: AppAction): UiState {
  switch (action.type) {
    // Every part of the records panel is scoped to one piece of equipment, so
    // selecting another resets the lot.
    case EQUIPMENT_SELECTED:
      return { ...state, selectedEquipmentId: action.payload, records: initialRecordsUi };

    case EQUIPMENT_PAGE_SET:
      return { ...state, equipment: { ...state.equipment, page: action.payload } };

    case EQUIPMENT_FILTERS_SET: {
      const { status, search } = action.payload;
      return {
        ...state,
        equipment: {
          ...state.equipment,
          ...(status !== undefined ? { status } : {}),
          ...(search !== undefined ? { search } : {}),
          page: 1, // a changed filter invalidates the current page number
        },
      };
    }

    // Adding, editing and confirming a delete are mutually exclusive: opening
    // any one of them closes the other two, so the list never shows two forms.
    case EQUIPMENT_ADDING_SET:
      return {
        ...state,
        equipment: {
          ...state.equipment,
          isAdding: action.payload,
          ...(action.payload ? { editing: null, pendingDelete: null } : {}),
        },
      };

    case EQUIPMENT_EDITING_SET:
      return {
        ...state,
        equipment: {
          ...state.equipment,
          editing: action.payload,
          ...(action.payload ? { isAdding: false, pendingDelete: null } : {}),
        },
      };

    case EQUIPMENT_PENDING_DELETE_SET:
      return {
        ...state,
        equipment: {
          ...state.equipment,
          pendingDelete: action.payload,
          ...(action.payload ? { isAdding: false, editing: null } : {}),
        },
      };

    case RECORDS_STATUS_FILTER_SET:
      return {
        ...state,
        records: {
          ...state.records,
          status: action.payload,
          // cursors are only valid for the filter that produced them
          cursorStack: initialCursorStack,
        },
      };

    case RECORDS_NEXT_PAGE:
      return {
        ...state,
        records: {
          ...state.records,
          cursorStack: goToNextPage(state.records.cursorStack, action.payload),
        },
      };

    case RECORDS_PREV_PAGE:
      return {
        ...state,
        records: { ...state.records, cursorStack: goToPreviousPage(state.records.cursorStack) },
      };

    case RECORDS_PAGE_RESET:
      return { ...state, records: { ...state.records, cursorStack: initialCursorStack } };

    case RECORD_EDITING_SET:
      return {
        ...state,
        // Editing and adding are mutually exclusive — only one form is shown.
        records: {
          ...state.records,
          editing: action.payload,
          isAdding: action.payload ? false : state.records.isAdding,
        },
      };

    case RECORD_ADDING_SET:
      return {
        ...state,
        records: {
          ...state.records,
          isAdding: action.payload,
          editing: action.payload ? null : state.records.editing,
        },
      };

    case AUDIT_RECORD_TOGGLED:
      return {
        ...state,
        records: {
          ...state.records,
          auditRecordId: state.records.auditRecordId === action.payload ? null : action.payload,
        },
      };

    default:
      return state;
  }
}
