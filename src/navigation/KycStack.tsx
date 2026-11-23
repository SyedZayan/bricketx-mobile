import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { KycStackParamList } from './types';
import {
  useGetKycMeQuery,
  usePostKycMeSubmitMutation,
  usePostKycMeRestartMutation,
} from '../api/generated/investorApi';
import {
  resolveMobileStepFromServer,
  individualDocumentSlots,
  businessDocumentGroups,
  findSlotDocument,
  getKycErrorMessage,
  getMissingItemsFromError,
} from '../features/kyc/kycUtils';
import { DocumentSlotCard } from '../components/kyc/DocumentSlotCard';
import { Button } from '../components/ui/Button';
import { InlineErrorBanner } from '../components/common/InlineErrorBanner';
import { normalizeError } from '../utils/errorHandler';
import { BasicInfoScreen } from '../screens/kyc/BasicInfoScreen';
import { InvestorTypeScreen } from '../screens/kyc/InvestorTypeScreen';
import { IndividualDetailsScreen } from '../screens/kyc/IndividualDetailsScreen';
import { CompanyKybScreen } from '../screens/kyc/CompanyKybScreen';
import { IdentityDocsScreen } from '../screens/kyc/IdentityDocsScreen';
import { SourceOfFundsScreen } from '../screens/kyc/SourceOfFundsScreen';
import { ReviewSubmitScreen } from '../screens/kyc/ReviewSubmitScreen';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

const Stack = createNativeStackNavigator<KycStackParamList>();

