import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
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
import { usePostAuthForgotPasswordMutation } from '../../api/generated/investorApi';
import { isValidEmail } from '../../utils/passwordRules';
import { TextField } from '../../components/ui/TextField';
import { Button } from '../../components/ui/Button';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

const LOGO_SOURCE = require('../../../assets/logo.png');

export const ForgotPasswordScreen: React.FC<Props> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState(route.params?.email?.trim() ?? '');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [forgotPassword, { isLoading }] = usePostAuthForgotPasswordMutation();

  const handleSendCode = async () => {
    setErrorMessage(null);
    const trimmed = email.trim().toLowerCase();

    if (!isValidEmail(trimmed)) {
      setErrorMessage('Enter a valid email address.');
      return;
    }

    try {
      await forgotPassword({
        body: { email: trimmed },
      }).unwrap();
    } catch (err: any) {
      if (err?.status === 429) {
        setErrorMessage(
          err?.data?.error?.message ||
            'Too many reset requests. Please wait before trying again.'
        );
        return;
      }
      if (err?.status === 'FETCH_ERROR') {
        setErrorMessage('Cannot reach the server. Check your internet connection.');
        return;
      }
      // Deliberately proceed on 404/generic responses so account existence is never revealed
    }

    navigation.navigate('ResetPassword', { email: trimmed });
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
            paddingBottom: Math.max(insets.bottom, 24) + 18,
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
          <Text style={styles.backText}>Back to Log In</Text>
        </TouchableOpacity>

        <View style={styles.heroHeader}>
          <Image source={LOGO_SOURCE} style={styles.logo} resizeMode="contain" />
          <Text style={styles.title}>Forgot Password?</Text>
          <Text style={styles.subtitle}>
            Enter your email address and we&apos;ll send a 6-digit verification code to reset your password.
          </Text>
        </View>

        {!!errorMessage && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={17} color={colors.error} />
            <Text style={styles.errorBannerText}>{errorMessage}</Text>
          </View>
        )}

        <TextField
          label="Email address"
          placeholder="name@example.com"
          value={email}
          onChangeText={(val) => {
            setEmail(val);
            if (errorMessage) setErrorMessage(null);
          }}
          keyboardType="email-address"
          autoComplete="email"
          autoCapitalize="none"
        />

        <Button
          title="Send Reset Code"
          onPress={handleSendCode}
          loading={isLoading}
          style={styles.submitButton}
        />

        <View style={styles.footer}>
          <Text style={styles.footerText}>Remembered your password? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}>Log In</Text>
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
    marginBottom: 24,
    paddingVertical: 4,
  },
  backText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.text,
  },
  heroHeader: {
    alignItems: 'center',
    marginBottom: 26,
  },
  logo: {
    width: 144,
    height: 46,
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13.5,
    color: colors.textMuted,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
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
    marginBottom: 16,
  },
  errorBannerText: {
    flex: 1,
    color: colors.error,
    fontSize: 12.5,
    fontWeight: '600',
  },
  submitButton: {
    height: 50,
    borderRadius: 14,
    marginTop: 6,
  },
  footer: {
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 28,
  },
  footerText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
  },
});


