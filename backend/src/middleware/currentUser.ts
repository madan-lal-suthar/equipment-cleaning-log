import type { NextFunction, Request, Response } from 'express';
import { User } from '../models/index.js';
import { UnauthorizedError } from '../lib/errors.js';

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
}

const USER_HEADER = 'x-user-id';

/**
 * Deliberately minimal stand-in for real auth (see NOTES.md): the client sends
 * the id of a seeded user in `X-User-Id` and we resolve it against the database,
 * so `cleanedBy` and the audit "who" always point at a real row.
 */
export async function currentUser(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const headerValue = req.header(USER_HEADER);

  if (!headerValue) {
    next();
    return;
  }

  try {
    const user = await User.findByPk(headerValue);
    if (!user) {
      next(new UnauthorizedError('Unknown user id in X-User-Id header'));
      return;
    }
    req.currentUser = { id: user.id, name: user.name, email: user.email };
    next();
  } catch {
    // A malformed (non-UUID) header makes Postgres reject the query.
    next(new UnauthorizedError('Invalid user id in X-User-Id header'));
  }
}

/** Guard for the routes that write data — every audit entry needs an actor. */
export function requireUser(req: Request, _res: Response, next: NextFunction): void {
  if (!req.currentUser) {
    next(new UnauthorizedError('X-User-Id header is required for this operation'));
    return;
  }
  next();
}

export function getCurrentUser(req: Request): CurrentUser {
  if (!req.currentUser) throw new UnauthorizedError();
  return req.currentUser;
}
