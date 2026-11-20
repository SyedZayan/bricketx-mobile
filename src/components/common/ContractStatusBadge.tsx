import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

interface ContractStatusBadgeProps {
  status: string;
  paymentSentAt?: string | null;
}

const toTitleCase = (raw: string): string =>
  raw
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (ch) => ch.toUpperCase());

export const ContractStatusBadge: React.FC<ContractStatusBadgeProps> = ({
  status,
  paymentSentAt,
}) => {
  const normalized = (status || '').toLowerCase();
  const isTransferInReview =
    (normalized === 'pending_funding' && Boolean(paymentSentAt)) ||
    normalized === 'pending_approval';
  const isShortfall = normalized === 'funding_shortfall';
  const isPendingFunding = !isTransferInReview && normalized === 'pending_funding';
  const isActive = normalized === 'active';

  const config = isActive
    ? {
        label: 'Active',
        bg: '#F2F7F3',
        border: '#D5E4D8',
        dot: '#2E7D32',
        text: '#235D28',
      }
    : isTransferInReview
      ? {
          label: 'In Review',
          bg: '#FAF5EE',
          border: '#E7D7C1',
          dot: colors.primary,
          text: '#7A5832',
        }
      : isShortfall
        ? {
            label: 'Top-Up Needed',
            bg: '#FBF6EE',
            border: '#E6D5B8',
            dot: '#A86A1A',
            text: '#7C4D12',
          }
        : isPendingFunding
          ? {
              label: 'Pending Funding',
              bg: '#FBF6EE',
              border: '#E6D5B8',
              dot: '#A86A1A',
              text: '#7C4D12',
            }
          : {
              label: toTitleCase(normalized || 'Unknown'),
              bg: '#F4F2ED',
              border: '#DFDBD2',
              dot: colors.textMuted,
              text: colors.textMuted,
            };

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: config.bg, borderColor: config.border },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: config.dot }]} />
      <Text
        style={[styles.label, { color: config.text }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.82}
      >
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    flexShrink: 0,
    maxWidth: 148,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    flexShrink: 0,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.1,
    minWidth: 0,
    flexShrink: 1,
  },
});
