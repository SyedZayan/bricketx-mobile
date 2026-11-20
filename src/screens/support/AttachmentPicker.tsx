import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { MAX_ATTACHMENTS } from './ticketMeta';
import { PickedAttachment } from './useTicketAttachments';

interface Props {
  attachments: {
    items: PickedAttachment[];
    notice: string | null;
    pickDocument: () => Promise<void>;
    pickImage: () => Promise<void>;
    remove: (localId: string) => void;
  };
  disabled?: boolean;
  compact?: boolean;
  mode?: 'full' | 'buttonsOnly' | 'listOnly';
}

export const AttachmentPicker: React.FC<Props> = ({
  attachments,
  disabled = false,
  compact = false,
  mode = 'full',
}) => {
  const { items, notice, pickDocument, pickImage, remove } = attachments;
  const atLimit = items.length >= MAX_ATTACHMENTS;

  const showButtons = mode === 'full' || mode === 'buttonsOnly';
  const showList = mode === 'full' || mode === 'listOnly';

  if (mode === 'listOnly' && !notice && items.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {showList && Boolean(notice) && (
        <View style={styles.noticeBox}>
          <Ionicons name="alert-circle-outline" size={15} color={colors.text} />
          <Text style={styles.noticeText}>{notice}</Text>
        </View>
      )}

      {showList && items.length > 0 && (
        <View style={styles.fileList}>
          {items.map((item) => (
            <View
              key={item.localId}
              style={[
                styles.fileRow,
                item.state === 'failed' && styles.fileRowFailed,
              ]}
            >
              <View style={styles.fileIconWrap}>
                {item.state === 'uploading' ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : item.state === 'ready' ? (
                  <Ionicons name="checkmark-circle" size={17} color={colors.primary} />
                ) : (
                  <Ionicons name="alert-circle" size={17} color={colors.text} />
                )}
              </View>

              <View style={styles.fileInfo}>
                <Text style={styles.fileName} numberOfLines={1}>
                  {item.fileName}
                </Text>
                {item.state === 'uploading' && (
                  <Text style={styles.fileSub}>Uploading...</Text>
                )}
                {item.state === 'failed' && (
                  <Text style={styles.fileError} numberOfLines={2}>
                    {item.error || 'Upload failed'}
                  </Text>
                )}
              </View>

              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => remove(item.localId)}
                disabled={disabled}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {showButtons && (
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.attachBtn, (disabled || atLimit) && styles.attachBtnDisabled]}
            onPress={pickDocument}
            disabled={disabled || atLimit}
            activeOpacity={0.8}
          >
            <Ionicons name="attach" size={16} color={colors.text} />
            <Text style={styles.attachBtnText}>{compact ? 'File' : 'Attach File'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.attachBtn, (disabled || atLimit) && styles.attachBtnDisabled]}
            onPress={pickImage}
            disabled={disabled || atLimit}
            activeOpacity={0.8}
          >
            <Ionicons name="image-outline" size={15} color={colors.text} />
            <Text style={styles.attachBtnText}>Photo</Text>
          </TouchableOpacity>

          {!compact && (
            <Text style={styles.hintText}>
              PDF, JPEG, PNG • max 10 MB • {items.length}/{MAX_ATTACHMENTS}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  attachBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  attachBtnDisabled: {
    opacity: 0.45,
  },
  attachBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.text,
  },
  hintText: {
    fontSize: 11,
    color: colors.textMuted,
    flexShrink: 1,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: colors.slateLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 9,
    padding: 9,
  },
  noticeText: {
    flex: 1,
    fontSize: 11.5,
    color: colors.text,
    lineHeight: 16,
  },
  fileList: {
    gap: 6,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    gap: 8,
  },
  fileRowFailed: {
    backgroundColor: colors.slateLight,
    borderColor: colors.slate,
  },
  fileIconWrap: {
    width: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileInfo: {
    flex: 1,
    flexShrink: 1,
  },
  fileName: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.text,
  },
  fileSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  fileError: {
    fontSize: 11,
    color: colors.text,
    fontWeight: '600',
    marginTop: 1,
  },
  removeBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.slateLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
