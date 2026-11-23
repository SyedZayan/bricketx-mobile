import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppError, normalizeError } from '../../utils/errorHandler';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

interface Props {
  error: unknown;
  appError?: AppError;
  onAction: () => void;
  actionLabelOverride?: string;
  secondaryLabel?: string;
  onSecondary?: () => void;
  loading?: boolean;
  compact?: boolean;
}

export const ErrorStateView: React.FC<Props> = ({
  error,
  appError,
  onAction,
  actionLabelOverride,
  secondaryLabel,
  onSecondary,
  loading = false,
  compact = false,
}) => {
  const resolved = appError || normalizeError(error);

  const iconName: keyof typeof Ionicons.glyphMap =
    resolved.category === 'network'
      ? 'cloud-offline-outline'
      : resolved.category === 'timeout'
      ? 'time-outline'
      : resolved.category === 'auth'
      ? 'lock-closed-outline'
      : resolved.category === 'forbidden'
      ? 'shield-outline'
      : resolved.category === 'rate_limit'
      ? 'hourglass-outline'
      : 'alert-circle-outline';

  const actionIcon: keyof typeof Ionicons.glyphMap =
    resolved.actionType === 'relogin'
      ? 'log-in-outline'
      : resolved.actionType === 'kyc'
      ? 'checkmark-circle-outline'
      : resolved.actionType === 'support'
      ? 'headset-outline'
      : 'refresh';

  return (
    <View style={[styles.container, compact && styles.compactContainer]}>
      <View style={styles.iconCircle}>
        <Ionicons name={iconName} size={compact ? 24 : 30} color={colors.error} />
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {resolved.title}
      </Text>

      <Text style={styles.message}>{resolved.message}</Text>

      <View style={styles.nextStepBox}>
        <Ionicons
          name="arrow-forward-circle-outline"
          size={15}
          color={colors.primary}
          style={{ flexShrink: 0, marginTop: 1 }}
        />
        <Text style={styles.nextStepText}>
          Next step: {resolved.nextStep}
        </Text>
      </View>

      {resolved.fieldErrors && resolved.fieldErrors.length > 0 && (
        <View style={styles.detailsList}>
          {resolved.fieldErrors.map((detail, idx) => (
            <Text key={idx} style={styles.detailItem}>
              • {detail}
            </Text>
          ))}
        </View>
      )}

      <View style={styles.actionsRow}>
        {secondaryLabel && onSecondary && (
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={onSecondary}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryBtnText} numberOfLines={2}>
              {secondaryLabel}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.primaryBtn,
            secondaryLabel ? { flex: 1, minWidth: 130 } : { minWidth: 160 },
          ]}
          onPress={onAction}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name={actionIcon} size={15} color="#FFFFFF" style={{ flexShrink: 0 }} />
              <Text style={styles.primaryBtnText} numberOfLines={2}>
                {actionLabelOverride || resolved.actionLabel}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  compactContainer: {
    flex: 0,
    padding: spacing.lg,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  iconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#FFCDD2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    flexShrink: 0,
  },
  title: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 6,
    flexShrink: 1,
  },
  message: {
    fontSize: 13,
    lineHeight: 18.5,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 310,
    marginBottom: 12,
    flexShrink: 1,
  },
  nextStepBox: {
    width: '100%',
    maxWidth: 340,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#E7D7C1',
    borderRadius: 12,
    padding: 11,
    marginBottom: 16,
  },
  nextStepText: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    fontSize: 12,
    lineHeight: 17,
    color: colors.text,
    fontWeight: '600',
  },
  detailsList: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FAF9F6',
    borderWidth: 1,
    borderColor: '#EFECE6',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
    gap: 4,
  },
  detailItem: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.text,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    maxWidth: 340,
  },
  secondaryBtn: {
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#E7D7C1',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 1,
  },
  secondaryBtnText: {
    fontSize: 12.5,
    lineHeight: 17,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: colors.primary,
    flexShrink: 1,
  },
  primaryBtnText: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    flexShrink: 1,
  },
});