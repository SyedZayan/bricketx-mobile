import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system/legacy';
import { openLocalPdfFile, openCachedDocument } from '../../../utils/documentCache';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';
import { CommonActions } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/types';
import { baseApi } from '../../../api/baseApi';
import {
  useGetInvestmentsByIdQuery,
  useGetInvestmentsByIdFundingInstructionsQuery,
  usePostInvestmentsByIdPaymentSentMutation,
  useLazyGetEsignEnvelopesByEnvelopeIdDownloadQuery,
} from '../../../api/generated/investorApi';
import {
  StatusFeedbackModal,
  FeedbackVariant,
} from '../../../components/common/StatusFeedbackModal';
import { colors } from '../../../theme/colors';
import { ErrorStateView } from '../../../components/common/ErrorStateView';
import { normalizeError } from '../../../utils/errorHandler';
import { tokenMemory } from '../../../api/tokenMemory';

type Props = NativeStackScreenProps<RootStackParamList, 'FundingInstructionsModal'>;

interface FeedbackState {
  visible: boolean;
  variant: FeedbackVariant;
  title: string;
  message: string;
  details?: string[];
  primaryLabel?: string;
  onPrimary?: () => void;
}

const formatWholeUsdAmount = (raw: unknown): string | null => {
  if (raw === null || raw === undefined) return null;
  const cleaned = String(raw).replace(/,/g, '').trim();
  if (!cleaned) return null;
  const num = Number(cleaned);
  if (!Number.isFinite(num) || num <= 0) return null;
  const whole = Math.trunc(num);
  return `$${whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
};

const formatSentTimestamp = (iso?: string | null): string => {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
};

export const FundingInstructionsModal: React.FC<Props> = ({ route, navigation }) => {
  const { investmentId, internalRef, envelopeId } = route.params;
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 28 : 16);

  const { data: investmentData, refetch: refetchInvestment } = useGetInvestmentsByIdQuery({
    id: investmentId,
  });

  const { data, isLoading, error, refetch } =
    useGetInvestmentsByIdFundingInstructionsQuery({ id: investmentId }, { refetchOnMountOrArgChange: true });

  const [markPaymentSent, { isLoading: isMarkingSent }] =
    usePostInvestmentsByIdPaymentSentMutation();

  const [triggerDownloadSigned, { isFetching: isDownloadingSigned }] =
    useLazyGetEsignEnvelopesByEnvelopeIdDownloadQuery();

  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showConfirmWireModal, setShowConfirmWireModal] = useState(false);

  const [feedback, setFeedback] = useState<FeedbackState>({
    visible: false,
    variant: 'warning',
    title: '',
    message: '',
  });

  const showFeedback = (next: Omit<FeedbackState, 'visible'>) => {
    setFeedback({ ...next, visible: true });
  };

  const closeFeedback = () => {
    setFeedback((prev) => ({ ...prev, visible: false }));
  };

  const bank = data?.bankDetails;
  const reference = data?.reference || internalRef;

  const invRecord = investmentData?.investment || (investmentData as any);
  const paymentSentAt: string | null = invRecord?.paymentSentAt ?? null;
  const isPaymentNoticeSent = Boolean(paymentSentAt);

  const rawPrincipal =
    (data as any)?.amount ??
    (data as any)?.principal ??
    invRecord?.principal ??
    invRecord?.amount;

  const numericPrincipal = Number(String(rawPrincipal ?? '').replace(/,/g, ''));
  const formattedAmount = formatWholeUsdAmount(rawPrincipal);
  const copyAmountPayload =
    Number.isFinite(numericPrincipal) && numericPrincipal > 0
      ? String(Math.trunc(numericPrincipal))
      : '';

  const packageTitle =
    invRecord?.package?.title ||
    invRecord?.package?.name ||
    invRecord?.packageName ||
    '';

  const handleCopy = async (key: string, val?: string | null) => {
    if (!val) return;
    await Clipboard.setStringAsync(val);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 2000);
  };

  const handleDownloadPaymentInstructionsPdf = async () => {
    try {
      setIsDownloadingPdf(true);
      const targetUrl = `${process.env.EXPO_PUBLIC_API_URL}/investments/${investmentId}/payment-instructions?ts=${Date.now()}`;
      const fileUri = `${FileSystem.documentDirectory}BricketX_Payment_Instructions_${internalRef}.pdf`;

      const headers: Record<string, string> = {
        Accept: 'application/pdf',
      };
      const token = tokenMemory.getAccessToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const basicAuth = process.env.EXPO_PUBLIC_BASIC_AUTH_TOKEN;
      if (basicAuth && !process.env.EXPO_PUBLIC_API_URL?.includes('@')) {
        headers['Proxy-Authorization'] = `Basic ${basicAuth}`;
      }

      await FileSystem.deleteAsync(fileUri, { idempotent: true }).catch(() => {});
      const res = await FileSystem.downloadAsync(targetUrl, fileUri, { headers });
      if (res.status === 200) {
        await openLocalPdfFile(res.uri, { title: `BricketX_Payment_Instructions_${internalRef}.pdf` });
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch {
      showFeedback({
        variant: 'error',
        title: 'Download Error',
        message: 'Could not download payment instructions PDF. Please try again.',
        primaryLabel: 'Close',
      });
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleDownloadSignedAgreement = async () => {
    if (!envelopeId) return;
    try {
      const res = await triggerDownloadSigned({ envelopeId }, false).unwrap();
      if (!res?.url) throw new Error('No download URL returned');

      await openCachedDocument(res.url, {
        fileName: `BricketX_Agreement_${internalRef}.pdf`,
        title: `BricketX_Agreement_${internalRef}.pdf`,
      });
    } catch {
      showFeedback({
        variant: 'error',
        title: 'Download Error',
        message: 'Could not download the signed agreement PDF. Please try again.',
        primaryLabel: 'Close',
      });
    }
  };

  const executePaymentSentConfirmation = async () => {
    setShowConfirmWireModal(false);
    try {
      await markPaymentSent({ id: investmentId }).unwrap();
      refetchInvestment?.();
      dispatch(baseApi.util.invalidateTags(['Investments', 'DashboardStats']));
      showFeedback({
        variant: 'success',
        title: 'Payment Notice Sent',
        message:
          'We have recorded your payment confirmation. Your investment status will update automatically once our treasury team verifies the incoming wire.',
        details: [
          ...(formattedAmount ? [`Amount: ${formattedAmount} USD`] : []),
          `Reference: ${reference}`,
        ],
        primaryLabel: 'Go to Dashboard',
        onPrimary: () => {
          closeFeedback();
          navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'MainRoot', params: { screen: 'Dashboard' } }] }));
        },
      });
    } catch (err: any) {
      showFeedback({
        variant: 'error',
        title: 'Confirmation Failed',
        message: err?.status === 409 ? (err?.data?.message || 'Please view your funding instructions first before confirming a payment.') : (err?.data?.message || 'Unable to log payment confirmation. Please try again.'),
        primaryLabel: 'Close',
      });
    }
  };

  const accountNumberOrIban = bank?.iban || bank?.accountNumber || '';
  const bankFullAddress = [bank?.bankAddress, bank?.city, bank?.country]
    .filter(Boolean)
    .join(', ');

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 16) + 4 }]}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.topBarCenter}>
          <Text style={styles.topBarTitle} numberOfLines={1}>
            Funding Instructions
          </Text>
          <Text style={styles.topBarSub} numberOfLines={1}>
            {internalRef}
          </Text>
        </View>
        <View style={styles.stepPillBadge}>
          <Text style={styles.stepPillBadgeText} numberOfLines={1}>
            STEP 3 OF 3
          </Text>
        </View>
      </View>

      <View style={styles.stepperBar}>
        <View style={styles.stepItem}>
          <View style={[styles.stepDot, styles.stepDotDone]}>
            <Ionicons name="checkmark" size={12} color="#FFFFFF" />
          </View>
          <Text style={styles.stepLabelDone} numberOfLines={2}>
            1. Committed
          </Text>
        </View>

        <View style={[styles.stepLine, styles.stepLineDone]} />

        <View style={styles.stepItem}>
          <View style={[styles.stepDot, styles.stepDotDone]}>
            <Ionicons name="checkmark" size={12} color="#FFFFFF" />
          </View>
          <Text style={styles.stepLabelDone} numberOfLines={2}>
            2. Signed
          </Text>
        </View>

        <View style={[styles.stepLine, styles.stepLineDone]} />

        <View style={styles.stepItem}>
          <View
            style={[
              styles.stepDot,
              isPaymentNoticeSent ? styles.stepDotDone : styles.stepDotActive,
            ]}
          >
            {isPaymentNoticeSent ? (
              <Ionicons name="checkmark" size={12} color="#FFFFFF" />
            ) : (
              <Text style={styles.stepDotNum}>3</Text>
            )}
          </View>
          <Text style={styles.stepLabelActive} numberOfLines={2}>
            {isPaymentNoticeSent ? '3. Wire Sent' : '3. Fund Wire'}
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading payment instructions...</Text>
        </View>
      ) : error || !bank ? (
        <ErrorStateView
          error={error}
          appError={normalizeError(error, {
            defaultMessage: 'We could not load wire and payment instructions right now.',
            defaultNextStep: 'Check your connection and tap Retry, or close and reopen from Portfolio.',
          })}
          onAction={() => refetch()}
          compact
        />
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset + 32 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <View style={styles.heroBadge}>
                <Ionicons
                  name="swap-horizontal"
                  size={12}
                  color={colors.primary}
                  style={{ flexShrink: 0 }}
                />
                <Text style={styles.heroBadgeText} numberOfLines={1}>
                  BANK WIRE TRANSFER
                </Text>
              </View>
              <Text style={styles.heroCurrencyPill} numberOfLines={1}>
                USD
              </Text>
            </View>

            {Boolean(packageTitle) && (
              <Text style={styles.heroPackageName} numberOfLines={2}>
                {packageTitle}
              </Text>
            )}

            {formattedAmount && (
              <View style={styles.amountBlock}>
                <Text style={styles.amountLabel} numberOfLines={1}>
                  INVESTMENT AMOUNT
                </Text>
                <View style={styles.amountRow}>
                  <Text
                    style={styles.amountValue}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.75}
                  >
                    {formattedAmount}
                  </Text>
                  <TouchableOpacity
                    style={styles.heroCopyBtn}
                    onPress={() => handleCopy('amount', copyAmountPayload)}
                    activeOpacity={0.75}
                  >
                    <Ionicons
                      name={copiedKey === 'amount' ? 'checkmark' : 'copy-outline'}
                      size={13}
                      color={colors.primary}
                      style={{ flexShrink: 0 }}
                    />
                    <Text style={styles.heroCopyText} numberOfLines={1}>
                      {copiedKey === 'amount' ? 'Copied' : 'Copy'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={styles.heroDivider} />

            <View style={styles.heroRefRow}>
              <View style={styles.heroRefTextWrap}>
                <Text style={styles.heroRefLabel} numberOfLines={1}>
                  PAYMENT REFERENCE (REQUIRED)
                </Text>
                <Text
                  style={styles.heroRefValue}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                >
                  {reference}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.goldCopyBtn}
                onPress={() => handleCopy('reference', reference)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={copiedKey === 'reference' ? 'checkmark' : 'copy-outline'}
                  size={15}
                  color="#FFFFFF"
                  style={{ flexShrink: 0 }}
                />
                <Text style={styles.goldCopyBtnText} numberOfLines={1}>
                  {copiedKey === 'reference' ? 'Copied' : 'Copy'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.bankTableCard}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.bankIconCircle}>
                <Ionicons name="business" size={16} color={colors.primary} />
              </View>
              <View style={styles.flexText}>
                <Text style={styles.cardHeaderTitle} numberOfLines={2}>
                  Beneficiary Bank Details
                </Text>
                <Text style={styles.cardHeaderSub}>
                  Send your transfer to the account below with your reference
                </Text>
              </View>
            </View>

            <View style={styles.coordItem}>
              <View style={styles.flexText}>
                <Text style={styles.coordLabel}>BENEFICIARY ACCOUNT NAME</Text>
                <Text style={styles.coordValue}>{bank.accountName}</Text>
              </View>
              <TouchableOpacity
                style={styles.miniCopyBtn}
                onPress={() => handleCopy('accountName', bank.accountName)}
              >
                <Ionicons
                  name={copiedKey === 'accountName' ? 'checkmark' : 'copy-outline'}
                  size={15}
                  color={copiedKey === 'accountName' ? colors.primary : colors.textMuted}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.coordItem}>
              <View style={styles.flexText}>
                <Text style={styles.coordLabel}>ACCOUNT NUMBER / IBAN</Text>
                <Text style={styles.coordValueMono} selectable>
                  {accountNumberOrIban}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.miniCopyBtn}
                onPress={() => handleCopy('iban', accountNumberOrIban)}
              >
                <Ionicons
                  name={copiedKey === 'iban' ? 'checkmark' : 'copy-outline'}
                  size={15}
                  color={copiedKey === 'iban' ? colors.primary : colors.textMuted}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.coordItem}>
              <View style={styles.flexText}>
                <Text style={styles.coordLabel}>SWIFT / BIC CODE</Text>
                <Text style={styles.coordValueMono} selectable>
                  {bank.swiftBic}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.miniCopyBtn}
                onPress={() => handleCopy('swift', bank.swiftBic)}
              >
                <Ionicons
                  name={copiedKey === 'swift' ? 'checkmark' : 'copy-outline'}
                  size={15}
                  color={copiedKey === 'swift' ? colors.primary : colors.textMuted}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.detailBlock}>
              <Text style={styles.detailLabel}>Receiving Bank</Text>
              <Text style={styles.detailValue}>{bank.bankName}</Text>
            </View>
            <View style={styles.divider} />

            {Boolean(bankFullAddress) && (
              <>
                <View style={styles.detailBlock}>
                  <Text style={styles.detailLabel}>Bank Address</Text>
                  <Text style={styles.detailValue}>{bankFullAddress}</Text>
                </View>
                <View style={styles.divider} />
              </>
            )}

            <View style={[styles.detailBlock, { paddingBottom: 2 }]}>
              <Text style={styles.detailLabel}>Currency</Text>
              <Text style={styles.detailValue}>USD (United States Dollar)</Text>
            </View>
          </View>

          <View style={styles.warningNoteBox}>
            <Ionicons
              name="information-circle"
              size={18}
              color={colors.primary}
              style={{ flexShrink: 0, marginTop: 1 }}
            />
            <Text style={styles.warningNoteText}>
              Your sending bank or intermediary bank may deduct transfer fees. Please ensure the net amount received matches your investment amount
              {formattedAmount ? ` (${formattedAmount} USD)` : ''}.
            </Text>
          </View>

          <View style={styles.docsSection}>
            <Text style={styles.docsSectionTitle}>Documents</Text>

            <TouchableOpacity
              style={styles.docTile}
              onPress={handleDownloadPaymentInstructionsPdf}
              disabled={isDownloadingPdf}
              activeOpacity={0.8}
            >
              <View style={styles.docIconBox}>
                <Ionicons name="receipt-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.flexText}>
                <Text style={styles.pdfDownloadTitle} numberOfLines={2}>
                  Payment Instructions (PDF)
                </Text>
                <Text style={styles.pdfDownloadSub}>
                  Bank details and payment reference on a single page for your bank
                </Text>
              </View>
              {isDownloadingPdf ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Ionicons
                  name="download-outline"
                  size={20}
                  color={colors.primary}
                  style={{ flexShrink: 0 }}
                />
              )}
            </TouchableOpacity>

            {Boolean(envelopeId) && (
              <TouchableOpacity
                style={styles.docTile}
                onPress={handleDownloadSignedAgreement}
                disabled={isDownloadingSigned}
                activeOpacity={0.8}
              >
                <View style={styles.docIconBox}>
                  <Ionicons name="document-text-outline" size={20} color={colors.primary} />
                </View>
                <View style={styles.flexText}>
                  <Text style={styles.pdfDownloadTitle} numberOfLines={2}>
                    Signed Agreement (PDF)
                  </Text>
                  <Text style={styles.pdfDownloadSub}>
                    Your signed Master Participation Agreement ({internalRef})
                  </Text>
                </View>
                {isDownloadingSigned ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Ionicons
                    name="download-outline"
                    size={20}
                    color={colors.primary}
                    style={{ flexShrink: 0 }}
                  />
                )}
              </TouchableOpacity>
            )}
          </View>

          {isPaymentNoticeSent ? (
            <View style={styles.sentVerifiedCard}>
              <View style={styles.sentVerifiedHeader}>
                <View style={styles.sentVerifiedIconRing}>
                  <Ionicons name="checkmark-done" size={20} color={colors.primary} />
                </View>
                <View style={styles.flexText}>
                  <View style={styles.sentVerifiedBadgeRow}>
                    <Text style={styles.sentVerifiedTitle} numberOfLines={2}>
                      Transfer Notice Submitted
                    </Text>
                    <View style={styles.inReviewPill}>
                      <Text style={styles.inReviewPillText} numberOfLines={1}>
                        IN REVIEW
                      </Text>
                    </View>
                  </View>
                  {Boolean(formatSentTimestamp(paymentSentAt)) && (
                    <Text style={styles.sentTimestampText}>
                      Reported on {formatSentTimestamp(paymentSentAt)}
                    </Text>
                  )}
                </View>
              </View>

              <Text style={styles.sentVerifiedBody}>
                Our treasury team has been notified of your incoming wire ({reference}). International bank transfers typically clear within 1-3 business days.
              </Text>

              <TouchableOpacity
                style={styles.backToPortfolioBtn}
                onPress={() => navigation.goBack()}
                activeOpacity={0.85}
              >
                <Text style={styles.backToPortfolioBtnText} numberOfLines={2}>
                  Done &amp; Return
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={15}
                  color={colors.primary}
                  style={{ flexShrink: 0 }}
                />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.transferSentCard}>
              <View style={styles.transferHeaderRow}>
                <View style={styles.step3IconCircle}>
                  <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
                </View>
                <View style={styles.flexText}>
                  <Text style={styles.transferStepKicker} numberOfLines={1}>
                    FINAL STEP � CONFIRM TRANSFER
                  </Text>
                  <Text style={styles.transferSentTitle} numberOfLines={2}>
                    Have You Sent the Wire?
                  </Text>
                </View>
              </View>

              <Text style={styles.transferSentSub}>
                Once you initiate the wire from your bank, confirm below so our treasury team can match and activate your allocation.
              </Text>

              <View style={styles.checklistBox}>
                <View style={styles.checkRow}>
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={colors.primary}
                    style={{ flexShrink: 0 }}
                  />
                  <Text style={styles.checkText}>
                    Included payment reference <Text style={styles.checkBold}>{reference}</Text>
                  </Text>
                </View>
                <View style={styles.checkRow}>
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={colors.primary}
                    style={{ flexShrink: 0 }}
                  />
                  <Text style={styles.checkText}>
                    Transferred net amount{' '}
                    {formattedAmount ? (
                      <Text style={styles.checkBold}>{formattedAmount} USD</Text>
                    ) : (
                      'in USD'
                    )}
                  </Text>
                </View>
                <View style={styles.checkRow}>
                  <Ionicons
                    name="time-outline"
                    size={16}
                    color={colors.textMuted}
                    style={{ flexShrink: 0 }}
                  />
                  <Text style={styles.checkText}>
                    Settlement typically takes <Text style={styles.checkBold}>1-3 business days</Text>
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.paymentSentBtn}
                onPress={() => setShowConfirmWireModal(true)}
                disabled={isMarkingSent}
                activeOpacity={0.85}
              >
                {isMarkingSent ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons
                      name="paper-plane"
                      size={16}
                      color="#FFFFFF"
                      style={{ flexShrink: 0 }}
                    />
                    <Text style={styles.paymentSentBtnText} numberOfLines={2}>
                      I&apos;ve Sent My Payment
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.transferLaterBtn}
                onPress={() => navigation.goBack()}
                activeOpacity={0.75}
              >
                <Text style={styles.transferLaterText}>
                  I&apos;ll transfer later - save instructions for now
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}

      <StatusFeedbackModal
        visible={showConfirmWireModal}
        variant="warning"
        title="Confirm Bank Transfer"
        message={`Have you completed the bank transfer with reference "${reference}"?`}
        details={[
          ...(formattedAmount ? [`Amount: ${formattedAmount} USD`] : []),
          `Reference: ${reference}`,
        ]}
        primaryLabel="Yes, I've Sent It"
        onPrimary={executePaymentSentConfirmation}
        secondaryLabel="Not Yet"
        onSecondary={() => setShowConfirmWireModal(false)}
      />

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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flexText: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.slateLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  topBarCenter: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  topBarSub: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: 1,
  },
  stepPillBadge: {
    backgroundColor: colors.primaryTint,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flexShrink: 0,
  },
  stepPillBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.4,
  },
  stepperBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minWidth: 0,
    flexShrink: 1,
  },
  stepDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepDotDone: {
    backgroundColor: colors.primary,
  },
  stepDotActive: {
    backgroundColor: colors.primary,
  },
  stepDotNum: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  stepLabelDone: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    color: colors.primary,
    flexShrink: 1,
  },
  stepLabelActive: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
    color: colors.primary,
    flexShrink: 1,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
    marginHorizontal: 6,
    borderRadius: 1,
    minWidth: 10,
  },
  stepLineDone: {
    backgroundColor: colors.primary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.primaryBorder,
    padding: 18,
    marginBottom: 16,
    ...Platform.select({
      ios: { shadowColor: '#212121', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 10 },
      android: { elevation: 3 },
    }),
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primaryTint,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    flexShrink: 1,
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  heroCurrencyPill: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMuted,
    backgroundColor: colors.slateLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    flexShrink: 0,
  },
  heroPackageName: {
    fontSize: 13.5,
    fontWeight: '600',
    color: colors.textMuted,
    lineHeight: 18,
    marginBottom: 12,
  },
  amountBlock: {
    marginBottom: 4,
  },
  amountLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  amountValue: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 0.2,
    fontVariant: ['tabular-nums'],
  },
  heroCopyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryTint,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    flexShrink: 0,
  },
  heroCopyText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.primary,
  },
  heroDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 14,
  },
  heroRefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  heroRefTextWrap: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
  },
  heroRefLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  heroRefValue: {
    fontSize: 16.5,
    lineHeight: 22,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 0.8,
    fontVariant: ['tabular-nums'],
  },
  goldCopyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9,
    flexShrink: 0,
  },
  goldCopyBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  bankTableCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  bankIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardHeaderTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: colors.text,
    lineHeight: 19,
  },
  cardHeaderSub: {
    fontSize: 11.5,
    color: colors.textMuted,
    marginTop: 1,
    lineHeight: 15,
  },
  coordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    gap: 10,
  },
  coordLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  coordValue: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 18,
  },
  coordValueMono: {
    fontSize: 13.5,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 0.3,
    lineHeight: 18,
  },
  miniCopyBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  detailBlock: {
    paddingVertical: 10,
  },
  detailLabel: {
    fontSize: 11.5,
    color: colors.textMuted,
    fontWeight: '600',
    marginBottom: 3,
  },
  detailValue: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 19,
  },
  divider: {
    height: 1,
    backgroundColor: colors.slateLight,
  },
  warningNoteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: colors.primaryTint,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    marginBottom: 16,
  },
  warningNoteText: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    fontSize: 12,
    color: colors.text,
    lineHeight: 17,
  },
  docsSection: {
    marginBottom: 16,
  },
  docsSectionTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  docTile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
    gap: 12,
  },
  docIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  pdfDownloadTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 18,
    marginBottom: 2,
  },
  pdfDownloadSub: {
    fontSize: 11.5,
    color: colors.textMuted,
    lineHeight: 16,
  },
  transferSentCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1.5,
    borderColor: colors.primaryBorder,
    marginBottom: 16,
    ...Platform.select({
      ios: { shadowColor: '#212121', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  transferHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  step3IconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primaryTint,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  transferStepKicker: {
    fontSize: 9.5,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  transferSentTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    lineHeight: 21,
  },
  transferSentSub: {
    fontSize: 12.5,
    color: colors.textMuted,
    lineHeight: 18,
    marginBottom: 14,
  },
  checklistBox: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginBottom: 16,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  checkText: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 16,
  },
  checkBold: {
    fontWeight: '800',
    color: colors.text,
  },
  paymentSentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 15,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  paymentSentBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    lineHeight: 19,
    fontWeight: '800',
    textAlign: 'center',
    flexShrink: 1,
  },
  transferLaterBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    paddingBottom: 2,
    paddingHorizontal: 8,
  },
  transferLaterText: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
    color: colors.textMuted,
    textAlign: 'center',
    flexShrink: 1,
  },
  sentVerifiedCard: {
    backgroundColor: colors.primaryTint,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1.5,
    borderColor: colors.primaryBorder,
    marginBottom: 16,
  },
  sentVerifiedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  sentVerifiedIconRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sentVerifiedBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  sentVerifiedTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    lineHeight: 20,
    flexShrink: 1,
  },
  inReviewPill: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    flexShrink: 0,
  },
  inReviewPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.4,
  },
  sentTimestampText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: 2,
  },
  sentVerifiedBody: {
    fontSize: 12.5,
    color: colors.text,
    lineHeight: 18,
    marginBottom: 14,
  },
  backToPortfolioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 11,
  },
  backToPortfolioBtnText: {
    fontSize: 13.5,
    lineHeight: 18,
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'center',
    flexShrink: 1,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: colors.textMuted,
  },
  errorIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.slateLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 14,
  },
  retryBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
