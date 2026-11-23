import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import {
  useGetInvestmentsQuery,
  GetInvestmentsApiResponse,
} from '../../api/generated/investorApi';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { getStatusMeta } from './detail/investmentTypes';
import { AppHeader } from '../../components/common/AppHeader';
import { ErrorStateView } from '../../components/common/ErrorStateView';
import { normalizeError } from '../../utils/errorHandler';
import { PoolMarker } from '../../components/invest/PoolMarker';

type InvestmentItem = GetInvestmentsApiResponse['investments'][number];
type TabFilter = 'ALL' | 'ACTIVE' | 'ACTION_REQUIRED' | 'CLOSED';

const getResolvedStatusMeta = (item: InvestmentItem) => {
  const baseMeta = getStatusMeta(item.status, item);
  const isTransferNoticeSent =
    item.status === 'pending_funding' && Boolean(item.paymentSentAt);

  if (!isTransferNoticeSent) {
    return { ...baseMeta, isTransferNoticeSent: false };
  }

  return {
    ...baseMeta,
    label: 'TRANSFER IN REVIEW',
    description: 'Awaiting treasury verification',
    color: '#C39967',
    bgColor: '#FAF5EE',
    borderColor: '#DFC7A7',
    step: 3,
    isTransferNoticeSent: true,
  };
};

