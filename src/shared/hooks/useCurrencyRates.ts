import { useQuery } from '@tanstack/react-query';
import { fetchCurrencyRates, Currency, CurrencyRates } from '@features/transactions/services/currencyService';
import { queryKeys } from '@shared/lib';

export function useCurrencyRates(base: Currency = 'TRY') {
  return useQuery<CurrencyRates>({
    queryKey: queryKeys.currency.rates(base),
    queryFn: () => fetchCurrencyRates(base),
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 6, // 6 hours
    retry: 2,
  });
}
