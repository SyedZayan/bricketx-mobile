import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import {
  useGetPackagesByIdQuery,
  useGetPackagesByIdPerformanceQuery,
  useGetKycMeQuery,
  useGetInvestmentsQuery,
  GetInvestmentsApiResponse,
} from '../../api/generated/investorApi';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { DetailTab } from './detail/types';
import { AppHeader } from '../../components/common/AppHeader';
import {
  formatRoi,
  formatCurrency,
  formatTenure,
  formatPayoutOptions,
} from './detail/packageFormatters';
import { DetailOverviewTab } from './detail/components/DetailOverviewTab';
import { DetailTermsTab } from './detail/components/DetailTermsTab';
import { DetailDocumentsTab } from './detail/components/DetailDocumentsTab';
import { DetailGalleryTab } from './detail/components/DetailGalleryTab';
import { DetailUpdatesTab } from './detail/components/DetailUpdatesTab';
import { DetailFaqTab } from './detail/components/DetailFaqTab';
import {
  buildCachedImageSource,
  getStableMediaCacheKey,
  prefetchMediaUrls,
} from '../../utils/mediaCache';

type Props = NativeStackScreenProps<RootStackParamList, 'PackageDetail'>;
type InvestmentItem = GetInvestmentsApiResponse['investments'][number];

