import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as FileSystem from 'expo-file-system/legacy';
import { AuthStackParamList } from '../../navigation/types';
import {
  investorApi,
  usePostAuthMobileLoginMutation,
  usePostAuthMobileRefreshMutation,
} from '../../api/generated/investorApi';
import { tokenMemory } from '../../api/tokenMemory';
import { secureSession } from '../../utils/secureSession';
import { BiometricsService } from '../../services/biometrics';
import { isValidEmail } from '../../utils/passwordRules';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setAuthenticatedUser, setMfaPending } from '../../store/authSlice';
import { TextField } from '../../components/ui/TextField';
import { InlineErrorBanner } from '../../components/common/InlineErrorBanner';
import { normalizeError } from '../../utils/errorHandler';
import { Button } from '../../components/ui/Button';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

const LOGO_SOURCE = require('../../../assets/logo.png');
const REMEMBER_EMAIL_FILE = `${FileSystem.documentDirectory}bricketx_remembered_email_v1.json`;

async function loadRememberedEmail(): Promise<string | null> {
  try {
    if (!FileSystem.documentDirectory) return null;
    const info = await FileSystem.getInfoAsync(REMEMBER_EMAIL_FILE);
    if (!info.exists) return null;
    const raw = await FileSystem.readAsStringAsync(REMEMBER_EMAIL_FILE);
    const parsed = JSON.parse(raw);
    return typeof parsed?.email === 'string' ? parsed.email : null;
  } catch {
    return null;
  }
}

async function saveRememberedEmail(email: string | null): Promise<void> {
  try {
    if (!FileSystem.documentDirectory) return;
    if (!email) {
      await FileSystem.deleteAsync(REMEMBER_EMAIL_FILE, { idempotent: true });
      return;
    }
    await FileSystem.writeAsStringAsync(
      REMEMBER_EMAIL_FILE,
      JSON.stringify({ email })
    );
  } catch {
    // Ignore storage errors
  }
}

