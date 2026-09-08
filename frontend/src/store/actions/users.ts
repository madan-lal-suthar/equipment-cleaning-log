import { usersApi } from '../../api/resources';
import { toErrorInfo, type ApiErrorInfo } from '../../lib/errors';
import { CURRENT_USER_SET, USERS_FAILURE, USERS_REQUEST, USERS_SUCCESS } from '../actionTypes';
import type { AppThunk } from '../types';
import type { User } from '../../types';

export interface UsersRequestAction {
  type: typeof USERS_REQUEST;
}
export interface UsersSuccessAction {
  type: typeof USERS_SUCCESS;
  payload: User[];
}
export interface UsersFailureAction {
  type: typeof USERS_FAILURE;
  payload: ApiErrorInfo;
}
export interface CurrentUserSetAction {
  type: typeof CURRENT_USER_SET;
  payload: string;
}

export type UsersAction =
  | UsersRequestAction
  | UsersSuccessAction
  | UsersFailureAction
  | CurrentUserSetAction;

export const usersRequested = (): UsersRequestAction => ({ type: USERS_REQUEST });

export const usersLoaded = (users: User[]): UsersSuccessAction => ({
  type: USERS_SUCCESS,
  payload: users,
});

export const usersFailed = (error: ApiErrorInfo): UsersFailureAction => ({
  type: USERS_FAILURE,
  payload: error,
});

/** The chosen id is sent as X-User-Id on every write — see `api/client.ts`. */
export const setCurrentUserId = (id: string): CurrentUserSetAction => ({
  type: CURRENT_USER_SET,
  payload: id,
});

export const fetchUsers = (): AppThunk<Promise<void>> => async (dispatch) => {
  dispatch(usersRequested());
  try {
    dispatch(usersLoaded(await usersApi.list()));
  } catch (error) {
    dispatch(usersFailed(toErrorInfo(error)));
  }
};
