import type { Request, Response } from 'express';
import { getCurrentUser } from '../../middleware/currentUser.js';
import * as service from './cleaningRecord.service.js';
import {
  cleaningRecordIdParamSchema,
  createCleaningRecordSchema,
  equipmentIdParamSchema,
  listCleaningRecordsQuerySchema,
  updateCleaningRecordSchema,
} from './cleaningRecord.schemas.js';

export async function listForEquipment(req: Request, res: Response): Promise<void> {
  const { equipmentId } = equipmentIdParamSchema.parse(req.params);
  const query = listCleaningRecordsQuerySchema.parse(req.query);
  res.json(await service.listCleaningRecords(equipmentId, query));
}

export async function createForEquipment(req: Request, res: Response): Promise<void> {
  const { equipmentId } = equipmentIdParamSchema.parse(req.params);
  const body = createCleaningRecordSchema.parse(req.body);
  const record = await service.createCleaningRecord(equipmentId, body, getCurrentUser(req));
  res.status(201).json({ data: record });
}

export async function getOne(req: Request, res: Response): Promise<void> {
  const { id } = cleaningRecordIdParamSchema.parse(req.params);
  res.json({ data: await service.getCleaningRecordOrFail(id) });
}

export async function update(req: Request, res: Response): Promise<void> {
  const { id } = cleaningRecordIdParamSchema.parse(req.params);
  const body = updateCleaningRecordSchema.parse(req.body);
  const record = await service.updateCleaningRecord(id, body, getCurrentUser(req));
  res.json({ data: record });
}

export async function auditTrail(req: Request, res: Response): Promise<void> {
  const { id } = cleaningRecordIdParamSchema.parse(req.params);
  res.json({ data: await service.getCleaningRecordAudit(id) });
}
