import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/types';
import { baseApi } from '../../../api/baseApi';
import {
  useGetInvestmentsByIdQuery,
  usePostInvestmentsByIdPaymentSentMutation,
} from '../../../api/generated/investorApi';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { getStatusMeta } from './investmentTypes';
import { AppHeader } from '../../../components/common/AppHeader';
import { PoolMarker } from '../../../components/invest/PoolMarker';
import {
  StatusFeedbackModal,
  FeedbackVariant,
} from '../../../components/common/StatusFeedbackModal';

type Props = NativeStackScreenProps<RootStackParamList, 'InvestmentDetail'>;

interface WireModalState {
  visible: boolean;
  variant: FeedbackVariant;
  title: string;
  message: string;
  details?: string[];
  primaryLabel: string;
  secondaryLabel?: string;
  onPrimary: () => void;
}

const formatWholeNumber = (raw: string | number | null | undefined): string | null => {
  if (raw === null || raw === undefined) return null;
  const cleaned = String(raw).replace(/,/g, '').trim();
  if (!cleaned) return null;
  const num = Number(cleaned);
  if (!Number.isFinite(num)) return null;
  const whole = Math.trunc(num);
  return whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

export const InvestmentDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { id } = route.params;
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();

  const { data, isLoading, isFetching, error, refetch } = useGetInvestmentsByIdQuery(
    { id },
    { refetchOnMountOrArgChange: true }
  );

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const [markPaymentSent, { isLoading: isMarkingPayment }] =
    usePostInvestmentsByIdPaymentSentMutation();

  const [wireModal, setWireModal] = useState<WireModalState>({
    visible: false,
    variant: 'confirm',
    title: '',
    message: '',
    primaryLabel: 'OK',
    onPrimary: () => {},
  });

  const closeWireModal = useCallback(() => {
    setWireModal((prev) => ({ ...prev, visible: false }));
  }, []);

  const inv = data?.investment;
  const baseStatusMeta = inv ? getStatusMeta(inv.status, inv) : null;
  const isTransferNoticeSent = Boolean(
    inv && inv.status === 'pending_funding' && inv.paymentSentAt
  );

  const statusMeta =
    baseStatusMeta && isTransferNoticeSent
      ? {
          ...baseStatusMeta,
          label: 'TRANSFER IN REVIEW',
          description:
            'Your wire confirmation has been received. Our treasury team is verifying the incoming transfer.',
          color: '#C39967',
          bgColor: '#FAF5EE',
          borderColor: '#DFC7A7',
          step: 3,
        }
      : baseStatusMeta;

  const isPooled = Boolean(inv?.poolInvestment);
  const poolState = inv?.poolInvestment?.state;

  const formatCurrency = (amount: string | null | undefined, currency = 'USD') => {
    if (!amount) return '$0';
    const grouped = formatWholeNumber(amount);
    return grouped ? `$${grouped} ${currency}` : `${amount} ${currency}`;
  };

  const formatDate = (isoString: string | null | undefined) => {
    if (!isoString) return 'Pending Allocation';
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
        return 'Quarterly Payouts';
      case 'half_yearly':
        return 'Semi-Annual Payouts';
      case 'yearly':
        return 'Annual Payout';
      default:
        return cadence;
    }
  };

  const handleConfirmWireSent = () => {
    if (!inv) return;

    setWireModal({
      visible: true,
      variant: 'confirm',
      title: 'Confirm Bank Transfer',
      message:
        'Please confirm that you have sent the bank transfer for this investment. Our finance team will verify the incoming payment.',
      details: [
        `Reference: ${inv.internalRef || id}`,
        `Principal Amount: ${formatCurrency(inv.principal, inv.currency)}`,
      ],
      primaryLabel: 'Yes, Payment Sent',
      secondaryLabel: 'Cancel',
      onPrimary: async () => {
        try {
          await markPaymentSent({ id }).unwrap();
          dispatch(baseApi.util.invalidateTags(['Investments', 'DashboardStats']));
          await refetch();
          setWireModal({
            visible: true,
            variant: 'success',
            title: 'Payment Notice Sent',
            message:
              'Your payment confirmation has been recorded and sent to our team for verification.',
            details: [
              `Reference: ${inv.internalRef || id}`,
              'Status updated to Transfer in Review',
            ],
            primaryLabel: 'Done',
            onPrimary: closeWireModal,
          });
        } catch (err: any) {
          setWireModal({
            visible: true,
            variant: 'error',
            title: 'Confirmation Failed',
            message:
              err?.data?.error?.message ||
              err?.data?.message ||
              'Unable to record payment confirmation right now. Please try again.',
            primaryLabel: 'Close',
            onPrimary: closeWireModal,
          });
        }
      },
    });
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading investment details...</Text>
      </View>
    );
  }

  if (error || !inv || !statusMeta) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={44} color={colors.error} />
        <Text style={styles.errorTitle}>Investment Not Found</Text>
        <Text style={styles.errorSub}>Unable to load this investment record.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()} activeOpacity={0.8}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isDraft = inv.status === 'draft';
  const isPendingFunding = statusMeta.step === 2 && !isTransferNoticeSent;
  const isAwaitingApproval =
    statusMeta.step === 3 || statusMeta.step === 4 || isTransferNoticeSent;
  const isActive = inv.status === 'active';

  return (
    <View style={styles.container}>
      <AppHeader hideNotifications showBack title={inv.package?.name || 'Investment Details'} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 110 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={() => {
              refetch();
            }}
            tintColor={colors.primary}
          />
        }
      >
        <View
          style={[
            styles.statusBanner,
            { backgroundColor: statusMeta.bgColor, borderColor: statusMeta.borderColor },
          ]}
        >
          <View style={styles.statusBannerHeader}>
            <View style={styles.statusBadgeCluster}>
              <View style={[styles.statusDot, { backgroundColor: statusMeta.color }]} />
              <Text style={[styles.statusBadgeText, { color: statusMeta.color }]} numberOfLines={1}>
                {statusMeta.label}
              </Text>
            </View>

            {isPooled && (
              <View style={styles.poolMarkerWrap}>
                <PoolMarker poolInvestment={inv.poolInvestment} />
              </View>
            )}
          </View>
          <Text style={styles.statusDescription}>{statusMeta.description}</Text>
        </View>

        {isPooled && (
          <View style={styles.poolNoticeBanner}>
            <Ionicons
              name={poolState === 'in_pool' ? 'checkmark-circle' : 'time'}
              size={18}
              color={poolState === 'in_pool' ? '#C39967' : '#8C6A3E'}
              style={{ flexShrink: 0, marginTop: 1 }}
            />
            <View style={styles.flexCol}>
              <Text style={styles.poolNoticeTitle} numberOfLines={2}>
                {poolState === 'in_pool'
                  ? 'Pooled Investment Active'
                  : 'Pooled Investment Queue'}
              </Text>
              <Text style={styles.poolNoticeBody}>
                {poolState === 'in_pool'
                  ? 'Your allocation has been paired with co-investors and is actively generating returns.'
                  : 'Your allocation is grouped in a co-investment pool and will deploy once the pool target is reached.'}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.flexCol}>
              <Text style={styles.cardKicker} numberOfLines={1}>
                {isPooled ? 'POOLED ALLOCATION' : 'DIRECT ALLOCATION'}
              </Text>
              <Text style={styles.cardPkgTitle} numberOfLines={2}>
                {inv.package?.name}
              </Text>
            </View>
            {inv.internalRef ? (
              <View style={styles.refBadge}>
                <Text style={styles.internalRef} numberOfLines={1}>
                  {inv.internalRef}
                </Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.principalLabel} numberOfLines={1}>
            INVESTMENT PRINCIPAL
          </Text>
          <Text
            style={styles.principalValue}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
          >
            {formatCurrency(inv.principal, inv.currency)}
          </Text>

          <View style={styles.divider} />

          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricItemLabel} numberOfLines={1}>
                PAYOUT SCHEDULE
              </Text>
              <Text style={styles.metricItemValue} numberOfLines={2}>
                {formatCadence(inv.payoutFrequency)}
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricItemLabel} numberOfLines={1}>
                INVESTMENT TERM
              </Text>
              <Text style={styles.metricItemValue} numberOfLines={2}>
                {inv.chosenTenureYears ? `${inv.chosenTenureYears} Years` : 'Fixed Term'}
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricItemLabel} numberOfLines={1}>
                CREATED ON
              </Text>
              <Text style={styles.metricItemValue} numberOfLines={2}>
                {formatDate(inv.createdAt)}
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricItemLabel} numberOfLines={1}>
                STRUCTURE
              </Text>
              <Text style={styles.metricItemValue} numberOfLines={2}>
                {isPooled ? 'Pooled Investment' : 'Direct Investment'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionHeader} numberOfLines={2}>
            Investment Progress
          </Text>

          <View style={styles.stepperContainer}>
            {[
              {
                title: isPooled ? 'Pool Allocation Created' : 'Allocation Created',
                desc: 'Investment amount registered',
                displayNum: 1,
                completed: statusMeta.step >= 2,
                current: statusMeta.step === 1,
              },
              {
                title: 'Agreement Signed',
                desc: 'Master Participation Agreement executed',
                displayNum: 2,
                completed: statusMeta.step >= 2,
                current: false,
              },
              {
                title: 'Funds Transferred',
                desc: inv.paymentSentAt
                  ? 'Payment notice submitted - under review'
                  : 'Bank transfer matched and verified',
                displayNum: 3,
                completed: statusMeta.step >= 3,
                current: statusMeta.step === 2,
              },
              {
                title: 'Active & Earning',
                desc: 'Payouts scheduled',
                displayNum: 4,
                completed: statusMeta.step >= 5,
                current: statusMeta.step === 3 || statusMeta.step === 4,
              },
            ].map((step, idx) => (
              <View key={idx} style={styles.stepRow}>
                <View style={styles.stepIndicatorCol}>
                  <View
                    style={[
                      styles.stepDot,
                      step.completed && styles.stepDotCompleted,
                      step.current && styles.stepDotCurrent,
                    ]}
                  >
                    {step.completed ? (
                      <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                    ) : (
                      <Text
                        style={[
                          styles.stepNumberText,
                          step.current && styles.stepNumberTextCurrent,
                        ]}
                      >
                        {step.displayNum}
                      </Text>
                    )}
                  </View>
                  {idx < 3 && (
                    <View
                      style={[
                        styles.stepLine,
                        step.completed && styles.stepLineCompleted,
                      ]}
                    />
                  )}
                </View>
                <View style={styles.stepTextCol}>
                  <Text
                    style={[
                      styles.stepTitle,
                      (step.completed || step.current) && styles.stepTitleActive,
                    ]}
                  >
                    {step.title}
                  </Text>
                  <Text style={styles.stepDesc}>{step.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {inv.agreementPartySnapshot && (
          <View style={styles.card}>
            <Text style={styles.sectionHeader} numberOfLines={2}>
              Investor Details
            </Text>

            <View style={styles.paramRow}>
              <Text style={styles.paramLabel} numberOfLines={2}>
                Legal Name / Entity
              </Text>
              <Text style={styles.paramValue}>
                {inv.agreementPartySnapshot.fullName || 'Investor'}
              </Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.paramRow}>
              <Text style={styles.paramLabel} numberOfLines={2}>
                Jurisdiction / Tax ID
              </Text>
              <Text style={styles.paramValue}>
                {inv.agreementPartySnapshot.nationalityOrJurisdiction || 'Verified Record'}
              </Text>
            </View>

            {inv.agreementPartySnapshot.bankDetails && (
              <>
                <View style={styles.divider} />
                <View style={styles.paramRow}>
                  <Text style={styles.paramLabel} numberOfLines={2}>
                    Registered Bank
                  </Text>
                  <Text style={styles.paramValue}>
                    {inv.agreementPartySnapshot.bankDetails.legalName}
                  </Text>
                </View>
              </>
            )}
          </View>
        )}
      </ScrollView>

      <View
        style={[
          styles.bottomBar,
          { paddingBottom: Math.max(insets.bottom, 14) },
        ]}
      >
        {isDraft ? (
          <TouchableOpacity
            style={styles.actionButtonFull}
            activeOpacity={0.85}
            onPress={() => {
              navigation.navigate('EsignModal', {
                investmentId: inv.id,
                internalRef: inv.internalRef,
                packageName: inv.package?.name || 'Investment Offering',
              });
            }}
          >
            <Text style={styles.actionButtonText} numberOfLines={2}>
              Sign Agreement
            </Text>
            <Ionicons name="document-text-outline" size={16} color="#FFFFFF" style={{ flexShrink: 0 }} />
          </TouchableOpacity>
        ) : isPendingFunding ? (
          <View style={styles.fundingActionRow}>
            <TouchableOpacity
              style={styles.actionButtonSecondary}
              activeOpacity={0.85}
              onPress={() => {
                navigation.navigate('FundingInstructionsModal', {
                  investmentId: inv.id,
                  internalRef: inv.internalRef,
                  principal: inv.principal,
                  currency: inv.currency,
                });
              }}
            >
              <Ionicons name="document-text-outline" size={15} color={colors.primary} style={{ flexShrink: 0 }} />
              <Text style={styles.actionButtonSecondaryText} numberOfLines={2}>
                Transfer Details
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButtonPrimary}
              activeOpacity={0.85}
              disabled={isMarkingPayment}
              onPress={handleConfirmWireSent}
            >
              {isMarkingPayment ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={16} color="#FFFFFF" style={{ flexShrink: 0 }} />
                  <Text style={styles.actionButtonText} numberOfLines={2}>
                    I&apos;ve Sent Payment
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : isAwaitingApproval ? (
          <View style={styles.activeFooterBox}>
            <Ionicons
              name={isTransferNoticeSent ? 'checkmark-done-circle' : 'time-outline'}
              size={17}
              color="#C39967"
              style={{ flexShrink: 0 }}
            />
            <Text style={[styles.activeFooterText, { color: '#C39967' }]}>
              Payment notice submitted - awaiting verification
            </Text>
          </View>
        ) : (
          <View style={styles.activeFooterBox}>
            <Ionicons name="shield-checkmark" size={16} color="#C39967" style={{ flexShrink: 0 }} />
            <Text style={styles.activeFooterText}>
              {isActive
                ? 'Active investment monitored by BricketX'
                : 'Record archived'}
            </Text>
          </View>
        )}
      </View>

      <StatusFeedbackModal
        visible={wireModal.visible}
        variant={wireModal.variant}
        title={wireModal.title}
        message={wireModal.message}
        details={wireModal.details}
        primaryLabel={wireModal.primaryLabel}
        secondaryLabel={wireModal.secondaryLabel}
        loading={isMarkingPayment}
        onPrimary={wireModal.onPrimary}
        onSecondary={closeWireModal}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7F4',
  },
  flexCol: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
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
  },
  retryBtn: {
    marginTop: spacing.md,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.primary,
    borderRadius: spacing.radiusSm,
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
    padding: spacing.lg,
    gap: spacing.md,
  },
  statusBanner: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  statusBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  statusBadgeCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
    flexShrink: 1,
  },
  poolMarkerWrap: {
    flexShrink: 0,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    flexShrink: 0,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    flexShrink: 1,
  },
  statusDescription: {
    fontSize: 12,
    color: colors.text,
    lineHeight: 17,
    flexShrink: 1,
  },
  poolNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#DFC7A7',
    borderRadius: 12,
    padding: 12,
  },
  poolNoticeTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400E',
    marginBottom: 2,
  },
  poolNoticeBody: {
    fontSize: 11,
    color: '#8C6A3E',
    lineHeight: 16,
    flexShrink: 1,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFECE6',
    borderRadius: 14,
    padding: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 8,
  },
  cardKicker: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.8,
  },
  cardPkgTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
    lineHeight: 23,
    marginTop: 2,
  },
  refBadge: {
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#E7D7C1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flexShrink: 0,
    maxWidth: '42%',
  },
  internalRef: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: colors.primary,
  },
  principalLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
  },
  principalValue: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.5,
    marginTop: 4,
    marginBottom: 12,
    fontVariant: ['tabular-nums'],
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#EFECE6',
    marginVertical: 10,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricItem: {
    flexBasis: '46%',
    flexGrow: 1,
    minWidth: 0,
    flexShrink: 1,
  },
  metricItemLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  metricItemValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 18,
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 12,
  },
  stepperContainer: {
    paddingLeft: 4,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepIndicatorCol: {
    alignItems: 'center',
    flexShrink: 0,
  },
  stepDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EFECE6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotCompleted: {
    backgroundColor: '#C39967',
  },
  stepDotCurrent: {
    backgroundColor: colors.primary,
  },
  stepNumberText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
  },
  stepNumberTextCurrent: {
    color: '#FFFFFF',
  },
  stepLine: {
    width: 2,
    height: 28,
    backgroundColor: '#EFECE6',
    marginVertical: 2,
  },
  stepLineCompleted: {
    backgroundColor: '#C39967',
  },
  stepTextCol: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    paddingTop: 1,
    paddingBottom: 16,
  },
  stepTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.textMuted,
    lineHeight: 17,
  },
  stepTitleActive: {
    color: colors.text,
  },
  stepDesc: {
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 16,
    marginTop: 2,
  },
  paramRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 4,
  },
  paramLabel: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.textMuted,
    flexShrink: 0,
    maxWidth: '45%',
  },
  paramValue: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 17,
    textAlign: 'right',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingTop: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  actionButtonFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  actionButtonPrimary: {
    flex: 1.15,
    minWidth: 0,
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: 13,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    lineHeight: 17,
    fontWeight: '700',
    textAlign: 'center',
    flexShrink: 1,
  },
  fundingActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionButtonSecondary: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#E7D7C1',
  },
  actionButtonSecondaryText: {
    fontSize: 12.5,
    lineHeight: 17,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
    flexShrink: 1,
  },
  activeFooterBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  activeFooterText: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    color: colors.textMuted,
    textAlign: 'center',
  },
});
