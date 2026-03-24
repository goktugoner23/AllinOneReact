import axios from 'axios';
import { API_BASE_URL_DEV, API_BASE_URL_PROD } from '@env';

const BASE_URL = (__DEV__ ? API_BASE_URL_DEV : API_BASE_URL_PROD).replace(/\/$/, '');

export type Currency = 'TRY' | 'USD' | 'AED';

export interface CurrencyRates {
  base: string;
  rates: Partial<Record<Currency, number>>;
  date: string;
}

export async function fetchCurrencyRates(base: Currency = 'TRY'): Promise<CurrencyRates> {
  const res = await axios.get(`${BASE_URL}/api/currency/rates`, { params: { base } });
  if (res.data.success && res.data.data) return res.data.data;
  throw new Error(res.data.error || 'Failed to fetch currency rates');
}

export function convertAmount(amount: number, targetCurrency: Currency, rates: Partial<Record<Currency, number>>): number {
  if (targetCurrency === 'TRY') return amount;
  const rate = rates[targetCurrency];
  return rate != null ? amount * rate : amount;
}

export function formatCurrencyAmount(amount: number, currency: Currency): string {
  const locale = currency === 'TRY' ? 'tr-TR' : 'en-US';
  const decimals = currency === 'TRY' ? 0 : 2;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}
