import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { requireUser } from '../../middleware/currentUser.js';
import * as controller from './cleaningRecord.controller.js';

/** Nested under an equipment: /api/equipment/:equipmentId/cleaning-records */
export const equipmentCleaningRecordsRouter = Router({ mergeParams: true });

equipmentCleaningRecordsRouter.get('/', asyncHandler(controller.listForEquipment));
equipmentCleaningRecordsRouter.post('/', requireUser, asyncHandler(controller.createForEquipment));

/**
 * Flat routes for a single record: /api/cleaning-records/:id. A record id is
 * globally unique, so making the client repeat the equipment id would be noise.
 */
export const cleaningRecordsRouter = Router();

cleaningRecordsRouter.get('/:id', asyncHandler(controller.getOne));
cleaningRecordsRouter.patch('/:id', requireUser, asyncHandler(controller.update));
cleaningRecordsRouter.get('/:id/audit', asyncHandler(controller.auditTrail));
