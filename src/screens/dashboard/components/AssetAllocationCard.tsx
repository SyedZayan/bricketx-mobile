import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../../theme/colors';

interface CategoryAllocation {
  categoryId: string;
  name: string;
  amount: string;
  share: string;
}

interface Props {
  allocations: CategoryAllocation[];
  formatCurrency: (val: string | number | null | undefined) => string;
}

const PALETTE = [colors.primary, '#2E7D32', '#9C8256', '#C9B38C', '#665E52'];

export const AssetAllocationCard: React.FC<Props> = ({ allocations, formatCurrency }) => {
  const normalized = allocations.map((cat, idx) => {
    const rawShare = parseFloat(cat.share || '0');
    const pct = Number.isFinite(rawShare)
      ? Math.max(0, Math.min(100, Math.round(rawShare * 100)))
      : 0;
    return {
      ...cat,
      key: cat.categoryId || String(idx),
      pct,
      color: PALETTE[idx % PALETTE.length],
    };
  });

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={2}>
          Asset Allocation
        </Text>
        <Text style={styles.subtitle} numberOfLines={2}>
          Portfolio weight across sectors
        </Text>
      </View>

      {/* Stacked Segmented Bar */}
      <View style={styles.stackedBar}>
        {normalized.map((item) => (
          <View
            key={item.key}
            style={[
              styles.segment,
              {
                flex: Math.max(item.pct, 2),
                backgroundColor: item.color,
              },
            ]}
          />
        ))}
      </View>

      {/* Clean Minimalist Breakdown Rows */}
      <View style={styles.rows}>
        {normalized.map((item, idx) => (
          <View
            key={item.key}
            style={[styles.row, idx < normalized.length - 1 && styles.rowBorder]}
          >
            <View style={styles.leftCol}>
              <View style={[styles.swatch, { backgroundColor: item.color }]} />
              <Text style={styles.sectorName} numberOfLines={2}>
                {item.name}
              </Text>
            </View>

            <View style={styles.rightCol}>
              <Text
                style={styles.sectorAmount}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.78}
              >
                {formatCurrency(item.amount)}
              </Text>
              <Text style={styles.sectorShare} numberOfLines={1}>
                {item.pct}%
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFECE6',
    borderRadius: 16,
    padding: 16,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 15.5,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 11.5,
    color: colors.textMuted,
    marginTop: 2,
  },
  stackedBar: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 999,
    backgroundColor: '#F2EFE9',
    overflow: 'hidden',
    gap: 2,
    marginBottom: 14,
  },
  segment: {
    height: '100%',
    borderRadius: 4,
  },
  rows: {
    gap: 2,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 9,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EFECE6',
  },
  leftCol: {
    flex: 1,
    minWidth: 120,
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  swatch: {
    width: 9,
    height: 9,
    borderRadius: 3,
    flexShrink: 0,
  },
  sectorName: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 17,
  },
  rightCol: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'flex-end',
    gap: 8,
    minWidth: 0,
    flexShrink: 1,
  },
  sectorAmount: {
    fontSize: 12.5,
    fontWeight: '800',
    color: colors.text,
    flexShrink: 1,
  },
  sectorShare: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.textMuted,
    minWidth: 32,
    flexShrink: 0,
    textAlign: 'right',
  },
});
