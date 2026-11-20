import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/types';
import { baseApi } from '../../../api/baseApi';
import {
  usePostInvestmentsMutation,
  usePatchInvestmentsByIdMutation,
  useGetInvestmentsPoolingDisclaimerQuery,
  useGetPackagesByIdQuery,
  PostInvestmentsApiArg,
} from '../../../api/generated/investorApi';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import {
  StatusFeedbackModal,
  FeedbackVariant,
} from '../../../components/common/StatusFeedbackModal';

import { CommitmentInputs, PayoutFreq } from './CommitmentInputs';
import { CommitmentDeclarations } from './CommitmentDeclarations';
import { PoolingModals } from './PoolingModals';
import { CommitmentSuccessModal } from './CommitmentSuccessModal';

type Props = NativeStackScreenProps<RootStackParamList, 'CommitmentModal'>;

interface FeedbackState {
  visible: boolean;
  variant: FeedbackVariant;
  title: string;
  message: string;
  details?: string[];
  primaryLabel?: string;
  onPrimary?: () => void;
}

const MAX_COMMITMENT_AMOUNT = 999999999999;

const formatWhole = (val: number): string => {
  if (!Number.isFinite(val) || val <= 0) return '0';
  return Math.trunc(val).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

export const CommitmentModal: React.FC<Props> = ({ route, navigation }) => {
  const {
    packageId,
    packageName,
    minInvestment,
    initialAmount,
    existingInvestmentId,
    isEditMode,
    payoutOptions = ['quarterly'],
    isDynamic,
    defaultTenureYears,
    disclaimerText: routeDisclaimerText,
  } = route.params;

  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const scrollRef = useRef<any>(null);

  const [postInvestment, { isLoading: isPosting }] = usePostInvestmentsMutation();
  const [patchInvestment, { isLoading: isPatching }] = usePatchInvestmentsByIdMutation();

  const { data: pkgDetailData, isLoading: isLoadingDisclaimer } = useGetPackagesByIdQuery(
    { id: packageId },
    { skip: Boolean(routeDisclaimerText) }
  );

  const resolvedDisclaimerText =
    routeDisclaimerText ?? pkgDetailData?.package?.disclaimerText ?? null;

  const isSubmitting = isPosting || isPatching;
  const minPackageAmount = Number(minInvestment) || 50000;

  const [step, setStep] = useState<1 | 2>(1);

  const [amount, setAmount] = useState<number>(() => {
    if (typeof initialAmount === 'number' && initialAmount > 0) {
      return initialAmount;
    }
    return minPackageAmount;
  });

  const [selectedCadence, setSelectedCadence] = useState<PayoutFreq>(
    (payoutOptions[0] as PayoutFreq) || 'quarterly'
  );
  const [tenureYears, setTenureYears] = useState<number>(defaultTenureYears || 1);

  const [proDeclarationAccepted, setProDeclarationAccepted] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [poolingAccepted, setPoolingAccepted] = useState(false);

  const [showPoolWarningModal, setShowPoolWarningModal] = useState(false);
  const [showDisclaimerSheet, setShowDisclaimerSheet] = useState(false);
  const [successData, setSuccessData] = useState<{ id: string; internalRef: string } | null>(null);

  const [feedback, setFeedback] = useState<FeedbackState>({
    visible: false,
    variant: 'warning',
    title: '',
    message: '',
  });

  const showFeedback = useCallback((next: Omit<FeedbackState, 'visible'>) => {
    setFeedback({ ...next, visible: true });
  }, []);

  const closeFeedback = useCallback(() => {
    setFeedback((prev) => ({ ...prev, visible: false }));
  }, []);

  const isPooled = amount < minPackageAmount && amount > 0;

  const {
    data: poolingData,
    isLoading: isPoolingLoading,
    refetch: refetchPoolingDisclaimer,
  } = useGetInvestmentsPoolingDisclaimerQuery(undefined, {
    skip: !isPooled,
    refetchOnMountOrArgChange: true,
  });

  const handleAmountChange = (text: string) => {
    const raw = text.replace(/[^0-9]/g, '').slice(0, 12);
    if (!raw) {
      setAmount(0);
      return;
    }
    const parsed = Number(raw);
    setAmount(Number.isFinite(parsed) ? Math.min(parsed, MAX_COMMITMENT_AMOUNT) : 0);
  };

  const cleanPoolingText = (poolingData?.html || '')
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .trim();

  const isFormValid =
    amount > 0 &&
    proDeclarationAccepted &&
    disclaimerAccepted &&
    (!isPooled || poolingAccepted) &&
    !isSubmitting;

  const goToStep = (nextStep: 1 | 2) => {
    setStep(nextStep);
    (scrollRef.current as any)?.scrollTo({ y: 0, animated: true });
  };

  const handleContinueFromTerms = () => {
    if (amount <= 0) {
      showFeedback({
        variant: 'warning',
        title: 'Invalid Allocation Amount',
        message: 'Please enter a valid capital commitment amount to continue.',
        primaryLabel: 'Got It',
      });
      return;
    }

    if (isPooled) {
      if (poolingData && !poolingData.available) {
        showFeedback({
          variant: 'warning',
          title: 'Minimum Commitment Required',
          message: `The minimum direct ticket size for ${packageName} is $${formatWhole(minPackageAmount)}. Syndicate pooling is currently not offered for this package.`,
          primaryLabel: 'Set to Minimum',
          onPrimary: () => {
            closeFeedback();
            setAmount(minPackageAmount);
          },
        });
        return;
      }

      const minMember = Number(poolingData?.minMemberAmount || 0);
      if (minMember > 0 && amount < minMember) {
        showFeedback({
          variant: 'warning',
          title: 'Minimum Pool Allocation',
          message: `To participate through a syndicate pool, the minimum member allocation is $${formatWhole(minMember)} USD.`,
          primaryLabel: `Set to $${formatWhole(minMember)}`,
          onPrimary: () => {
            closeFeedback();
            setAmount(minMember);
          },
        });
        return;
      }
    }

    goToStep(2);
  };

  const executeCommitment = async (poolingVersionOverride?: number) => {
    try {
      let resolvedPoolingVersion = poolingVersionOverride ?? poolingData?.version;

      if (isPooled && (resolvedPoolingVersion === undefined || resolvedPoolingVersion === null)) {
        const fresh = await refetchPoolingDisclaimer();
        if (fresh.data && !fresh.data.available) {
          setPoolingAccepted(false);
          showFeedback({
            variant: 'warning',
            title: 'Syndicate Pooling Unavailable',
            message:
              'Investing through a syndicate pool is currently unavailable for this offering. Please allocate at least the standard package minimum.',
            details: [`Standard Ticket Minimum: $${formatWhole(minPackageAmount)} USD`],
            primaryLabel: 'Set to Minimum',
            onPrimary: () => {
              closeFeedback();
              setAmount(minPackageAmount);
              goToStep(1);
            },
          });
          return;
        }
        resolvedPoolingVersion = fresh.data?.version;
      }

      const body: PostInvestmentsApiArg['body'] = {
        packageId,
        principal: String(amount),
        payoutFrequency: selectedCadence,
        professionalDeclarationAccepted: true,
        disclaimerAccepted: true,
      };

      if (isDynamic && tenureYears) {
        body.chosenTenureYears = Number(tenureYears);
      }

      if (isPooled) {
        body.poolingAccepted = true;
        if (resolvedPoolingVersion !== undefined && resolvedPoolingVersion !== null) {
          body.poolingDisclaimerVersion = Number(resolvedPoolingVersion);
        }
      }

      let created: { id: string; internalRef: string };

      if (isEditMode && existingInvestmentId) {
        const res = await patchInvestment({
          id: existingInvestmentId,
          body: {
            principal: String(amount),
            payoutFrequency: selectedCadence,
            ...(isDynamic && tenureYears ? { chosenTenureYears: Number(tenureYears) } : {}),
            ...(isPooled
              ? {
                  poolingAccepted: true,
                  ...(resolvedPoolingVersion !== undefined && resolvedPoolingVersion !== null
                    ? { poolingDisclaimerVersion: Number(resolvedPoolingVersion) }
                    : {}),
                }
              : {}),
          } as any,
        }).unwrap();
        created = res.investment;
      } else {
        const res = await postInvestment({ body }).unwrap();
        created = res.investment;
      }

      dispatch(baseApi.util.invalidateTags(['Investments', 'DashboardStats']));

      setSuccessData({
        id: created.id,
        internalRef: created.internalRef,
      });
    } catch (err: any) {
      if (err?.status === 409 && isPooled) {
        const fresh = await refetchPoolingDisclaimer();
        if (fresh.data && !fresh.data.available) {
          setPoolingAccepted(false);
          showFeedback({
            variant: 'warning',
            title: 'Syndicate Pooling Unavailable',
            message:
              'Investing through a pool is currently unavailable for this offering. Please allocate at least the standard package minimum.',
            details: [`Standard Ticket Minimum: $${formatWhole(minPackageAmount)} USD`],
            primaryLabel: 'Set to Minimum',
            onPrimary: () => {
              closeFeedback();
              setAmount(minPackageAmount);
              goToStep(1);
            },
          });
          return;
        }
        if (fresh.data && fresh.data.version !== poolingData?.version) {
          setPoolingAccepted(false);
          showFeedback({
            variant: 'warning',
            title: 'Pooling Terms Updated',
            message:
              'The syndicate pooling agreement has been updated. Please review and accept the latest version to proceed.',
            primaryLabel: 'Review Terms',
            onPrimary: () => {
              closeFeedback();
              setShowDisclaimerSheet(true);
            },
          });
          return;
        }
      }

      const rawDetails =
        err?.data?.error?.details ||
        err?.data?.details ||
        err?.data?.issues ||
        err?.data?.errors;

      let detailLines: string[] | undefined;
      if (Array.isArray(rawDetails)) {
        detailLines = rawDetails.map((d: any) => {
          const path = Array.isArray(d.path) ? d.path.join('.') : d.field || d.path || '';
          const message = d.message || String(d);
          return path ? `${path}: ${message}` : message;
        });
      } else if (rawDetails && typeof rawDetails === 'object') {
        detailLines = Object.entries(rawDetails).map(
          ([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : String(v)}`
        );
      }

      const msg =
        err?.data?.error?.message ||
        err?.data?.message ||
        'Unable to register investment allocation. Please try again.';

      showFeedback({
        variant: 'error',
        title: 'Allocation Notice',
        message: msg,
        details: detailLines,
        primaryLabel: 'Close',
      });
    }
  };

  const handleInitiateCommitment = () => {
    if (!proDeclarationAccepted || !disclaimerAccepted) {
      showFeedback({
        variant: 'warning',
        title: 'Declarations Required',
        message:
          'Please scroll through the disclaimer and accept all required investor eligibility declarations before proceeding.',
        primaryLabel: 'Got It',
      });
      return;
    }

    if (isPooled && !poolingAccepted) {
      setShowPoolWarningModal(true);
      return;
    }

    executeCommitment();
  };

  return (
    <View style={styles.container}>
      {/* 1. Top Header Bar */}
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 16) + 4 }]}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => {
            if (step === 2) {
              goToStep(1);
            } else {
              navigation.goBack();
            }
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name={step === 2 ? 'arrow-back' : 'close'} size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle} numberOfLines={1}>
          {isEditMode ? 'Modify Allocation Draft' : 'Capital Allocation'}
        </Text>
        <View style={styles.placeholderBtn} />
      </View>

      {/* 2. Stepper Indicator Bar (1. Terms -> 2. Disclaimer & declarations) */}
      <View style={styles.stepperBar}>
        <TouchableOpacity
          style={styles.stepPill}
          onPress={() => goToStep(1)}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.stepCircle,
              step === 1 ? styles.stepCircleActive : styles.stepCircleDone,
            ]}
          >
            {step > 1 ? (
              <Ionicons name="checkmark" size={12} color="#FFFFFF" />
            ) : (
              <Text style={styles.stepNumberActive}>1</Text>
            )}
          </View>
          <Text
            style={[styles.stepLabel, step === 1 && styles.stepLabelActive]}
            numberOfLines={2}
          >
            Terms
          </Text>
        </TouchableOpacity>

        <View style={styles.stepConnector} />

        <View style={styles.stepPill}>
          <View
            style={[
              styles.stepCircle,
              step === 2 ? styles.stepCircleActive : styles.stepCircleIdle,
            ]}
          >
            <Text style={step === 2 ? styles.stepNumberActive : styles.stepNumberIdle}>
              2
            </Text>
          </View>
          <Text
            style={[styles.stepLabel, step === 2 && styles.stepLabelActive]}
            numberOfLines={2}
          >
            Disclaimer &amp; declarations
          </Text>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 110 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Selected Package Summary Banner */}
        <View style={styles.targetPackageCard}>
          <View style={styles.targetCardHeader}>
            <Text style={styles.targetLabel} numberOfLines={1}>
              {isEditMode ? 'EXISTING DRAFT REVISION' : 'SELECTED OPPORTUNITY'}
            </Text>
            {isPooled && (
              <View style={styles.poolingIndicatorPill}>
                <Ionicons name="people" size={11} color="#936D3E" style={{ flexShrink: 0 }} />
                <Text style={styles.poolingIndicatorText} numberOfLines={1}>
                  Syndicate Pool
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.targetTitle} numberOfLines={2}>
            {packageName}
          </Text>
          <Text style={styles.targetMin}>
            {step === 1
              ? `Standard Ticket: $${formatWhole(minPackageAmount)} USD`
              : `Committing $${formatWhole(amount)} USD · ${
                  selectedCadence === 'quarterly'
                    ? 'Quarterly'
                    : selectedCadence === 'half_yearly'
                    ? 'Half-yearly'
                    : 'Yearly'
                }`}
          </Text>
        </View>

        {step === 1 ? (
          <CommitmentInputs
            amount={amount}
            minPackageAmount={minPackageAmount}
            isPooled={isPooled}
            onAmountChange={handleAmountChange}
            onQuickAdd={(inc) => setAmount((prev) => Math.min(prev + inc, MAX_COMMITMENT_AMOUNT))}
            onResetMin={() => setAmount(minPackageAmount)}
            payoutOptions={payoutOptions}
            selectedCadence={selectedCadence}
            onCadenceSelect={setSelectedCadence}
            isDynamic={isDynamic}
            tenureYears={tenureYears}
            onTenureSelect={setTenureYears}
          />
        ) : isLoadingDisclaimer && !resolvedDisclaimerText ? (
          <View style={styles.loadingDisclaimerBox}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingDisclaimerText}>Loading package disclaimer...</Text>
          </View>
        ) : (
          <CommitmentDeclarations
            packageName={packageName}
            disclaimerText={resolvedDisclaimerText}
            isPooled={isPooled}
            poolingVersion={poolingData?.version}
            proDeclarationAccepted={proDeclarationAccepted}
            onToggleProDeclaration={() => setProDeclarationAccepted(!proDeclarationAccepted)}
            disclaimerAccepted={disclaimerAccepted}
            onToggleDisclaimer={() => setDisclaimerAccepted(!disclaimerAccepted)}
            poolingAccepted={poolingAccepted}
            onOpenPoolingDisclaimer={() => setShowDisclaimerSheet(true)}
            onTogglePoolingConsent={() => setPoolingAccepted(!poolingAccepted)}
          />
        )}
      </ScrollView>

      {/* Floating Bottom Action Bar */}
      <View
        style={[
          styles.bottomBar,
          {
            paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 36 : 14) + 6,
          },
        ]}
      >
        <View style={styles.bottomMeta}>
          <Text style={styles.bottomMetaLabel} numberOfLines={1}>
            Total Commitment
          </Text>
          <Text
            style={styles.bottomMetaValue}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
          >
            ${formatWhole(amount)} USD
          </Text>
        </View>

        {step === 1 ? (
          <TouchableOpacity
            style={[styles.submitBtn, amount <= 0 && styles.submitBtnDisabled]}
            onPress={handleContinueFromTerms}
            disabled={amount <= 0}
            activeOpacity={0.85}
          >
            <Text style={styles.submitBtnText} numberOfLines={1}>
              Continue
            </Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={{ flexShrink: 0 }} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.submitBtn, !isFormValid && styles.submitBtnDisabled]}
            onPress={handleInitiateCommitment}
            disabled={!isFormValid}
            activeOpacity={0.85}
          >
            {isSubmitting || isPoolingLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.submitBtnText} numberOfLines={2}>
                  {isPooled && !poolingAccepted
                    ? 'Review Pool Terms'
                    : isEditMode
                    ? 'Update & continue'
                    : 'Accept & continue'}
                </Text>
                <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={{ flexShrink: 0 }} />
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Pooling Notice & Terms Modals */}
      <PoolingModals
        packageName={packageName}
        amount={amount}
        minPackageAmount={minPackageAmount}
        showWarningModal={showPoolWarningModal}
        onCloseWarning={() => setShowPoolWarningModal(false)}
        onProceedToTerms={() => {
          setShowPoolWarningModal(false);
          setShowDisclaimerSheet(true);
        }}
        showTermsModal={showDisclaimerSheet}
        onCloseTerms={() => setShowDisclaimerSheet(false)}
        onAcceptTerms={() => {
          setPoolingAccepted(true);
          setShowDisclaimerSheet(false);
        }}
        version={poolingData?.version}
        disclaimerText={cleanPoolingText}
        topInset={insets.top}
        bottomInset={insets.bottom}
      />

      {/* Branded Status Feedback Modal */}
      <StatusFeedbackModal
        visible={feedback.visible}
        variant={feedback.variant}
        title={feedback.title}
        message={feedback.message}
        details={feedback.details}
        primaryLabel={feedback.primaryLabel}
        onPrimary={() => {
          if (feedback.onPrimary) {
            feedback.onPrimary();
          } else {
            closeFeedback();
          }
        }}
      />

      {/* Success Confirmation Modal */}
      {successData && (
        <CommitmentSuccessModal
          visible={Boolean(successData)}
          internalRef={successData.internalRef}
          amount={amount}
          packageName={packageName}
          isPooled={isPooled}
          onProceed={() => {
            const investmentId = successData.id;
            setSuccessData(null);
            navigation.replace('InvestmentDetail', { id: investmentId });
          }}
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EFECE6',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  topBarTitle: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  placeholderBtn: {
    width: 36,
    flexShrink: 0,
  },
  stepperBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: spacing.lg,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EFECE6',
    gap: 8,
  },
  stepPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
    flexShrink: 1,
  },
  stepCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepCircleActive: {
    backgroundColor: colors.primary,
  },
  stepCircleDone: {
    backgroundColor: '#C39967',
  },
  stepCircleIdle: {
    backgroundColor: '#EFECE6',
  },
  stepNumberActive: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  stepNumberIdle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  stepLabel: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: colors.textMuted,
  },
  stepLabelActive: {
    fontWeight: '800',
    color: colors.text,
  },
  stepConnector: {
    width: 16,
    height: 1.5,
    backgroundColor: '#E5E1D8',
    flexShrink: 0,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  targetPackageCard: {
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#E7D7C1',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  targetCardHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 6,
  },
  targetLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.8,
  },
  poolingIndicatorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(195, 153, 103, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    flexShrink: 0,
  },
  poolingIndicatorText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#936D3E',
  },
  targetTitle: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '800',
    color: colors.text,
    marginTop: 4,
  },
  targetMin: {
    fontSize: 11.5,
    lineHeight: 16,
    color: colors.textMuted,
    marginTop: 4,
  },
  loadingDisclaimerBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFECE6',
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  loadingDisclaimerText: {
    fontSize: 12.5,
    color: colors.textMuted,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EFECE6',
    paddingHorizontal: spacing.lg,
    paddingTop: 12,
    gap: 10,
  },
  bottomMeta: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
  },
  bottomMetaLabel: {
    fontSize: 9,
    lineHeight: 13,
    color: colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  bottomMetaValue: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 1,
    fontVariant: ['tabular-nums'],
  },
  submitBtn: {
    flexShrink: 1,
    minWidth: 120,
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: 13,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
  },
  submitBtnDisabled: {
    backgroundColor: '#D1C7BD',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '800',
    flexShrink: 1,
  },
});




