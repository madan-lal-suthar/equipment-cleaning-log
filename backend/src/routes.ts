import { Router } from 'express';
import { equipmentRouter } from './modules/equipment/equipment.routes.js';
import {
  cleaningRecordsRouter,
  equipmentCleaningRecordsRouter,
} from './modules/cleaning-records/cleaningRecord.routes.js';
import { usersRouter } from './modules/users/users.routes.js';

export const apiRouter = Router();

apiRouter.use('/equipment/:equipmentId/cleaning-records', equipmentCleaningRecordsRouter);
apiRouter.use('/equipment', equipmentRouter);
apiRouter.use('/cleaning-records', cleaningRecordsRouter);
apiRouter.use('/users', usersRouter);
