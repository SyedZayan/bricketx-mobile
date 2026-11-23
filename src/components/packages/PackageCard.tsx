import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { GetPackagesApiResponse } from '../../api/generated/investorApi';
import { colors } from '../../theme/colors';
import { buildCachedImageSource, getStableMediaCacheKey } from '../../utils/mediaCache';

export type PackageItem = GetPackagesApiResponse['packages'][number];

interface PackageCardProps {
  item: PackageItem;
  isKycApproved: boolean;
  onPress: (item: PackageItem) => void;
}

const formatRoi = (min: string | null, max: string | null): string => {
  if (min && max) return `${min}-${max}%`;
  if (min) return `${min}%`;
  if (max) return `${max}%`;
  return 'Target Yield';
};

const formatMinInvestment = (amount: string): string => {
  const num = Number(amount);
  if (!isNaN(num) && num > 0) {
    return `$${num.toLocaleString()}`;
  }
  return amount || '$0';
};

const formatTenure = (years: number | null, isDynamic?: boolean): string => {
  if (isDynamic) return '1-5 Years (Choice)';
  if (!years) return 'Flexible';
  return `${years} ${years === 1 ? 'Year' : 'Years'}`;
};

const formatCadence = (cadence: string): string => {
  switch (cadence) {
    case 'quarterly':
      return 'Quarterly';
    case 'half_yearly':
      return 'Semi-Annual';
    case 'yearly':
      return 'Annual';
    default:
      return cadence;
  }
};

