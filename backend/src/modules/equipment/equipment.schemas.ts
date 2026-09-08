import { z } from 'zod';
import { EQUIPMENT_STATUSES } from '../../models/Equipment.js';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../../lib/pagination.js';

export const equipmentIdParamSchema = z.object({
  id: z.string().uuid('Must be a valid UUID'),
});

export const createEquipmentSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(160),
  code: z.string().trim().min(1, 'Code is required').max(60),
  status: z.enum(EQUIPMENT_STATUSES).optional(),
});

/** PATCH semantics: every field optional, but at least one must be present. */
export const updateEquipmentSchema = createEquipmentSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: 'Provide at least one field to update' },
);

export const listEquipmentQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
  status: z.enum(EQUIPMENT_STATUSES).optional(),
  // A search of "" or "   " means "not searching", not a bad request: it is what
  // a user leaves behind when clearing the box or typing a stray space. It
  // trims to undefined so the service simply omits the filter. Rejecting it
  // would turn an ordinary keystroke into a 400.
  search: z
    .string()
    .trim()
    .max(160)
    .optional()
    .transform((value) => (value === '' ? undefined : value)),
});

export type CreateEquipmentInput = z.infer<typeof createEquipmentSchema>;
export type UpdateEquipmentInput = z.infer<typeof updateEquipmentSchema>;
export type ListEquipmentQuery = z.infer<typeof listEquipmentQuerySchema>;