export const LoginScreen: React.FC<Props> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const retryAfterUntil = useAppSelector((state) => state.auth.retryAfterUntil);

  const [email, setEmail] = useState(route.params?.email ?? '');
  const [password, setPassword] = useState('');
  const [rememberEmail, setRememberEmail] = useState(true);
  const [noticeBanner, setNoticeBanner] = useState<string | null>(
    route.params?.notice ?? null
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rawError, setRawError] = useState<unknown>(null);
  const [tooManyAttempts, setTooManyAttempts] = useState(false);

  const [canUseBiometrics, setCanUseBiometrics] = useState(false);
  const [biometricName, setBiometricName] = useState('Biometrics');
  const [isBioAuthenticating, setIsBioAuthenticating] = useState(false);

  const [login, { isLoading }] = usePostAuthMobileLoginMutation();
  const [refreshMobileAuth] = usePostAuthMobileRefreshMutation();

  const isRateLimited = retryAfterUntil ? Date.now() < retryAfterUntil : false;

  useEffect(() => {
    if (route.params?.notice) {
      setNoticeBanner(route.params.notice);
    }
    if (route.params?.email) {
      setEmail(route.params.email);
    }
  }, [route.params?.notice, route.params?.email]);

  const checkSavedState = async () => {
    try {
      const remembered = await loadRememberedEmail();
      const bioEmail = await BiometricsService.getSavedEmail();
      const initialSavedEmail = route.params?.email || remembered || bioEmail;

      if (initialSavedEmail) {
        setEmail((prev) => prev || initialSavedEmail);
        setRememberEmail(true);
      }

      const isAvailable = await BiometricsService.isAvailable();
      const isEnabled = await BiometricsService.isEnabled();

      if (isAvailable && isEnabled) {
        const typeName = await BiometricsService.getBiometricTypeName();
        setBiometricName(typeName);
        setCanUseBiometrics(true);
      } else {
        setCanUseBiometrics(false);
      }
    } catch {
      setCanUseBiometrics(false);
    }
  };

  useEffect(() => {
    checkSavedState();
  }, []);

  useFocusEffect(
    useCallback(() => {
      checkSavedState();
    }, [])
  );

  const finalizeInvestorSession = async (
    accessToken: string,
    refreshToken?: string,
    fallbackUser?: { id: string; email: string; role?: string }
  ) => {
    tokenMemory.setAccessToken(accessToken);
    if (refreshToken) {
      await secureSession.setRefreshToken(refreshToken);
    }

    const me = await dispatch(
      investorApi.endpoints.getAuthMe.initiate(undefined, { forceRefetch: true })
    ).unwrap();

    const roles = me.roles || (fallbackUser?.role ? [fallbackUser.role] : []);
    const isInvestor =
      roles.includes('investor') || roles.includes('premium_investor');

    if (!isInvestor) {
      await secureSession.clear();
      tokenMemory.clear();
      setErrorMessage(
        "This account can't be used here. Staff accounts sign in through the admin portal."
      );
      return;
    }

    await saveRememberedEmail(rememberEmail ? me.email : null);

    if (refreshToken) {
      const isBioEnabled = await BiometricsService.isEnabled();
      const savedBioEmail = await BiometricsService.getSavedEmail();
      const nextEmail = (me.email || '').trim().toLowerCase();
      const isSameAccount = !savedBioEmail || savedBioEmail.trim().toLowerCase() === nextEmail;

      if (isBioEnabled && !isSameAccount) {
        await BiometricsService.setEnabled(false);
        setCanUseBiometrics(false);
      } else {
        await BiometricsService.setEnabled(isBioEnabled, me.email, refreshToken);
      }
    }

    dispatch(
      setAuthenticatedUser({
        id: me.id,
        email: me.email,
        role: roles[0] || 'investor',
        roles,
        fullName: me.fullName,
        investorRfid: me.investorRfid,
      })
    );
  };

  const handleBiometricAuth = async () => {
    setErrorMessage(null);
    setRawError(null);
    setNoticeBanner(null);
    setIsBioAuthenticating(true);

    try {
      let token = await BiometricsService.getBiometricToken();
      if (!token) {
        token = await secureSession.getRefreshToken();
      }

      if (!token) {
        setErrorMessage(
          'No saved session found. Sign in with your password once to link biometrics.'
        );
        setIsBioAuthenticating(false);
        return;
      }

      const authResult = await BiometricsService.authenticate(
        `Authenticate with ${biometricName} to access BricketX`
      );

      if (!authResult.success) {
        if (!authResult.cancelled && authResult.message) {
          setErrorMessage(authResult.message);
        }
        setIsBioAuthenticating(false);
        return;
      }

      const refreshResponse = await refreshMobileAuth({
        body: { refreshToken: token },
      }).unwrap();

      if (refreshResponse?.accessToken && refreshResponse?.refreshToken) {
        await finalizeInvestorSession(
          refreshResponse.accessToken,
          refreshResponse.refreshToken
        );
      } else {
        throw new Error('Malformed token response from server.');
      }
    } catch (err: any) {
      if (err?.status === 401 || err?.status === 403) {
        await BiometricsService.clearCredentials();
        setCanUseBiometrics(false);
      }
      setRawError(err);
      setErrorMessage(
        err?.status === 401 || err?.status === 403
          ? 'Your saved biometric session expired. Please sign in with your password to re-link biometrics.'
          : err?.data?.error?.message ||
            err?.data?.message ||
            'Biometric authentication failed. Please enter your password.'
      );
    } finally {
      setIsBioAuthenticating(false);
    }
  };

  const handleLogin = async () => {
    setErrorMessage(null);
    setRawError(null);
    setNoticeBanner(null);
    setTooManyAttempts(false);

    if (!isValidEmail(email)) {
      setErrorMessage('Enter a valid email address.');
      return;
    }

    if (!password) {
      setErrorMessage('Enter your password.');
      return;
    }

    try {
      const response = await login({
        body: {
          email: email.trim().toLowerCase(),
          password,
        },
      }).unwrap();

      if ('mfaRequired' in response && response.mfaRequired) {
        tokenMemory.setMfaToken(response.mfaToken);
        dispatch(setMfaPending(true));
        navigation.navigate('MfaVerify');
        return;
      }

      if ('mfaEnrollmentRequired' in response && (response as any).mfaEnrollmentRequired) {
        setErrorMessage(
          "This account can't be used here. Staff accounts sign in through the admin portal."
        );
        return;
      }

      if ('accessToken' in response && response.accessToken) {
        await finalizeInvestorSession(
          response.accessToken,
          'refreshToken' in response && typeof response.refreshToken === 'string'
            ? response.refreshToken
            : undefined,
          'user' in response ? response.user : undefined
        );
      }
    } catch (err: any) {
      setRawError(err);
      if (err?.status === 401) {
        setErrorMessage('Invalid email or password.');
      } else if (err?.status === 403) {
        setErrorMessage(
          err?.data?.error?.message || 'Access denied or email not yet verified.'
        );
      } else if (err?.status === 429) {
        setTooManyAttempts(true);
        setErrorMessage(
          err?.data?.error?.message ||
            'Too many sign-in attempts. Please wait before trying again.'
        );
      } else if (err?.status === 'FETCH_ERROR') {
        setErrorMessage('Unable to reach server. Check your internet connection.');
      } else {
        setErrorMessage(
          err?.data?.error?.message || 'Unable to sign in. Please try again.'
        );
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 24) + 18,
            paddingBottom: Math.max(insets.bottom, 24) + 18,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Top Centered Logo + Editorial Heading */}
        <View style={styles.heroHeader}>
          <Image source={LOGO_SOURCE} style={styles.logo} resizeMode="contain" />
          <Text style={styles.welcomeTitle}>Welcome Back</Text>
          <Text style={styles.welcomeSubtitle}>
            Sign in to access your private real-asset portfolio
          </Text>
        </View>

        {/* Segmented Auth Mode Pill Switcher */}
        <View style={styles.modeSwitcher}>
          <View style={[styles.modeTab, styles.modeTabActive]}>
            <Text style={styles.modeTabTextActive}>Log In</Text>
          </View>
          <TouchableOpacity
            style={styles.modeTab}
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.8}
          >
            <Text style={styles.modeTabTextInactive}>Create Account</Text>
          </TouchableOpacity>
        </View>

        {/* Alerts */}
        {!!noticeBanner && (
          <View style={styles.noticeBanner}>
            <Ionicons name="checkmark-circle" size={17} color="#2E7D32" />
            <Text style={styles.noticeBannerText}>{noticeBanner}</Text>
          </View>
        )}
        {!!errorMessage && (
          <InlineErrorBanner
            error={rawError}
            appError={{
              ...normalizeError(rawError, { defaultMessage: errorMessage }),
              message: errorMessage,
              nextStep: tooManyAttempts
                ? 'Reset your password to unlock sign-in, or wait a moment and try again.'
                : normalizeError(rawError, { defaultMessage: errorMessage }).nextStep,
            }}
            actionLabel={tooManyAttempts ? 'Reset your password' : undefined}
            onAction={tooManyAttempts ? () => navigation.navigate('ForgotPassword', { email }) : undefined}
            onDismiss={() => { setErrorMessage(null); setRawError(null); }}
          />
        )}

        {/* Form Fields */}
        <View style={styles.formStack}>
          <TextField
            label="Email address"
            placeholder="name@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoComplete="email"
            autoCapitalize="none"
          />

          <TextField
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            isPassword
          />

          {/* Remember Me & Forgot Password Row */}
          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={styles.rememberRow}
              onPress={() => setRememberEmail((prev) => !prev)}
              activeOpacity={0.75}
            >
              <View
                style={[
                  styles.checkbox,
                  rememberEmail && styles.checkboxChecked,
                ]}
              >
                {rememberEmail && (
                  <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                )}
              </View>
              <Text style={styles.rememberText}>Remember me</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('ForgotPassword', { email })}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
          </View>

          <Button
            title="Log In"
            onPress={handleLogin}
            loading={isLoading}
            disabled={isRateLimited || isBioAuthenticating}
            style={styles.primaryCta}
          />
        </View>

        {/* Secondary Actions: Biometrics & Email Verification */}
        {canUseBiometrics && (
          <>
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerLabel}>Or sign in with</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.biometricBtn}
              onPress={handleBiometricAuth}
              disabled={isBioAuthenticating || isLoading}
              activeOpacity={0.8}
            >
              {isBioAuthenticating ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <>
                  <Ionicons
                    name={
                      biometricName === 'Face ID'
                        ? 'scan-outline'
                        : 'finger-print-outline'
                    }
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={styles.biometricBtnText}>
                    Continue with {biometricName}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}

        {/* Bottom Links */}
        <View style={styles.bottomSection}>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don&apos;t have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Sign Up</Text>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  heroHeader: {
    alignItems: 'center',
    marginBottom: 22,
  },
  logo: {
    width: 156,
    height: 52,
    marginBottom: 14,
  },
  welcomeTitle: {
    fontSize: 27,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  welcomeSubtitle: {
    fontSize: 13.5,
    color: colors.textMuted,
    marginTop: 5,
    textAlign: 'center',
    lineHeight: 19,
  },
  modeSwitcher: {
    flexDirection: 'row', flexWrap: 'wrap',
    backgroundColor: '#EFECE6',
    borderRadius: 14,
    padding: 4,
    marginBottom: 22,
  },
  modeTab: {
    flex: 1,
    height: 40,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeTabActive: {
    backgroundColor: colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  modeTabTextActive: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modeTabTextInactive: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.textMuted,
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
    lineHeight: 17,
  },
  errorBanner: {
    flexDirection: 'row', flexWrap: 'wrap',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: colors.errorBg,
    borderWidth: 1,
    borderColor: '#FFCDD2',
    padding: 11,
    borderRadius: 12,
    marginBottom: 14,
  },
  errorBannerText: {
    color: colors.error,
    fontSize: 12.5,
    fontWeight: '600',
    lineHeight: 17,
  },
  errorResetLink: {
    color: colors.error,
    fontSize: 12.5,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  formStack: {
    gap: 2,
  },
  optionsRow: {
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 18,
  },
  rememberRow: {
    flexDirection: 'row', flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#CFC9BE',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  rememberText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  forgotText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  primaryCta: {
    height: 50,
    borderRadius: 14,
  },
  dividerRow: {
    flexDirection: 'row', flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E6E1D8',
  },
  dividerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  biometricBtn: {
    flexDirection: 'row', flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E0D8',
  },
  biometricBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  bottomSection: {
    alignItems: 'center',
    marginTop: 22,
    gap: 12,
  },

  footer: {
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  registerLink: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
  },
});



