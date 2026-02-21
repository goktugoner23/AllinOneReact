import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { StorageService } from '@shared/services/storage/asyncStorage';

export type CurrencyCode = 'TRY' | 'AED';

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
  format: (a) => `₺${a.toFixed(0)}`,
});

export function useCurrencyProvider(): CurrencyState {
  const [selectedCurrency, setSelectedCurrencyState] = useState<CurrencyCode>('TRY');
  const [exchangeRate, setExchangeRate] = useState<number | null>(null); // TRY→AED
  const [isLoading, setIsLoading] = useState(false);

  // Load saved preference
  useEffect(() => {
    StorageService.getItem<CurrencyCode>(STORAGE_KEY).then((saved) => {
      if (saved === 'AED' || saved === 'TRY') {
        setSelectedCurrencyState(saved);
      }
    });
  }, []);

  // Fetch exchange rate
  useEffect(() => {
    let cancelled = false;

    async function fetchRate() {
      // Check cache first (valid for 6 hours)
      const cached = await StorageService.getItem<{ rate: number; timestamp: number }>(RATE_CACHE_KEY);
      if (cached && Date.now() - cached.timestamp < 6 * 60 * 60 * 1000) {
        if (!cancelled) setExchangeRate(cached.rate);
        return;
      }

      setIsLoading(true);
      try {
        let res = await fetch(RATE_API_URL);
        if (!res.ok) res = await fetch(RATE_FALLBACK_URL);
        const data = await res.json();
        // data.try.aed gives TRY→AED rate
        const tryToAed = data?.try?.aed;
        if (tryToAed && !cancelled) {
          setExchangeRate(tryToAed);
          await StorageService.setItem(RATE_CACHE_KEY, { rate: tryToAed, timestamp: Date.now() });
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

  const convert = useCallback(
    (amountInTRY: number): number => {
      if (selectedCurrency === 'TRY' || !exchangeRate) return amountInTRY;
      return amountInTRY * exchangeRate;
    },
    [selectedCurrency, exchangeRate],
  );

  const format = useCallback(
    (amountInTRY: number): string => {
      const converted = selectedCurrency === 'TRY' || !exchangeRate ? amountInTRY : amountInTRY * exchangeRate;
      return new Intl.NumberFormat(selectedCurrency === 'TRY' ? 'tr-TR' : 'en-AE', {
        style: 'currency',
        currency: selectedCurrency,
        minimumFractionDigits: 0,
        maximumFractionDigits: selectedCurrency === 'AED' ? 2 : 0,
      }).format(converted);
    },
    [selectedCurrency, exchangeRate],
  );

  return useMemo(
    () => ({ selectedCurrency, setSelectedCurrency, exchangeRate, isLoading, convert, format }),
    [selectedCurrency, setSelectedCurrency, exchangeRate, isLoading, convert, format],
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
