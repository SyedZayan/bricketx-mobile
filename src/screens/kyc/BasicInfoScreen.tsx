import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Platform,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { KycStackParamList } from '../../navigation/types';
import {
  usePatchKycMeBasicInfoMutation,
  useGetKycMeQuery,
} from '../../api/generated/investorApi';
import {
  LATIN_NAME_MESSAGE,
  latinNameError,
  toCountryCode,
  isCountryCode,
  cleanAmount,
  isValidAmount,
  toDateInputValue,
  getKycErrorMessage,
} from '../../features/kyc/kycUtils';
import { TextField } from '../../components/ui/TextField';
import { CountryPickerField } from '../../components/ui/CountryPickerModal';
import { Button } from '../../components/ui/Button';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

type Props = NativeStackScreenProps<KycStackParamList, 'BasicInfo'>;

const INVESTMENT_TIERS = [
  { label: '$25,000', value: '25000' },
  { label: '$50,000', value: '50000' },
  { label: '$100,000', value: '100000' },
  { label: '$250,000', value: '250000' },
];

export const BasicInfoScreen: React.FC<Props> = ({ navigation }) => {
  const { data: kycData } = useGetKycMeQuery(undefined);
  const [patchBasicInfo, { isLoading }] = usePatchKycMeBasicInfoMutation();

  const profile = kycData?.kycProfile;

  const [fullLegalName, setFullLegalName] = useState(profile?.fullLegalName || '');
  const [dateOfBirth, setDateOfBirth] = useState(
    toDateInputValue(profile?.dateOfBirth)
  );
  const [nationality, setNationality] = useState(
    toCountryCode(profile?.nationality)
  );
  const [countryOfResidence, setCountryOfResidence] = useState(
    toCountryCode(profile?.countryOfResidence)
  );
  const [countryOfCitizenship, setCountryOfCitizenship] = useState(
    toCountryCode(profile?.countryOfCitizenship)
  );
  const [expectedInvestmentAmount, setExpectedInvestmentAmount] = useState(
    profile?.expectedInvestmentAmount || '50000'
  );
  const [taxId, setTaxId] = useState(profile?.taxId || '');
  const [isPep, setIsPep] = useState<boolean>(profile?.isPep || false);
  const [pepDetails, setPepDetails] = useState(profile?.pepDetails || '');
  const [heardAboutUs, setHeardAboutUs] = useState(profile?.heardAboutUs || '');

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    if (profile.fullLegalName) setFullLegalName(profile.fullLegalName);
    if (profile.dateOfBirth) setDateOfBirth(toDateInputValue(profile.dateOfBirth));
    if (profile.nationality) setNationality(toCountryCode(profile.nationality));
    if (profile.countryOfResidence)
      setCountryOfResidence(toCountryCode(profile.countryOfResidence));
    if (profile.countryOfCitizenship)
      setCountryOfCitizenship(toCountryCode(profile.countryOfCitizenship));
    if (profile.expectedInvestmentAmount)
      setExpectedInvestmentAmount(profile.expectedInvestmentAmount);
    if (profile.taxId) setTaxId(profile.taxId);
    if (typeof profile.isPep === 'boolean') setIsPep(profile.isPep);
    if (profile.pepDetails) setPepDetails(profile.pepDetails);
    if (profile.heardAboutUs) setHeardAboutUs(profile.heardAboutUs);
  }, [profile]);

  const liveNameError = latinNameError(fullLegalName);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    const cleanName = fullLegalName.trim();
    const cleanDob = toDateInputValue(dateOfBirth);

    if (!cleanName) {
      errors.fullLegalName = 'Full legal name is required.';
    } else if (latinNameError(cleanName)) {
      errors.fullLegalName = LATIN_NAME_MESSAGE;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanDob)) {
      errors.dateOfBirth = 'Enter date of birth in YYYY-MM-DD format (e.g. 1995-05-14).';
    }

    if (!isCountryCode(nationality)) {
      errors.nationality = 'Select your nationality.';
    }
    if (!isCountryCode(countryOfResidence)) {
      errors.countryOfResidence = 'Select your country of residence.';
    }
    if (!isCountryCode(countryOfCitizenship)) {
      errors.countryOfCitizenship = 'Select your country of citizenship.';
    }

    if (!isValidAmount(expectedInvestmentAmount)) {
      errors.expectedInvestmentAmount =
        'Enter a valid amount in digits (e.g. 50000).';
    }

    if (isPep && !pepDetails.trim()) {
      errors.pepDetails = 'Provide details since you indicated PEP status.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleContinue = async () => {
    setErrorMessage(null);
    if (!validate()) return;

    try {
      await patchBasicInfo({
        body: {
          fullLegalName: fullLegalName.trim(),
          dateOfBirth: toDateInputValue(dateOfBirth),
          nationality: toCountryCode(nationality),
          countryOfResidence: toCountryCode(countryOfResidence),
          countryOfCitizenship: toCountryCode(countryOfCitizenship),
          expectedInvestmentAmount: cleanAmount(expectedInvestmentAmount),
          isPep,
          ...(isPep ? { pepDetails: pepDetails.trim() } : {}),
          ...(taxId.trim() ? { taxId: taxId.trim() } : {}),
          ...(heardAboutUs.trim() ? { heardAboutUs: heardAboutUs.trim() } : {}),
        },
      }).unwrap();

      navigation.navigate('InvestorType');
    } catch (err: any) {
      if (err?.data?.error?.code === 'NAME_NOT_LATIN') {
        setFieldErrors((prev) => ({ ...prev, fullLegalName: LATIN_NAME_MESSAGE }));
        return;
      }
      setErrorMessage(
        getKycErrorMessage(err, 'Failed to save basic info. Please check your inputs.')
      );
    }
  };

  return (
    <KeyboardAwareScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      enableOnAndroid={true}
      enableAutomaticScroll={true}
      extraScrollHeight={Platform.OS === 'android' ? 120 : 64}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.stepHeader}>
        <Text style={styles.stepBadge}>STEP 1 OF 6</Text>
        <Text style={styles.title}>Personal Information</Text>
        <Text style={styles.subtitle}>
          Ensure your details match your passport or government-issued photo ID.
        </Text>
      </View>

      <View style={styles.formCard}>
        {!!errorMessage && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        <TextField
          label="Full Legal Name *"
          placeholder="e.g. Omar Al Mansoori"
          value={fullLegalName}
          onChangeText={(v) => {
            setFullLegalName(v);
            if (fieldErrors.fullLegalName)
              setFieldErrors((p) => ({ ...p, fullLegalName: '' }));
          }}
          autoCapitalize="words"
          maxLength={200}
          hint={LATIN_NAME_MESSAGE}
          error={liveNameError || fieldErrors.fullLegalName || undefined}
        />

        <TextField
          label="Date of Birth (YYYY-MM-DD) *"
          placeholder="1995-05-14"
          value={dateOfBirth}
          onChangeText={(v) => {
            setDateOfBirth(v);
            if (fieldErrors.dateOfBirth)
              setFieldErrors((p) => ({ ...p, dateOfBirth: '' }));
          }}
          keyboardType="numbers-and-punctuation"
          maxLength={10}
          error={fieldErrors.dateOfBirth}
        />

        <CountryPickerField
          label="Nationality *"
          placeholder="Select nationality"
          value={nationality}
          onChange={(code) => {
            setNationality(code);
            if (fieldErrors.nationality)
              setFieldErrors((p) => ({ ...p, nationality: '' }));
          }}
          error={fieldErrors.nationality}
        />

        <CountryPickerField
          label="Country of Residence *"
          placeholder="Select country of residence"
          value={countryOfResidence}
          onChange={(code) => {
            setCountryOfResidence(code);
            if (fieldErrors.countryOfResidence)
              setFieldErrors((p) => ({ ...p, countryOfResidence: '' }));
          }}
          error={fieldErrors.countryOfResidence}
        />

        <CountryPickerField
          label="Country of Citizenship *"
          placeholder="Select country of citizenship"
          value={countryOfCitizenship}
          onChange={(code) => {
            setCountryOfCitizenship(code);
            if (fieldErrors.countryOfCitizenship)
              setFieldErrors((p) => ({ ...p, countryOfCitizenship: '' }));
          }}
          error={fieldErrors.countryOfCitizenship}
        />

        <View style={styles.sectionField}>
          <Text style={styles.fieldLabel}>Expected Investment Amount (USD) *</Text>
          <View style={styles.tierContainer}>
            {INVESTMENT_TIERS.map((tier) => {
              const isSelected = cleanAmount(expectedInvestmentAmount) === tier.value;
              return (
                <TouchableOpacity
                  key={tier.value}
                  style={[styles.tierOption, isSelected && styles.tierOptionActive]}
                  onPress={() => {
                    setExpectedInvestmentAmount(tier.value);
                    if (fieldErrors.expectedInvestmentAmount)
                      setFieldErrors((p) => ({ ...p, expectedInvestmentAmount: '' }));
                  }}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.tierText, isSelected && styles.tierTextActive]}>
                    {tier.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <TextField
            label="Or enter custom amount (USD)"
            placeholder="e.g. 50000"
            value={expectedInvestmentAmount}
            onChangeText={(v) => {
              setExpectedInvestmentAmount(v);
              if (fieldErrors.expectedInvestmentAmount)
                setFieldErrors((p) => ({ ...p, expectedInvestmentAmount: '' }));
            }}
            keyboardType="decimal-pad"
            error={fieldErrors.expectedInvestmentAmount}
          />
        </View>

        <TextField
          label="Tax ID / NTN / TIN (Optional)"
          placeholder="Enter tax identification number"
          value={taxId}
          onChangeText={setTaxId}
          maxLength={50}
        />

        <View style={styles.pepContainer}>
          <View style={styles.pepTextWrap}>
            <Text style={styles.pepTitle}>Politically Exposed Person (PEP)</Text>
            <Text style={styles.pepSub}>
              Are you or an immediate family member a senior public official or diplomat?
            </Text>
          </View>
          <Switch
            value={isPep}
            onValueChange={setIsPep}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        {isPep && (
          <TextField
            label="PEP Role & Details *"
            placeholder="Describe public office or relation"
            value={pepDetails}
            onChangeText={(v) => {
              setPepDetails(v);
              if (fieldErrors.pepDetails)
                setFieldErrors((p) => ({ ...p, pepDetails: '' }));
            }}
            multiline
            numberOfLines={3}
            maxLength={2000}
            error={fieldErrors.pepDetails}
          />
        )}

        <TextField
          label="How did you hear about us? (Optional)"
          placeholder="e.g. Referral, LinkedIn, Web"
          value={heardAboutUs}
          onChangeText={setHeardAboutUs}
          maxLength={200}
        />

        <Button
          title="Save & Continue"
          onPress={handleContinue}
          loading={isLoading}
          style={styles.submitBtn}
        />
      </View>
    </KeyboardAwareScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl + 40,
  },
  stepHeader: {
    marginBottom: spacing.md,
  },
  stepBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 1,
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  formCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  errorBanner: {
    backgroundColor: colors.errorBg,
    padding: spacing.sm,
    borderRadius: spacing.radiusSm,
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    textAlign: 'center',
  },
  sectionField: {
    marginBottom: spacing.xs,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  tierContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: spacing.sm,
  },
  tierOption: {
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: spacing.radiusSm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  tierOptionActive: {
    borderColor: colors.primary,
    backgroundColor: '#FAF5EE',
  },
  tierText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
  tierTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  pepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    marginVertical: spacing.md,
  },
  pepTextWrap: {
    flex: 1,
    paddingRight: spacing.md,
  },
  pepTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  pepSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: 16,
  },
  submitBtn: {
    marginTop: spacing.md,
  },
});
