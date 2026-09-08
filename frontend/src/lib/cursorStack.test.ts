import { describe, expect, it } from 'vitest';
import {
  currentCursor,
  goToNextPage,
  goToPreviousPage,
  initialCursorStack,
  isFirstPage,
} from './cursorStack';

describe('cursorStack', () => {
  it('starts on the first page with no cursor', () => {
    expect(currentCursor(initialCursorStack)).toBeNull();
    expect(isFirstPage(initialCursorStack)).toBe(true);
  });

  it('walks forward and back through remembered cursors', () => {
    const page2 = goToNextPage(initialCursorStack, 'cursor-2');
    const page3 = goToNextPage(page2, 'cursor-3');

    expect(currentCursor(page3)).toBe('cursor-3');
    expect(page3.index).toBe(2);

    const backToPage2 = goToPreviousPage(page3);
    expect(currentCursor(backToPage2)).toBe('cursor-2');

    const backToPage1 = goToPreviousPage(backToPage2);
    expect(currentCursor(backToPage1)).toBeNull();
    expect(isFirstPage(backToPage1)).toBe(true);
  });

  it('does not move past the first page', () => {
    expect(goToPreviousPage(initialCursorStack)).toEqual(initialCursorStack);
  });

  it('ignores a next request when the API reported no next cursor', () => {
    expect(goToNextPage(initialCursorStack, null)).toEqual(initialCursorStack);
  });

  it('reuses the stack when stepping forward over an already-seen cursor', () => {
    const page2 = goToNextPage(initialCursorStack, 'cursor-2');
    const page3 = goToNextPage(page2, 'cursor-3');
    const replayed = goToNextPage(goToPreviousPage(page3), 'cursor-3');

    expect(replayed.cursors).toEqual(page3.cursors);
    expect(replayed.index).toBe(2);
  });

  it('drops stale forward history when a page hands back a different cursor', () => {
    const page2 = goToNextPage(initialCursorStack, 'cursor-2');
    const page3 = goToNextPage(page2, 'cursor-3');
    const rewalked = goToNextPage(goToPreviousPage(page3), 'cursor-3-changed');

    expect(rewalked.cursors).toEqual([null, 'cursor-2', 'cursor-3-changed']);
  });
});
