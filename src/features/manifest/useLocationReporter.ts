import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import * as Location from 'expo-location';
import { api } from '@shared/services/api/httpClient';

// Manifest "Find": reports this phone's GPS fix to huginn-external so the owner
// and spouse can see it on a map. Phase 1 — foreground only: reports on app
// launch, whenever the app returns to the foreground, and on a slow interval
// while active. Background reporting (app closed) is a future phase and needs
// "Always" permission + a native background task.

const REPORT_INTERVAL_MS = 5 * 60 * 1000; // every 5 min while the app is open

async function reportOnce(): Promise<void> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') return;
    const fix = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    await api.post('/api/manifest/location', {
      lat: fix.coords.latitude,
      lng: fix.coords.longitude,
      accuracy: fix.coords.accuracy ?? null,
    });
  } catch {
    // Best-effort — a missed fix is fine, the next tick retries.
  }
}

export function useLocationReporter(): void {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      // Ask once on launch; if denied, we simply never report.
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (cancelled || status !== 'granted') return;
      void reportOnce();
      timerRef.current = setInterval(() => void reportOnce(), REPORT_INTERVAL_MS);
    }

    void start();

    // Report immediately whenever the app comes back to the foreground.
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') void reportOnce();
    });

    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
      sub.remove();
    };
  }, []);
}
