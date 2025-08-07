export type HistoryItemType =
  | 'TRANSACTION_INCOME'
  | 'TRANSACTION_EXPENSE'
  | 'INVESTMENT'
  | 'REGISTRATION';

export interface HistoryItem {
  id: string;
  title: string;
  description: string;
  date: string; // ISO string
  amount?: number;
  type: string;
  imageUri?: string;
  itemType: HistoryItemType;
}