import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { StorageService } from '@shared/services/storage/asyncStorage';

export type CurrencyCode = 'TRY' | 'AED' | 'USD';

interface CurrencyState {
  selectedCurrency: CurrencyCode;
  setSelectedCurrency: (currency: CurrencyCode) => void;
  exchangeRate: number | null; // AED→TRY rate
  isLoading: boolean;
  /** Convert amount from TRY to selected currency */
  convert: (amountInTRY: number) => number;
  /** Format amount in the selected currency */
  format: (amountInTRY: number) => string;
}

const STORAGE_KEY = 'selected_currency';
const RATE_CACHE_KEY = 'exchange_rate_cache';
const RATE_API_URL = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/try.json';
const RATE_FALLBACK_URL = 'https://latest.currency-api.pages.dev/v1/currencies/try.json';

export const CurrencyContext = createContext<CurrencyState>({
  selectedCurrency: 'TRY',
  setSelectedCurrency: () => {},
  exchangeRate: null,
  isLoading: false,
  convert: (a) => a,
  format: (a) => `₺${a.toFixed(2)}`,
});

export function useCurrencyProvider(): CurrencyState {
  const [selectedCurrency, setSelectedCurrencyState] = useState<CurrencyCode>('TRY');
  const [rates, setRates] = useState<Record<string, number>>({}); // TRY→X rates
  const [exchangeRate, setExchangeRate] = useState<number | null>(null); // TRY→selected
  const [isLoading, setIsLoading] = useState(false);

  // Load saved preference
  useEffect(() => {
    StorageService.getItem<CurrencyCode>(STORAGE_KEY).then((saved) => {
      if (saved === 'AED' || saved === 'TRY' || saved === 'USD') {
        setSelectedCurrencyState(saved);
      }
    });
  }, []);

  // Fetch exchange rate
  useEffect(() => {
    let cancelled = false;

    async function fetchRate() {
      // Check cache first (valid for 6 hours)
      const cached = await StorageService.getItem<{ rates: Record<string, number>; timestamp: number }>(RATE_CACHE_KEY);
      if (cached && Date.now() - cached.timestamp < 6 * 60 * 60 * 1000) {
        if (!cancelled) setRates(cached.rates);
        return;
      }

      setIsLoading(true);
      try {
        let res = await fetch(RATE_API_URL);
        if (!res.ok) res = await fetch(RATE_FALLBACK_URL);
        const data = await res.json();
        const fetched: Record<string, number> = {};
        if (data?.try?.aed) fetched.aed = data.try.aed;
        if (data?.try?.usd) fetched.usd = data.try.usd;
        if (!cancelled && Object.keys(fetched).length > 0) {
          setRates(fetched);
          await StorageService.setItem(RATE_CACHE_KEY, { rates: fetched, timestamp: Date.now() });
        }
      } catch (err) {
        console.warn('Failed to fetch exchange rate:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchRate();
    return () => { cancelled = true; };
  }, []);

  const setSelectedCurrency = useCallback((currency: CurrencyCode) => {
    setSelectedCurrencyState(currency);
    StorageService.setItem(STORAGE_KEY, currency);
  }, []);

  const rateForCurrency = useMemo(() => {
    if (selectedCurrency === 'TRY') return 1;
    return rates[selectedCurrency.toLowerCase()] ?? null;
  }, [selectedCurrency, rates]);

  const convert = useCallback(
    (amountInTRY: number): number => {
      if (selectedCurrency === 'TRY' || !rateForCurrency) return amountInTRY;
      return amountInTRY * rateForCurrency;
    },
    [selectedCurrency, rateForCurrency],
  );

  const localeMap: Record<CurrencyCode, string> = { TRY: 'tr-TR', AED: 'en-AE', USD: 'en-US' };

  const format = useCallback(
    (amountInTRY: number): string => {
      const converted = selectedCurrency === 'TRY' || !rateForCurrency ? amountInTRY : amountInTRY * rateForCurrency;
      return new Intl.NumberFormat(localeMap[selectedCurrency], {
        style: 'currency',
        currency: selectedCurrency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(converted);
    },
    [selectedCurrency, rateForCurrency],
  );

  return useMemo(
    () => ({ selectedCurrency, setSelectedCurrency, exchangeRate: rateForCurrency, isLoading, convert, format }),
    [selectedCurrency, setSelectedCurrency, rateForCurrency, isLoading, convert, format],
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