const PackageCardComponent: React.FC<PackageCardProps> = ({
  item,
  isKycApproved,
  onPress,
}) => {
  const roiString = formatRoi(item.roiMin, item.roiMax);
  const minInvestString = formatMinInvestment(item.minInvestment);
  const tenureString = formatTenure(item.tenureYears, item.isDynamic);

  const cleanCacheKey = useMemo(
    () => getStableMediaCacheKey(item.coverImageViewUrl, item.id),
    [item.coverImageViewUrl, item.id]
  );

  const imageSource = useMemo(
    () => buildCachedImageSource(item.coverImageViewUrl, { width: 600, height: 200 }),
    [item.coverImageViewUrl]
  );

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.92}
      onPress={() => onPress(item)}
    >
      {/* Cover Media Container (object-contain per web spec) */}
      <View style={styles.coverWrapper}>
        {imageSource ? (
          <Image
            source={imageSource}
            style={styles.cardCover}
            contentFit="contain"
            transition={100}
            cachePolicy="memory-disk"
            recyclingKey={cleanCacheKey}
          />
        ) : (
          <View style={styles.cardCoverPlaceholder}>
            <View style={styles.placeholderIconRing}>
              <Ionicons name="business" size={26} color={colors.primary} />
            </View>
            <Text style={styles.placeholderWatermark}>BRICKETX PRIME</Text>
          </View>
        )}

        {/* Floating Badges Overlay */}
        <View style={styles.coverTopOverlay}>
          <View style={styles.typeBadge}>
            <View
              style={[
                styles.typeBadgeDot,
                { backgroundColor: item.isDynamic ? '#C39967' : '#2A9D8F' },
              ]}
            />
            <Text style={styles.typeBadgeText}>
              {item.isDynamic ? 'DYNAMIC PORTFOLIO' : 'FIXED MATURITY'}
            </Text>
          </View>

          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>ACTIVE</Text>
          </View>
        </View>
      </View>

      {/* Card Body */}
      <View style={styles.cardBody}>
        <View style={styles.titleRow}>
          <Text style={styles.packageTitle} numberOfLines={1}>{item.name}</Text>
          <Ionicons
            name="arrow-forward-circle"
            size={22}
            color={colors.primary}
            style={styles.arrowIcon}
          />
        </View>

        {item.subtitle ? (
          <Text style={styles.packageSubtitle} numberOfLines={2}>{item.subtitle}</Text>
        ) : null}

        {/* 3-Column Financial Metrics Panel */}
        <View style={styles.metricsStrip}>
          <View style={styles.metricCol}>
            <Text style={styles.metricLabel}>TARGET RETURN</Text>
            <Text style={styles.metricValueGold} numberOfLines={1}>{roiString}</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricCol}>
            <Text style={styles.metricLabel}>MIN. TICKET</Text>
            <Text style={styles.metricValue} numberOfLines={1}>{minInvestString}</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricCol}>
            <Text style={styles.metricLabel}>TENURE</Text>
            <Text style={styles.metricValue} numberOfLines={1}>{tenureString}</Text>
          </View>
        </View>

        {/* Payout Options Pill Row */}
        {item.payoutOptions && item.payoutOptions.length > 0 && (
          <View style={styles.payoutRow}>
            <Text style={styles.payoutLabel}>Disbursements:</Text>
            <View style={styles.payoutPillsContainer}>
              {item.payoutOptions.map((cadence, idx) => (
                <View key={idx} style={styles.payoutPill}>
                  <Ionicons name="time-outline" size={10} color={colors.primary} />
                  <Text style={styles.payoutPillText}>{formatCadence(cadence)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Footer Actions */}
        <View style={styles.footerRow}>
          <View style={styles.complianceTag}>
            <Ionicons
              name="shield-checkmark"
              size={12}
              color={isKycApproved ? '#2E7D32' : colors.textMuted}
            />
            <Text
              style={[
                styles.complianceText,
                isKycApproved && styles.complianceTextApproved,
              ]}
            >
              {isKycApproved ? 'KYC Verified' : 'KYC required to invest'}
            </Text>
          </View>

          <View style={styles.actionBtn}>
            <Text style={styles.actionBtnText}>
              {isKycApproved ? 'View Data Room' : 'View Details'}
            </Text>
            <Ionicons
              name="chevron-forward"
              size={13}
              color="#FFFFFF"
            />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const PackageCard = React.memo<PackageCardProps>(
  PackageCardComponent,
  (prev, next) => {
    return (
      prev.item.id === next.item.id &&
      prev.item.coverImageViewUrl === next.item.coverImageViewUrl &&
      prev.item.name === next.item.name &&
      prev.item.minInvestment === next.item.minInvestment &&
      prev.item.roiMin === next.item.roiMin &&
      prev.item.roiMax === next.item.roiMax &&
      prev.isKycApproved === next.isKycApproved
    );
  }
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFECE6',
    marginBottom: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#1A1815',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: {
        elevation: 2.5,
      },
    }),
  },
  coverWrapper: {
    position: 'relative',
    width: '100%',
    height: 170,
    backgroundColor: '#FAF5EE',
  },
  cardCover: {
    width: '100%',
    height: '100%',
  },
  cardCoverPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4ECE1',
  },
  placeholderIconRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E7D7C1',
  },
  placeholderWatermark: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
    color: '#B59873',
  },
  coverTopOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderWidth: 1,
    borderColor: 'rgba(231, 215, 193, 0.6)',
  },
  typeBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 8,
    backgroundColor: 'rgba(232, 245, 233, 0.95)',
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#2E7D32',
    letterSpacing: 0.6,
  },
  cardBody: {
    padding: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  packageTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
  },
  arrowIcon: {
    marginTop: 1,
  },
  packageSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18,
    marginTop: 4,
    marginBottom: 12,
  },
  metricsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAF9F6',
    borderWidth: 1,
    borderColor: '#EFECE6',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  metricCol: {
    flex: 1,
    alignItems: 'center',
  },
  metricDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E5E1D8',
  },
  metricLabel: {
    fontSize: 8.5,
    color: colors.textMuted,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
  },
  metricValueGold: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 2,
  },
  payoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  payoutLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  payoutPillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  payoutPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#E7D7C1',
  },
  payoutPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#EFECE6',
    gap: 10,
  },
  complianceTag: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  complianceText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
  },
  complianceTextApproved: {
    color: '#2E7D32',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  actionBtnGated: {
    backgroundColor: colors.slate,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});