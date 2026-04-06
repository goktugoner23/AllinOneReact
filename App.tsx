import React, { useEffect } from 'react';
import { enableFreeze } from 'react-native-screens';
import { ThemeProvider } from '@shared/theme';
import { CurrencyContext, useCurrencyProvider } from '@shared/hooks/useCurrency';
import { AppNavigator } from './src/navigation/AppNavigator';

function CurrencyWrapper() {
  const currencyState = useCurrencyProvider();
  return (
    <CurrencyContext.Provider value={currencyState}>
      <AppNavigator />
    </CurrencyContext.Provider>
  );
}

export default function App() {
  useEffect(() => {
    try { enableFreeze(true); } catch (_) {}
  }, []);

  return (
    <ThemeProvider>
      <CurrencyWrapper />
    </ThemeProvider>
  );
}
