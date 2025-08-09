export interface Investment {
  id: string;
  name: string;
  amount: number;
  type: string;
  description?: string;
  imageUri?: string;
  imageUris?: string; // comma-separated, same pattern as notes
  videoUris?: string; // comma-separated
  voiceNoteUris?: string; // comma-separated
  date: string; // ISO string
  isPast?: boolean;
  profitLoss?: number;
  currentValue?: number;
}