export const KycStack = ({ navigation }: any) => {
  const { data: kycData, isLoading, refetch } = useGetKycMeQuery(undefined);
  const [resubmitKyc, { isLoading: isResubmitting }] = usePostKycMeSubmitMutation();
  const [restartKyc, { isLoading: isRestarting }] = usePostKycMeRestartMutation();
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [rawActionError, setRawActionError] = React.useState<unknown>(null);

  if (isLoading || !kycData) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading KYC status…</Text>
      </View>
    );
  }

  const status = kycData.kycProfile.status;

  // Handle More Info Requested directly with flagged document re-upload & resubmit
  if (status === 'more_info_requested') {
    const isBusiness = kycData.kycProfile.kycType === 'business';
    const groups = isBusiness
      ? businessDocumentGroups(
          kycData.companyKyc?.id,
          kycData.companyKyc?.directors ?? [],
          kycData.companyKyc?.uboRecords ?? []
        )
      : [{ title: 'Your Documents', slots: individualDocumentSlots() }];
    const allSlots = groups.flatMap((g) => g.slots);
    const latestReview = kycData.reviews?.[0];

    const handleResubmit = async () => {
      setActionError(null);
    setRawActionError(null);
      try {
        await resubmitKyc({ body: { declarationAccepted: true } }).unwrap();
        await refetch();
        navigation.goBack();
      } catch (err) {
        setRawActionError(err);
        const missing = getMissingItemsFromError(err, kycData);
        if (missing.length > 0) {
          setActionError(
            `Still missing: ${missing.map((m) => m.label).join(', ')}`
          );
        } else {
          setActionError(getKycErrorMessage(err, 'Unable to resubmit KYC.'));
        }
      }
    };

    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.statusContent}>
        <View style={styles.topCloseRow}>
          <Text style={styles.modalTitle}>Additional Info Requested</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.alertCard}>
          <Ionicons name="alert-circle" size={22} color="#B26A00" />
          <View style={{ flex: 1 }}>
            <Text style={styles.alertTitle}>Compliance Team Note</Text>
            <Text style={styles.alertBody}>
              {latestReview?.notes ||
                'Please replace any flagged documents or update the requested information below, then resubmit.'}
            </Text>
          </View>
        </View>

        {allSlots.map((slot) => (
          <DocumentSlotCard
            key={slot.key}
            slot={slot}
            existingDocument={findSlotDocument(slot, kycData.documents)}
            onUploaded={() => refetch()}
          />
        ))}

        {!!actionError && (
          <InlineErrorBanner
            error={rawActionError}
            appError={{
              ...normalizeError(rawActionError, {
                defaultMessage: actionError,
                defaultNextStep: 'Verify all required documents are uploaded and tap Resubmit Application again.',
              }),
              message: actionError,
            }}
            onDismiss={() => {
              setActionError(null);
              setRawActionError(null);
            }}
          />
        )}

        <Button
          title="Resubmit Application"
          onPress={handleResubmit}
          loading={isResubmitting}
        />
      </ScrollView>
    );
  }

  // Handle non-draft statuses (pending_review, approved, rejected)
  if (status !== 'draft') {
    const latestReview = kycData.reviews?.[0];
    const isApproved = status === 'approved';
    const isRejected = status === 'rejected';

    const handleRestart = async () => {
      setActionError(null);
    setRawActionError(null);
      try {
        await restartKyc().unwrap();
        await refetch();
      } catch (err) {
        setRawActionError(err);
        setActionError(getKycErrorMessage(err, 'Unable to restart KYC application.'));
      }
    };

    return (
      <View style={styles.statusCenter}>
        <View style={styles.statusCard}>
          <Ionicons
            name={
              isApproved
                ? 'checkmark-circle'
                : isRejected
                  ? 'close-circle'
                  : 'time'
            }
            size={48}
            color={
              isApproved
                ? '#2E7D32'
                : isRejected
                  ? colors.error
                  : colors.primary
            }
          />
          <Text style={styles.statusTitle}>
            {isApproved
              ? 'KYC Verified'
              : isRejected
                ? 'Application Declined'
                : 'Under Compliance Review'}
          </Text>
          <Text style={styles.statusBody}>
            {isApproved
              ? 'Your identity and investor profile are verified. You have full access to BricketX investments.'
              : isRejected
                ? latestReview?.notes ||
                  'Your KYC application was not approved. You can start a new submission below.'
                : 'Your verification documents have been submitted and are currently being reviewed by our compliance team.'}
          </Text>

          {!!actionError && (
            <Text style={[styles.errorText, { marginTop: 10 }]}>{actionError}</Text>
          )}

          {isRejected && (
            <Button
              title="Start New KYC Application"
              onPress={handleRestart}
              loading={isRestarting}
              style={{ width: '100%', marginTop: spacing.lg }}
            />
          )}

          <Button
            title="Back to App"
            variant={isRejected ? 'outline' : 'primary'}
            onPress={() => navigation.goBack()}
            style={{ width: '100%', marginTop: spacing.md }}
          />
        </View>
      </View>
    );
  }

  const initialRoute = resolveMobileStepFromServer(kycData);

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
        headerRight: () => (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={{ color: colors.slate, fontWeight: '600', fontSize: 14 }}>
              Close
            </Text>
          </TouchableOpacity>
        ),
      }}
    >
      <Stack.Screen
        name="BasicInfo"
        component={BasicInfoScreen}
        options={{ title: 'Personal Info' }}
      />
      <Stack.Screen
        name="InvestorType"
        component={InvestorTypeScreen}
        options={{ title: 'Investor Type' }}
      />
      <Stack.Screen
        name="IndividualDetails"
        component={IndividualDetailsScreen}
        options={{ title: 'Residential Details' }}
      />
      <Stack.Screen
        name="CompanyKyb"
        component={CompanyKybScreen}
        options={{ title: 'Company Details' }}
      />
      <Stack.Screen
        name="IdentityDocs"
        component={IdentityDocsScreen}
        options={{ title: 'Documents' }}
      />
      <Stack.Screen
        name="SourceOfFunds"
        component={SourceOfFundsScreen}
        options={{ title: 'Source of Funds' }}
      />
      <Stack.Screen
        name="ReviewSubmit"
        component={ReviewSubmitScreen}
        options={{ title: 'Review & Submit' }}
      />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textMuted,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  statusContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl + 24,
  },
  topCloseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  closeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.slate,
  },
  alertCard: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#FFF8E1',
    borderWidth: 1,
    borderColor: '#FFE082',
    borderRadius: spacing.radiusMd,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  alertTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#8D5B00',
  },
  alertBody: {
    fontSize: 12.5,
    color: colors.text,
    marginTop: 2,
    lineHeight: 18,
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
  statusCenter: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  statusCard: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.md,
  },
  statusBody: {
    fontSize: 13.5,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 20,
  },
});
