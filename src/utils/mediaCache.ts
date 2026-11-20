import { Image } from 'expo-image';

/**
 * Strips rotating S3 presigned query strings (?X-Amz-Signature=...)
 * so expo-image hits its disk cache reliably across sessions.
 */
export const getStableMediaCacheKey = (url?: string | null, fallbackId?: string): string | undefined => {
  if (!url) return fallbackId;
  const clean = url.split('?')[0]?.trim();
  return clean || fallbackId;
};

/**
 * Builds an expo-image source object with a stable disk cacheKey.
 */
export const buildCachedImageSource = (
  url?: string | null,
  dimensions?: { width?: number; height?: number }
) => {
  if (!url) return undefined;
  return {
    uri: url,
    cacheKey: getStableMediaCacheKey(url),
    ...(dimensions?.width ? { width: dimensions.width } : {}),
    ...(dimensions?.height ? { height: dimensions.height } : {}),
  };
};

/**
 * Deduplicates and prefetches image URLs into expo-image's memory-disk cache.
 */
export const prefetchMediaUrls = async (urls: (string | null | undefined)[]): Promise<void> => {
  const uniqueUrls = Array.from(
    new Set(
      urls.filter((u): u is string => typeof u === 'string' && u.startsWith('http'))
    )
  );

  if (uniqueUrls.length === 0) return;

  try {
    await Image.prefetch(uniqueUrls, 'memory-disk');
  } catch {
    // Non-blocking background warm-up; ignore transient network errors
  }
};