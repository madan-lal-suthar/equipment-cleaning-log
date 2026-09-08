import { z } from 'zod';
import { CLEANING_STATUSES } from '../../models/CleaningRecord.js';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../../lib/pagination.js';

export const cleaningRecordIdParamSchema = z.object({
  id: z.string().uuid('Must be a valid UUID'),
});

export const equipmentIdParamSchema = z.object({
  equipmentId: z.string().uuid('Must be a valid UUID'),
});

export const createCleaningRecordSchema = z.object({
  /** Defaults to the authenticated user's name when omitted. */
  cleanedBy: z.string().trim().min(1).max(120).optional(),
  cleanedAt: z.coerce.date({ invalid_type_error: 'cleanedAt must be a valid date' }),
  method: z.string().trim().min(1, 'Method is required').max(120),
  notes: z.string().trim().max(2000).nullish(),
  status: z.enum(CLEANING_STATUSES).optional(),
});

export const updateCleaningRecordSchema = createCleaningRecordSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Provide at least one field to update',
  });

export const listCleaningRecordsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
  /** Opaque keyset cursor returned as `pageInfo.nextCursor` by the previous page. */
  cursor: z.string().min(1).optional(),
  status: z.enum(CLEANING_STATUSES).optional(),
});

export type CreateCleaningRecordInput = z.infer<typeof createCleaningRecordSchema>;
export type UpdateCleaningRecordInput = z.infer<typeof updateCleaningRecordSchema>;
export type ListCleaningRecordsQuery = z.infer<typeof listCleaningRecordsQuerySchema>;
