import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import {
  usePostAuthVerifyEmailMutation,
  usePostAuthResendOtpMutation,
} from '../../api/generated/investorApi';
import { isValidEmail } from '../../utils/passwordRules';
import { OtpInput } from '../../components/ui/OtpInput';
import { TextField } from '../../components/ui/TextField';
import { InlineErrorBanner } from '../../components/common/InlineErrorBanner';
import { normalizeError } from '../../utils/errorHandler';
import { Button } from '../../components/ui/Button';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

type Props = NativeStackScreenProps<AuthStackParamList, 'VerifyEmail'>;

const RESEND_COOLDOWN_SECONDS = 60;

export const VerifyEmailScreen: React.FC<Props> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const initialEmail = route.params?.email?.trim() || '';
  const initialMessage = route.params?.message;

  const [typedEmail, setTypedEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rawError, setRawError] = useState<unknown>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(
    initialEmail && initialMessage ? RESEND_COOLDOWN_SECONDS : 0
  );

  const [verifyEmail, { isLoading: isVerifying }] = usePostAuthVerifyEmailMutation();
  const [resendOtp, { isLoading: isResending }] = usePostAuthResendOtpMutation();

  const effectiveEmail = typedEmail.trim().toLowerCase();

  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const interval = setInterval(() => {
      setCooldownSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownSeconds]);

  const handleVerify = async () => {
    setErrorMessage(null);
    setRawError(null);
    setSuccessNotice(null);

    if (!isValidEmail(effectiveEmail)) {
      setErrorMessage('Enter the email address you registered with.');
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      setErrorMessage('Enter the 6-digit verification code sent to your email.');
      return;
    }

    try {
      await verifyEmail({
        body: {
          email: effectiveEmail,
          otp,
        },
      }).unwrap();

      navigation.reset({
        index: 0,
        routes: [
          {
            name: 'Login',
            params: {
              email: effectiveEmail,
              notice: 'Email verified successfully. You can now sign in.',
            },
          },
        ],
      });
    } catch (err: any) {
      setRawError(err);
      if (err?.status === 400) {
        setErrorMessage('Invalid or expired verification code.');
      } else if (err?.status === 429) {
        setErrorMessage(
          'Too many attempts. Please request a fresh code once the cooldown ends.'
        );
      } else {
        setErrorMessage(
          err?.data?.error?.message || 'Verification failed. Please try again.'
        );
      }
    }
  };

  const handleResend = async () => {
    if (cooldownSeconds > 0) return;
    setErrorMessage(null);
    setRawError(null);
    setSuccessNotice(null);

    if (!isValidEmail(effectiveEmail)) {
      setErrorMessage('Enter a valid email address first.');
      return;
    }

    try {
      const res = await resendOtp({
        body: { email: effectiveEmail },
      }).unwrap();

      setSuccessNotice(
        res.message ||
          'If this address is awaiting verification, a new 6-digit code is on its way.'
      );
      setCooldownSeconds(RESEND_COOLDOWN_SECONDS);
    } catch (err: any) {
      setRawError(err);
      if (err?.status === 429) {
        setErrorMessage('Please wait before requesting another code.');
        setCooldownSeconds(RESEND_COOLDOWN_SECONDS);
      } else {
        setErrorMessage(err?.data?.error?.message || 'Failed to resend code.');
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          {
            paddingTop: Math.max(insets.top, 20) + 12,
            paddingBottom: Math.max(insets.bottom, 24) + 16,
          },
        ]}
        keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets
      >
        <TouchableOpacity
          style={styles.backRow}
          onPress={() => navigation.navigate('Login', { email: effectiveEmail || undefined })}
        >
          <Ionicons name="arrow-back" size={18} color={colors.text} />
          <Text style={styles.backText}>Back to Log In</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Ionicons name="mail-open-outline" size={26} color={colors.primary} />
          </View>
          <Text style={styles.title}>Verify your email</Text>
          <Text style={styles.subtitle}>
            {initialMessage || 'Enter the 6-digit code sent to your inbox.'}
          </Text>
          {Boolean(initialEmail) && (
            <Text style={styles.emailHighlight}>{initialEmail}</Text>
          )}
        </View>

        <View style={styles.card}>
          {!!errorMessage && (
            <InlineErrorBanner
              error={rawError}
              appError={{
                ...normalizeError(rawError, { defaultMessage: errorMessage }),
                message: errorMessage,
              }}
              onDismiss={() => {
                setErrorMessage(null);
                setRawError(null);
              }}
            />
          )}

          {!!successNotice && (
            <View style={styles.successBanner}>
              <Text style={styles.successText}>{successNotice}</Text>
            </View>
          )}

          {!initialEmail && (
            <TextField
              label="Registered Email"
              placeholder="name@example.com"
              value={typedEmail}
              onChangeText={setTypedEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          )}

          <OtpInput value={otp} onChange={setOtp} disabled={isVerifying} />

          <Button
            title="Verify Email"
            onPress={handleVerify}
            loading={isVerifying}
            disabled={otp.length !== 6}
            style={styles.submitButton}
          />

          <View style={styles.resendRow}>
            <Text style={styles.resendPrompt}>Didn&apos;t receive a code? </Text>
            <TouchableOpacity
              onPress={handleResend}
              disabled={cooldownSeconds > 0 || isResending}
            >
              <Text
                style={[
                  styles.resendLink,
                  (cooldownSeconds > 0 || isResending) && styles.resendDisabled,
                ]}
              >
                {cooldownSeconds > 0
                  ? `Resend in ${cooldownSeconds}s`
                  : isResending
                  ? 'Resending…'
                  : 'Resend code'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: '#F8F7F4',
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  backRow: {
    flexDirection: 'row', flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginBottom: 18,
  },
  backText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.text,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 19,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#E7D7C1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 25,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13.5,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
  },
  emailHighlight: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 14,
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  errorBanner: {
    backgroundColor: colors.errorBg,
    borderWidth: 1,
    borderColor: '#FFCDD2',
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
  },
  errorText: {
    color: colors.error,
    fontSize: 12.5,
    fontWeight: '600',
    textAlign: 'center',
  },
  successBanner: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#C8E6C9',
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
  },
  successText: {
    color: '#2E7D32',
    fontSize: 12.5,
    fontWeight: '600',
    textAlign: 'center',
  },
  submitButton: {
    marginTop: 14,
  },
  resendRow: {
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },
  resendPrompt: {
    fontSize: 13,
    color: colors.textMuted,
  },
  resendLink: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  resendDisabled: {
    color: colors.textMuted,
  },
});



