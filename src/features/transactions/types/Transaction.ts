export type TransactionCurrency = 'TRY' | 'AED' | 'USD';

export const TRANSACTION_CURRENCIES: TransactionCurrency[] = ['TRY', 'AED', 'USD'];

export interface Transaction {
  id: string; // We'll keep as string for React Native compatibility
  amount: number;
  currency: TransactionCurrency;
  type: string; // Category name (same as category)
  description: string; // Not nullable like Kotlin
  isIncome: boolean;
  date: string; // ISO string for React Native
  category: string;
  relatedRegistrationId?: number; // Reference to linked registration if applicable
  relatedInvestmentId?: string; // Reference to linked investment if applicable
}
