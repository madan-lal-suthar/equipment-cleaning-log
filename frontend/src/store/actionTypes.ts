/**
 * Every action string the app can dispatch, in one place.
 *
 * Plain Redux has no `createSlice` to generate these; a typo in an inline
 * string is a silent no-op that type-checks, so the constants are the only
 * thing keeping the action creators and the reducers in sync.
 */

// --- users -----------------------------------------------------------------
export const USERS_REQUEST = 'users/request';
export const USERS_SUCCESS = 'users/success';
export const USERS_FAILURE = 'users/failure';
export const CURRENT_USER_SET = 'users/currentUserSet';

// --- equipment -------------------------------------------------------------
export const EQUIPMENT_REQUEST = 'equipment/request';
export const EQUIPMENT_SUCCESS = 'equipment/success';
export const EQUIPMENT_FAILURE = 'equipment/failure';
export const EQUIPMENT_CREATE_REQUEST = 'equipment/createRequest';
export const EQUIPMENT_CREATE_SUCCESS = 'equipment/createSuccess';
export const EQUIPMENT_CREATE_FAILURE = 'equipment/createFailure';
export const EQUIPMENT_TOGGLE_REQUEST = 'equipment/toggleRequest';
export const EQUIPMENT_TOGGLE_SETTLED = 'equipment/toggleSettled';
export const EQUIPMENT_UPDATE_REQUEST = 'equipment/updateRequest';
export const EQUIPMENT_UPDATE_SUCCESS = 'equipment/updateSuccess';
export const EQUIPMENT_UPDATE_FAILURE = 'equipment/updateFailure';
export const EQUIPMENT_DELETE_REQUEST = 'equipment/deleteRequest';
export const EQUIPMENT_DELETE_SUCCESS = 'equipment/deleteSuccess';
export const EQUIPMENT_DELETE_FAILURE = 'equipment/deleteFailure';

// --- cleaning records ------------------------------------------------------
export const RECORDS_REQUEST = 'records/request';
export const RECORDS_SUCCESS = 'records/success';
export const RECORDS_FAILURE = 'records/failure';
export const RECORD_CREATE_REQUEST = 'records/createRequest';
export const RECORD_CREATE_SUCCESS = 'records/createSuccess';
export const RECORD_CREATE_FAILURE = 'records/createFailure';
export const RECORD_UPDATE_REQUEST = 'records/updateRequest';
export const RECORD_UPDATE_SUCCESS = 'records/updateSuccess';
export const RECORD_UPDATE_FAILURE = 'records/updateFailure';

// --- audit trail -----------------------------------------------------------
export const AUDIT_REQUEST = 'audit/request';
export const AUDIT_SUCCESS = 'audit/success';
export const AUDIT_FAILURE = 'audit/failure';

// --- ui --------------------------------------------------------------------
export const EQUIPMENT_SELECTED = 'ui/equipmentSelected';
export const EQUIPMENT_PAGE_SET = 'ui/equipmentPageSet';
export const EQUIPMENT_FILTERS_SET = 'ui/equipmentFiltersSet';
export const EQUIPMENT_ADDING_SET = 'ui/equipmentAddingSet';
export const EQUIPMENT_EDITING_SET = 'ui/equipmentEditingSet';
export const EQUIPMENT_PENDING_DELETE_SET = 'ui/equipmentPendingDeleteSet';
export const RECORDS_STATUS_FILTER_SET = 'ui/recordsStatusFilterSet';
export const RECORDS_NEXT_PAGE = 'ui/recordsNextPage';
export const RECORDS_PREV_PAGE = 'ui/recordsPrevPage';
export const RECORDS_PAGE_RESET = 'ui/recordsPageReset';
export const RECORD_EDITING_SET = 'ui/recordEditingSet';
export const RECORD_ADDING_SET = 'ui/recordAddingSet';
export const AUDIT_RECORD_TOGGLED = 'ui/auditRecordToggled';
