import React, { useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { KycStackParamList } from '../../navigation/types';
import {
  usePatchKycMeInvestorTypeMutation,
  useGetKycMeQuery,
} from '../../api/generated/investorApi';
import { Button } from '../../components/ui/Button';
import { InlineErrorBanner } from '../../components/common/InlineErrorBanner';
import { normalizeError } from '../../utils/errorHandler';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

type Props = NativeStackScreenProps<KycStackParamList, 'InvestorType'>;

export const InvestorTypeScreen: React.FC<Props> = ({ navigation }) => {
  const { data: kycData } = useGetKycMeQuery(undefined);
  const [patchInvestorType, { isLoading }] = usePatchKycMeInvestorTypeMutation();

  const profile = kycData?.kycProfile;

  const [kycType, setKycType] = useState<'individual' | 'business'>(
    profile?.kycType === 'business' ? 'business' : 'individual'
  );
  const [actingOnBehalf, setActingOnBehalf] = useState<boolean>(
    profile?.actingOnBehalf || false
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rawError, setRawError] = useState<unknown>(null);

  const handleContinue = async () => {
    setErrorMessage(null);
    setRawError(null);

    try {
      const payload = {
        kycType,
        actingOnBehalf,
      };

      console.log('Submitting investor-type payload:', JSON.stringify(payload, null, 2));

      await patchInvestorType({ body: payload }).unwrap();

      // Individual proceeds to IndividualDetails; Business proceeds to CompanyKyb
      if (kycType === 'individual') {
        navigation.navigate('IndividualDetails');
      } else {
        navigation.navigate('CompanyKyb');
      }
    } catch (err: any) {
      setRawError(err);
      console.log('Error submitting investor-type:', JSON.stringify(err, null, 2));
      setErrorMessage(
        err?.data?.error?.message ||
          'Failed to save investor classification. Please try again.'
      );
    }
  };

  return (
    <KeyboardAwareScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      enableOnAndroid={true}
      extraScrollHeight={Platform.OS === 'android' ? 100 : 50}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.stepHeader}>
        <Text style={styles.stepBadge}>STEP 2 OF 5</Text>
        <Text style={styles.title}>Investor Classification</Text>
        <Text style={styles.subtitle}>
          Select whether you are investing as a private individual or on behalf of a registered legal entity.
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

        {/* Individual Option Card */}
        <TouchableOpacity
          style={[
            styles.typeCard,
            kycType === 'individual' && styles.typeCardActive,
          ]}
          onPress={() => setKycType('individual')}
          activeOpacity={0.8}
        >
          <View style={styles.typeIconContainer}>
            <Ionicons
              name="person-outline"
              size={26}
              color={kycType === 'individual' ? colors.primary : colors.slate}
            />
          </View>
          <View style={styles.typeTextWrap}>
            <Text
              style={[
                styles.typeTitle,
                kycType === 'individual' && styles.typeTitleActive,
              ]}
            >
              Individual Investor
            </Text>
            <Text style={styles.typeSub}>
              Invest personal capital in your own name as a verified natural person.
            </Text>
          </View>
          <View
            style={[
              styles.radioCircle,
              kycType === 'individual' && styles.radioCircleActive,
            ]}
          >
            {kycType === 'individual' && <View style={styles.radioInner} />}
          </View>
        </TouchableOpacity>

        {/* Business/Institutional Option Card */}
        <TouchableOpacity
          style={[
            styles.typeCard,
            kycType === 'business' && styles.typeCardActive,
          ]}
          onPress={() => setKycType('business')}
          activeOpacity={0.8}
        >
          <View style={styles.typeIconContainer}>
            <Ionicons
              name="business-outline"
              size={26}
              color={kycType === 'business' ? colors.primary : colors.slate}
            />
          </View>
          <View style={styles.typeTextWrap}>
            <Text
              style={[
                styles.typeTitle,
                kycType === 'business' && styles.typeTitleActive,
              ]}
            >
              Corporate / Entity
            </Text>
            <Text style={styles.typeSub}>
              Invest through a corporation, holding company, trust, or partnership.
            </Text>
          </View>
          <View
            style={[
              styles.radioCircle,
              kycType === 'business' && styles.radioCircleActive,
            ]}
          >
            {kycType === 'business' && <View style={styles.radioInner} />}
          </View>
        </TouchableOpacity>

        {/* Acting on behalf switch */}
        <View style={styles.behalfContainer}>
          <View style={styles.behalfTextWrap}>
            <Text style={styles.behalfTitle}>Acting on Behalf of a Third Party</Text>
            <Text style={styles.behalfSub}>
              Are you completing this verification or managing funds on behalf of another ultimate beneficiary?
            </Text>
          </View>
          <Switch
            value={actingOnBehalf}
            onValueChange={setActingOnBehalf}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={'#FFFFFF'}
          />
        </View>

        <Button
          title="Save & Proceed"
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
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: spacing.radiusMd,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  typeCardActive: {
    borderColor: colors.primary,
    backgroundColor: '#FAF5EE',
  },
  typeIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  typeTextWrap: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  typeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  typeTitleActive: {
    color: colors.primary,
  },
  typeSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: 16,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  behalfContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    marginVertical: spacing.sm,
  },
  behalfTextWrap: {
    flex: 1,
    paddingRight: spacing.md,
  },
  behalfTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  behalfSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: 16,
  },
  submitBtn: {
    marginTop: spacing.md,
  },
});