export type EquipmentStatus = 'active' | 'retired';
export type CleaningStatus = 'pending' | 'verified';

export interface Equipment {
  id: string;
  name: string;
  code: string;
  status: EquipmentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CleaningRecord {
  id: string;
  equipmentId: string;
  cleanedBy: string;
  cleanedAt: string;
  method: string;
  notes: string | null;
  status: CleaningStatus;
  createdAt: string;
  updatedAt: string;
}

export interface FieldChange {
  field: string;
  from: unknown;
  to: unknown;
}

export interface AuditEntry {
  id: string;
  entityType: string;
  entityId: string;
  action: 'create' | 'update';
  changedById: string | null;
  changedByName: string;
  changedAt: string;
  changes: FieldChange[];
}

export interface User {
  id: string;
  name: string;
  email: string;
}

/** Offset pagination — used for the equipment list. */
export interface OffsetPage<T> {
  data: T[];
  pageInfo: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
  };
}

/** Keyset pagination — used for cleaning records. */
export interface KeysetPage<T> {
  data: T[];
  pageInfo: {
    limit: number;
    hasNextPage: boolean;
    nextCursor: string | null;
  };
}

export interface CleaningRecordInput {
  cleanedBy?: string;
  cleanedAt: string;
  method: string;
  notes?: string | null;
  status?: CleaningStatus;
}
