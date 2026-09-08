import { CURRENT_USER_SET, USERS_FAILURE, USERS_REQUEST, USERS_SUCCESS } from '../actionTypes';
import { readStoredUserId } from '../currentUserStorage';
import type { AppAction } from '../actions';
import type { ApiErrorInfo } from '../../lib/errors';
import type { User } from '../../types';

export interface UsersState {
  items: User[];
  isLoading: boolean;
  error: ApiErrorInfo | null;
  /** The "signed in as" selection, restored from localStorage on boot. */
  currentUserId: string | null;
}

const initialState: UsersState = {
  items: [],
  isLoading: false,
  error: null,
  currentUserId: readStoredUserId(),
};

export function usersReducer(state: UsersState = initialState, action: AppAction): UsersState {
  switch (action.type) {
    case USERS_REQUEST:
      return { ...state, isLoading: true, error: null };

    case USERS_SUCCESS: {
      const items = action.payload;
      // Fall back to the first seeded user so the app is usable straight away,
      // and drop a stored id that no longer matches a real user.
      const keepCurrent =
        state.currentUserId !== null && items.some((user) => user.id === state.currentUserId);

      return {
        ...state,
        isLoading: false,
        items,
        currentUserId: keepCurrent ? state.currentUserId : (items[0]?.id ?? null),
      };
    }

    case USERS_FAILURE:
      return { ...state, isLoading: false, error: action.payload };

    case CURRENT_USER_SET:
      return { ...state, currentUserId: action.payload };

    default:
      return state;
  }
}
