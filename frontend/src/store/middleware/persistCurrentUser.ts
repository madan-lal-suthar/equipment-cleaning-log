import type { Middleware } from 'redux';
import { writeStoredUserId } from '../currentUserStorage';
import type { RootState } from '../reducers';

/**
 * Mirrors the "signed in as" selection into localStorage.
 *
 * It watches the resulting state rather than listening for one action, because
 * the id changes two ways: the user picks somebody, or the users list loads and
 * the reducer falls back to the first seeded user.
 */
export const persistCurrentUser: Middleware<object, RootState> =
  (store) => (next) => (action) => {
    const before = store.getState().users.currentUserId;
    const result = next(action);
    const after = store.getState().users.currentUserId;

    if (before !== after) writeStoredUserId(after);
    return result;
  };
