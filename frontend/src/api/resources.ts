import { apiFetch } from './client';
import type {
  AuditEntry,
  CleaningRecord,
  CleaningRecordInput,
  CleaningStatus,
  Equipment,
  EquipmentStatus,
  KeysetPage,
  OffsetPage,
  User,
} from '../types';

export const usersApi = {
  list: () => apiFetch<{ data: User[] }>('/api/users').then((r) => r.data),
};

export const equipmentApi = {
  list: (params: { page: number; pageSize: number; status?: EquipmentStatus | ''; search?: string }) =>
    apiFetch<OffsetPage<Equipment>>('/api/equipment', { query: params }),

  create: (body: { name: string; code: string; status?: EquipmentStatus }, userId: string) =>
    apiFetch<{ data: Equipment }>('/api/equipment', { method: 'POST', body, userId }).then(
      (r) => r.data,
    ),

  update: (id: string, body: Partial<{ name: string; code: string; status: EquipmentStatus }>, userId: string) =>
    apiFetch<{ data: Equipment }>(`/api/equipment/${id}`, { method: 'PATCH', body, userId }).then(
      (r) => r.data,
    ),

  remove: (id: string, userId: string) =>
    apiFetch<void>(`/api/equipment/${id}`, { method: 'DELETE', userId }),
};

export const cleaningRecordsApi = {
  list: (
    equipmentId: string,
    params: { limit: number; cursor?: string | null; status?: CleaningStatus | '' },
  ) =>
    apiFetch<KeysetPage<CleaningRecord>>(`/api/equipment/${equipmentId}/cleaning-records`, {
      query: params,
    }),

  create: (equipmentId: string, body: CleaningRecordInput, userId: string) =>
    apiFetch<{ data: CleaningRecord }>(`/api/equipment/${equipmentId}/cleaning-records`, {
      method: 'POST',
      body,
      userId,
    }).then((r) => r.data),

  update: (id: string, body: Partial<CleaningRecordInput>, userId: string) =>
    apiFetch<{ data: CleaningRecord }>(`/api/cleaning-records/${id}`, {
      method: 'PATCH',
      body,
      userId,
    }).then((r) => r.data),

  audit: (id: string) =>
    apiFetch<{ data: AuditEntry[] }>(`/api/cleaning-records/${id}/audit`).then((r) => r.data),
};
