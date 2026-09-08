/**
 * Keyset pagination has no page numbers, so "previous" is only possible if the
 * client remembers the cursors it has already used. This tiny stack does that:
 * index 0 is the first page (no cursor), and each "next" pushes the cursor that
 * opens the following page.
 */
export interface CursorStack {
  /** cursors[i] opens page i; cursors[0] is always null. */
  cursors: (string | null)[];
  index: number;
}

export const initialCursorStack: CursorStack = { cursors: [null], index: 0 };

export function currentCursor(stack: CursorStack): string | null {
  return stack.cursors[stack.index] ?? null;
}

export function goToNextPage(stack: CursorStack, nextCursor: string | null): CursorStack {
  if (!nextCursor) return stack;

  const index = stack.index + 1;
  // Re-visiting a page we already have keeps the stack stable instead of forking it.
  if (stack.cursors[index] === nextCursor) return { ...stack, index };

  return { cursors: [...stack.cursors.slice(0, index), nextCursor], index };
}

export function goToPreviousPage(stack: CursorStack): CursorStack {
  return { ...stack, index: Math.max(0, stack.index - 1) };
}

export function isFirstPage(stack: CursorStack): boolean {
  return stack.index === 0;
}
