import { api } from '@shared/services/api/httpClient';
import type { DietDayResult, DietEntryPatch, DietLogEntry } from '../types/Diet';

/** Read all entries for a single day + totals. Defaults to today. */
export async function getDietDay(date?: string): Promise<DietDayResult> {
  const params: Record<string, string> = {};
  if (date) params.date = date;
  return api.get<DietDayResult>('/api/diet', { searchParams: params });
}

/** Patch one entry by id (any subset of fields). */
export async function updateDietEntry(
  id: number,
  patch: DietEntryPatch,
): Promise<DietLogEntry> {
  return api.patch<DietLogEntry>(`/api/diet/${id}`, patch);
}

/** Delete one entry. Backend best-effort cleans up its R2 photos. */
export async function deleteDietEntry(id: number): Promise<{ id: number; deletedPhotoKeys: string[] }> {
  return api.delete<{ id: number; deletedPhotoKeys: string[] }>(`/api/diet/${id}`);
}
