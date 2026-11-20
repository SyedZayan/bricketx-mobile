import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Sharing from 'expo-sharing';

const DOC_CACHE_DIR = `${FileSystem.cacheDirectory}bricketx_docs/`;

const hashString = (input: string): string => {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
};

const getExtension = (fileName?: string | null, url?: string): string => {
  const cleanUrl = (url || '').split('?')[0];
  const candidate = fileName || cleanUrl;
  const match = candidate.match(/\.([a-zA-Z0-9]{2,5})$/);
  return match ? `.${match[1].toLowerCase()}` : '.pdf';
};

export const openLocalPdfFile = async (
  localUri: string,
  options?: { title?: string; mimeType?: string }
): Promise<void> => {
  const mimeType = options?.mimeType || 'application/pdf';

  if (Platform.OS === 'android') {
    try {
      const contentUri = await FileSystem.getContentUriAsync(localUri);
      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
        data: contentUri,
        flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
        type: mimeType,
      });
      return;
    } catch {
      // Fallback to share sheet if no PDF viewer app is registered
    }
  }

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('No document viewer available on this device.');
  }

  await Sharing.shareAsync(localUri, {
    mimeType,
    dialogTitle: options?.title || 'Open PDF',
    UTI: mimeType === 'application/pdf' ? 'com.adobe.pdf' : undefined,
  });
};

export const getCachedDocumentUri = async (
  url: string,
  fileName?: string | null
): Promise<string | null> => {
  if (!url || !FileSystem.cacheDirectory) return null;
  const stableKey = url.split('?')[0];
  const ext = getExtension(fileName, url);
  const localUri = `${DOC_CACHE_DIR}${hashString(stableKey)}${ext}`;

  const info = await FileSystem.getInfoAsync(localUri);
  return info.exists && (info.size ?? 0) > 0 ? localUri : null;
};

export const openCachedDocument = async (
  url: string,
  options?: { fileName?: string | null; title?: string }
): Promise<{ localUri: string; fromCache: boolean }> => {
  if (!FileSystem.cacheDirectory) {
    throw new Error('Local cache directory unavailable');
  }

  await FileSystem.makeDirectoryAsync(DOC_CACHE_DIR, { intermediates: true });

  const stableKey = url.split('?')[0];
  const ext = getExtension(options?.fileName, url);
  const localUri = `${DOC_CACHE_DIR}${hashString(stableKey)}${ext}`;

  const existing = await FileSystem.getInfoAsync(localUri);
  const fromCache = existing.exists && (existing.size ?? 0) > 0;

  if (!fromCache) {
    const downloadResumable = FileSystem.createDownloadResumable(url, localUri);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => {
        downloadResumable.cancelAsync().catch(() => {});
        reject(new Error('Download timed out. Please try again.'));
      }, 15000)
    );

    const result = await Promise.race([
      downloadResumable.downloadAsync(),
      timeoutPromise,
    ]);

    if (!result || result.status < 200 || result.status >= 300) {
      await FileSystem.deleteAsync(localUri, { idempotent: true });
      throw new Error(`Download failed (${result?.status ?? 'network error'})`);
    }
  }

  await openLocalPdfFile(localUri, {
    title: options?.title || options?.fileName || 'BricketX Document',
    mimeType: ext === '.pdf' ? 'application/pdf' : '*/*',
  });

  return { localUri, fromCache };
};
