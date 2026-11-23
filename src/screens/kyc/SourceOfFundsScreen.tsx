import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { KycStackParamList } from '../../navigation/types';
import {
  usePutKycMeSourceOfFundsMutation,
  useGetKycMeQuery,
  type SourceOfFunds,
} from '../../api/generated/investorApi';
import {
  PRIMARY_SOURCE_OPTIONS,
  cleanAmount,
  isValidAmount,
  getKycErrorMessage,
} from '../../features/kyc/kycUtils';
import { TextField } from '../../components/ui/TextField';
import { Button } from '../../components/ui/Button';
import { InlineErrorBanner } from '../../components/common/InlineErrorBanner';
import { normalizeError } from '../../utils/errorHandler';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

type Props = NativeStackScreenProps<KycStackParamList, 'SourceOfFunds'>;

export const SourceOfFundsScreen: React.FC<Props> = ({ navigation }) => {
  const { data: kycData } = useGetKycMeQuery(undefined);
  const [putSourceOfFunds, { isLoading }] = usePutKycMeSourceOfFundsMutation();

  const existingSource = kycData?.sourceOfFunds;

  const [primarySource, setPrimarySource] = useState<
    SourceOfFunds['primarySource']
  >(existingSource?.primarySource || 'salary');
  const [sourceOfWealth, setSourceOfWealth] = useState(
    existingSource?.sourceOfWealth || ''
  );
  const [annualIncome, setAnnualIncome] = useState(
    existingSource?.annualIncome || ''
  );
  const [currency, setCurrency] = useState(existingSource?.currency || 'USD');
  const [explanation, setExplanation] = useState(
    existingSource?.explanation || ''
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rawError, setRawError] = useState<unknown>(null);

  useEffect(() => {
    if (!existingSource) return;
    if (existingSource.primarySource) setPrimarySource(existingSource.primarySource);
    if (existingSource.sourceOfWealth) setSourceOfWealth(existingSource.sourceOfWealth);
    if (existingSource.annualIncome) setAnnualIncome(existingSource.annualIncome);
    if (existingSource.currency) setCurrency(existingSource.currency);
    if (existingSource.explanation) setExplanation(existingSource.explanation);
  }, [existingSource]);

  const handleContinue = async () => {
    setErrorMessage(null);
    setRawError(null);

    if (annualIncome.trim() && !isValidAmount(annualIncome)) {
      setErrorMessage(
        'Enter annual income in digits with at most two decimals (e.g. 120000).'
      );
      return;
    }

    const cleanCurrency = currency.trim().toUpperCase();
    if (cleanCurrency && cleanCurrency.length !== 3) {
      setErrorMessage('Use a 3-letter currency code (e.g. USD, AED, PKR, GBP).');
      return;
    }

    try {
      await putSourceOfFunds({
        body: {
          primarySource,
          ...(sourceOfWealth.trim()
            ? { sourceOfWealth: sourceOfWealth.trim() }
            : {}),
          ...(annualIncome.trim()
            ? { annualIncome: cleanAmount(annualIncome) }
            : {}),
          ...(cleanCurrency ? { currency: cleanCurrency } : {}),
          ...(explanation.trim() ? { explanation: explanation.trim() } : {}),
        },
      }).unwrap();

      navigation.navigate('ReviewSubmit');
    } catch (err: any) {
      setRawError(err);
      setErrorMessage(
        getKycErrorMessage(err, 'Failed to save source of funds declaration.')
      );
    }
  };

  return (
    <KeyboardAwareScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      enableOnAndroid={true}
      extraScrollHeight={Platform.OS === 'android' ? 120 : 64}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.stepHeader}>
        <Text style={styles.stepBadge}>STEP 5 OF 6</Text>
        <Text style={styles.title}>Source of Funds</Text>
        <Text style={styles.subtitle}>
          Financial compliance regulations require verification of capital origins for all investment accounts.
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

        <Text style={styles.sectionLabel}>Primary Source of Invested Capital *</Text>
        <View style={styles.sourceGrid}>
          {PRIMARY_SOURCE_OPTIONS.map((item) => {
            const isSelected = primarySource === item.value;
            return (
              <TouchableOpacity
                key={item.value}
                style={[styles.sourceCard, isSelected && styles.sourceCardActive]}
                onPress={() => setPrimarySource(item.value)}
                activeOpacity={0.75}
              >
                <Text
                  style={[styles.sourceText, isSelected && styles.sourceTextActive]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TextField
          label="Source of Overall Wealth (Optional)"
          placeholder="e.g. Tech consulting, Retained business profits"
          value={sourceOfWealth}
          onChangeText={setSourceOfWealth}
          maxLength={500}
        />

        <View style={styles.row}>
          <View style={{ flex: 2 }}>
            <TextField
              label="Estimated Annual Income (Optional)"
              placeholder="e.g. 120000"
              value={annualIncome}
              onChangeText={setAnnualIncome}
              keyboardType="decimal-pad"
            />
          </View>
          <View style={{ width: spacing.md }} />
          <View style={{ flex: 1 }}>
            <TextField
              label="Currency"
              placeholder="USD"
              value={currency}
              onChangeText={(t) => setCurrency(t.toUpperCase())}
              maxLength={3}
              autoCapitalize="characters"
            />
          </View>
        </View>

        <TextField
          label={
            primarySource === 'other'
              ? 'Explanation of Capital Source *'
              : 'Additional Explanation (Optional)'
          }
          placeholder="Provide any supporting context regarding your funds"
          value={explanation}
          onChangeText={setExplanation}
          multiline
          numberOfLines={3}
          maxLength={2000}
        />

        <Button
          title="Save & Proceed to Review"
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
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  sourceGrid: {
    gap: 8,
    marginBottom: spacing.md,
  },
  sourceCard: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: spacing.radiusSm,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  sourceCardActive: {
    borderColor: colors.primary,
    backgroundColor: '#FAF5EE',
  },
  sourceText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '500',
  },
  sourceTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
  },
  submitBtn: {
    marginTop: spacing.md,
  },
});
