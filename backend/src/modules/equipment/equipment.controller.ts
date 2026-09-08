import type { Request, Response } from 'express';
import * as service from './equipment.service.js';
import {
  createEquipmentSchema,
  equipmentIdParamSchema,
  listEquipmentQuerySchema,
  updateEquipmentSchema,
} from './equipment.schemas.js';

/**
 * Controllers parse their own input with zod and let the thrown ZodError be
 * turned into a 400 by the error handler. Everything past `.parse()` is typed.
 */
export async function list(req: Request, res: Response): Promise<void> {
  const query = listEquipmentQuerySchema.parse(req.query);
  res.json(await service.listEquipment(query));
}

export async function getOne(req: Request, res: Response): Promise<void> {
  const { id } = equipmentIdParamSchema.parse(req.params);
  res.json({ data: await service.getEquipmentOrFail(id) });
}

export async function create(req: Request, res: Response): Promise<void> {
  const body = createEquipmentSchema.parse(req.body);
  res.status(201).json({ data: await service.createEquipment(body) });
}

export async function update(req: Request, res: Response): Promise<void> {
  const { id } = equipmentIdParamSchema.parse(req.params);
  const body = updateEquipmentSchema.parse(req.body);
  res.json({ data: await service.updateEquipment(id, body) });
}

export async function remove(req: Request, res: Response): Promise<void> {
  const { id } = equipmentIdParamSchema.parse(req.params);
  await service.deleteEquipment(id);
  res.status(204).send();
}
