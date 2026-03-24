import React, { createContext, useContext, useState } from 'react';
import { Currency } from '@features/transactions/services/currencyService';

interface CurrencyContextValue {
  selectedCurrency: Currency;
  setSelectedCurrency: (currency: Currency) => void;
}

const CurrencyContext = createContext<CurrencyContextValue>({
  selectedCurrency: 'TRY',
  setSelectedCurrency: () => {},
});

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>('TRY');
  return (
    <CurrencyContext.Provider value={{ selectedCurrency, setSelectedCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
