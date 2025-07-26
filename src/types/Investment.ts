export interface Investment {
  id: string;
  name: string;
  amount: number;
  type: string;
  description?: string;
  imageUri?: string;
  date: string; // ISO string
  isPast?: boolean;
  profitLoss?: number;
  currentValue?: number;
}
