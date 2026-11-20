import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

export type FeedbackVariant = 'success' | 'error' | 'warning' | 'confirm' | 'info';

interface Props {
  visible: boolean;
  variant: FeedbackVariant;
  title: string;
  message: string;
  details?: string[];
  primaryLabel?: string;
  secondaryLabel?: string;
  destructive?: boolean;
  iconName?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  onPrimary: () => void;
  onSecondary?: () => void;
}

export const StatusFeedbackModal: React.FC<Props> = ({
  visible,
  variant,
  title,
  message,
  details,
  primaryLabel = 'OK',
  secondaryLabel,
  destructive = false,
  iconName,
  loading = false,
  onPrimary,
  onSecondary,
}) => {
  const palette = {
    success: {
      icon: 'checkmark-circle' as const,
      iconColor: colors.primary,
      circleBg: colors.primaryTint,
      borderColor: colors.primaryBorder,
      btnBg: colors.primary,
    },
    error: {
      icon: 'alert-circle-outline' as const,
      iconColor: colors.text,
      circleBg: colors.slateLight,
      borderColor: colors.border,
      btnBg: colors.text,
    },
    warning: {
      icon: 'time-outline' as const,
      iconColor: colors.primary,
      circleBg: colors.primaryTint,
      borderColor: colors.primaryBorder,
      btnBg: colors.primary,
    },
    confirm: {
      icon: 'shield-checkmark' as const,
      iconColor: colors.primary,
      circleBg: colors.primaryTint,
      borderColor: colors.primaryBorder,
      btnBg: colors.primary,
    },
    info: {
      icon: 'information-circle-outline' as const,
      iconColor: colors.primary,
      circleBg: colors.primaryTint,
      borderColor: colors.primaryBorder,
      btnBg: colors.primary,
    },
  }[variant];

  const resolvedIcon = iconName || palette.icon;
  const resolvedBtnBg = destructive ? colors.text : palette.btnBg;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onSecondary || onPrimary}
    >
      <View style={styles.overlay}>
        <View style={[styles.card, { borderColor: palette.borderColor }]}>
          <View style={[styles.iconCircle, { backgroundColor: palette.circleBg }]}>
            <Ionicons name={resolvedIcon} size={30} color={palette.iconColor} />
          </View>

          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          <Text style={styles.message}>{message}</Text>

          {details && details.length > 0 && (
            <View style={styles.detailsBox}>
              {details.map((item, idx) => (
                <View key={idx} style={styles.detailRow}>
                  <View style={[styles.bulletDot, { backgroundColor: palette.iconColor }]} />
                  <Text style={styles.detailText}>{item}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.actionsRow}>
            {secondaryLabel && onSecondary && (
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={onSecondary}
                disabled={loading}
                activeOpacity={0.85}
              >
                <Text style={styles.secondaryBtnText} numberOfLines={2}>
                  {secondaryLabel}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.primaryBtn,
                { backgroundColor: resolvedBtnBg },
                secondaryLabel
                  ? { flexBasis: '52%', flexGrow: 1.35, minWidth: 120 }
                  : { width: '100%' },
              ]}
              onPress={onPrimary}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryBtnText} numberOfLines={2}>
                  {primaryLabel}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(33, 33, 33, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  card: {
    width: '100%',
    maxWidth: 390,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1.2,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#212121',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.14,
        shadowRadius: 18,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    flexShrink: 0,
  },
  title: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  message: {
    fontSize: 13.5,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 19.5,
    marginBottom: 18,
    flexShrink: 1,
  },
  detailsBox: {
    width: '100%',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
    flexShrink: 0,
  },
  detailText: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 17,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  secondaryBtn: {
    flexBasis: '42%',
    flexGrow: 1,
    minWidth: 100,
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.slateLight,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontSize: 13.5,
    lineHeight: 18,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    flexShrink: 1,
  },
  primaryBtn: {
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontSize: 13.5,
    lineHeight: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    flexShrink: 1,
  },
});
