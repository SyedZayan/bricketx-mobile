import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppError, normalizeError } from '../../utils/errorHandler';
import { colors } from '../../theme/colors';

interface Props {
  error?: unknown;
  appError?: AppError;
  onDismiss?: () => void;
  onAction?: () => void;
  actionLabel?: string;
}

export const InlineErrorBanner: React.FC<Props> = ({
  error,
  appError,
  onDismiss,
  onAction,
  actionLabel,
}) => {
  const resolved = appError || (error ? normalizeError(error) : null);
  if (!resolved) return null;

  const isWarning = resolved.category === 'validation' || resolved.category === 'rate_limit';

  return (
    <View
      style={[
        styles.banner,
        isWarning ? styles.warningBanner : styles.errorBanner,
      ]}
    >
      <Ionicons
        name={isWarning ? 'warning-outline' : 'alert-circle'}
        size={18}
        color={isWarning ? '#B78103' : colors.error}
        style={{ flexShrink: 0, marginTop: 1 }}
      />

      <View style={styles.contentCol}>
        <Text
          style={[
            styles.title,
            { color: isWarning ? '#9A6B00' : colors.error },
          ]}
          numberOfLines={2}
        >
          {resolved.title}
        </Text>
        <Text style={styles.message}>{resolved.message}</Text>
        <Text style={styles.nextStep}>Next step: {resolved.nextStep}</Text>

        {resolved.fieldErrors && resolved.fieldErrors.length > 0 && (
          <View style={styles.fieldErrorList}>
            {resolved.fieldErrors.map((errItem, idx) => (
              <Text key={idx} style={styles.fieldErrorItem}>
                • {errItem}
              </Text>
            ))}
          </View>
        )}

        {onAction && (
          <TouchableOpacity
            style={styles.actionLinkBtn}
            onPress={onAction}
            activeOpacity={0.75}
          >
            <Text style={styles.actionLinkText} numberOfLines={1}>
              {actionLabel || resolved.actionLabel}
            </Text>
            <Ionicons name="arrow-forward" size={13} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {onDismiss && (
        <TouchableOpacity
          onPress={onDismiss}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{ flexShrink: 0 }}
        >
          <Ionicons name="close" size={16} color={colors.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  errorBanner: {
    backgroundColor: '#FFEBEE',
    borderColor: '#FFCDD2',
  },
  warningBanner: {
    backgroundColor: '#FFF8E1',
    borderColor: '#FFE082',
  },
  contentCol: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    gap: 3,
  },
  title: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '800',
  },
  message: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.text,
    fontWeight: '500',
  },
  nextStep: {
    fontSize: 11.5,
    lineHeight: 16,
    color: colors.textMuted,
    fontWeight: '600',
    marginTop: 1,
  },
  fieldErrorList: {
    marginTop: 4,
    gap: 2,
  },
  fieldErrorItem: {
    fontSize: 11.5,
    lineHeight: 15.5,
    color: colors.text,
  },
  actionLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  actionLinkText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
    color: colors.primary,
    textDecorationLine: 'underline',
  },
});