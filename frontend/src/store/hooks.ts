import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from './index';

/** `useDispatch` that knows thunks are dispatchable. */
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();

/** `useSelector` with `RootState` already applied, so selectors need no annotation. */
export const useAppSelector = useSelector.withTypes<RootState>();
