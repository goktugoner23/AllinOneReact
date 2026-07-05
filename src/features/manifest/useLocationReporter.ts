import { useEffect, useRef } from 'react';
import {
  AppState,
  PermissionsAndroid,
  Platform,
  type AppStateStatus,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { api } from '@shared/services/api/httpClient';

// Manifest "Find": reports this phone's GPS fix to huginn-external so the owner
// and spouse can see it on a map. Phase 1 — foreground only: reports on app
// launch, whenever the app returns to the foreground, and on a slow interval
// while active. Background reporting (app closed) is a future phase.
//
// Uses @react-native-community/geolocation (standard RN autolinking) rather than
// expo-location — this app does not have the native expo-modules runtime wired.

const REPORT_INTERVAL_MS = 5 * 60 * 1000; // every 5 min while the app is open

async function ensurePermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Location',
        message: 'Share your location privately with your partner in Manifest.',
        buttonPositive: 'OK',
        buttonNegative: 'Not now',
      },
    );
    return result === PermissionsAndroid.RESULTS.GRANTED;
  }
  // iOS: triggers the system prompt; plist has NSLocationWhenInUseUsageDescription.
  return new Promise((resolve) => {
    try {
      Geolocation.requestAuthorization(
        () => resolve(true),
        () => resolve(false),
      );
    } catch {
      resolve(true); // older signature without callbacks
    }
  });
}

function reportOnce(): void {
  Geolocation.getCurrentPosition(
    (pos) => {
      void api
        .post('/api/manifest/location', {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy ?? null,
        })
        .catch(() => {
          // Best-effort — a missed fix is fine, the next tick retries.
        });
    },
    () => {
      // GPS error — ignore, retry next tick.
    },
    { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 },
  );
}

export function useLocationReporter(): void {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const grantedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      const granted = await ensurePermission();
      if (cancelled || !granted) return;
      grantedRef.current = true;
      reportOnce();
      timerRef.current = setInterval(reportOnce, REPORT_INTERVAL_MS);
    }

    void start();

    // Report immediately whenever the app comes back to the foreground.
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active' && grantedRef.current) reportOnce();
    });

    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
      sub.remove();
    };
  }, []);
}
