/**
 * Thin fetch-based client for huginn-external.
 *
 * - Reads base URL from @env (API_BASE_URL_DEV/PROD, already set by the app).
 * - Attaches the shared Bearer token (HUGINN_API_TOKEN) to every request so
 *   protected data modules (notes, tasks, calendar, wtregistry, storage,
 *   transactions, investments, workout) can authenticate.
 * - Unwraps the huginn-external envelope `{ success, data, error }` and throws
 *   on non-2xx / `success: false` responses so feature services can `await`
 *   directly without envelope handling.
 *
 * Import:   import { api } from '@/shared/services/api/httpClient'
 * Use:      const notes = await api.get<Note[]>('/api/notes')
 */

import {
  API_BASE_URL_DEV,
  API_BASE_URL_PROD,
  HUGINN_API_TOKEN,
} from '@env';

const RAW_BASE = (__DEV__ ? API_BASE_URL_DEV : API_BASE_URL_PROD) ?? '';
export const API_BASE_URL = RAW_BASE.replace(/\/$/, '');

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp?: number;
}

export interface RequestOptions {
  searchParams?: Record<string, string | number | boolean | null | undefined>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  /** Override timeout in ms. Default: 30s. */
  timeoutMs?: number;
}

export class HuginnApiError extends Error {
  readonly status: number;
  readonly code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'HuginnApiError';
    this.status = status;
    this.code = code;
  }
}

function buildUrl(path: string, searchParams?: RequestOptions['searchParams']): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  let url = `${API_BASE_URL}${normalized}`;
  if (searchParams) {
    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value === null || value === undefined) continue;
      qs.append(key, String(value));
    }
    const s = qs.toString();
    if (s) url += (url.includes('?') ? '&' : '?') + s;
  }
  return url;
}

function authHeaders(): Record<string, string> {
  // HUGINN_API_TOKEN is injected at build time by react-native-dotenv.
  // If missing, the backend will 503 anyway (requireBearer is fail-closed).
  return HUGINN_API_TOKEN ? { Authorization: `Bearer ${HUGINN_API_TOKEN}` } : {};
}

async function request<T>(
  method: string,
  path: string,
  options: RequestOptions & { body?: unknown } = {}
): Promise<T> {
  const { searchParams, headers: extraHeaders, signal, timeoutMs = 30_000, body } = options;
  const url = buildUrl(path, searchParams);

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...authHeaders(),
    ...(extraHeaders ?? {}),
  };

  const init: RequestInit = { method, headers };

  if (body !== undefined) {
    if (typeof FormData !== 'undefined' && body instanceof FormData) {
      // Let the runtime set multipart boundaries automatically.
      init.body = body as BodyInit;
    } else {
      headers['Content-Type'] = headers['Content-Type'] ?? 'application/json';
      init.body = JSON.stringify(body);
    }
  }

  // Compose timeout + external signal.
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener('abort', () => controller.abort(), { once: true });
  }
  init.signal = controller.signal;

  let res: Response;
  try {
    res = await fetch(url, init);
  } catch (err) {
    clearTimeout(timeoutHandle);
    if ((err as Error)?.name === 'AbortError') {
      throw new HuginnApiError('Request aborted or timed out.', 0, 'ABORTED');
    }
    throw new HuginnApiError(
      (err as Error)?.message ?? 'Network request failed.',
      0,
      'NETWORK',
    );
  }
  clearTimeout(timeoutHandle);

  let payload: ApiEnvelope<T> | null = null;
  const text = await res.text();
  if (text) {
    try {
      payload = JSON.parse(text) as ApiEnvelope<T>;
    } catch {
      // Non-JSON response — treated as failure below if status is bad.
    }
  }

  if (!res.ok || !payload || payload.success === false) {
    const message =
      payload?.error ||
      `huginn-external ${method} ${path} failed (${res.status} ${res.statusText || ''})`.trim();
    throw new HuginnApiError(message, res.status);
  }

  return (payload.data as T);
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>('GET', path, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('POST', path, { ...options, body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PUT', path, { ...options, body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PATCH', path, { ...options, body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>('DELETE', path, options),
};

export default api;
