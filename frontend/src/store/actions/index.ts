import type { AuditAction } from './audit';
import type { CleaningRecordsAction } from './cleaningRecords';
import type { EquipmentAction } from './equipment';
import type { UiAction } from './ui';
import type { UsersAction } from './users';

/** Every plain action the store can receive — the reducers' `action` type. */
export type AppAction =
  | UsersAction
  | EquipmentAction
  | CleaningRecordsAction
  | AuditAction
  | UiAction;

export * from './audit';
export * from './cleaningRecords';
export * from './equipment';
export * from './ui';
export * from './users';