const formatWholeNumber = (val: number | string | null | undefined): string => {
  if (val === null || val === undefined) return '0';
  const cleaned = typeof val === 'string' ? val.replace(/,/g, '').trim() : String(val);
  const num = Number(cleaned);
  if (!Number.isFinite(num) || num <= 0) return '0';
  return Math.trunc(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const formatCurrency = (amount: string | null | undefined, currency = 'USD') => {
  if (!amount) return `$0 ${currency}`;
  const cleaned = amount.replace(/,/g, '').trim();
  const num = Number(cleaned);
  return Number.isFinite(num) ? `$${formatWholeNumber(num)} ${currency}` : `${amount} ${currency}`;
};

const formatMaturityShort = (isoString: string | null | undefined) => {
  if (!isoString) return 'Upon Activation';
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return isoString;
  }
};

const formatCadence = (cadence: string | null | undefined) => {
  if (!cadence) return 'Standard';
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

interface CardProps {
  item: InvestmentItem;
  onPress: (item: InvestmentItem) => void;
}

const InvestmentCardComponent: React.FC<CardProps> = ({ item, onPress }) => {
  const statusMeta = getResolvedStatusMeta(item);
  const isPooled = Boolean(item.poolInvestment);

  const tenureDisplay = item.chosenTenureYears
    ? `${item.chosenTenureYears}Y Hold`
    : item.package?.tenureYears
    ? `${item.package.tenureYears}Y Hold`
    : 'Fixed Term';

  const progressPercent =
    statusMeta.step === 1
      ? '25%'
      : statusMeta.step === 2
      ? '50%'
      : statusMeta.step === 3
      ? '75%'
      : statusMeta.step === 4
      ? '88%'
      : '100%';

  const isDraft = item.status === 'draft';
  const isPendingFunding = statusMeta.step === 2 && !statusMeta.isTransferNoticeSent;
  const isActionRequired = isDraft || isPendingFunding;

  const footerCtaLabel = isDraft
    ? 'Sign Agreement'
    : isPendingFunding
    ? 'Wire & Confirm'
    : statusMeta.isTransferNoticeSent
    ? 'View Status'
    : 'View Details';

  const footerHint = isDraft
    ? 'Signature required'
    : isPendingFunding
    ? 'Wire transfer pending'
    : statusMeta.isTransferNoticeSent
    ? 'Awaiting verification'
    : isPooled && item.poolInvestment?.state === 'waiting_for_pool'
    ? 'Queued in pool'
    : item.status === 'active'
    ? 'Active & earning'
    : statusMeta.description;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.92}
      onPress={() => onPress(item)}
    >
      <View style={styles.cardTopMetaRow}>
        <Text style={styles.packageKicker} numberOfLines={1}>
          {isPooled ? 'POOLED ALLOCATION' : 'DIRECT ALLOCATION'}
        </Text>

        {isPooled ? (
          <View style={styles.badgeWrap}>
            <PoolMarker poolInvestment={item.poolInvestment} />
          </View>
        ) : (
          <View
            style={[
              styles.statusPill,
              {
                backgroundColor: statusMeta.bgColor,
                borderColor: statusMeta.borderColor,
              },
            ]}
          >
            <View style={[styles.statusDot, { backgroundColor: statusMeta.color }]} />
            <Text style={[styles.statusPillText, { color: statusMeta.color }]} numberOfLines={1}>
              {statusMeta.label}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.titleBlock}>
        <Text style={styles.packageName} numberOfLines={2}>
          {item.package?.name || 'Private Syndication'}
        </Text>
        <Text style={styles.internalRef} numberOfLines={1}>
          REF: {item.internalRef}
        </Text>
      </View>

      <View style={styles.pipelineTrack}>
        <View
          style={[
            styles.pipelineFill,
            { width: progressPercent, backgroundColor: statusMeta.color },
          ]}
        />
      </View>

      <View style={styles.principalSection}>
        <View style={styles.principalTextGroup}>
          <Text style={styles.principalLabel} numberOfLines={1}>
            CAPITAL DEPLOYED
          </Text>
          <Text
            style={styles.principalValue}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.72}
          >
            {formatCurrency(item.principal, item.currency)}
          </Text>
        </View>

        {isActionRequired && (
          <View style={styles.actionChip}>
            <Ionicons name="alert-circle" size={12} color="#8C6A3E" style={{ flexShrink: 0 }} />
            <Text style={styles.actionChipText} numberOfLines={1}>
              {isDraft ? 'Sign Required' : 'Wire Required'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.metricsStrip}>
        <View style={styles.metricCol}>
          <Text style={styles.metricLabel} numberOfLines={1}>
            PAYOUT
          </Text>
          <Text style={styles.metricValue} numberOfLines={1}>
            {formatCadence(item.payoutFrequency)}
          </Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricCol}>
          <Text style={styles.metricLabel} numberOfLines={1}>
            DURATION
          </Text>
          <Text style={styles.metricValue} numberOfLines={1}>
            {tenureDisplay}
          </Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricCol}>
          <Text style={styles.metricLabel} numberOfLines={1}>
            MATURITY
          </Text>
          <Text style={styles.metricValue} numberOfLines={1}>
            {formatMaturityShort(item.maturityDate)}
          </Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text
          style={[
            styles.footerDescription,
            isActionRequired && styles.footerDescriptionHighlight,
          ]}
          numberOfLines={2}
        >
          {footerHint}
        </Text>

        <View style={styles.footerAction}>
          <Text style={styles.footerActionText} numberOfLines={1}>
            {footerCtaLabel}
          </Text>
          <Ionicons name="arrow-forward" size={12} color={colors.primary} style={{ flexShrink: 0 }} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const InvestmentCard = React.memo<CardProps>(InvestmentCardComponent, (prev, next) => {
  return (
    prev.item.id === next.item.id &&
    prev.item.status === next.item.status &&
    prev.item.principal === next.item.principal &&
    prev.item.paymentSentAt === next.item.paymentSentAt &&
    prev.item.poolInvestment?.state === next.item.poolInvestment?.state
  );
});

export const InvestmentsScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const { data, isLoading, isFetching, error, refetch } = useGetInvestmentsQuery(
    undefined,
    { refetchOnMountOrArgChange: true }
  );

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const investments: InvestmentItem[] = data?.investments || [];

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabFilter>('ALL');

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const normalizedError = useMemo(() => {
    if (!error) return null;
    return normalizeError(error, {
      defaultMessage: 'We could not load your portfolio positions right now.',
      defaultNextStep:
        'Check your internet connection and tap Retry to reload your investments.',
    });
  }, [error]);

  const handleErrorAction = useCallback(() => {
    if (!normalizedError) {
      handleRefresh();
      return;
    }
    if (normalizedError.actionType === 'kyc') {
      navigation.navigate('KycModal');
      return;
    }
    if (normalizedError.actionType === 'support') {
      navigation.navigate('Support' as any);
      return;
    }
    handleRefresh();
  }, [normalizedError, handleRefresh, navigation]);

  const summary = useMemo(() => {
    let activeCapital = 0;
    let inFlightCapital = 0;
    let activePositions = 0;
    let inFlightPositions = 0;
    let actionRequiredPositions = 0;

    investments.forEach((inv) => {
      const p = Number(String(inv.principal ?? '').replace(/,/g, '')) || 0;
      const meta = getResolvedStatusMeta(inv);

      if (inv.status === 'active') {
        activeCapital += p;
        activePositions += 1;
      } else if (
        [
          'draft',
          'docs_signed',
          'pending_funding',
          'funding_received',
          'pending_approval',
        ].includes(inv.status)
      ) {
        inFlightCapital += p;
        inFlightPositions += 1;

        if (inv.status === 'draft' || meta.step === 2) {
          actionRequiredPositions += 1;
        }
      }
    });

    return {
      activeCapital,
      inFlightCapital,
      activePositions,
      inFlightPositions,
      actionRequiredPositions,
      totalPositions: investments.length,
    };
  }, [investments]);

  const filteredInvestments = useMemo(() => {
    return investments.filter((item) => {
      const meta = getResolvedStatusMeta(item);

      if (activeTab === 'ACTIVE' && item.status !== 'active') return false;
      if (
        activeTab === 'ACTION_REQUIRED' &&
        !(item.status === 'draft' || meta.step === 2)
      ) {
        return false;
      }
      if (
        activeTab === 'CLOSED' &&
        !['matured', 'cancelled', 'funding_reversed', 'withdrawn'].includes(item.status)
      ) {
        return false;
      }

      if (searchQuery.trim().length > 0) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = item.package?.name?.toLowerCase().includes(query);
        const matchesRef = item.internalRef?.toLowerCase().includes(query);
        const matchesStatus = meta.label.toLowerCase().includes(query);
        return matchesName || matchesRef || matchesStatus;
      }

      return true;
    });
  }, [investments, activeTab, searchQuery]);

  const handlePressInvestment = useCallback(
    (item: InvestmentItem) => {
      navigation.navigate('InvestmentDetail', { id: item.id });
    },
    [navigation]
  );

  const renderItem = useCallback(
    ({ item }: { item: InvestmentItem }) => (
      <InvestmentCard item={item} onPress={handlePressInvestment} />
    ),
    [handlePressInvestment]
  );

  const keyExtractor = useCallback((item: InvestmentItem) => item.id, []);

  const portfolioSummaryHeader = useMemo(
    () => (
      <View style={styles.balanceCard}>
        <View style={styles.balanceHeader}>
          <View style={styles.balanceHeroGroup}>
            <Text style={styles.balanceKicker} numberOfLines={1}>
              ACTIVE DEPLOYED PORTFOLIO
            </Text>
            <Text
              style={styles.balanceHero}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.72}
            >
              ${formatWholeNumber(summary.activeCapital)}
              <Text style={styles.balanceCurrency}> USD</Text>
            </Text>
          </View>

          <View style={styles.positionBadge}>
            <Text style={styles.positionBadgeValue} numberOfLines={1}>
              {summary.activePositions}
            </Text>
            <Text style={styles.positionBadgeLabel} numberOfLines={1}>
              Active
            </Text>
          </View>
        </View>

        <View style={styles.balanceDivider} />

        <View style={styles.balanceFooterRow}>
          <View style={styles.balanceSubItem}>
            <Text style={styles.balanceSubLabel} numberOfLines={1}>
              In-Flight Subscriptions
            </Text>
            <Text
              style={styles.balanceSubValue}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.78}
            >
              ${formatWholeNumber(summary.inFlightCapital)} ({summary.inFlightPositions})
            </Text>
          </View>

          <View style={styles.balanceSubItemRight}>
            <Text style={styles.balanceSubLabel} numberOfLines={1}>
              Total Allocations
            </Text>
            <Text
              style={styles.balanceSubValue}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.78}
            >
              {summary.totalPositions} Records
            </Text>
          </View>
        </View>
      </View>
    ),
    [
      summary.activeCapital,
      summary.activePositions,
      summary.inFlightCapital,
      summary.inFlightPositions,
      summary.totalPositions,
    ]
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <AppHeader title="Portfolio" subtitle="Active contracts & distributions" />

      <View style={styles.stickyControls}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color={colors.primary} style={{ flexShrink: 0 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search package name or ref (e.g. BX-100095)..."
            placeholderTextColor="#A8A29E"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.tabStrip}>
          {(['ALL', 'ACTIVE', 'ACTION_REQUIRED', 'CLOSED'] as TabFilter[]).map((tab) => {
            const isSelected = activeTab === tab;
            const label =
              tab === 'ALL'
                ? `All (${summary.totalPositions})`
                : tab === 'ACTIVE'
                ? `Active (${summary.activePositions})`
                : tab === 'ACTION_REQUIRED'
                ? `Action (${summary.actionRequiredPositions})`
                : 'Closed';

            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tabChip, isSelected && styles.tabChipActive]}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.8}
              >
                <Text
                  style={[styles.tabChipText, isSelected && styles.tabChipTextActive]}
                  numberOfLines={2}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Streaming position ledger...</Text>
        </View>
      ) : error ? (
        <ErrorStateView
          error={error}
          appError={normalizedError || undefined}
          onAction={handleErrorAction}
          loading={isFetching}
        />
      ) : filteredInvestments.length === 0 ? (
        <View style={styles.centerBox}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="briefcase-outline" size={32} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>
            {searchQuery ? 'No Matches Found' : 'No Positions Available'}
          </Text>
          <Text style={styles.emptySub}>
            {searchQuery
              ? `No investments match "${searchQuery}". Try searching by another reference.`
              : activeTab === 'ALL'
              ? 'You have not committed to any investment packages yet. Explore offerings in the catalog.'
              : `No positions are currently marked as ${activeTab.toLowerCase().replace('_', ' ')}.`}
          </Text>
          {activeTab === 'ALL' && !searchQuery ? (
            <TouchableOpacity
              style={styles.exploreBtn}
              onPress={() => navigation.navigate('Packages' as any)}
              activeOpacity={0.85}
            >
              <Text style={styles.exploreBtnText}>Browse Packages</Text>
              <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.clearFilterBtn}
              onPress={() => {
                setSearchQuery('');
                setActiveTab('ALL');
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.clearFilterText}>Reset Filters</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredInvestments}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ListHeaderComponent={portfolioSummaryHeader}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, 16) + 40 },
          ]}
          showsVerticalScrollIndicator={false}
          initialNumToRender={5}
          maxToRenderPerBatch={6}
          windowSize={7}
          removeClippedSubviews={Platform.OS === 'android'}
          refreshControl={
            <RefreshControl
              refreshing={isFetching}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7F4',
  },
  stickyControls: {
    paddingHorizontal: spacing.lg,
    paddingTop: 10,
    paddingBottom: 6,
    backgroundColor: '#F8F7F4',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7D7C1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 9 : 7,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    fontSize: 12.5,
    color: colors.text,
    padding: 0,
  },
  tabStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tabChip: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFECE6',
    maxWidth: '48%',
    flexShrink: 1,
  },
  tabChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabChipText: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
    color: colors.textMuted,
    fontVariant: ['tabular-nums'],
  },
  tabChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  balanceCard: {
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#E7D7C1',
    borderRadius: 14,
    padding: 15,
    marginBottom: 4,
    overflow: 'hidden',
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  balanceHeroGroup: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
  },
  balanceKicker: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.8,
  },
  balanceHero: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  balanceCurrency: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  positionBadge: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7D7C1',
    flexShrink: 0,
  },
  positionBadgeValue: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
    fontVariant: ['tabular-nums'],
  },
  positionBadgeLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  balanceDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E7D7C1',
    marginVertical: 11,
  },
  balanceFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  balanceSubItem: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
  },
  balanceSubItemRight: {
    alignItems: 'flex-end',
    minWidth: 0,
    flexShrink: 1,
  },
  balanceSubLabel: {
    fontSize: 10,
    lineHeight: 14,
    color: colors.textMuted,
    fontWeight: '600',
  },
  balanceSubValue: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: 6,
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EBE6DD',
    padding: 15,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#1A1815',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  cardTopMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  packageKicker: {
    fontSize: 8.5,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.8,
  },
  badgeWrap: {
    flexShrink: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
    borderWidth: 1,
    flexShrink: 1,
  },
  statusDot: {
    width: 5.5,
    height: 5.5,
    borderRadius: 3,
    flexShrink: 0,
  },
  statusPillText: {
    fontSize: 8.5,
    lineHeight: 14,
    fontWeight: '800',
    letterSpacing: 0.4,
    flexShrink: 1,
  },
  titleBlock: {
    marginBottom: 10,
  },
  packageName: {
    fontSize: 15.5,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  internalRef: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.4,
    marginTop: 2,
  },
  pipelineTrack: {
    width: '100%',
    height: 2.5,
    backgroundColor: '#F1EFEA',
    borderRadius: 1.5,
    overflow: 'hidden',
    marginBottom: 12,
  },
  pipelineFill: {
    height: '100%',
    borderRadius: 1.5,
  },
  principalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 12,
  },
  principalTextGroup: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
  },
  principalLabel: {
    fontSize: 8.5,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.6,
  },
  principalValue: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.3,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#DFC7A7',
    flexShrink: 0,
  },
  actionChipText: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
    color: '#8C6A3E',
  },
  metricsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF9F6',
    borderWidth: 1,
    borderColor: '#EFECE6',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 6,
    marginBottom: 10,
  },
  metricCol: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  metricDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E5E1D8',
    flexShrink: 0,
  },
  metricLabel: {
    fontSize: 7.5,
    lineHeight: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  metricValue: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
    textAlign: 'center',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 9,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#EFECE6',
    gap: 8,
  },
  footerDescription: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '500',
    color: colors.textMuted,
  },
  footerDescriptionHighlight: {
    color: '#8C6A3E',
    fontWeight: '600',
  },
  footerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flexShrink: 0,
  },
  footerActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
  errorIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFEBEE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginTop: spacing.xs,
  },
  errorSub: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 280,
  },
  retryBtn: {
    marginTop: spacing.md,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#E7D7C1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginTop: spacing.xs,
  },
  emptySub: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
    maxWidth: 280,
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.md,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.primary,
    borderRadius: 10,
  },
  exploreBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  clearFilterBtn: {
    marginTop: spacing.md,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#E7D7C1',
  },
  clearFilterText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
});


