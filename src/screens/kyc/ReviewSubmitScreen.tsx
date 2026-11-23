import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { KycStackParamList } from '../../navigation/types';
import {
  usePostKycMeSubmitMutation,
  useGetKycMeQuery,
} from '../../api/generated/investorApi';
import {
  computeMissingItems,
  getMissingItemsFromError,
  getKycErrorMessage,
  countryName,
  formatMoney,
  formatPrimarySource,
  toDateInputValue,
  DOCUMENT_TYPE_LABELS,
  type MissingItem,
} from '../../features/kyc/kycUtils';
import { Button } from '../../components/ui/Button';
import { InlineErrorBanner } from '../../components/common/InlineErrorBanner';
import { normalizeError } from '../../utils/errorHandler';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

type Props = NativeStackScreenProps<KycStackParamList, 'ReviewSubmit'>;

export const ReviewSubmitScreen: React.FC<Props> = ({ navigation }) => {
  const { data: kycData, isLoading: isFetching, refetch } = useGetKycMeQuery(undefined);
  const [submitKyc, { isLoading }] = usePostKycMeSubmitMutation();

  const [declarationAccepted, setDeclarationAccepted] = useState(
    Boolean(kycData?.kycProfile?.declarationAccepted)
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rawError, setRawError] = useState<unknown>(null);
  const [submitMissing, setSubmitMissing] = useState<MissingItem[] | null>(null);

  const proactiveMissing = useMemo(
    () => (kycData ? computeMissingItems(kycData) : []),
    [kycData]
  );
  const missingItems = submitMissing ?? proactiveMissing;

  if (isFetching || !kycData) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const { kycProfile, individualDetails, companyKyc, documents, sourceOfFunds } = kycData;
  const isBusiness = kycProfile.kycType === 'business';

  const handleSubmit = async () => {
    if (!declarationAccepted) {
      setErrorMessage('You must accept the compliance declaration to submit.');
      return;
    }

    setErrorMessage(null);
    setRawError(null);
    setSubmitMissing(null);

    try {
      await submitKyc({
        body: { declarationAccepted: true },
      }).unwrap();

      await refetch();
      navigation.getParent()?.goBack();
    } catch (err: any) {
      setRawError(err);
      const missing = getMissingItemsFromError(err, kycData);
      if (missing.length > 0) {
        setSubmitMissing(missing);
      } else {
        setErrorMessage(
          getKycErrorMessage(err, 'Failed to submit verification. Please retry.')
        );
      }
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepBadge}>STEP 6 OF 6 • FINAL REVIEW</Text>
        <Text style={styles.title}>Review & Submit</Text>
        <Text style={styles.subtitle}>
          Verify all information and uploaded documents before submitting for compliance review.
        </Text>
      </View>

      {missingItems.length > 0 && (
        <View style={styles.missingCard}>
          <View style={styles.missingHeader}>
            <Ionicons name="warning-outline" size={18} color="#B26A00" />
            <Text style={styles.missingTitle}>
              {submitMissing
                ? 'Your application is incomplete:'
                : 'Complete these items before submitting:'}
            </Text>
          </View>
          {missingItems.map((item) => (
            <View key={item.raw} style={styles.missingRow}>
              <Text style={styles.missingItemText}>• {item.label}</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate(item.targetRoute as any)}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Text style={styles.fixLink}>Fix ?</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
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

      {/* 1. Personal Info */}
      <View style={styles.formCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Personal Information</Text>
          <TouchableOpacity onPress={() => navigation.navigate('BasicInfo')}>
            <Text style={styles.editLink}>Edit</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Full Legal Name</Text>
          <Text style={styles.summaryValue}>{kycProfile.fullLegalName || '-'}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Date of Birth</Text>
          <Text style={styles.summaryValue}>
            {toDateInputValue(kycProfile.dateOfBirth) || '-'}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Nationality</Text>
          <Text style={styles.summaryValue}>
            {countryName(kycProfile.nationality) || '-'}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Country of Residence</Text>
          <Text style={styles.summaryValue}>
            {countryName(kycProfile.countryOfResidence) || '-'}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Expected Investment</Text>
          <Text style={styles.summaryValue}>
            {formatMoney(kycProfile.expectedInvestmentAmount)}
          </Text>
        </View>
      </View>

      {/* 2. Investor Classification & Branch Details */}
      <View style={styles.formCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>
            {isBusiness ? 'Company & Directors' : 'Residential & Employment'}
          </Text>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate(isBusiness ? 'CompanyKyb' : 'IndividualDetails')
            }
          >
            <Text style={styles.editLink}>Edit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Account Type</Text>
          <Text style={styles.summaryValue}>
            {isBusiness ? 'Corporate / Entity' : 'Individual'}
          </Text>
        </View>

        {isBusiness ? (
          <>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Company Name</Text>
              <Text style={styles.summaryValue}>{companyKyc?.companyName || '-'}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Registration No.</Text>
              <Text style={styles.summaryValue}>{companyKyc?.regNumber || '-'}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Jurisdiction</Text>
              <Text style={styles.summaryValue}>
                {countryName(companyKyc?.jurisdiction) || '-'}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Directors</Text>
              <Text style={styles.summaryValue}>
                {companyKyc?.directors?.length
                  ? companyKyc.directors.map((d) => d.fullName).join(', ')
                  : 'None added'}
              </Text>
            </View>
          </>
        ) : (
          <>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Residential Address</Text>
              <Text style={styles.summaryValue}>
                {individualDetails?.residentialAddress || '-'}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Occupation</Text>
              <Text style={styles.summaryValue}>
                {individualDetails?.occupation || '-'}
              </Text>
            </View>
          </>
        )}
      </View>

      {/* 3. Documents */}
      <View style={styles.formCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Uploaded Documents ({documents.length})</Text>
          <TouchableOpacity onPress={() => navigation.navigate('IdentityDocs')}>
            <Text style={styles.editLink}>Edit</Text>
          </TouchableOpacity>
        </View>
        {documents.length === 0 ? (
          <Text style={styles.emptyDocText}>No documents uploaded yet.</Text>
        ) : (
          documents.map((doc) => (
            <View key={doc.id} style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>
                {DOCUMENT_TYPE_LABELS[doc.documentType] || doc.documentType}
              </Text>
              <Text
                style={[
                  styles.summaryValue,
                  doc.status === 'rejected' && { color: colors.error },
                ]}
              >
                {doc.status.replace(/_/g, ' ')}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* 4. Source of Funds */}
      <View style={styles.formCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Source of Funds</Text>
          <TouchableOpacity onPress={() => navigation.navigate('SourceOfFunds')}>
            <Text style={styles.editLink}>Edit</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Primary Source</Text>
          <Text style={styles.summaryValue}>
            {formatPrimarySource(sourceOfFunds?.primarySource)}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Annual Income</Text>
          <Text style={styles.summaryValue}>
            {formatMoney(sourceOfFunds?.annualIncome, sourceOfFunds?.currency)}
          </Text>
        </View>
      </View>

      {/* Declaration & Submit */}
      <View style={styles.formCard}>
        <View style={styles.declarationBox}>
          <Switch
            value={declarationAccepted}
            onValueChange={setDeclarationAccepted}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
          <Text style={styles.declarationText}>
            I declare that the information and documents provided are true, complete, and accurate to the best of my knowledge, and that invested funds originate from lawful sources.
          </Text>
        </View>

        <Button
          title="Confirm & Submit Verification"
          onPress={handleSubmit}
          loading={isLoading}
          disabled={!declarationAccepted || missingItems.length > 0}
          style={styles.submitBtn}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
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
  missingCard: {
    backgroundColor: '#FFF8E1',
    borderWidth: 1,
    borderColor: '#FFE082',
    borderRadius: spacing.radiusMd,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  missingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  missingTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8D5B00',
  },
  missingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  missingItemText: {
    flex: 1,
    fontSize: 12.5,
    color: colors.text,
  },
  fixLink: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.primary,
    marginLeft: 8,
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
  formCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  editLink: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: 12,
  },
  summaryLabel: {
    fontSize: 13,
    color: colors.textMuted,
    flex: 1,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    flex: 1.3,
    textAlign: 'right',
    textTransform: 'capitalize',
  },
  emptyDocText: {
    fontSize: 13,
    color: colors.textMuted,
    paddingVertical: 6,
  },
  declarationBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  declarationText: {
    flex: 1,
    fontSize: 12.5,
    color: colors.text,
    lineHeight: 18,
  },
  submitBtn: {
    marginTop: spacing.lg,
  },
});
