export interface DietLogEntry {
  id: number;
  date: string;
  name: string;
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  mealLabel: string | null;
  notes: string | null;
  /** 0..N R2 object keys for photos attached to this entry. */
  photoKeys: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DietDayTotals {
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface DietDayResult {
  date: string;
  entries: DietLogEntry[];
  totals: DietDayTotals;
}

export interface DietEntryPatch {
  name?: string;
  kcal?: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
  mealLabel?: string | null;
  notes?: string | null;
  photoKeys?: string[];
  date?: string;
}
