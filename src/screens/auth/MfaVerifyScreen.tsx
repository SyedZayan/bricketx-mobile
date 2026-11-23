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
  investorApi,
  usePostAuthMobileMfaVerifyMutation,
} from '../../api/generated/investorApi';
import { tokenMemory } from '../../api/tokenMemory';
import { secureSession } from '../../utils/secureSession';
import { BiometricsService } from '../../services/biometrics';
import { useAppDispatch } from '../../store/hooks';
import { setAuthenticatedUser, setMfaPending } from '../../store/authSlice';
import { OtpInput } from '../../components/ui/OtpInput';
import { TextField } from '../../components/ui/TextField';
import { InlineErrorBanner } from '../../components/common/InlineErrorBanner';
import { normalizeError } from '../../utils/errorHandler';
import { Button } from '../../components/ui/Button';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

type Props = NativeStackScreenProps<AuthStackParamList, 'MfaVerify'>;

export const MfaVerifyScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();

  const [useRecovery, setUseRecovery] = useState(false);
  const [totp, setTotp] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rawError, setRawError] = useState<unknown>(null);
  const [mustSignInAgain, setMustSignInAgain] = useState(false);

  const [verifyMfa, { isLoading }] = usePostAuthMobileMfaVerifyMutation();

  const mfaToken = tokenMemory.getMfaToken();

  useEffect(() => {
    if (!mfaToken && !mustSignInAgain) {
      dispatch(setMfaPending(false));
      navigation.replace('Login');
    }
  }, [mfaToken, mustSignInAgain, dispatch, navigation]);

  const handleBackToLogin = () => {
    tokenMemory.setMfaToken(null);
    dispatch(setMfaPending(false));
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  const handleVerify = async () => {
    setErrorMessage(null);
    setRawError(null);
    const currentToken = tokenMemory.getMfaToken();
    if (!currentToken) {
      setMustSignInAgain(true);
      setErrorMessage('Your verification session expired. Please sign in again.');
      return;
    }

    if (!useRecovery && !/^\d{6}$/.test(totp)) {
      setErrorMessage('Enter the 6-digit code from your authenticator app.');
      return;
    }

    if (useRecovery && !recoveryCode.trim()) {
      setErrorMessage('Enter one of your backup recovery codes.');
      return;
    }

    try {
      const result = await verifyMfa({
        body: useRecovery
          ? { mfaToken: currentToken, recoveryCode: recoveryCode.trim() }
          : { mfaToken: currentToken, totp },
      }).unwrap();

      tokenMemory.setMfaToken(null);
      tokenMemory.setAccessToken(result.accessToken);
      await secureSession.setRefreshToken(result.refreshToken);

      const me = await dispatch(
        investorApi.endpoints.getAuthMe.initiate(undefined, { forceRefetch: true })
      ).unwrap();

      const roles = me.roles || [];
      const isInvestor =
        roles.includes('investor') || roles.includes('premium_investor');

      if (!isInvestor) {
        await secureSession.clear();
        tokenMemory.clear();
        dispatch(setMfaPending(false));
        setMustSignInAgain(true);
        setErrorMessage(
          "This account can't be used here. Staff accounts sign in through the admin portal."
        );
        return;
      }

      const isBioEnabled = await BiometricsService.isEnabled();
      await BiometricsService.setEnabled(isBioEnabled, me.email, result.refreshToken);

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
    } catch (err: any) {
      setRawError(err);
      const status = err?.status;
      const msg = err?.data?.error?.message || '';
      if (status === 429 || (status === 401 && /expired/i.test(msg))) {
        tokenMemory.setMfaToken(null);
        dispatch(setMfaPending(false));
        setMustSignInAgain(true);
        setErrorMessage(
          msg || 'Two-factor verification expired or exceeded attempts. Please log in again.'
        );
      } else {
        setErrorMessage(msg || 'Invalid verification code. Please try again.');
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
        <TouchableOpacity style={styles.backRow} onPress={handleBackToLogin}>
          <Ionicons name="arrow-back" size={18} color={colors.text} />
          <Text style={styles.backText}>Back to Log In</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Ionicons name="shield-checkmark-outline" size={26} color={colors.primary} />
          </View>
          <Text style={styles.title}>Two-factor verification</Text>
          <Text style={styles.subtitle}>
            {useRecovery
              ? 'Enter one of your single-use backup recovery codes.'
              : 'Enter the 6-digit code from your authenticator app to continue.'}
          </Text>
        </View>

        <View style={styles.card}>
          {!!errorMessage && (
            <InlineErrorBanner
              error={rawError}
              appError={{
                ...normalizeError(rawError, { defaultMessage: errorMessage }),
                message: errorMessage,
                nextStep: mustSignInAgain
                  ? 'Go back to sign in to start a fresh verification session.'
                  : normalizeError(rawError, { defaultMessage: errorMessage }).nextStep,
              }}
              onDismiss={() => {
                setErrorMessage(null);
                setRawError(null);
              }}
            />
          )}

          {mustSignInAgain ? (
            <Button title="Return to Log In" onPress={handleBackToLogin} />
          ) : (
            <>
              {useRecovery ? (
                <TextField
                  label="Recovery Code"
                  placeholder="Enter recovery code"
                  value={recoveryCode}
                  onChangeText={setRecoveryCode}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              ) : (
                <OtpInput value={totp} onChange={setTotp} disabled={isLoading} />
              )}

              <Button
                title="Verify & Sign In"
                onPress={handleVerify}
                loading={isLoading}
                disabled={!useRecovery && totp.length !== 6}
                style={styles.submitButton}
              />

              <TouchableOpacity
                style={styles.switchModeBtn}
                onPress={() => {
                  setErrorMessage(null);
    setRawError(null);
                  setUseRecovery((prev) => !prev);
                }}
              >
                <Text style={styles.switchModeText}>
                  {useRecovery
                    ? 'Use authenticator 6-digit code instead'
                    : 'Use a backup recovery code'}
                </Text>
              </TouchableOpacity>
            </>
          )}
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
    flexDirection: 'row',
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
  submitButton: {
    marginTop: 14,
  },
  switchModeBtn: {
    alignItems: 'center',
    marginTop: 16,
  },
  switchModeText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
});

