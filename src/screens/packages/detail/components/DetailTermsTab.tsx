import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../theme/colors';
import { spacing } from '../../../../theme/spacing';
import { KeyInfoItem, PackageInfo, PerformanceData } from '../types';
import {
  formatCurrency,
  formatPayoutOptions,
  formatRoi,
  formatTenure,
} from '../packageFormatters';

interface Props {
  pkg: PackageInfo;
  keyInfo: KeyInfoItem[];
  performance: PerformanceData | null;
}

export const DetailTermsTab: React.FC<Props> = ({ pkg, keyInfo, performance }) => {
  const keyFacts = [
    { label: 'Target ROI', value: formatRoi(pkg.roiMin, pkg.roiMax) },
    { label: 'Minimum investment', value: formatCurrency(pkg.minInvestment) },
    { label: 'Tenure', value: formatTenure(pkg.tenureYears, pkg.isDynamic) },
    {
      label: 'Available payout',
      value: formatPayoutOptions(pkg.payoutOptions as any),
    },
  ].filter((f) => f.value !== '-');

  return (
    <View style={styles.container}>
      {/* Key Facts Card */}
      {keyFacts.length > 0 && (
        <View style={styles.card}>
          <View style={styles.eyebrowRow}>
            <Ionicons name="shield-checkmark-outline" size={14} color={colors.primary} />
            <Text style={styles.eyebrowText}>KEY FACTS</Text>
          </View>
          {keyFacts.map((fact, idx) => (
            <View key={fact.label}>
              <View style={styles.paramRow}>
                <Text style={styles.paramLabel}>{fact.label}</Text>
                <Text style={styles.paramValue}>{fact.value}</Text>
              </View>
              {idx < keyFacts.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>
      )}

      {/* Full Key Info Card */}
      {keyInfo.length > 0 && (
        <View style={styles.card}>
          <View style={styles.eyebrowRow}>
            <Ionicons name="information-circle-outline" size={14} color={colors.primary} />
            <Text style={styles.eyebrowText}>KEY INFO</Text>
          </View>
          {keyInfo.map((item, idx) => (
            <View key={item.id || idx}>
              <View style={styles.paramRow}>
                <Text style={styles.paramLabel}>{item.label}</Text>
                <Text style={styles.paramValue}>{item.value}</Text>
              </View>
              {idx < keyInfo.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>
      )}

      {/* Past Performance Table (matching web PastPerformance.tsx) */}
      {performance && performance.years.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Past performance</Text>

          <View style={styles.tableHeader}>
            <Text style={styles.tableHeaderLeft}>Year</Text>
            <Text style={styles.tableHeaderRight}>
              Average annual return credited to investors
            </Text>
          </View>

          {performance.years.map((y, idx) => (
            <View
              key={y.year}
              style={[
                styles.tableRow,
                idx === performance.years.length - 1 && { borderBottomWidth: 0 },
              ]}
            >
              <Text style={styles.tableYear}>{y.label}</Text>
              <Text style={styles.tablePct}>{y.averageAnnualReturnPct}%</Text>
            </View>
          ))}

          {performance.footnote ? (
            <Text style={styles.footnote}>{performance.footnote}</Text>
          ) : null}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFECE6',
    borderRadius: 14,
    padding: 16,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  eyebrowText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 12,
  },
  paramRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingVertical: 10,
    gap: 12,
  },
  paramLabel: {
    fontSize: 12.5,
    color: colors.textMuted,
    flexShrink: 1,
  },
  paramValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'right',
    flexShrink: 1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#EFECE6',
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E1D8',
    paddingBottom: 8,
    gap: 12,
  },
  tableHeaderLeft: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.textMuted,
  },
  tableHeaderRight: {
    flex: 1,
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.textMuted,
    textAlign: 'right',
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EFECE6',
  },
  tableYear: {
    fontSize: 13,
    color: colors.text,
  },
  tablePct: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  footnote: {
    marginTop: 12,
    fontSize: 11.5,
    lineHeight: 17,
    color: colors.textMuted,
  },
});