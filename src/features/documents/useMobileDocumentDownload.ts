import { useState, useCallback } from 'react';
import {
  InvestorDocumentKind,
  useLazyGetDocumentsByKindAndIdDownloadQuery,
  useLazyGetStatementsByIdDownloadQuery,
} from '../../api/documentsApi';
import { openCachedDocument } from '../../utils/documentCache';

export type MobileDocumentRef =
  | { via: 'documents'; kind: InvestorDocumentKind; id: string; title?: string }
  | { via: 'statements'; id: string; title?: string };

export function extractApiErrorMessage(err: unknown, fallback: string): string {
  if (!err || typeof err !== 'object') return fallback;
  const anyErr = err as any;
  const data = anyErr.data;
  if (typeof data === 'string' && data.trim()) return data.trim();
  if (data && typeof data === 'object') {
    if (typeof data.message === 'string' && data.message.trim()) return data.message.trim();
    if (typeof data.error === 'string' && data.error.trim()) return data.error.trim();
  }
  if (typeof anyErr.message === 'string' && anyErr.message.trim()) return anyErr.message.trim();
  return fallback;
}

export function useMobileDocumentDownload() {
  const [triggerDocDownload] = useLazyGetDocumentsByKindAndIdDownloadQuery();
  const [triggerStmtDownload] = useLazyGetStatementsByIdDownloadQuery();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [errorState, setErrorState] = useState<{ key: string; message: string } | null>(null);

  const downloadAndOpen = useCallback(
    async (ref: MobileDocumentRef) => {
      if (busyKey !== null) return;
      const key = ref.via === 'documents' ? `${ref.kind}:${ref.id}` : `statement:${ref.id}`;
      setBusyKey(key);
      setErrorState(null);

      try {
        const link =
          ref.via === 'documents'
            ? await triggerDocDownload({ kind: ref.kind, id: ref.id }, false).unwrap()
            : await triggerStmtDownload({ id: ref.id }, false).unwrap();

        await openCachedDocument(link.url, {
          fileName: link.filename,
          title: ref.title || link.filename,
        });
      } catch (err) {
        setErrorState({
          key,
          message: extractApiErrorMessage(err, "We couldn't download this document. Please try again."),
        });
      } finally {
        setBusyKey(null);
      }
    },
    [busyKey, triggerDocDownload, triggerStmtDownload]
  );

  const clearError = useCallback(() => setErrorState(null), []);

  return {
    downloadAndOpen,
    busyKey,
    errorState,
    clearError,
  };
}
