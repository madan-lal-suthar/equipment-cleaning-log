const STORAGE_KEY = 'cleaning-log:user-id';

/** Storage can throw (private mode, blocked cookies) — a lost selection is fine. */
export function readStoredUserId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function writeStoredUserId(id: string | null): void {
  try {
    if (id === null) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* storage unavailable — the selection just won't persist */
  }
}
