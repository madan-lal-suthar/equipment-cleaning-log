let counter = 0;

/**
 * Monotonic id stamped on every list request.
 *
 * React Query keyed its cache by query key and discarded responses for keys it
 * no longer cared about. Plain Redux has no such bookkeeping, so without this a
 * slow response for "ab" can land after a fast one for "abc" and overwrite the
 * newer results. Reducers ignore any success whose id is not the latest.
 */
export function nextRequestId(): number {
  counter += 1;
  return counter;
}
