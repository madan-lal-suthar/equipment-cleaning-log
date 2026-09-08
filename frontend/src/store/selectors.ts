import type { RootState } from './reducers';
import type { Equipment, User } from '../types';

export const selectCurrentUser = (state: RootState): User | null =>
  state.users.items.find((user) => user.id === state.users.currentUserId) ?? null;

/**
 * The selected equipment, read out of the list already in the store.
 *
 * The React Query version fetched `?page=1&pageSize=100` and searched it just
 * to put a name in the panel heading. Selection can only start from a rendered
 * row, and `EQUIPMENT_CREATE_SUCCESS` puts a freshly created one into `items`,
 * so the extra request has no reason to exist.
 */
export const selectSelectedEquipment = (state: RootState): Equipment | null => {
  const { selectedEquipmentId } = state.ui;
  if (selectedEquipmentId === null) return null;
  return state.equipment.items.find((item) => item.id === selectedEquipmentId) ?? null;
};

export const selectSelectedEquipmentName = (state: RootState): string =>
  selectSelectedEquipment(state)?.name ?? '';
