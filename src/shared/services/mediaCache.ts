import RNFS from 'react-native-fs';

/**
 * Lightweight media cache backed by the app's cache directory.
 * Stores previously viewed/played URIs under a stable file name derived from the URI.
 */
const CACHE_DIR = `${RNFS.CachesDirectoryPath}/media-cache`;

/**
 * Create cache directory if it does not exist. No-op if already present.
 */
async function ensureCacheDirExists(): Promise<void> {
  try {
    const exists = await RNFS.exists(CACHE_DIR);
    if (!exists) {
      await RNFS.mkdir(CACHE_DIR);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Failed to ensure media cache dir:', error);
  }
}

/**
 * Simple non-crypto string hash for file naming
 */
function simpleHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    const chr = input.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

function inferExtensionFromUri(uri: string, fallback: string): string {
  try {
    const withoutQuery = uri.split('?')[0];
    const match = withoutQuery.match(/\.([a-zA-Z0-9]+)$/);
    if (match && match[1]) {
      const ext = match[1].toLowerCase();
      // Whitelist common types only, otherwise use fallback
      if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'mp4', 'mov', 'm4a', 'mp3', 'wav', 'aac'].includes(ext)) {
        return `.${ext}`;
      }
    }
  } catch (_) {
    // ignore
  }
  return fallback.startsWith('.') ? fallback : `.${fallback}`;
}

function getCachePath(uri: string, fallbackExtension: string): string {
  const fileName = `${simpleHash(uri)}${inferExtensionFromUri(uri, fallbackExtension)}`;
  return `${CACHE_DIR}/${fileName}`;
}

/**
 * Return cached file path if present; otherwise return the original uri.
 */
export async function getCachedUriIfExists(uri: string, fallbackExtension: string): Promise<string> {
  try {
    await ensureCacheDirExists();
    const path = getCachePath(uri, fallbackExtension);
    const exists = await RNFS.exists(path);
    return exists ? `file://${path}` : uri;
  } catch (_) {
    return uri;
  }
}

/**
 * Ensure the media for the uri is cached. Returns the local file uri once available.
 * If already cached, resolves immediately.
 */
export async function cacheMedia(uri: string, fallbackExtension: string): Promise<string> {
  try {
    await ensureCacheDirExists();
    const path = getCachePath(uri, fallbackExtension);
    const exists = await RNFS.exists(path);
    if (exists) {
      return `file://${path}`;
    }

    const result = await RNFS.downloadFile({ fromUrl: uri, toFile: path, background: true }).promise;
    if (result.statusCode && result.statusCode >= 200 && result.statusCode < 400) {
      return `file://${path}`;
    }
    throw new Error(`Download failed: ${result.statusCode}`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Failed to cache media:', uri, error);
    return uri;
  }
}

/**
 * Fire-and-forget warmup; does not throw
 */
export async function warmCache(uri: string, fallbackExtension: string): Promise<void> {
  try {
    await cacheMedia(uri, fallbackExtension);
  } catch (_) {
    // ignore errors in warmup
  }
}

export const mediaCache = {
  getCachedUriIfExists,
  cacheMedia,
  warmCache,
};

export default mediaCache;


