import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import {
  useGetPortfolioQuery,
  useGetInvestmentsQuery,
  useGetDashboardStatsQuery,
  useGetAuthMeQuery,
  useGetKycMeQuery,
  useGetPackagesQuery,
  useGetNotificationsUnreadCountQuery,
  useGetNotificationsQuery,
  useGetTicketsSummaryQuery,
} from '../../api/generated/investorApi';

import { AppHeader } from '../../components/common/AppHeader';
import { PortfolioHeroCard } from '../dashboard/components/PortfolioHeroCard';
import { QuickActionsRow } from '../dashboard/components/QuickActionsRow';
import { ActionRequiredBanner } from '../dashboard/components/ActionRequiredBanner';
import { PayoutForecastSchedule } from '../dashboard/components/PayoutForecastSchedule';
import { AssetAllocationCard } from '../dashboard/components/AssetAllocationCard';
import { InvestmentContractRow } from '../dashboard/components/InvestmentContractRow';
import { FeaturedPackageCard } from '../dashboard/components/FeaturedPackageCard';
import { SupportSummaryCard } from '../dashboard/components/SupportSummaryCard';

const DASHBOARD_INVESTMENTS_PREVIEW_LIMIT = 3;

export const DashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  const { data: authData, refetch: refetchAuth } = useGetAuthMeQuery();
  const { data: kycData, refetch: refetchKyc } = useGetKycMeQuery(undefined);
  const {
    data: portfolio,
    isLoading: portfolioLoading,
    isFetching: portfolioFetching,
    refetch: refetchPortfolio,
  } = useGetPortfolioQuery();

  const { data: investmentsListData, refetch: refetchInvestmentsList } = useGetInvestmentsQuery();

  const {
    data: stats,
    isLoading: statsLoading,
    isFetching: statsFetching,
    refetch: refetchStats,
  } = useGetDashboardStatsQuery();

  const { data: packagesData, refetch: refetchPackages } = useGetPackagesQuery({} as any);

  const { refetch: refetchTicketsSummary } = useGetTicketsSummaryQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const { refetch: refetchUnread } = useGetNotificationsUnreadCountQuery(undefined, {
    pollingInterval: 30000,
  });
  const { refetch: refetchNotifications } = useGetNotificationsQuery(
    { limit: 5 },
    { pollingInterval: 30000 }
  );

  const isRefreshing = Boolean(portfolioFetching || statsFetching);

  const onRefresh = () => {
    refetchAuth?.();
    refetchKyc?.();
    refetchPortfolio?.();
    refetchInvestmentsList?.();
    refetchStats?.();
    refetchPackages?.();
    refetchUnread?.();
    refetchNotifications?.();
    refetchTicketsSummary?.();
  };

  const formatCurrency = (amount: string | number | null | undefined) => {
    if (!amount) return '$0';
    const num = typeof amount === 'string' ? parseFloat(amount.replace(/[^0-9.-]/g, '')) : amount;
    return isNaN(num)
      ? '$0'
      : `$${num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const transferSentMap = useMemo(() => {
    const map = new Map<string, { paymentSentAt: string | null; topUpSentAt: string | null }>();
    const rawList = Array.isArray(investmentsListData)
      ? investmentsListData
      : (investmentsListData as any)?.investments || [];
    for (const item of rawList) {
      if (item?.id) {
        map.set(item.id, {
          paymentSentAt: item.paymentSentAt ?? null,
          topUpSentAt: item.topUpSentAt ?? null,
        });
      }
    }
    return map;
  }, [investmentsListData]);

  const investments = useMemo(() => (portfolio?.investments || []).filter((inv: any) => inv?.status !== 'cancelled'), [portfolio?.investments]);
  const hasActiveInvestments = investments.length > 0;

  const pendingInvestment = useMemo(() => {
    return investments.find((inv: any) => {
      const transferMeta = transferSentMap.get(inv.id);
      const paymentSentAt = inv.paymentSentAt ?? transferMeta?.paymentSentAt ?? null;
      const topUpSentAt = inv.topUpSentAt ?? transferMeta?.topUpSentAt ?? null;

      if (inv.status === 'pending_funding') {
        return !paymentSentAt;
      }
      if (inv.status === 'funding_shortfall') {
        return !topUpSentAt;
      }
      return false;
    });
  }, [investments, transferSentMap]);

  const previewInvestments = useMemo(() => {
    const priority = (inv: any) => {
      const paymentSentAt = inv.paymentSentAt ?? transferSentMap.get(inv.id)?.paymentSentAt;
      if ((inv.status === 'pending_funding' || inv.status === 'funding_shortfall') && !paymentSentAt) {
        return 0;
      }
      if (inv.status === 'pending_funding' || inv.status === 'pending_approval') {
        return 1;
      }
      if (inv.status === 'active') return 2;
      return 3;
    };
    return [...investments]
      .sort((a: any, b: any) => priority(a) - priority(b))
      .slice(0, DASHBOARD_INVESTMENTS_PREVIEW_LIMIT);
  }, [investments, transferSentMap]);

  if ((portfolioLoading || statsLoading) && !portfolio) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading investor portal...</Text>
      </View>
    );
  }

  const rawStatus =
    (kycData?.kycProfile as any)?.status || (kycData as any)?.status || 'NOT_STARTED';
  const kycStatus = String(rawStatus).toUpperCase();
  const isKycApproved = kycStatus === 'APPROVED' || kycStatus === 'VERIFIED';
  const isKycInReview = kycStatus === 'IN_REVIEW' || kycStatus === 'PENDING_REVIEW';

  const featuredPackages = Array.isArray(packagesData)
    ? packagesData.slice(0, 3)
    : (packagesData as any)?.packages?.slice(0, 3) || [];

  const remainingContractsCount = Math.max(
    investments.length - DASHBOARD_INVESTMENTS_PREVIEW_LIMIT,
    0
  );

  const nextPayoutText = portfolio?.totals?.nextPayout?.range
    ? `${formatCurrency(portfolio.totals.nextPayout.range.min)} - ${formatCurrency(
        portfolio.totals.nextPayout.range.max
      )}`
    : '$0';

  const nextPayoutSub = portfolio?.totals?.nextPayout?.expectedDate
    ? `Est. ${portfolio.totals.nextPayout.expectedDate}`
    : 'Pending deployment';

  const handleOpenKyc = () => {
    if (isKycApproved) {
      navigation.navigate('KycProfileView');
    } else {
      navigation.navigate('KycModal');
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 36 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <PortfolioHeroCard
          fullName={kycData?.kycProfile?.fullLegalName || authData?.fullName}
          investorRfid={authData?.investorRfid}
          isKycApproved={isKycApproved}
          isKycInReview={isKycInReview}
          totalCommitted={(() => {
            const rawCommitted = parseFloat(String(portfolio?.totals?.committed ?? '0').replace(/[^0-9.-]/g, '')) || 0;
            const rawActive = parseFloat(String(portfolio?.totals?.activeCapital ?? '0').replace(/[^0-9.-]/g, '')) || 0;
            const rawTotalInvested = parseFloat(String(portfolio?.totals?.totalInvested ?? '0').replace(/[^0-9.-]/g, '')) || 0;
            const sumNonCancelled = investments.reduce(
              (acc: number, inv: any) =>
                acc + (parseFloat(String(inv?.principal ?? '0').replace(/[^0-9.-]/g, '')) || 0),
              0
            );
            return Math.max(rawCommitted, rawActive, rawTotalInvested, sumNonCancelled);
          })()}
          activeCapital={portfolio?.totals?.activeCapital}
          paidToDate={(() => {
            const rawPaid = parseFloat(String(portfolio?.totals?.paidToDate ?? '0').replace(/[^0-9.-]/g, '')) || 0;
            if (rawPaid > 0) return rawPaid;
            const sumPaid = investments.reduce(
              (acc: number, inv: any) =>
                acc + (parseFloat(String(inv?.paid?.total ?? '0').replace(/[^0-9.-]/g, '')) || 0),
              0
            );
            return sumPaid > 0 ? sumPaid : (portfolio?.totals?.paidToDate ?? 0);
          })()}
          nextPayoutText={nextPayoutText}
          nextPayoutSub={nextPayoutSub}
          formatCurrency={formatCurrency}
          onPressKyc={handleOpenKyc}
        />

        <QuickActionsRow
          isKycApproved={isKycApproved}
          contractsCount={investments.length}
          onPressPackages={() => navigation.navigate('Packages')}
          onPressInvestments={() => navigation.navigate('Investments')}
          onPressKyc={handleOpenKyc}
          onPressSupport={() => navigation.navigate('Support')}
        />

        {!isKycApproved && (
          <TouchableOpacity
            style={styles.kycPromptCard}
            onPress={() => navigation.navigate('KycModal')}
            activeOpacity={0.88}
          >
            <View style={styles.kycPromptIconRing}>
              <Ionicons
                name={isKycInReview ? 'time-outline' : 'shield-outline'}
                size={21}
                color={colors.primary}
              />
            </View>
            <View style={styles.kycPromptTextWrap}>
              <Text style={styles.kycPromptTitle}>
                {isKycInReview
                  ? 'KYC Under Compliance Review'
                  : 'Complete Identity Verification'}
              </Text>
              <Text style={styles.kycPromptSub}>
                {isKycInReview
                  ? 'Your compliance documents are being audited. We will notify you once approved.'
                  : 'Verify your investor profile to commit to projects and unlock yield payouts.'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.primary} />
          </TouchableOpacity>
        )}

        {pendingInvestment && (
          <ActionRequiredBanner
            packageName={pendingInvestment.packageName}
            internalRef={pendingInvestment.internalRef}
            amount={formatCurrency(pendingInvestment.principal)}
            onPressDetails={() =>
              navigation.navigate('InvestmentDetail', { id: pendingInvestment.id })
            }
          />
        )}

        {hasActiveInvestments ? (
          <>
            {stats?.upcomingByMonth && stats.upcomingByMonth.length > 0 && (
              <PayoutForecastSchedule
                upcoming={stats.upcomingByMonth}
                history={stats.paidByMonth || []}
                formatCurrency={formatCurrency}
              />
            )}

            {stats?.allocationByCategory && stats.allocationByCategory.length > 0 && (
              <AssetAllocationCard
                allocations={stats.allocationByCategory}
                formatCurrency={formatCurrency}
              />
            )}

            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={styles.sectionTitle}>Your Investments</Text>
                  <Text style={styles.sectionSubtitle}>
                    Showing {previewInvestments.length} of {investments.length}{' '}
                    {investments.length === 1 ? 'contract' : 'contracts'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.seeAllPill}
                  onPress={() => navigation.navigate('Investments')}
                  activeOpacity={0.75}
                >
                  <Text style={styles.seeAllText}>See all</Text>
                  <Ionicons name="arrow-forward" size={12} color={colors.primary} />
                </TouchableOpacity>
              </View>

              <View style={styles.contractsList}>
                {previewInvestments.map((inv: any) => (
                  <InvestmentContractRow
                    key={inv.id}
                    packageName={inv.packageName}
                    internalRef={inv.internalRef}
                    principal={inv.principal}
                    status={inv.status}
                    paymentSentAt={
                      inv.paymentSentAt ?? transferSentMap.get(inv.id)?.paymentSentAt ?? null
                    }
                    maturityDate={inv.maturityDate}
                    annualReturn={inv.annualReturnRange}
                    formatCurrency={formatCurrency}
                    onPress={() => navigation.navigate('InvestmentDetail', { id: inv.id })}
                  />
                ))}
              </View>

              {remainingContractsCount > 0 && (
                <TouchableOpacity
                  style={styles.viewAllFooterBtn}
                  onPress={() => navigation.navigate('Investments')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.viewAllFooterText}>
                    View {remainingContractsCount} more{' '}
                    {remainingContractsCount === 1 ? 'investment' : 'investments'}
                  </Text>
                  <Ionicons name="arrow-forward" size={14} color={colors.primary} />
                </TouchableOpacity>
              )}
            </View>
          </>
        ) : (
          <View style={styles.opportunitiesSection}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>Available Opportunities</Text>
                <Text style={styles.sectionSubtitle}>
                  Curated institutional real estate packages
                </Text>
              </View>
              <TouchableOpacity
                style={styles.seeAllPill}
                onPress={() => navigation.navigate('Packages')}
                activeOpacity={0.75}
              >
                <Text style={styles.seeAllText}>View all</Text>
                <Ionicons name="arrow-forward" size={12} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {featuredPackages.length > 0 ? (
              <View style={styles.contractsList}>
                {featuredPackages.map((pkg: any) => (
                  <FeaturedPackageCard
                    key={pkg.id}
                    item={pkg}
                    onPress={() => navigation.navigate('PackageDetail', { id: pkg.id })}
                  />
                ))}
              </View>
            ) : (
              <TouchableOpacity
                style={styles.browseCard}
                onPress={() => navigation.navigate('Packages')}
                activeOpacity={0.8}
              >
                <Ionicons name="layers-outline" size={24} color={colors.primary} />
                <Text style={styles.browseTitle}>Explore Investment Packages</Text>
                <Text style={styles.browseSub}>
                  Browse high-yield commercial and residential syndications.
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <SupportSummaryCard
          onOpenSupport={() => navigation.navigate('Support')}
          onOpenNewTicket={() => navigation.navigate('NewTicket')}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7F4',
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F7F4',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    gap: 14,
  },
  kycPromptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF5EE',
    borderWidth: 1.5,
    borderColor: '#E7D7C1',
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  kycPromptIconRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7D7C1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kycPromptTextWrap: {
    flex: 1,
  },
  kycPromptTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: colors.primary,
  },
  kycPromptSub: {
    fontSize: 11.5,
    color: colors.textMuted,
    lineHeight: 16,
    marginTop: 2,
  },
  opportunitiesSection: {
    marginTop: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: colors.text,
  },
  sectionSubtitle: {
    fontSize: 11.5,
    color: colors.textMuted,
    marginTop: 2,
  },
  seeAllPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#E7D7C1',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  browseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFECE6',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  browseTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  browseSub: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFECE6',
    borderRadius: 16,
    padding: 16,
  },
  contractsList: {
    gap: 10,
  },
  viewAllFooterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#E7D7C1',
  },
  viewAllFooterText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.primary,
  },
});
