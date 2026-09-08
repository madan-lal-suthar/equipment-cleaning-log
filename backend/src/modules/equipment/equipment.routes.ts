import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { requireUser } from '../../middleware/currentUser.js';
import * as controller from './equipment.controller.js';

export const equipmentRouter = Router();

equipmentRouter.get('/', asyncHandler(controller.list));
equipmentRouter.get('/:id', asyncHandler(controller.getOne));
equipmentRouter.post('/', requireUser, asyncHandler(controller.create));
equipmentRouter.patch('/:id', requireUser, asyncHandler(controller.update));
equipmentRouter.delete('/:id', requireUser, asyncHandler(controller.remove));
