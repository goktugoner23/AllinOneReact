export interface Transaction {
  id: string; // We'll keep as string for React Native compatibility
  amount: number;
  type: string; // Category name (same as category)
  description: string; // Not nullable like Kotlin
  isIncome: boolean;
  date: string; // ISO string for React Native
  category: string;
  relatedRegistrationId?: number; // Reference to linked registration if applicable
}
