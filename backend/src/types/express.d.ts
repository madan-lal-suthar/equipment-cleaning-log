import type { CurrentUser } from '../middleware/currentUser.js';

declare global {
  namespace Express {
    interface Request {
      /** Set by the `currentUser` middleware from the X-User-Id header. */
      currentUser?: CurrentUser;
    }
  }
}

export {};
