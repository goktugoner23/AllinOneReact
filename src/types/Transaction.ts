export interface Transaction {
  id: string;
  amount: number;
  description: string;
  category: string;
  date: string; // ISO string
  type: 'income' | 'expense';
}
