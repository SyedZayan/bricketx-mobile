import { useRef, useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { usePostTicketsAttachmentsPresignMutation } from '../../api/generated/investorApi';
import {
  ALLOWED_MIME_TYPES,
  AllowedMimeType,
  MAX_ATTACHMENTS,
  MAX_FILE_BYTES,
} from './ticketMeta';

export interface PickedAttachment {
  localId: string;
  fileName: string;
  sizeBytes?: number;
  state: 'uploading' | 'ready' | 'failed';
  objectKey?: string;
  error?: string;
}

interface LocalFileAsset {
  uri: string;
  name: string;
  mimeType: string;
  size?: number;
}

function normalizeMimeType(mime?: string | null, fileName?: string): AllowedMimeType | null {
  const lower = (mime || '').toLowerCase();
  if (lower === 'image/jpg' || lower === 'image/jpeg') return 'image/jpeg';
  if (lower === 'image/png') return 'image/png';
  if (lower === 'application/pdf') return 'application/pdf';

  const ext = (fileName || '').split('.').pop()?.toLowerCase();
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'png') return 'image/png';
  if (ext === 'pdf') return 'application/pdf';
  return null;
}

export function useTicketAttachments() {
  const [presign] = usePostTicketsAttachmentsPresignMutation();
  const [items, setItems] = useState<PickedAttachment[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const countRef = useRef(0);

  const patch = (localId: string, change: Partial<PickedAttachment>) => {
    setItems((prev) => prev.map((a) => (a.localId === localId ? { ...a, ...change } : a)));
  };

  const enqueueAssets = async (assets: LocalFileAsset[]) => {
    setNotice(null);
    const problems: string[] = [];

    for (const asset of assets) {
      if (countRef.current >= MAX_ATTACHMENTS) {
        problems.push(`You can attach up to ${MAX_ATTACHMENTS} files per message.`);
        break;
      }

      const validMime = normalizeMimeType(asset.mimeType, asset.name);
      if (!validMime || !ALLOWED_MIME_TYPES.includes(validMime)) {
        problems.push(`"${asset.name}" is not supported. Only PDF, JPEG, or PNG files are allowed.`);
        continue;
      }

      let resolvedSize = asset.size ?? 0;
      if (!resolvedSize) {
        try {
          const info = await FileSystem.getInfoAsync(asset.uri);
          if (info.exists && 'size' in info) {
            resolvedSize = info.size ?? 0;
          }
        } catch {
          // ignore
        }
      }

      if (resolvedSize > MAX_FILE_BYTES) {
        problems.push(`"${asset.name}" exceeds the 10 MB limit.`);
        continue;
      }

      countRef.current += 1;
      const localId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      setItems((prev) => [
        ...prev,
        {
          localId,
          fileName: asset.name,
          sizeBytes: resolvedSize,
          state: 'uploading',
        },
      ]);

      void (async () => {
        const ext = validMime === 'application/pdf' ? 'pdf' : validMime === 'image/png' ? 'png' : 'jpg';
        const safeUri = `${FileSystem.documentDirectory}ticket_upload_${localId}.${ext}`;

        try {
          await FileSystem.copyAsync({ from: asset.uri, to: safeUri });

          const presigned = await presign({
            body: {
              fileName: asset.name,
              mimeType: validMime,
              sizeBytes: Math.max(1, resolvedSize),
            },
          }).unwrap();

          const uploadRes = await FileSystem.uploadAsync(presigned.uploadUrl, safeUri, {
            httpMethod: 'PUT',
            uploadType: 0 as any,
            headers: {
              'Content-Type': validMime,
              'Bypass-Tunnel-Reminder': 'true',
            },
          });

          if (uploadRes.status < 200 || uploadRes.status >= 300) {
            throw new Error(`Upload failed (${uploadRes.status})`);
          }

          patch(localId, {
            state: 'ready',
            objectKey: presigned.objectKey,
          });
        } catch (err: any) {
          const msg =
            err?.data?.message ||
            err?.message ||
            'Upload failed. Remove and try again.';
          patch(localId, {
            state: 'failed',
            error: msg,
          });
        } finally {
          FileSystem.deleteAsync(safeUri, { idempotent: true }).catch(() => {});
        }
      })();
    }

    if (problems.length > 0) {
      setNotice(problems.join(' '));
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/png'],
        multiple: true,
        copyToCacheDirectory: false,
      });
      if (result.canceled || !result.assets?.length) return;

      await enqueueAssets(
        result.assets.map((a) => ({
          uri: a.uri,
          name: a.name || `document-${Date.now()}.pdf`,
          mimeType: a.mimeType || '',
          size: a.size,
        }))
      );
    } catch {
      setNotice('Unable to open document picker.');
    }
  };

  const pickImage = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        setNotice('Photo library permission is required to attach screenshots.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: Math.max(1, MAX_ATTACHMENTS - countRef.current),
        quality: 0.9,
      });

      if (result.canceled || !result.assets?.length) return;

      await enqueueAssets(
        result.assets.map((a, idx) => ({
          uri: a.uri,
          name: a.fileName || `image-${Date.now()}-${idx + 1}.jpg`,
          mimeType: a.mimeType || 'image/jpeg',
          size: a.fileSize,
        }))
      );
    } catch {
      setNotice('Unable to open photo library.');
    }
  };

  const remove = (localId: string) => {
    countRef.current = Math.max(0, countRef.current - 1);
    setItems((prev) => prev.filter((a) => a.localId !== localId));
    setNotice(null);
  };

  const clear = () => {
    countRef.current = 0;
    setItems([]);
    setNotice(null);
  };

  const uploading = items.some((a) => a.state === 'uploading');
  const failed = items.some((a) => a.state === 'failed');
  const ready = items.flatMap((a) =>
    a.state === 'ready' && a.objectKey
      ? [{ objectKey: a.objectKey, fileName: a.fileName }]
      : []
  );

  return {
    items,
    notice,
    pickDocument,
    pickImage,
    remove,
    clear,
    uploading,
    failed,
    ready,
  };
}
