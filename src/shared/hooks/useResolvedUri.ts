import { useEffect, useState } from 'react';
import {
  getDisplayUrl,
  buildLegacyRedirectUrl,
} from '@shared/services/storage/r2Storage';

/**
 * Resolve an R2 object key (or legacy stored URL) into a short-lived signed
 * display URL. Returns the best-available URI immediately and upgrades to the
 * signed URL once /sign responds.
 *
 * - If `keyOrUrl` is falsy, returns undefined.
 * - If `getDisplayUrl` succeeds, returns the 10-min signed URL (cached 8min
 *   inside r2Storage, so list re-renders don't hammer the server).
 * - If /sign fails (e.g. legacy absolute URLs), falls back to the legacy
 *   redirect endpoint, then finally to the raw value.
 */
export function useResolvedUri(keyOrUrl: string | undefined | null): string | undefined {
  const [resolved, setResolved] = useState<string | undefined>(
    keyOrUrl ? keyOrUrl : undefined,
  );

  useEffect(() => {
    if (!keyOrUrl) {
      setResolved(undefined);
      return;
    }
    let cancelled = false;

    // If it's already a full URL, use it directly — no signing needed.
    if (keyOrUrl.startsWith('http://') || keyOrUrl.startsWith('https://')) {
      setResolved(keyOrUrl);
      return;
    }

    // Seed with the raw value so there's always something to render while
    // we wait for the signed URL.
    setResolved(keyOrUrl);
    (async () => {
      try {
        const url = await getDisplayUrl(keyOrUrl);
        if (!cancelled) setResolved(url);
      } catch {
        if (!cancelled) {
          try {
            setResolved(buildLegacyRedirectUrl(keyOrUrl));
          } catch {
            setResolved(keyOrUrl);
          }
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [keyOrUrl]);

  return resolved;
}
