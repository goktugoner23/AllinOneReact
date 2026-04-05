/**
 * Thin client for huginn-external's /api/storage module (Cloudflare R2).
 *
 * Endpoints:
 *   POST   /api/storage/upload       multipart: file, folder, entityId?
 *   GET    /api/storage/sign?key=... → { url, expiresIn }  (10 min presigned)
 *   DELETE /api/storage/object?key=...
 *   GET    /api/storage/legacy?sourceUrl=...   (redirects, for legacy storage URLs)
 *
 * Security model: we store only the opaque object `key` in the database/state.
 * Every time the UI wants to display an image/file we call `getDisplayUrl(key)`
 * which re-signs via /sign. Signed URLs live for 10 minutes — we cache each
 * URL for 8 minutes to avoid hammering /sign when a list re-renders.
 */

import { api, API_BASE_URL, HuginnApiError } from '../api/httpClient';

export type StorageFolder =
  | 'notes'
  | 'investments'
  | 'registrations'
  | 'students'
  | 'transactions'
  | 'workout';

export interface UploadResult {
  key: string;
  mimeType: string;
  sizeBytes: number;
  originalName: string;
}

interface SignResponse {
  url: string;
  expiresIn: number;
}

export interface UploadFileInput {
  /** file:// or content:// URI from image picker / document picker */
  uri: string;
  fileName: string;
  mimeType: string;
  folder: StorageFolder;
  entityId?: string | null;
}

/**
 * Upload a local file to R2 via huginn-external.
 * Uses multipart/form-data; React Native's FormData streams the file directly
 * from the local URI without loading it into JS memory.
 */
export async function uploadToR2(input: UploadFileInput): Promise<UploadResult> {
  const form = new FormData();
  // RN FormData accepts { uri, name, type } for files, but TS lib.dom's
  // FormData.append only knows about Blob/string. Cast through unknown so the
  // RN runtime streams the file directly from the local URI without loading
  // it into JS memory.
  form.append(
    'file',
    {
      uri: input.uri,
      name: input.fileName,
      type: input.mimeType,
    } as unknown as Blob,
  );
  form.append('folder', input.folder);
  if (input.entityId) {
    form.append('entityId', input.entityId);
  }

  return api.post<UploadResult>('/api/storage/upload', form);
}

export async function deleteFromR2(key: string): Promise<void> {
  await api.delete<{ key: string }>('/api/storage/object', { searchParams: { key } });
}

// ──────────────────────────────────────────────────────────────────────────
// Signed-URL cache
// Keyed by object key, value is { url, expiresAt }. Evicted 2 minutes before
// the real server-side expiry so callers always get a fresh URL.
// ──────────────────────────────────────────────────────────────────────────

const SIGN_CACHE_HEADROOM_MS = 2 * 60 * 1000;
const signCache = new Map<string, { url: string; expiresAt: number }>();

export async function getDisplayUrl(key: string): Promise<string> {
  const now = Date.now();
  const cached = signCache.get(key);
  if (cached && cached.expiresAt > now + SIGN_CACHE_HEADROOM_MS) {
    return cached.url;
  }
  const res = await api.get<SignResponse>('/api/storage/sign', {
    searchParams: { key },
  });
  signCache.set(key, {
    url: res.url,
    expiresAt: now + res.expiresIn * 1000,
  });
  return res.url;
}

/** Drop a single key from the sign cache (e.g. after overwriting the object). */
export function invalidateSignCache(key: string): void {
  signCache.delete(key);
}

/** Clear everything — useful on sign-out. */
export function clearSignCache(): void {
  signCache.clear();
}

/**
 * Build a /api/storage/legacy redirect URL for a legacy storage URL embedded
 * in old notes/attachments. huginn-external resolves it to the matching R2
 * object and redirects to a signed URL.
 */
export function buildLegacyRedirectUrl(legacyUrl: string): string {
  return `${API_BASE_URL}/api/storage/legacy?sourceUrl=${encodeURIComponent(legacyUrl)}`;
}

export { HuginnApiError };
