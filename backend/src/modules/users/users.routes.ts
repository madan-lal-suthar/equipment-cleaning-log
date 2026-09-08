import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { User } from '../../models/index.js';

/**
 * Read-only list of seeded users so the front-end can offer a "sign in as"
 * picker for the header-based auth stand-in (see NOTES.md).
 */
export const usersRouter = Router();

usersRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const users = await User.findAll({
      attributes: ['id', 'name', 'email'],
      order: [['name', 'ASC']],
    });
    res.json({ data: users });
  }),
);

usersRouter.get(
  '/me',
  asyncHandler(async (req, res) => {
    res.json({ data: req.currentUser ?? null });
  }),
);
