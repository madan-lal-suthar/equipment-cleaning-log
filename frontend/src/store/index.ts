import { applyMiddleware, legacy_createStore as createStore } from 'redux';
import { thunk } from 'redux-thunk';
import { persistCurrentUser } from './middleware/persistCurrentUser';
import { rootReducer } from './reducers';

/**
 * Plain Redux, no Toolkit: `createStore` plus the two pieces of middleware the
 * app actually needs. `legacy_createStore` is the same function as
 * `createStore` without the deprecation warning Redux 5 attaches to the latter
 * to steer people towards `configureStore`.
 */
export const store = createStore(
  rootReducer,
  // Explicitly "no preloaded state": with the enhancer in the second slot,
  // TypeScript picks the `preloadedState` overload and the call fails to
  // type-check.
  undefined,
  applyMiddleware(thunk, persistCurrentUser),
);

export type { RootState } from './reducers';
export type { AppDispatch, AppThunk } from './types';
