import { combineReducers } from 'redux';
import { auditReducer } from './audit';
import { cleaningRecordsReducer } from './cleaningRecords';
import { equipmentReducer } from './equipment';
import { uiReducer } from './ui';
import { usersReducer } from './users';

export const rootReducer = combineReducers({
  users: usersReducer,
  equipment: equipmentReducer,
  cleaningRecords: cleaningRecordsReducer,
  audit: auditReducer,
  ui: uiReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
