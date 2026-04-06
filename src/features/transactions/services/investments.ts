/**
 * Investments service — talks to huginn-external REST.
 *
 * Replaces the former Firestore implementation. Screens import these
 * functions by name; signatures are preserved. Backend uses numeric ids;
 * mobile uses string ids, so we coerce at the boundary.
 */

import { api } from '@shared/services/api/httpClient';
import { Investment, InvestmentCurrency } from '../types/Investment';
import { MediaAttachment } from '@shared/types/MediaAttachment';
import { uploadInvestmentAttachments } from './investmentAttachments';

// ──────────────────────────────────────────────────────────────────────────
// Backend DTOs (mirror of huginn-external investments/types.ts)
// ──────────────────────────────────────────────────────────────────────────

interface BackendInvestmentEntry {
  id: number;
  name: string;
  type: string;
  amount: number;
  currency: 'TRY' | 'AED' | 'USD';
  description: string;
  date: string;
  isPast: boolean;
  profitLoss: number | null;
  currentValue: number | null;
  createdAt: string;
  imageUri: string;
  imageUris: string;
  videoUris: string;
  voiceNoteUris: string;
}

// ──────────────────────────────────────────────────────────────────────────
// Cache (preserved so count helpers stay cheap)
// ──────────────────────────────────────────────────────────────────────────

let investmentCache: {
  count: number;
  investments: Investment[];
  timestamp: number;
} | null = null;
const INVESTMENT_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function invalidateCache() {
  investmentCache = null;
}

// ──────────────────────────────────────────────────────────────────────────
// Mapping
// ──────────────────────────────────────────────────────────────────────────

function mapBackendToMobile(entry: BackendInvestmentEntry): Investment {
  return {
    id: String(entry.id),
    name: entry.name ?? '',
    amount: entry.amount ?? 0,
    currency: (entry.currency as InvestmentCurrency) || 'TRY',
    type: entry.type ?? '',
    description: entry.description ?? '',
    // Backend now persists attachment keys on investments (see
    // huginn-external investments migration). CSV strings of R2 object keys;
    // empty string when absent. Render via getDisplayUrl(key).
    imageUri: entry.imageUri ?? '',
    imageUris: entry.imageUris ?? '',
    videoUris: entry.videoUris ?? '',
    voiceNoteUris: entry.voiceNoteUris ?? '',
    date: entry.date,
    isPast: entry.isPast ?? false,
    profitLoss: entry.profitLoss ?? 0,
    currentValue: entry.currentValue ?? entry.amount ?? 0,
  };
}

function buildInvestmentBody(
  investment: Omit<Investment, 'id'> | Investment,
  overrides?: Partial<{
    imageUris: string;
    videoUris: string;
    voiceNoteUris: string;
    imageUri: string;
  }>,
) {
  return {
    name: investment.name,
    type: investment.type,
    amount: investment.amount,
    currency: investment.currency ?? 'TRY',
    description: investment.description || '',
    date: investment.date,
    isPast: investment.isPast ?? false,
    currentValue: investment.currentValue ?? null,
    profitLoss: investment.profitLoss ?? null,
    // Extra fields the backend currently ignores but are sent so a future
    // backend upgrade can persist R2 keys without a mobile change.
    imageUri: overrides?.imageUri ?? investment.imageUri ?? '',
    imageUris: overrides?.imageUris ?? investment.imageUris ?? '',
    videoUris: overrides?.videoUris ?? investment.videoUris ?? '',
    voiceNoteUris: overrides?.voiceNoteUris ?? investment.voiceNoteUris ?? '',
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Public API (signatures preserved)
// ──────────────────────────────────────────────────────────────────────────

export async function fetchInvestments(limit: number = 100): Promise<Investment[]> {
  try {
    const now = Date.now();

    if (investmentCache && now - investmentCache.timestamp < INVESTMENT_CACHE_DURATION) {
      return investmentCache.investments.slice(0, limit);
    }

    const entries = await api.get<BackendInvestmentEntry[]>('/api/investments');
    const investments = (entries ?? []).map(mapBackendToMobile);

    // Backend already sorts by date DESC, but be defensive.
    const sorted = investments.sort(
      (a: Investment, b: Investment) =>
        new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    investmentCache = {
      count: sorted.length,
      investments: sorted,
      timestamp: now,
    };

    return sorted.slice(0, limit);
  } catch (error) {
    console.error('Error fetching investments:', error);
    return [];
  }
}

export async function getInvestmentCount(): Promise<number> {
  try {
    const now = Date.now();
    if (investmentCache && now - investmentCache.timestamp < INVESTMENT_CACHE_DURATION) {
      return investmentCache.count;
    }
    const investments = await fetchInvestments(1000);
    return investmentCache?.count ?? investments.length;
  } catch (error) {
    console.error('Error getting investment count:', error);
    return 0;
  }
}

export async function addInvestment(investment: Omit<Investment, 'id'>): Promise<void> {
  try {
    await api.post<BackendInvestmentEntry>('/api/investments', buildInvestmentBody(investment));
    invalidateCache();
  } catch (error) {
    console.error('Error adding investment:', error);
    throw error;
  }
}

/**
 * Create a new investment with attachments. Attachments are uploaded to R2
 * first; the returned object keys are then sent as part of the investment
 * body. Because the backend does not yet allocate the investment id ahead of
 * time, attachments are uploaded under a temporary client-generated entity id
 * and the R2 keys are stored alongside the investment.
 */
export async function addInvestmentWithAttachments(
  investment: Omit<Investment, 'id' | 'imageUris' | 'videoUris' | 'voiceNoteUris'>,
  attachments: MediaAttachment[],
): Promise<void> {
  try {
    // Use a client-side temporary id for the R2 folder partition. The actual
    // investment row id is assigned server-side; we can't round-trip it here
    // without an extra GET, and R2 keys are opaque anyway.
    const tempEntityId = `new-${Date.now()}`;
    const uploaded = await uploadInvestmentAttachments(tempEntityId, attachments);

    const body = buildInvestmentBody(investment, {
      imageUri: uploaded.imageUris[0] || investment.imageUri || '',
      imageUris: uploaded.imageUris.join(','),
      videoUris: uploaded.videoUris.join(','),
      voiceNoteUris: uploaded.voiceNoteUris.join(','),
    });

    await api.post<BackendInvestmentEntry>('/api/investments', body);
    invalidateCache();
  } catch (error) {
    console.error('Error adding investment with attachments:', error);
    throw error;
  }
}

export async function updateInvestment(investment: Investment): Promise<void> {
  try {
    const id = Number(investment.id);
    if (!Number.isFinite(id)) {
      throw new Error(`Invalid investment id: ${investment.id}`);
    }
    await api.put<BackendInvestmentEntry>(`/api/investments/${id}`, buildInvestmentBody(investment));
    invalidateCache();
  } catch (error) {
    console.error('Error updating investment:', error);
    throw error;
  }
}

export async function deleteInvestment(id: string): Promise<void> {
  try {
    const numericId = Number(id);
    if (!Number.isFinite(numericId)) {
      throw new Error(`Invalid investment id: ${id}`);
    }
    await api.delete<{ id: number; mode: string }>(`/api/investments/${numericId}`);
    invalidateCache();
  } catch (error) {
    console.error('Error deleting investment:', error);
    throw error;
  }
}