export const PackageDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { id } = route.params;
  const insets = useSafeAreaInsets();

  const { data, isLoading, error, refetch } = useGetPackagesByIdQuery(
    { id },
    { refetchOnMountOrArgChange: 120 }
  );

  const { data: performanceData } = useGetPackagesByIdPerformanceQuery(
    { id },
    { refetchOnMountOrArgChange: 120 }
  );

  const { data: kycData } = useGetKycMeQuery(undefined, {
    refetchOnMountOrArgChange: 60,
  });

  const { data: investmentsData } = useGetInvestmentsQuery(undefined, {
    refetchOnMountOrArgChange: 30,
  });

  const rawStatus =
    (kycData?.kycProfile as any)?.status || (kycData as any)?.status || 'NOT_STARTED';
  const isKycApproved =
    String(rawStatus).toUpperCase() === 'APPROVED' ||
    String(rawStatus).toUpperCase() === 'VERIFIED';

  const [activeTab, setActiveTab] = useState<DetailTab>('OVERVIEW');
  const [coverFailed, setCoverFailed] = useState(false);

  const [draftPrompt, setDraftPrompt] = useState<{
    visible: boolean;
    pendingInstance: InvestmentItem | null;
    newAmount: number;
  }>({
    visible: false,
    pendingInstance: null,
    newAmount: 0,
  });

  const closeDraftPrompt = () => {
    setDraftPrompt((prev) => ({ ...prev, visible: false }));
  };

  const stableCoverCacheKey = useMemo(
    () => getStableMediaCacheKey(data?.package?.coverImageViewUrl, `cover_${id}`),
    [data?.package?.coverImageViewUrl, id]
  );

  const heroCoverSource = useMemo(
    () =>
      buildCachedImageSource(data?.package?.coverImageViewUrl, {
        width: 720,
        height: 260,
      }),
    [data?.package?.coverImageViewUrl]
  );

  useEffect(() => {
    if (!data) return;
    const urlsToPrefetch: (string | null | undefined)[] = [
      data.package?.coverImageViewUrl,
    ];
    data.galleries?.forEach((gallery) => {
      gallery.media?.forEach((m: any) => {
        urlsToPrefetch.push(m?.viewUrl || m?.url);
      });
    });
    data.contentMedia?.forEach((m: any) => {
      urlsToPrefetch.push(m?.viewUrl || m?.url);
    });
    prefetchMediaUrls(urlsToPrefetch);
  }, [data]);

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Opening investment data-room...</Text>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={44} color={colors.error} />
        <Text style={styles.errorTitle}>Failed to load package details</Text>
        <Text style={styles.errorSub}>The data room could not be retrieved.</Text>
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={() => refetch()}
          activeOpacity={0.8}
        >
          <Ionicons name="refresh" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const {
    package: pkg,
    allocations = [],
    keyInfo = [],
    documents = [],
    resources = [],
    galleries = [],
    contentMedia = [],
    sections = [],
    faqs = [],
  } = data;

  const performance =
    performanceData && performanceData.years.length > 0 ? performanceData : null;

  const galleryMediaCount = galleries.reduce(
    (acc, g) => acc + (g.media?.length || 0),
    0
  );
  const totalMediaCount = galleryMediaCount + (contentMedia?.length || 0);
  const totalFilesCount = documents.length + resources.length;
  const updateCount = pkg.updateCount || 0;

  const availableTabs: { key: DetailTab; label: string }[] = [
    { key: 'OVERVIEW', label: 'Overview' },
    { key: 'DETAILS', label: 'Terms & details' },
    ...(totalMediaCount > 0 ? [{ key: 'GALLERY' as DetailTab, label: 'Gallery' }] : []),
    ...(totalFilesCount > 0
      ? [{ key: 'DOCUMENTS' as DetailTab, label: 'Documents & Resources' }]
      : []),
    ...(updateCount > 0 ? [{ key: 'UPDATES' as DetailTab, label: 'Updates' }] : []),
    ...(faqs.length > 0 ? [{ key: 'FAQS' as DetailTab, label: 'FAQs' }] : []),
  ];

  const navigateToCommitmentModal = (options: {
    amount: number;
    existingInvestmentId?: string;
    isEditMode?: boolean;
    defaultTenureYears?: number | null;
  }) => {
    navigation.navigate('CommitmentModal', {
      packageId: pkg.id,
      packageName: pkg.name,
      minInvestment: pkg.minInvestment,
      initialAmount: options.amount,
      existingInvestmentId: options.existingInvestmentId,
      isEditMode: options.isEditMode,
      payoutOptions: (pkg.payoutOptions || ['quarterly']) as (
        | 'quarterly'
        | 'half_yearly'
        | 'yearly'
      )[],
      isDynamic: Boolean(pkg.isDynamic),
      defaultTenureYears: options.defaultTenureYears ?? pkg.tenureYears,
      disclaimerText: pkg.disclaimerText,
    });
  };

  const handleCommitPress = (customAmount?: number) => {
    if (!isKycApproved) {
      navigation.navigate('KycModal');
      return;
    }

    const defaultAmount = Number(pkg.minInvestment) || 50000;
    const amountToCommit =
      typeof customAmount === 'number' && customAmount > 0
        ? customAmount
        : defaultAmount;

    const pendingInstance = investmentsData?.investments?.find(
      (inv) =>
        inv.packageId === pkg.id &&
        ['draft', 'docs_signed', 'pending_funding'].includes(inv.status)
    );

    if (pendingInstance) {
      setDraftPrompt({
        visible: true,
        pendingInstance,
        newAmount: amountToCommit,
      });
      return;
    }

    navigateToCommitmentModal({ amount: amountToCommit });
  };

  const pendingInstance = draftPrompt.pendingInstance;
  const pendingPrincipal = pendingInstance
    ? Number(pendingInstance.principal) || Number(pkg.minInvestment) || 50000
    : 0;
  const pendingStatusLabel = pendingInstance
    ? pendingInstance.status === 'draft'
      ? 'Draft Allocation'
      : pendingInstance.paymentSentAt
      ? 'Awaiting Approval'
      : 'Awaiting Wire Funding'
    : '';

  return (
    <View style={styles.container}>
      <AppHeader hideNotifications showBack title={pkg.name || 'Package Overview'} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 110 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Cover Media (object-contain per web HeroImage spec) */}
        <View style={styles.heroCoverWrapper}>
          {heroCoverSource && !coverFailed ? (
            <Image
              source={heroCoverSource}
              style={styles.heroCover}
              contentFit="contain"
              transition={120}
              cachePolicy="memory-disk"
              recyclingKey={stableCoverCacheKey}
              onError={() => setCoverFailed(true)}
            />
          ) : (
            <View style={[styles.heroCover, styles.placeholderCover]}>
              <View style={styles.placeholderIconRing}>
                <Ionicons name="business" size={32} color={colors.primary} />
              </View>
              <Text style={styles.placeholderWatermark}>BRICKETX PRIME</Text>
            </View>
          )}

          <View style={styles.coverTopOverlay}>
            <View style={styles.typeBadge}>
              <View
                style={[
                  styles.typeBadgeDot,
                  { backgroundColor: pkg.isDynamic ? '#C39967' : '#2A9D8F' },
                ]}
              />
              <Text style={styles.typeBadgeText}>
                {pkg.isDynamic ? 'DYNAMIC PORTFOLIO' : 'FIXED MATURITY'}
              </Text>
            </View>

            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>
                {(pkg.status || 'ACTIVE').toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* Header Summary */}
        <View style={styles.headerCard}>
          <Text style={styles.pkgTitle}>{pkg.name}</Text>
          {pkg.subtitle ? <Text style={styles.pkgSubtitle}>{pkg.subtitle}</Text> : null}

          <View style={styles.termsGrid}>
            <View style={styles.termBox}>
              <Text style={styles.termLabel}>TARGET ROI</Text>
              <Text style={styles.termValueGold} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
                {formatRoi(pkg.roiMin, pkg.roiMax)}
              </Text>
            </View>
            <View style={styles.termDivider} />
            <View style={styles.termBox}>
              <Text style={styles.termLabel}>MIN. TICKET</Text>
              <Text style={styles.termValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
                {formatCurrency(pkg.minInvestment)}
              </Text>
            </View>
            <View style={styles.termDivider} />
            <View style={styles.termBox}>
              <Text style={styles.termLabel}>TENURE</Text>
              <Text style={styles.termValue} numberOfLines={1}>
                {pkg.isDynamic ? '1-5 Years' : formatTenure(pkg.tenureYears, false)}
              </Text>
            </View>
          </View>

          {pkg.payoutOptions && pkg.payoutOptions.length > 0 && (
            <View style={styles.payoutStrip}>
              <Text style={styles.payoutStripLabel}>Available payout:</Text>
              <Text style={styles.payoutStripValue}>
                {formatPayoutOptions(pkg.payoutOptions as any)}
              </Text>
            </View>
          )}

          {allocations.length > 0 && (
            <View style={styles.allocationBox}>
              <Text style={styles.sectionKicker}>CAPITAL ALLOCATION SPREAD</Text>
              <View style={styles.allocationRow}>
                {allocations.map((alloc) => (
                  <View key={alloc.categoryId} style={styles.allocPill}>
                    <Text style={styles.allocName}>{alloc.category?.name}</Text>
                    <Text style={styles.allocWeight}>{alloc.weight}%</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Horizontal Scrollable Tab Navigation */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabBarScroll}
          contentContainerStyle={styles.tabBarContent}
        >
          {availableTabs.map((tab) => {
            const isSelected = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabItem, isSelected && styles.tabItemActive]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.75}
              >
                <Text style={[styles.tabText, isSelected && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Tab Panels */}
        <View style={styles.tabContentContainer}>
          {activeTab === 'OVERVIEW' && (
            <DetailOverviewTab
              keyInfo={keyInfo}
              sections={sections}
              disclaimerText={pkg.disclaimerText}
              documentCount={documents.length}
              resourceCount={resources.length}
              mediaCount={totalMediaCount}
              onNavigateTab={setActiveTab}
            />
          )}
          {activeTab === 'DETAILS' && (
            <DetailTermsTab
              pkg={pkg}
              keyInfo={keyInfo}
              performance={performance}
            />
          )}
          {activeTab === 'DOCUMENTS' && (
            <DetailDocumentsTab documents={documents} resources={resources} />
          )}
          {activeTab === 'GALLERY' && (
            <DetailGalleryTab
              galleries={galleries}
              contentMedia={contentMedia}
            />
          )}
          {activeTab === 'UPDATES' && <DetailUpdatesTab packageId={pkg.id} />}
          {activeTab === 'FAQS' && <DetailFaqTab faqs={faqs} />}
        </View>
      </ScrollView>

      {/* Floating Commit Bar */}
      <View
        style={[
          styles.bottomBar,
          {
            paddingBottom: Math.max(insets.bottom, 14),
          },
        ]}
      >
        <View style={styles.bottomBarMeta}>
          <Text style={styles.bottomBarLabel}>Minimum Allocation</Text>
          <Text style={styles.bottomBarValue}>
            {formatCurrency(pkg.minInvestment)}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.commitBtn, !isKycApproved && styles.commitBtnGated]}
          onPress={() => handleCommitPress()}
          activeOpacity={0.85}
        >
          <Text style={styles.commitBtnText} numberOfLines={2}>
            {isKycApproved ? 'Commit Investment' : 'Verify Identity to Commit'}
          </Text>
          <Ionicons
            name={isKycApproved ? 'arrow-forward' : 'shield-checkmark-outline'}
            size={15}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>

      {/* Branded Allocation Draft Found Modal */}
      <Modal
        visible={draftPrompt.visible && Boolean(pendingInstance)}
        transparent
        animationType="fade"
        onRequestClose={closeDraftPrompt}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.draftModalCard}>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={closeDraftPrompt}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.draftIconCircle}>
              <Ionicons name="folder-open" size={28} color={colors.primary} />
            </View>

            <Text style={styles.draftModalTitle}>Existing Allocation Found</Text>
            <Text style={styles.draftModalSub}>
              You already have an active commitment in progress for{' '}
              <Text style={{ fontWeight: '800', color: colors.text }}>
                {pkg.name}
              </Text>
              .
            </Text>

            {pendingInstance && (
              <View style={styles.draftSummaryBox}>
                <View style={styles.draftSummaryRow}>
                  <Text style={styles.draftSummaryLabel}>Reference</Text>
                  <Text style={styles.draftSummaryRef}>
                    {pendingInstance.internalRef}
                  </Text>
                </View>
                <View style={styles.draftSummaryDivider} />
                <View style={styles.draftSummaryRow}>
                  <Text style={styles.draftSummaryLabel}>Committed Amount</Text>
                  <Text style={styles.draftSummaryValue}>
                    ${pendingPrincipal.toLocaleString()}{' '}
                    {pendingInstance.currency || 'USD'}
                  </Text>
                </View>
                <View style={styles.draftSummaryDivider} />
                <View style={styles.draftSummaryRow}>
                  <Text style={styles.draftSummaryLabel}>Current Stage</Text>
                  <View style={styles.draftStagePill}>
                    <Text style={styles.draftStageText}>
                      {pendingStatusLabel}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            <View style={styles.draftActionsCol}>
              <TouchableOpacity
                style={styles.draftPrimaryBtn}
                activeOpacity={0.85}
                onPress={() => {
                  if (!pendingInstance) return;
                  const targetId = pendingInstance.id;
                  closeDraftPrompt();
                  navigation.navigate('InvestmentDetail', { id: targetId });
                }}
              >
                <Ionicons name="eye-outline" size={16} color="#FFFFFF" />
                <Text style={styles.draftPrimaryBtnText}>
                  View Existing Position
                </Text>
              </TouchableOpacity>

              {pendingInstance?.status === 'draft' && (
                <TouchableOpacity
                  style={styles.draftSecondaryBtn}
                  activeOpacity={0.85}
                  onPress={() => {
                    if (!pendingInstance) return;
                    const instance = pendingInstance;
                    closeDraftPrompt();
                    navigateToCommitmentModal({
                      amount: pendingPrincipal,
                      existingInvestmentId: instance.id,
                      isEditMode: true,
                      defaultTenureYears: instance.chosenTenureYears,
                    });
                  }}
                >
                  <Ionicons
                    name="create-outline"
                    size={16}
                    color={colors.primary}
                  />
                  <Text style={styles.draftSecondaryBtnText}>
                    Modify Existing Draft
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.draftTertiaryBtn}
                activeOpacity={0.85}
                onPress={() => {
                  const newAmt = draftPrompt.newAmount;
                  closeDraftPrompt();
                  navigateToCommitmentModal({ amount: newAmt });
                }}
              >
                <Ionicons
                  name="add-circle-outline"
                  size={16}
                  color={colors.text}
                />
                <Text style={styles.draftTertiaryBtnText}>
                  Start New Allocation
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7F4',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: '#F8F7F4',
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '500',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginTop: spacing.sm,
  },
  errorSub: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 260,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingHorizontal: 16,
    paddingVertical: 9,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  heroCoverWrapper: {
    position: 'relative',
    width: '100%',
    height: 220,
    backgroundColor: '#FAF5EE',
  },
  heroCover: {
    width: '100%',
    height: '100%',
  },
  placeholderCover: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4ECE1',
  },
  placeholderIconRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
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
    top: 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderWidth: 1,
    borderColor: 'rgba(231, 215, 193, 0.7)',
  },
  typeBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  typeBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(232, 245, 233, 0.95)',
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  statusBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#2E7D32',
    letterSpacing: 0.5,
  },
  headerCard: {
    padding: spacing.lg,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EFECE6',
  },
  pkgTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.4,
    lineHeight: 28,
  },
  pkgSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 19,
    marginTop: 4,
  },
  termsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAF9F6',
    borderWidth: 1,
    borderColor: '#EFECE6',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  termBox: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    alignItems: 'center',
  },
  termDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E5E1D8',
  },
  termLabel: {
    fontSize: 8.5,
    color: colors.textMuted,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  termValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginTop: 3,
  },
  termValueGold: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 2,
  },
  payoutStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#EFECE6',
  },
  payoutStripLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  payoutStripValue: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.text,
  },
  allocationBox: {
    marginTop: spacing.md,
  },
  sectionKicker: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  allocationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  allocPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#E7D7C1',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  allocName: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
  },
  allocWeight: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
  },
  tabBarScroll: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EFECE6',
    flexGrow: 0,
  },
  tabBarContent: {
    paddingHorizontal: spacing.md,
    gap: 6,
  },
  tabItem: {
    paddingHorizontal: 12,
    paddingVertical: 13,
    alignItems: 'center',
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  tabContentContainer: {
    padding: spacing.lg,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EFECE6',
    paddingHorizontal: spacing.lg,
    paddingTop: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#1A1815',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  bottomBarMeta: {
    flex: 1,
    minWidth: 110,
    marginRight: spacing.sm,
  },
  bottomBarLabel: {
    fontSize: 9,
    color: colors.textMuted,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  bottomBarValue: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 1,
  },
  commitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 1,
    minWidth: 120,
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
    borderRadius: 10,
  },
  commitBtnGated: {
    backgroundColor: colors.slate,
  },
  commitBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
    flexShrink: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.68)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22,
  },
  draftModalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E7D7C1',
    padding: 22,
    alignItems: 'center',
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8F7F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  draftIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#E7D7C1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  draftModalTitle: {
    fontSize: 18.5,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  draftModalSub: {
    fontSize: 12.5,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  draftSummaryBox: {
    width: '100%',
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#E7D7C1',
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
  },
  draftSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  draftSummaryDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E7D7C1',
    marginVertical: 4,
  },
  draftSummaryLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.textMuted,
  },
  draftSummaryRef: {
    fontSize: 11.5,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.4,
  },
  draftSummaryValue: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },
  draftStagePill: {
    backgroundColor: '#FFF8E1',
    borderWidth: 1,
    borderColor: '#FFE082',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  draftStageText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#D87A16',
  },
  draftActionsCol: {
    width: '100%',
    gap: 10,
  },
  draftPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 13,
    borderRadius: 12,
  },
  draftPrimaryBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  draftSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#E7D7C1',
    paddingVertical: 12,
    borderRadius: 12,
  },
  draftSecondaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  draftTertiaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F8F7F4',
    borderWidth: 1,
    borderColor: '#EFECE6',
    paddingVertical: 12,
    borderRadius: 12,
  },
  draftTertiaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
});

