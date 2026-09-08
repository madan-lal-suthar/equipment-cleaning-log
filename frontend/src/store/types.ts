import type { ThunkAction, ThunkDispatch } from 'redux-thunk';
import type { AppAction } from './actions';
import type { RootState } from './reducers';

/**
 * Return type for every thunk in `store/actions`. Plain Redux has no
 * `createAsyncThunk`, so async work is an ordinary function that receives
 * `dispatch` and `getState` and dispatches the request/success/failure trio
 * itself.
 */
export type AppThunk<Result = void> = ThunkAction<Result, RootState, undefined, AppAction>;

/** `dispatch` that accepts thunks as well as plain actions. */
export type AppDispatch = ThunkDispatch<RootState, undefined, AppAction>;
