import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { ContractStatusBadge } from '../../../components/common/ContractStatusBadge';

interface Props {
  packageName: string;
  internalRef: string;
  principal: string;
  status: string;
  paymentSentAt?: string | null;
  maturityDate?: string | null;
  annualReturn?: { minPct: string; maxPct: string } | null;
  onPress: () => void;
  formatCurrency: (val: string | number | null | undefined) => string;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatMaturity = (raw?: string | null): string => {
  if (!raw) return '3 Years';
  const parts = raw.split('-');
  if (parts.length >= 2) {
    const monthIdx = parseInt(parts[1], 10) - 1;
    const monthLabel = MONTHS[monthIdx];
    if (monthLabel) return `${monthLabel} ${parts[0]}`;
  }
  return parts[0] || '3 Years';
};

export const InvestmentContractRow: React.FC<Props> = ({
  packageName,
  internalRef,
  principal,
  status,
  paymentSentAt,
  maturityDate,
  annualReturn,
  onPress,
  formatCurrency,
}) => {
  const cleanTitle = (packageName || '').replace(/\s+/g, ' ').trim();

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.82}>
      <View style={styles.topRow}>
        <View style={styles.titleCol}>
          <Text
            style={styles.packageName}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.78}
          >
            {cleanTitle}
          </Text>
          <Text style={styles.refText} numberOfLines={1}>
            {internalRef}
          </Text>
        </View>

        <View style={styles.rightWrap}>
          <ContractStatusBadge status={status} paymentSentAt={paymentSentAt} />
          <Ionicons
            name="chevron-forward"
            size={15}
            color={colors.textMuted}
            style={{ flexShrink: 0 }}
          />
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.footerRow}>
        <View style={styles.footerCol}>
          <Text style={styles.metaLabel} numberOfLines={1}>
            Principal
          </Text>
          <Text
            style={styles.metaValue}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
          >
            {formatCurrency(principal)}
          </Text>
        </View>

        <View style={styles.footerCol}>
          <Text style={styles.metaLabel} numberOfLines={1}>
            Target Yield
          </Text>
          <Text
            style={[styles.metaValue, { color: colors.primary }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
          >
            {annualReturn ? `${annualReturn.minPct}–${annualReturn.maxPct}%` : '12–16%'}
          </Text>
        </View>

        <View style={[styles.footerCol, { alignItems: 'flex-end' }]}>
          <Text style={styles.metaLabel} numberOfLines={1}>
            Maturity
          </Text>
          <Text
            style={styles.metaValue}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
          >
            {formatMaturity(maturityDate)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECE8E0',
    borderRadius: 14,
    padding: 14,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  titleCol: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
  },
  packageName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: colors.text,
    lineHeight: 18,
  },
  refText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: 2,
    flexShrink: 1,
  },
  rightWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    gap: 6,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#ECE8E0',
    marginVertical: 11,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  footerCol: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
  },
  metaLabel: {
    fontSize: 10.5,
    color: colors.textMuted,
    fontWeight: '600',
  },
  metaValue: {
    fontSize: 12.5,
    fontWeight: '800',
    color: colors.text,
    marginTop: 2,
    flexShrink: 1,
  },
});
