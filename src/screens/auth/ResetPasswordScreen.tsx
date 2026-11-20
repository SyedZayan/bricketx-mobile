import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import {
  usePostAuthResetPasswordMutation,
  usePostAuthForgotPasswordMutation,
} from '../../api/generated/investorApi';
import { isValidEmail, validatePassword } from '../../utils/passwordRules';
import { OtpInput } from '../../components/ui/OtpInput';
import { TextField } from '../../components/ui/TextField';
import { PasswordRules } from '../../components/auth/PasswordRules';
import { Button } from '../../components/ui/Button';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<AuthStackParamList, 'ResetPassword'>;

const RESEND_COOLDOWN_SECONDS = 60;

export const ResetPasswordScreen: React.FC<Props> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const initialEmail = route.params?.email?.trim() ?? '';

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [resendNotice, setResendNotice] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(initialEmail ? RESEND_COOLDOWN_SECONDS : 0);

  const [resetPassword, { isLoading }] = usePostAuthResetPasswordMutation();
  const [resendCode, { isLoading: isResending }] = usePostAuthForgotPasswordMutation();

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!isValidEmail(email)) {
      errors.email = 'Enter a valid email address.';
    }
    if (!/^\d{6}$/.test(otp)) {
      errors.otp = 'Enter the 6-digit verification code.';
    }
    if (!validatePassword(newPassword).isValid) {
      errors.newPassword = 'Password must meet all requirements below.';
    }
    if (confirmPassword !== newPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleReset = async () => {
    setFormError(null);
    setResendNotice(null);
    if (!validate()) return;

    const trimmedEmail = email.trim().toLowerCase();

    try {
      await resetPassword({
        body: {
          email: trimmedEmail,
          otp,
          newPassword,
        },
      }).unwrap();

      navigation.reset({
        index: 0,
        routes: [
          {
            name: 'Login',
            params: {
              email: trimmedEmail,
              notice: 'Your password has been reset. Please log in.',
            },
          },
        ],
      });
    } catch (err: any) {
      if (err?.status === 429) {
        setFormError(
          `${
            err?.data?.error?.message || 'Too many attempts.'
          } Request a new code below once available.`
        );
      } else {
        setFormError(
          err?.data?.error?.message || 'Invalid or expired verification code.'
        );
      }
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setFormError(null);
    setResendNotice(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!isValidEmail(trimmedEmail)) {
      setFieldErrors((prev) => ({ ...prev, email: 'Enter a valid email address.' }));
      return;
    }

    try {
      await resendCode({ body: { email: trimmedEmail } }).unwrap();
    } catch (err: any) {
      if (err?.status === 429) {
        setFormError(
          err?.data?.error?.message || 'Please wait before requesting another code.'
        );
        setCooldown(RESEND_COOLDOWN_SECONDS);
        return;
      }
    }

    setResendNotice('If an account exists for that email, a new 6-digit code has been sent.');
    setCooldown(RESEND_COOLDOWN_SECONDS);
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 20) + 12,
            paddingBottom: Math.max(insets.bottom, 24) + 24,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.backRow}
          onPress={() => navigation.goBack()}
          activeOpacity={0.75}
        >
          <Ionicons name="arrow-back" size={18} color={colors.text} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.heroHeader}>
          <View style={styles.iconCircle}>
            <Ionicons name="key-outline" size={24} color={colors.primary} />
          </View>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to{' '}
            <Text style={styles.emailHighlight}>{initialEmail || 'your email'}</Text> along with your new password.
          </Text>
        </View>

        {!!formError && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={17} color={colors.error} />
            <Text style={styles.errorBannerText}>{formError}</Text>
          </View>
        )}

        {!!resendNotice && (
          <View style={styles.noticeBanner}>
            <Ionicons name="checkmark-circle" size={17} color="#2E7D32" />
            <Text style={styles.noticeBannerText}>{resendNotice}</Text>
          </View>
        )}

        {!initialEmail && (
          <TextField
            label="Email address"
            placeholder="name@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            error={fieldErrors.email}
          />
        )}

        <View style={styles.otpSection}>
          <Text style={styles.fieldLabel}>Verification Code</Text>
          <OtpInput
            value={otp}
            onChange={(val) => {
              setOtp(val);
              if (fieldErrors.otp) setFieldErrors((prev) => ({ ...prev, otp: '' }));
            }}
            disabled={isLoading}
          />
          {!!fieldErrors.otp && (
            <Text style={styles.inlineError}>{fieldErrors.otp}</Text>
          )}
        </View>

        <TextField
          label="New Password"
          placeholder="Create a new password"
          value={newPassword}
          onChangeText={(val) => {
            setNewPassword(val);
            if (fieldErrors.newPassword) {
              setFieldErrors((prev) => ({ ...prev, newPassword: '' }));
            }
          }}
          isPassword
          error={fieldErrors.newPassword}
        />

        <PasswordRules password={newPassword} />

        <TextField
          label="Confirm New Password"
          placeholder="Re-enter your new password"
          value={confirmPassword}
          onChangeText={(val) => {
            setConfirmPassword(val);
            if (fieldErrors.confirmPassword) {
              setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
            }
          }}
          isPassword
          error={fieldErrors.confirmPassword}
        />

        <Button
          title="Reset Password"
          onPress={handleReset}
          loading={isLoading}
          style={styles.submitButton}
        />

        <View style={styles.resendRow}>
          <Text style={styles.resendPrompt}>Didn&apos;t receive the code? </Text>
          <TouchableOpacity
            onPress={handleResend}
            disabled={cooldown > 0 || isResending}
          >
            <Text
              style={[
                styles.resendLink,
                (cooldown > 0 || isResending) && styles.resendDisabled,
              ]}
            >
              {cooldown > 0
                ? `Resend in ${cooldown}s`
                : isResending
                ? 'Sending…'
                : 'Resend code'}
            </Text>
          </TouchableOpacity>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 22,
  },
  backRow: {
    flexDirection: 'row', flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginBottom: 18,
    paddingVertical: 4,
  },
  backText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.text,
  },
  heroHeader: {
    alignItems: 'center',
    marginBottom: 22,
  },
  iconCircle: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#E7D7C1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 25,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13.5,
    color: colors.textMuted,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 19,
  },
  emailHighlight: {
    fontWeight: '700',
    color: colors.text,
  },
  errorBanner: {
    flexDirection: 'row', flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.errorBg,
    borderWidth: 1,
    borderColor: '#FFCDD2',
    padding: 11,
    borderRadius: 12,
    marginBottom: 14,
  },
  errorBannerText: {
    flex: 1,
    color: colors.error,
    fontSize: 12.5,
    fontWeight: '600',
  },
  noticeBanner: {
    flexDirection: 'row', flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#C8E6C9',
    padding: 11,
    borderRadius: 12,
    marginBottom: 14,
  },
  noticeBannerText: {
    flex: 1,
    color: '#2E7D32',
    fontSize: 12.5,
    fontWeight: '600',
  },
  otpSection: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  inlineError: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.error,
    marginTop: 2,
  },
  submitButton: {
    height: 50,
    borderRadius: 14,
    marginTop: 6,
  },
  resendRow: {
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
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


