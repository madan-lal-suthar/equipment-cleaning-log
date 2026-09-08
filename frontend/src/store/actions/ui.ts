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
import type {
  CleaningRecord,
  CleaningStatus,
  Equipment,
  EquipmentStatus,
} from '../../types';

export interface EquipmentSelectedAction {
  type: typeof EQUIPMENT_SELECTED;
  payload: string | null;
}
export interface EquipmentPageSetAction {
  type: typeof EQUIPMENT_PAGE_SET;
  payload: number;
}
export interface EquipmentFiltersSetAction {
  type: typeof EQUIPMENT_FILTERS_SET;
  payload: { status?: EquipmentStatus | ''; search?: string };
}
export interface EquipmentAddingSetAction {
  type: typeof EQUIPMENT_ADDING_SET;
  payload: boolean;
}
export interface EquipmentEditingSetAction {
  type: typeof EQUIPMENT_EDITING_SET;
  payload: Equipment | null;
}
export interface EquipmentPendingDeleteSetAction {
  type: typeof EQUIPMENT_PENDING_DELETE_SET;
  payload: Equipment | null;
}
export interface RecordsStatusFilterSetAction {
  type: typeof RECORDS_STATUS_FILTER_SET;
  payload: CleaningStatus | '';
}
export interface RecordsNextPageAction {
  type: typeof RECORDS_NEXT_PAGE;
  payload: string | null;
}
export interface RecordsPrevPageAction {
  type: typeof RECORDS_PREV_PAGE;
}
export interface RecordsPageResetAction {
  type: typeof RECORDS_PAGE_RESET;
}
export interface RecordEditingSetAction {
  type: typeof RECORD_EDITING_SET;
  payload: CleaningRecord | null;
}
export interface RecordAddingSetAction {
  type: typeof RECORD_ADDING_SET;
  payload: boolean;
}
export interface AuditRecordToggledAction {
  type: typeof AUDIT_RECORD_TOGGLED;
  payload: string;
}

export type UiAction =
  | EquipmentSelectedAction
  | EquipmentPageSetAction
  | EquipmentFiltersSetAction
  | EquipmentAddingSetAction
  | EquipmentEditingSetAction
  | EquipmentPendingDeleteSetAction
  | RecordsStatusFilterSetAction
  | RecordsNextPageAction
  | RecordsPrevPageAction
  | RecordsPageResetAction
  | RecordEditingSetAction
  | RecordAddingSetAction
  | AuditRecordToggledAction;

export const selectEquipment = (id: string | null): EquipmentSelectedAction => ({
  type: EQUIPMENT_SELECTED,
  payload: id,
});

export const setEquipmentPage = (page: number): EquipmentPageSetAction => ({
  type: EQUIPMENT_PAGE_SET,
  payload: page,
});

export const setEquipmentFilters = (filters: {
  status?: EquipmentStatus | '';
  search?: string;
}): EquipmentFiltersSetAction => ({ type: EQUIPMENT_FILTERS_SET, payload: filters });

export const setEquipmentAdding = (isAdding: boolean): EquipmentAddingSetAction => ({
  type: EQUIPMENT_ADDING_SET,
  payload: isAdding,
});

export const setEditingEquipment = (equipment: Equipment | null): EquipmentEditingSetAction => ({
  type: EQUIPMENT_EDITING_SET,
  payload: equipment,
});

/**
 * Arms the delete confirmation for one row. Deleting equipment cascades to its
 * cleaning records, so it is never a single click.
 */
export const setEquipmentPendingDelete = (
  equipment: Equipment | null,
): EquipmentPendingDeleteSetAction => ({
  type: EQUIPMENT_PENDING_DELETE_SET,
  payload: equipment,
});

export const setRecordsStatusFilter = (
  status: CleaningStatus | '',
): RecordsStatusFilterSetAction => ({ type: RECORDS_STATUS_FILTER_SET, payload: status });

export const goToNextRecordsPage = (nextCursor: string | null): RecordsNextPageAction => ({
  type: RECORDS_NEXT_PAGE,
  payload: nextCursor,
});

export const goToPreviousRecordsPage = (): RecordsPrevPageAction => ({ type: RECORDS_PREV_PAGE });

export const resetRecordsPaging = (): RecordsPageResetAction => ({ type: RECORDS_PAGE_RESET });

export const setEditingRecord = (record: CleaningRecord | null): RecordEditingSetAction => ({
  type: RECORD_EDITING_SET,
  payload: record,
});

export const setRecordAdding = (isAdding: boolean): RecordAddingSetAction => ({
  type: RECORD_ADDING_SET,
  payload: isAdding,
});

/** Opens the audit trail for a record, or closes it if it is already open. */
export const toggleAuditRecord = (recordId: string): AuditRecordToggledAction => ({
  type: AUDIT_RECORD_TOGGLED,
  payload: recordId,
});
