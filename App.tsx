import React, { useEffect } from 'react';
import { enableFreeze } from 'react-native-screens';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@shared/theme';
import { CurrencyContext, useCurrencyProvider } from '@shared/hooks/useCurrency';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useLocationReporter } from './src/features/manifest/useLocationReporter';

function CurrencyWrapper() {
  const currencyState = useCurrencyProvider();
  useLocationReporter(); // Manifest "Find" — report this phone's location.
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
    <SafeAreaProvider>
      <ThemeProvider>
        <CurrencyWrapper />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
