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
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { usePostAuthRegisterMutation } from '../../api/generated/investorApi';
import {
  validatePassword,
  latinNameError,
  LATIN_NAME_MESSAGE,
  normalizePhone,
  phoneError,
  isValidEmail,
  normalizeReferralCode,
} from '../../utils/passwordRules';
import { TextField } from '../../components/ui/TextField';
import { Button } from '../../components/ui/Button';
import { PasswordRules } from '../../components/auth/PasswordRules';
import {
  CountryDialCodePicker,
  DIAL_COUNTRIES,
  DialCountry,
} from '../../components/auth/CountryDialCodePicker';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

const LOGO_SOURCE = require('../../../assets/logo.png');
const FULL_NAME_MAX = 200;

export const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<DialCountry>(DIAL_COUNTRIES[0]);
  const [localPhone, setLocalPhone] = useState('');
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [password, setPassword] = useState('');

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const [register, { isLoading }] = usePostAuthRegisterMutation();

  const liveNameError = latinNameError(fullName);

  const buildFullE164Phone = () => {
    const trimmed = localPhone.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('+')) {
      return normalizePhone(trimmed);
    }
    const localDigits = normalizePhone(trimmed).replace(/^0+/, '');
    return `${selectedCountry.dialCode}${localDigits}`;
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!fullName.trim()) {
      errors.fullName = 'Full name is required.';
    } else if (fullName.trim().length > FULL_NAME_MAX) {
      errors.fullName = `Keep your name to ${FULL_NAME_MAX} characters.`;
    } else if (latinNameError(fullName)) {
      errors.fullName = LATIN_NAME_MESSAGE;
    }

    if (!isValidEmail(email)) {
      errors.email = 'Enter a valid email address.';
    }

    const fullPhone = buildFullE164Phone();
    const pErr = phoneError(fullPhone);
    if (pErr) {
      errors.phone = pErr;
    }

    const pwdCheck = validatePassword(password);
    if (!pwdCheck.isValid) {
      errors.password = 'Password must meet all requirements below.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async () => {
    setFormError(null);
    if (!validateForm()) return;

    const fullPhone = buildFullE164Phone();
    const cleanReferral = normalizeReferralCode(referralCode);

    try {
      const response = await register({
        body: {
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: fullPhone,
          password,
          ...(cleanReferral ? { referralCode: cleanReferral } : {}),
        },
      }).unwrap();

      navigation.navigate('VerifyEmail', {
        email: response.email,
        message: response.message,
      });
    } catch (err: any) {
      const errorCode = err?.data?.error?.code;
      const details = err?.data?.error?.details;

      if (errorCode === 'NAME_NOT_LATIN') {
        setFieldErrors((prev) => ({ ...prev, fullName: LATIN_NAME_MESSAGE }));
        return;
      }

      if (details?.fieldErrors && typeof details.fieldErrors === 'object') {
        const mapped: Record<string, string> = {};
        for (const [key, msgs] of Object.entries(details.fieldErrors)) {
          if (Array.isArray(msgs) && msgs.length > 0) {
            mapped[key] = String(msgs[0]);
          }
        }
        if (Object.keys(mapped).length > 0) {
          setFieldErrors(mapped);
          return;
        }
      }

      if (Array.isArray(details) && details.length > 0) {
        const mapped: Record<string, string> = {};
        details.forEach((d: any) => {
          const field = d.path?.[0];
          if (field && d.message) mapped[String(field)] = String(d.message);
        });
        if (Object.keys(mapped).length > 0) {
          setFieldErrors(mapped);
          return;
        }
      }

      if (err?.status === 429) {
        setFormError(
          err?.data?.error?.message ||
            'Too many registration attempts. Please wait before retrying.'
        );
      } else if (err?.status === 'FETCH_ERROR') {
        setFormError('Cannot reach the server. Check your internet connection.');
      } else {
        setFormError(
          err?.data?.error?.message ||
            err?.data?.message ||
            'Something went wrong. Please try again.'
        );
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
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 20) + 14,
            paddingBottom: Math.max(insets.bottom, 24) + 28,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
      >
        {/* Top Centered Logo + Heading */}
        <View style={styles.heroHeader}>
          <Image source={LOGO_SOURCE} style={styles.logo} resizeMode="contain" />
          <Text style={styles.title}>Get Started Now</Text>
          <Text style={styles.subtitle}>
            Create your investor account to explore curated real-asset opportunities
          </Text>
        </View>

        {/* Segmented Auth Mode Pill Switcher */}
        <View style={styles.modeSwitcher}>
          <TouchableOpacity
            style={styles.modeTab}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.8}
          >
            <Text style={styles.modeTabTextInactive}>Log In</Text>
          </TouchableOpacity>
          <View style={[styles.modeTab, styles.modeTabActive]}>
            <Text style={styles.modeTabTextActive}>Create Account</Text>
          </View>
        </View>

        {!!formError && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={17} color={colors.error} />
            <Text style={styles.errorBannerText}>{formError}</Text>
          </View>
        )}

        {/* Full Name */}
        <TextField
          label="Full Legal Name *"
          placeholder="Omar Al Mansoori"
          value={fullName}
          onChangeText={(val) => {
            setFullName(val);
            if (fieldErrors.fullName) {
              setFieldErrors((prev) => ({ ...prev, fullName: '' }));
            }
          }}
          autoCapitalize="words"
          hint="Use Latin letters exactly as shown on your passport."
          error={liveNameError || fieldErrors.fullName || undefined}
        />

        {/* Email */}
        <TextField
          label="Email Address *"
          placeholder="name@example.com"
          value={email}
          onChangeText={(val) => {
            setEmail(val);
            if (fieldErrors.email) {
              setFieldErrors((prev) => ({ ...prev, email: '' }));
            }
          }}
          keyboardType="email-address"
          autoComplete="email"
          autoCapitalize="none"
          error={fieldErrors.email || undefined}
        />

        {/* Unified Phone Number Input with Country Dial-Code Dropdown */}
        <View style={styles.phoneSection}>
          <Text style={styles.fieldLabel}>Phone Number *</Text>
          <View
            style={[
              styles.phoneUnifiedBox,
              phoneFocused && styles.phoneUnifiedBoxFocused,
              Boolean(fieldErrors.phone) && styles.phoneUnifiedBoxError,
            ]}
          >
            <CountryDialCodePicker
              selected={selectedCountry}
              onSelect={(c) => {
                setSelectedCountry(c);
                if (fieldErrors.phone) {
                  setFieldErrors((prev) => ({ ...prev, phone: '' }));
                }
              }}
            />
            <TextInput
              style={styles.phoneInput}
              placeholder={selectedCountry.example}
              placeholderTextColor="#A39E93"
              selectionColor={colors.primary}
              value={localPhone}
              onFocus={() => setPhoneFocused(true)}
              onBlur={() => setPhoneFocused(false)}
              onChangeText={(val) => {
                setLocalPhone(val);
                if (fieldErrors.phone) {
                  setFieldErrors((prev) => ({ ...prev, phone: '' }));
                }
              }}
              keyboardType="phone-pad"
              autoComplete="tel"
            />
          </View>
          {fieldErrors.phone ? (
            <Text style={styles.inlineError}>{fieldErrors.phone}</Text>
          ) : (
            <Text style={styles.fieldHint}>
              {selectedCountry.name} ({selectedCountry.dialCode})
            </Text>
          )}
        </View>

        {/* Password */}
        <TextField
          label="Password *"
          placeholder="Create a strong password"
          value={password}
          onChangeText={(val) => {
            setPassword(val);
            if (fieldErrors.password) {
              setFieldErrors((prev) => ({ ...prev, password: '' }));
            }
          }}
          isPassword
          error={fieldErrors.password || undefined}
        />

        <PasswordRules password={password} />

        {/* Optional Agent Referral Code */}
        <TextField
          label="Referral Code (Optional)"
          placeholder="BXA-XXXXXX"
          value={referralCode}
          onChangeText={setReferralCode}
          onBlur={() => setReferralCode(normalizeReferralCode(referralCode))}
          autoCapitalize="characters"
          autoCorrect={false}
        />

        <Button
          title="Sign Up"
          onPress={handleRegister}
          loading={isLoading}
          style={styles.submitButton}
        />

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
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
  heroHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 148,
    height: 48,
    marginBottom: 12,
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
    marginTop: 5,
    textAlign: 'center',
    lineHeight: 19,
  },
  modeSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#EFECE6',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
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
  errorBanner: {
    flexDirection: 'row',
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
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  fieldHint: {
    fontSize: 11.5,
    color: colors.textMuted,
    marginTop: 5,
    lineHeight: 15,
  },
  inlineError: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.error,
    marginTop: 5,
    lineHeight: 16,
  },
  phoneSection: {
    marginBottom: 15,
  },
  phoneUnifiedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#E5E0D8',
    overflow: 'hidden',
  },
  phoneUnifiedBoxFocused: {
    borderColor: colors.primary,
    backgroundColor: '#FFFDF9',
  },
  phoneUnifiedBoxError: {
    borderColor: colors.error,
    backgroundColor: '#FFFBFB',
  },
  phoneInput: {
    flex: 1,
    height: '100%',
    paddingVertical: 0,
    paddingHorizontal: 13,
    fontSize: 15,
    color: colors.text,
  },
  submitButton: {
    height: 50,
    borderRadius: 14,
    marginTop: 6,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 22,
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

