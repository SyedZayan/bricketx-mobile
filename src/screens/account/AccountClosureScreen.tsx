import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Platform,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import {
  useGetAccountClosureQuery,
  usePostAccountClosureMutation,
  usePostAccountClosureCancelMutation,
} from '../../api/generated/investorApi';
import { baseApi } from '../../api/baseApi';
import { tokenMemory } from '../../api/tokenMemory';
import { secureSession } from '../../utils/secureSession';
import { BiometricsService } from '../../services/biometrics';
import { useAppDispatch } from '../../store/hooks';
import { logoutAction } from '../../store/authSlice';
import { normalizeError } from '../../utils/errorHandler';
import { InlineErrorBanner } from '../../components/common/InlineErrorBanner';
import { ErrorStateView } from '../../components/common/ErrorStateView';
import { colors } from '../../theme/colors';

interface Props {
  onClose?: () => void;
  onSuccess?: () => void;
}

export const AccountClosureScreen: React.FC<Props> = ({ onClose, onSuccess }) => {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 28 : 16);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const dispatch = useAppDispatch();

  const {
    data: closureData,
    isLoading: isFetchingStatus,
    error: fetchError,
    refetch,
  } = useGetAccountClosureQuery();

  const [submitClosure, { isLoading: isSubmitting }] = usePostAccountClosureMutation();
  const [cancelClosure, { isLoading: isCancelling }] = usePostAccountClosureCancelMutation();

  const [step, setStep] = useState<'confirm' | 'feedback' | 'submitted'>('confirm');
  const [acknowledged, setAcknowledged] = useState(false);
  const [reason, setReason] = useState('');
  const [rawError, setRawError] = useState<unknown>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const latestRequest = closureData?.request ?? null;

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const handleWipeAndSignOut = async () => {
    setIsSigningOut(true);
    try {
      tokenMemory.clear();
      await secureSession.clear();
      await BiometricsService.setEnabled(false);
      dispatch(baseApi.util.resetApiState());
      dispatch(logoutAction());
    } catch {
      dispatch(logoutAction());
    } finally {
      setIsSigningOut(false);
      onSuccess?.();
    }
  };

  const handleProceedToFeedback = () => {
    setRawError(null);
    setValidationMessage(null);
    if (!acknowledged) {
      setValidationMessage(
        'Please confirm that you understand account deletion is permanent and subject to statutory financial record retention.'
      );
      return;
    }
    setStep('feedback');
  };

  const handleSubmitDeletion = async () => {
    setRawError(null);
    setValidationMessage(null);
    try {
      const trimmedReason = reason.trim();
      await submitClosure({
        body: trimmedReason ? { reason: trimmedReason } : {},
      }).unwrap();
      await refetch();
      setStep('submitted');
    } catch (err) {
      setRawError(err);
    }
  };

  const handleWithdrawRequest = async () => {
    setRawError(null);
    setValidationMessage(null);
    try {
      await cancelClosure().unwrap();
      await refetch();
      setStep('confirm');
      setAcknowledged(false);
    } catch (err) {
      setRawError(err);
    }
  };

  const handleOpenSupport = () => {
    navigation.navigate('NewTicket');
  };

  const bannerError = validationMessage
    ? {
        title: 'Confirmation Required',
        message: validationMessage,
        category: 'validation' as const,
        retryable: false,
      }
    : rawError
    ? normalizeError(rawError)
    : null;

  const formatDate = (iso?: string | null) => {
    if (!iso) return null;
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 16), paddingBottom: bottomInset }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={styles.kicker}>ACCOUNT &amp; DATA PRIVACY</Text>
          <Text style={styles.title}>Delete &amp; Close Account</Text>
        </View>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={handleClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      {bannerError && (
        <View style={styles.bannerWrap}>
          <InlineErrorBanner
            error={bannerError}
            onDismiss={() => {
              setValidationMessage(null);
              setRawError(null);
            }}
          />
        </View>
      )}

      {isFetchingStatus ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Checking account status...</Text>
        </View>
      ) : fetchError ? (
        <ErrorStateView
          error={fetchError}
          onAction={refetch}
        />
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Active Pending Request State */}
          {latestRequest?.status === 'pending' && (
            <View style={styles.statusCard}>
              <View style={styles.pendingIconCircle}>
                <Ionicons name="time-outline" size={30} color="#B78103" />
              </View>
              <Text style={styles.statusTitle}>Account Deletion Request Pending</Text>
              <Text style={styles.statusSub}>
                Submitted on {formatDate(latestRequest.requestedAt) || 'recently'}. Our compliance team is verifying that all active positions and payouts are settled before permanently closing your account and deleting personal profile data.
              </Text>

              {latestRequest.reason ? (
                <View style={styles.noteBox}>
                  <Text style={styles.noteLabel}>YOUR SUBMITTED REASON</Text>
                  <Text style={styles.noteText}>{latestRequest.reason}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={styles.destructiveBtn}
                onPress={handleWipeAndSignOut}
                disabled={isSigningOut}
                activeOpacity={0.85}
              >
                {isSigningOut ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryBtnText}>Clear Device Data &amp; Sign Out</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={handleWithdrawRequest}
                disabled={isCancelling}
                activeOpacity={0.85}
              >
                {isCancelling ? (
                  <ActivityIndicator color={colors.text} />
                ) : (
                  <Text style={styles.secondaryBtnText}>Withdraw Deletion Request</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Rejected Request Banner */}
          {latestRequest?.status === 'rejected' && step === 'confirm' && (
            <View style={styles.rejectedCard}>
              <View style={styles.rejectedHeader}>
                <Ionicons name="alert-circle-outline" size={20} color="#C62828" />
                <Text style={styles.rejectedTitle}>Previous Request Could Not Be Completed</Text>
              </View>
              <Text style={styles.rejectedText}>
                {latestRequest.decisionReason ||
                  'Your account currently has active investments, pending settlements, or open compliance items that must be resolved before deletion.'}
              </Text>
            </View>
          )}

          {/* Step 1: Confirm & Retention Disclosures */}
          {latestRequest?.status !== 'pending' && step === 'confirm' && (
            <View>
              <View style={styles.warningCard}>
                <Ionicons name="trash-outline" size={28} color="#C62828" />
                <Text style={styles.warningCardTitle}>Permanent Account Deletion</Text>
                <Text style={styles.warningCardText}>
                  Requesting deletion permanently revokes portal access, removes saved device credentials, and closes your BricketX investor account once any active positions or pending payouts are settled.
                </Text>
              </View>

              <View style={styles.disclosureCard}>
                <Text style={styles.disclosureHeader}>WHAT HAPPENS TO YOUR DATA</Text>

                <View style={styles.disclosureItem}>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#2E7D32" style={{ marginTop: 2 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.disclosureItemTitle}>Deleted Personal &amp; Device Data</Text>
                    <Text style={styles.disclosureItemText}>
                      Your login credentials, notification preferences, biometric unlock links, and local session tokens are permanently erased upon closure.
                    </Text>
                  </View>
                </View>

                <View style={styles.disclosureDivider} />

                <View style={styles.disclosureItem}>
                  <Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} style={{ marginTop: 2 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.disclosureItemTitle}>Statutory Financial &amp; AML Retention</Text>
                    <Text style={styles.disclosureItemText}>
                      Under financial anti-money laundering (AML) and tax laws, completed KYC records, executed investment agreements, and transaction ledger entries must be retained securely for the legally mandated statutory period (typically 5-7 years) and cannot be altered or purged early.
                    </Text>
                  </View>
                </View>

                <View style={styles.disclosureDivider} />

                <View style={styles.disclosureItem}>
                  <Ionicons name="wallet-outline" size={18} color="#B78103" style={{ marginTop: 2 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.disclosureItemTitle}>Active Holdings &amp; Pending Payouts</Text>
                    <Text style={styles.disclosureItemText}>
                      If you hold active investments or unsettled withdrawals, our compliance team will coordinate settlement before finalizing deletion.
                    </Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setAcknowledged(!acknowledged)}
                activeOpacity={0.8}
              >
                <View style={[styles.checkbox, acknowledged && styles.checkboxChecked]}>
                  {acknowledged && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                </View>
                <Text style={styles.checkboxLabel}>
                  I understand that deleting my account is permanent, removes my portal access, and is subject to statutory AML/financial record retention laws.
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.destructiveBtn}
                onPress={handleProceedToFeedback}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryBtnText}>Continue to Account Deletion</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Step 2: Optional Feedback & Final Submission */}
          {latestRequest?.status !== 'pending' && step === 'feedback' && (
            <View>
              <Text style={styles.sectionLabel}>Reason for Deleting Account (Optional)</Text>
              <Text style={styles.sectionSub}>
                Sharing why you are leaving is optional and helps us improve BricketX.
              </Text>

              <TextInput
                style={styles.textInput}
                value={reason}
                onChangeText={setReason}
                placeholder="Optional feedback..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={4}
              />

              <TouchableOpacity
                style={styles.destructiveBtn}
                onPress={handleSubmitDeletion}
                disabled={isSubmitting}
                activeOpacity={0.85}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryBtnText}>Permanently Delete Account</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => setStep('confirm')}
                disabled={isSubmitting}
                activeOpacity={0.85}
              >
                <Text style={styles.secondaryBtnText}>Back</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Step 3: Submitted Confirmation */}
          {step === 'submitted' && latestRequest?.status !== 'pending' && (
            <View style={styles.statusCard}>
              <View style={styles.successIconCircle}>
                <Ionicons name="checkmark-done" size={32} color="#2E7D32" />
              </View>
              <Text style={styles.statusTitle}>Deletion Request Registered</Text>
              <Text style={styles.statusSub}>
                Your account deletion request has been submitted. You can sign out now to clear all saved credentials from this device.
              </Text>

              <TouchableOpacity
                style={styles.destructiveBtn}
                onPress={handleWipeAndSignOut}
                disabled={isSigningOut}
                activeOpacity={0.85}
              >
                {isSigningOut ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryBtnText}>Clear Device Data &amp; Sign Out</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.footerHelp}>
            <Text style={styles.footerHelpText}>Questions about your data or holdings?</Text>
            <View style={styles.footerLinksRow}>
              <TouchableOpacity onPress={handleOpenSupport}>
                <Text style={styles.footerHelpLink}>Open Support Ticket</Text>
              </TouchableOpacity>
              <Text style={styles.footerDot}>-</Text>
              <TouchableOpacity onPress={() => Linking.openURL('mailto:compliance@bricketx.com')}>
                <Text style={styles.footerHelpLink}>compliance@bricketx.com</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EFECE6',
  },
  kicker: {
    fontSize: 9.5,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8F7F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerWrap: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: colors.textMuted,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  warningCard: {
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FFCDD2',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginBottom: 16,
  },
  warningCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#B71C1C',
    marginTop: 10,
    marginBottom: 6,
  },
  warningCardText: {
    fontSize: 12.5,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 18,
  },
  disclosureCard: {
    backgroundColor: '#FAF9F6',
    borderWidth: 1,
    borderColor: '#EFECE6',
    borderRadius: 14,
    padding: 16,
    marginBottom: 18,
  },
  disclosureHeader: {
    fontSize: 10.5,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  disclosureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  disclosureItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  disclosureItemText: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 17,
  },
  disclosureDivider: {
    height: 1,
    backgroundColor: '#EFECE6',
    marginVertical: 12,
  },
  rejectedCard: {
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FFCDD2',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  rejectedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  rejectedTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#C62828',
  },
  rejectedText: {
    fontSize: 12.5,
    color: colors.text,
    lineHeight: 18,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 22,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#D1C7BD',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    backgroundColor: '#FAF9F6',
  },
  checkboxChecked: {
    backgroundColor: '#C62828',
    borderColor: '#C62828',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 12.5,
    color: colors.text,
    lineHeight: 18,
  },
  destructiveBtn: {
    width: '100%',
    backgroundColor: '#C62828',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtn: {
    width: '100%',
    marginTop: 10,
    backgroundColor: '#F8F7F4',
    borderWidth: 1,
    borderColor: '#E5E0D8',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  secondaryBtnText: {
    color: colors.text,
    fontSize: 13.5,
    fontWeight: '700',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 16,
    lineHeight: 17,
  },
  textInput: {
    backgroundColor: '#FAF9F6',
    borderWidth: 1,
    borderColor: '#EFECE6',
    borderRadius: 12,
    padding: 14,
    fontSize: 13.5,
    color: colors.text,
    textAlignVertical: 'top',
    minHeight: 112,
    marginBottom: 20,
  },
  statusCard: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  pendingIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF8E1',
    borderWidth: 1,
    borderColor: '#FFE082',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#C8E6C9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  statusSub: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  noteBox: {
    width: '100%',
    backgroundColor: '#FAF9F6',
    borderWidth: 1,
    borderColor: '#EFECE6',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  noteLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  noteText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
  footerHelp: {
    alignItems: 'center',
    marginTop: 28,
    paddingBottom: 24,
  },
  footerHelpText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  footerLinksRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
  },
  footerHelpLink: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.primary,
  },
  footerDot: {
    fontSize: 12,
    color: colors.textMuted,
  },
});