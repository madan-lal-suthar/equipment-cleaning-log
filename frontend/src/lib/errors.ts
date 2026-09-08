import { ApiError } from '../api/client';

/**
 * A plain, serialisable snapshot of a failed request.
 *
 * Redux state is meant to be serialisable — storing the `ApiError` instance
 * itself would put a class (with a getter) in the store and break time-travel
 * debugging, so the two things the UI actually needs are extracted up front.
 */
export interface ApiErrorInfo {
  message: string;
  /** Field name -> message, from the `details` the API's zod validation returns. */
  fieldErrors: Record<string, string>;
}

export function toErrorInfo(error: unknown): ApiErrorInfo {
  if (error instanceof ApiError) {
    return { message: error.message, fieldErrors: error.fieldErrors };
  }
  if (error instanceof Error) {
    return { message: error.message, fieldErrors: {} };
  }
  return { message: 'Something went wrong', fieldErrors: {} };
}
