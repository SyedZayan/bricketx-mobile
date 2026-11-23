import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { KycStackParamList } from '../../navigation/types';
import {
  usePutKycMeIndividualDetailsMutation,
  useGetKycMeQuery,
} from '../../api/generated/investorApi';
import {
  LATIN_NAME_MESSAGE,
  latinNameError,
  getKycErrorMessage,
} from '../../features/kyc/kycUtils';
import { TextField } from '../../components/ui/TextField';
import { Button } from '../../components/ui/Button';
import { InlineErrorBanner } from '../../components/common/InlineErrorBanner';
import { normalizeError } from '../../utils/errorHandler';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

type Props = NativeStackScreenProps<KycStackParamList, 'IndividualDetails'>;

export const IndividualDetailsScreen: React.FC<Props> = ({ navigation }) => {
  const { data: kycData } = useGetKycMeQuery(undefined);
  const [putIndividualDetails, { isLoading }] = usePutKycMeIndividualDetailsMutation();

  const details = kycData?.individualDetails;

  const [fatherOrHusbandName, setFatherOrHusbandName] = useState(
    details?.fatherOrHusbandName || ''
  );
  const [residentialAddress, setResidentialAddress] = useState(
    details?.residentialAddress || ''
  );
  const [occupation, setOccupation] = useState(details?.occupation || '');
  const [employerName, setEmployerName] = useState(details?.employerName || '');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rawError, setRawError] = useState<unknown>(null);

  useEffect(() => {
    if (!details) return;
    if (details.fatherOrHusbandName) setFatherOrHusbandName(details.fatherOrHusbandName);
    if (details.residentialAddress) setResidentialAddress(details.residentialAddress);
    if (details.occupation) setOccupation(details.occupation);
    if (details.employerName) setEmployerName(details.employerName);
  }, [details]);

  const liveFatherError = latinNameError(fatherOrHusbandName);

  const handleContinue = async () => {
    setErrorMessage(null);
    setRawError(null);
    const errors: Record<string, string> = {};

    if (!residentialAddress.trim()) {
      errors.residentialAddress = 'Full residential address is required.';
    }
    if (latinNameError(fatherOrHusbandName)) {
      errors.fatherOrHusbandName = LATIN_NAME_MESSAGE;
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      await putIndividualDetails({
        body: {
          residentialAddress: residentialAddress.trim(),
          ...(fatherOrHusbandName.trim()
            ? { fatherOrHusbandName: fatherOrHusbandName.trim() }
            : {}),
          ...(occupation.trim() ? { occupation: occupation.trim() } : {}),
          ...(employerName.trim() ? { employerName: employerName.trim() } : {}),
        },
      }).unwrap();

      navigation.navigate('IdentityDocs');
    } catch (err: any) {
      setRawError(err);
      if (err?.data?.error?.code === 'NAME_NOT_LATIN') {
        setFieldErrors((prev) => ({
          ...prev,
          fatherOrHusbandName: LATIN_NAME_MESSAGE,
        }));
        return;
      }
      setErrorMessage(
        getKycErrorMessage(err, 'Failed to save residential and employment details.')
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
        <Text style={styles.stepBadge}>STEP 3 OF 6</Text>
        <Text style={styles.title}>Residential & Employment</Text>
        <Text style={styles.subtitle}>
          Provide your current physical residence address and primary employment details.
        </Text>
      </View>

      <View style={styles.formCard}>
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

        <TextField
          label="Residential Street Address *"
          placeholder="Building, street, apartment/unit, city, postal code"
          value={residentialAddress}
          onChangeText={(v) => {
            setResidentialAddress(v);
            if (fieldErrors.residentialAddress)
              setFieldErrors((p) => ({ ...p, residentialAddress: '' }));
          }}
          multiline
          numberOfLines={3}
          error={fieldErrors.residentialAddress}
        />

        <TextField
          label="Father's / Husband's Name (Optional)"
          placeholder="Full legal name in Latin letters"
          value={fatherOrHusbandName}
          onChangeText={(v) => {
            setFatherOrHusbandName(v);
            if (fieldErrors.fatherOrHusbandName)
              setFieldErrors((p) => ({ ...p, fatherOrHusbandName: '' }));
          }}
          maxLength={200}
          hint={LATIN_NAME_MESSAGE}
          error={liveFatherError || fieldErrors.fatherOrHusbandName || undefined}
        />

        <TextField
          label="Occupation / Profession (Optional)"
          placeholder="e.g. Software Engineer, Business Owner"
          value={occupation}
          onChangeText={setOccupation}
          maxLength={150}
        />

        <TextField
          label="Employer / Business Name (Optional)"
          placeholder="e.g. BricketX, Self-employed"
          value={employerName}
          onChangeText={setEmployerName}
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
  submitBtn: {
    marginTop: spacing.md,
  },
});
