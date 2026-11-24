import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Ionicons } from '@expo/vector-icons';
import {
  usePostKycDocumentsPresignMutation,
  usePostKycDocumentsMutation,
  useDeleteKycDocumentsByIdMutation,
  useLazyGetKycDocumentsByIdDownloadQuery,
  type KycDocumentInvestor,
} from '../../api/generated/investorApi';
import {
  DOCUMENT_TYPE_LABELS,
  getKycErrorMessage,
  type DocumentSlot,
  type DocumentType,
} from '../../features/kyc/kycUtils';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

const MAX_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIMES = new Set(['image/jpeg', 'image/png', 'application/pdf']);

interface SelectedAsset {
  uri: string;
  name: string;
  mimeType: string;
  size: number;
}

interface Props {
  slot: DocumentSlot;
  existingDocument?: KycDocumentInvestor;
  onUploaded: () => void;
  highlighted?: boolean;
}

export const DocumentSlotCard: React.FC<Props> = ({
  slot,
  existingDocument,
  onUploaded,
  highlighted = false,
}) => {
  const [presign] = usePostKycDocumentsPresignMutation();
  const [registerDocument] = usePostKycDocumentsMutation();
  const [deleteDocument] = useDeleteKycDocumentsByIdMutation();
  const [fetchDownloadUrl] = useLazyGetKycDocumentsByIdDownloadQuery();

  const [selectedType, setSelectedType] = useState<DocumentType>(slot.anyOf[0]);
  const [pickedFile, setPickedFile] = useState<SelectedAsset | null>(null);
  const [replacing, setReplacing] = useState(false);
  const [busyPhase, setBusyPhase] = useState<
    null | 'presigning' | 'uploading' | 'registering' | 'deleting' | 'viewing'
  >(null);
  const [error, setError] = useState<string | null>(null);

  const showUploadForm = !existingDocument || replacing;

  const normalizeAsset = (
    uri: string,
    rawName?: string | null,
    rawMime?: string | null,
    rawSize?: number | null
  ): SelectedAsset | null => {
    const lowerUri = uri.toLowerCase();
    let mime = (rawMime || '').toLowerCase();
    if (mime === 'image/jpg') mime = 'image/jpeg';
    if (!mime) {
      if (lowerUri.endsWith('.pdf')) mime = 'application/pdf';
      else if (lowerUri.endsWith('.png')) mime = 'image/png';
      else mime = 'image/jpeg';
    }

    if (!ALLOWED_MIMES.has(mime)) {
      setError('Unsupported file format. Please choose a PDF, JPG, or PNG file.');
      return null;
    }

    const size = rawSize ?? 0;
    if (size > MAX_BYTES) {
      setError('File exceeds the 10MB limit. Please select a smaller file.');
      return null;
    }

    const ext = mime === 'application/pdf' ? 'pdf' : mime === 'image/png' ? 'png' : 'jpg';
    const name = rawName?.trim() || `${slot.key}_${Date.now()}.${ext}`;

    return { uri, name, mimeType: mime, size };
  };

  const handlePickDocument = async () => {
    setError(null);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/png'],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.length) return;
      const a = result.assets[0];
      const info = await FileSystem.getInfoAsync(a.uri);
      const actualSize =
        a.size ?? (info.exists && 'size' in info ? (info as any).size : 0);
      const asset = normalizeAsset(a.uri, a.name, a.mimeType, actualSize);
      if (asset) setPickedFile(asset);
    } catch {
      setError('Could not open file picker.');
    }
  };

  const handlePickPhoto = async (useCamera: boolean) => {
    setError(null);
    try {
      if (useCamera) {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          setError('Camera permission is required to capture documents.');
          return;
        }
        const res = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          quality: 0.85,
        });
        if (res.canceled || !res.assets?.length) return;
        const img = res.assets[0];
        const info = await FileSystem.getInfoAsync(img.uri);
        const size =
          img.fileSize ?? (info.exists && 'size' in info ? (info as any).size : 0);
        const asset = normalizeAsset(
          img.uri,
          img.fileName || `photo_${Date.now()}.jpg`,
          img.mimeType || 'image/jpeg',
          size
        );
        if (asset) setPickedFile(asset);
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          setError('Photo library permission is required.');
          return;
        }
        const res = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.85,
        });
        if (res.canceled || !res.assets?.length) return;
        const img = res.assets[0];
        const info = await FileSystem.getInfoAsync(img.uri);
        const size =
          img.fileSize ?? (info.exists && 'size' in info ? (info as any).size : 0);
        const asset = normalizeAsset(
          img.uri,
          img.fileName || `image_${Date.now()}.jpg`,
          img.mimeType || 'image/jpeg',
          size
        );
        if (asset) setPickedFile(asset);
      }
    } catch {
      setError('Could not capture or select image.');
    }
  };

  const handleUpload = async () => {
    if (!pickedFile) {
      setError('Choose a file or take a photo first.');
      return;
    }

    setError(null);
    let tempCopyPath: string | null = null;

    try {
      const info = await FileSystem.getInfoAsync(pickedFile.uri);
      const sizeBytes =
        pickedFile.size > 0
          ? pickedFile.size
          : info.exists && 'size' in info
            ? Number((info as any).size) || 1024
            : 1024;

      if (sizeBytes > MAX_BYTES) {
        setError('File exceeds the 10MB limit.');
        return;
      }

      // Step 1: Request presigned upload URL from backend
      setBusyPhase('presigning');
      const presigned = await presign({
        body: {
          documentType: selectedType,
          category: slot.category,
          ownerType: slot.ownerType,
          ...(slot.ownerId ? { ownerId: slot.ownerId } : {}),
          fileName: pickedFile.name,
          mimeType: pickedFile.mimeType,
          sizeBytes,
        },
      }).unwrap();

      // Step 2: Copy to app sandbox & binary PUT to presigned S3/MinIO URL
      setBusyPhase('uploading');
      const ext =
        pickedFile.mimeType === 'application/pdf'
          ? 'pdf'
          : pickedFile.mimeType === 'image/png'
            ? 'png'
            : 'jpg';
      tempCopyPath = `${FileSystem.cacheDirectory}kyc_upload_${Date.now()}.${ext}`;
      await FileSystem.copyAsync({
        from: pickedFile.uri,
        to: tempCopyPath,
      });

      const putRes = await FileSystem.uploadAsync(
        presigned.uploadUrl,
        tempCopyPath,
        {
          httpMethod: 'PUT',
          uploadType: 0 as any, // FileSystemUploadType.BINARY_CONTENT
          headers: {
            'Content-Type': pickedFile.mimeType,
            'Bypass-Tunnel-Reminder': 'true',
          },
        }
      );

      if (putRes.status < 200 || putRes.status >= 300) {
        throw new Error(`Storage upload failed (HTTP ${putRes.status}).`);
      }

      // Step 3: Register uploaded objectKey with KYC backend
      setBusyPhase('registering');
      await registerDocument({
        body: {
          objectKey: presigned.objectKey,
          documentType: selectedType,
          category: slot.category,
          ownerType: slot.ownerType,
          ...(slot.ownerId ? { ownerId: slot.ownerId } : {}),
        },
      }).unwrap();

      setPickedFile(null);
      setReplacing(false);
      setBusyPhase(null);
      onUploaded();
    } catch (err: any) {
      setBusyPhase(null);
      setError(
        getKycErrorMessage(
          err,
          err?.message || 'Upload failed. Please check your connection and try again.'
        )
      );
    } finally {
      if (tempCopyPath) {
        FileSystem.deleteAsync(tempCopyPath, { idempotent: true }).catch(() => {});
      }
    }
  };

  const handleReplace = () => {
    if (!existingDocument) return;
    Alert.alert(
      'Replace Document',
      'Remove the current file so you can upload a replacement?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Replace',
          style: 'destructive',
          onPress: async () => {
            setError(null);
            setBusyPhase('deleting');
            try {
              await deleteDocument({ id: existingDocument.id }).unwrap();
              setReplacing(true);
              setBusyPhase(null);
              onUploaded();
            } catch (err) {
              setBusyPhase(null);
              setError(
                getKycErrorMessage(err, "Couldn't remove the existing document.")
              );
            }
          },
        },
      ]
    );
  };

  const handleViewDocument = async () => {
    if (!existingDocument) return;
    setError(null);
    setBusyPhase('viewing');
    try {
      const res = await fetchDownloadUrl({ id: existingDocument.id }).unwrap();
      setBusyPhase(null);
      if (res?.url) {
        await Linking.openURL(res.url);
      }
    } catch (err) {
      setBusyPhase(null);
      setError(getKycErrorMessage(err, 'Unable to open document preview.'));
    }
  };

  const isRejected = existingDocument?.status === 'rejected' && !replacing;
  const isVerified = existingDocument?.status === 'verified' && !replacing;

  return (
    <View
      style={[
        styles.card,
        highlighted && styles.cardHighlighted,
        isRejected && styles.cardRejected,
      ]}
    >
      <View style={styles.headerRow}>
        <Text style={styles.slotLabel}>{slot.label}</Text>
        {existingDocument && !replacing && (
          <View
            style={[
              styles.badge,
              isVerified
                ? styles.badgeSuccess
                : isRejected
                  ? styles.badgeDanger
                  : styles.badgeWarning,
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                isVerified
                  ? styles.badgeTextSuccess
                  : isRejected
                    ? styles.badgeTextDanger
                    : styles.badgeTextWarning,
              ]}
            >
              {isVerified
                ? 'Verified'
                : isRejected
                  ? 'Rejected'
                  : 'Pending review'}
            </Text>
          </View>
        )}
      </View>

      {existingDocument && !replacing && (
        <View style={styles.existingBox}>
          <View style={styles.existingInfo}>
            <Ionicons
              name={isRejected ? 'alert-circle' : 'document-attach-outline'}
              size={18}
              color={isRejected ? colors.error : colors.primary}
            />
            <Text style={styles.existingDocName} numberOfLines={1}>
              {DOCUMENT_TYPE_LABELS[existingDocument.documentType] ||
                existingDocument.documentType}
            </Text>
          </View>
          <View style={styles.existingActions}>
            <TouchableOpacity
              onPress={handleViewDocument}
              disabled={busyPhase !== null}
              style={styles.textActionBtn}
            >
              <Text style={styles.textActionLabel}>
                {busyPhase === 'viewing' ? 'Opening…' : 'View'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleReplace}
              disabled={busyPhase !== null}
              style={styles.textActionBtn}
            >
              <Text style={[styles.textActionLabel, styles.replaceLabel]}>
                {busyPhase === 'deleting' ? 'Removing…' : 'Replace'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {isRejected && !!existingDocument.rejectionReason && (
        <Text style={styles.rejectionReason}>
          Reason: {existingDocument.rejectionReason}
        </Text>
      )}

      {showUploadForm && (
        <View style={styles.uploadBody}>
          {slot.anyOf.length > 1 && (
            <View style={styles.typeChipsWrap}>
              {slot.anyOf.map((docType) => {
                const active = selectedType === docType;
                return (
                  <TouchableOpacity
                    key={docType}
                    style={[styles.typeChip, active && styles.typeChipActive]}
                    onPress={() => setSelectedType(docType)}
                    disabled={busyPhase !== null}
                  >
                    <Text
                      style={[
                        styles.typeChipText,
                        active && styles.typeChipTextActive,
                      ]}
                    >
                      {DOCUMENT_TYPE_LABELS[docType]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {pickedFile ? (
            <View style={styles.pickedBox}>
              <Ionicons
                name={
                  pickedFile.mimeType === 'application/pdf'
                    ? 'document-text'
                    : 'image'
                }
                size={22}
                color={colors.primary}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.pickedName} numberOfLines={1}>
                  {pickedFile.name}
                </Text>
                <Text style={styles.pickedMeta}>
                  {pickedFile.size > 0
                    ? `${(pickedFile.size / (1024 * 1024)).toFixed(2)} MB`
                    : 'Ready to upload'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setPickedFile(null)}
                disabled={busyPhase !== null}
              >
                <Ionicons name="close-circle" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.pickerRow}>
              <TouchableOpacity
                style={styles.pickBtn}
                onPress={handlePickDocument}
                disabled={busyPhase !== null}
              >
                <Ionicons name="folder-open-outline" size={18} color={colors.primary} />
                <Text style={styles.pickBtnText}>PDF / File</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.pickBtn}
                onPress={() => handlePickPhoto(false)}
                disabled={busyPhase !== null}
              >
                <Ionicons name="images-outline" size={18} color={colors.primary} />
                <Text style={styles.pickBtnText}>Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.pickBtn}
                onPress={() => handlePickPhoto(true)}
                disabled={busyPhase !== null}
              >
                <Ionicons name="camera-outline" size={18} color={colors.primary} />
                <Text style={styles.pickBtnText}>Camera</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.formatHint}>
            Accepted: PDF, JPG, PNG (max 10MB)
          </Text>

          {pickedFile && (
            <TouchableOpacity
              style={[
                styles.uploadBtn,
                busyPhase !== null && styles.uploadBtnDisabled,
              ]}
              onPress={handleUpload}
              disabled={busyPhase !== null}
              activeOpacity={0.85}
            >
              {busyPhase !== null ? (
                <>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.uploadBtnText}>
                    {busyPhase === 'presigning'
                      ? 'Preparing upload…'
                      : busyPhase === 'uploading'
                        ? 'Uploading to secure storage…'
                        : 'Saving record…'}
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.uploadBtnText}>
                    {replacing ? 'Upload Replacement' : 'Upload Document'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}

      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: spacing.radiusMd,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardHighlighted: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: '#FFFDF9',
  },
  cardRejected: {
    borderColor: '#FFCDD2',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  slotLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgeSuccess: {
    backgroundColor: '#E8F5E9',
  },
  badgeWarning: {
    backgroundColor: '#FFF8E1',
  },
  badgeDanger: {
    backgroundColor: '#FFEBEE',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  badgeTextSuccess: {
    color: '#2E7D32',
  },
  badgeTextWarning: {
    color: '#B26A00',
  },
  badgeTextDanger: {
    color: colors.error,
  },
  existingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    gap: 8,
  },
  existingInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  existingDocName: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    fontWeight: '500',
  },
  existingActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  textActionBtn: {
    paddingVertical: 2,
  },
  textActionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  replaceLabel: {
    color: colors.slate,
  },
  rejectionReason: {
    marginTop: 8,
    fontSize: 12,
    color: colors.error,
    fontWeight: '600',
  },
  uploadBody: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  typeChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  typeChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  typeChipActive: {
    borderColor: colors.primary,
    backgroundColor: '#FAF5EE',
  },
  typeChipText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.textMuted,
  },
  typeChipTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    backgroundColor: '#FAF5EE',
  },
  pickBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  pickedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#E7D7C1',
  },
  pickedName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  pickedMeta: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  formatHint: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 6,
  },
  uploadBtn: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 11,
    borderRadius: 10,
  },
  uploadBtnDisabled: {
    opacity: 0.7,
  },
  uploadBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  errorText: {
    marginTop: 8,
    fontSize: 12,
    color: colors.error,
    fontWeight: '600',
  },
});
