import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';

interface FeaturedPackageCardProps {
  item: any;
  onPress: () => void;
}

const formatWholeUsd = (val: unknown): string => {
  const raw = typeof val === 'string' ? Number(val.replace(/,/g, '')) : Number(val);
  const safe = Number.isFinite(raw) && raw > 0 ? Math.trunc(raw) : 50000;
  return `$${safe.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
};

export const FeaturedPackageCard: React.FC<FeaturedPackageCardProps> = ({ item, onPress }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.topRow}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText} numberOfLines={1}>
            {item.category || 'Real Estate'}
          </Text>
        </View>
        <View style={styles.yieldBadge}>
          <Text style={styles.yieldText} numberOfLines={1}>
            {item.targetYield || item.annualReturn || '12-16%'} Target
          </Text>
        </View>
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {item.name || item.title}
      </Text>
      <Text style={styles.location} numberOfLines={2}>
        <Ionicons name="location-outline" size={13} color={colors.textMuted} />{' '}
        {item.location || 'Dubai, UAE'}
      </Text>

      <View style={styles.divider} />

      <View style={styles.bottomRow}>
        <View style={styles.bottomValueCol}>
          <Text style={styles.label} numberOfLines={1}>
            MIN. INVESTMENT
          </Text>
          <Text style={styles.value} numberOfLines={1}>
            {formatWholeUsd(item.minInvestment)}
          </Text>
        </View>
        <View style={styles.arrowCircle}>
          <Ionicons name="arrow-forward" size={16} color={colors.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFECE6',
    padding: 14,
    marginBottom: 10,
  },
  topRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: '#FAF5EE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    maxWidth: '55%',
    flexShrink: 1,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
  },
  yieldBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    flexShrink: 0,
  },
  yieldText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2E7D32',
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    lineHeight: 20,
  },
  location: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 3,
    lineHeight: 17,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#EFECE6',
    marginVertical: 12,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  bottomValueCol: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    marginTop: 2,
  },
  arrowCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FAF5EE',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
