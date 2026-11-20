import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { KycStackParamList } from '../../navigation/types';
import { useGetKycMeQuery } from '../../api/generated/investorApi';
import {
  individualDocumentSlots,
  businessDocumentGroups,
  findSlotDocument,
} from '../../features/kyc/kycUtils';
import { DocumentSlotCard } from '../../components/kyc/DocumentSlotCard';
import { Button } from '../../components/ui/Button';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

type Props = NativeStackScreenProps<KycStackParamList, 'IdentityDocs'>;

export const IdentityDocsScreen: React.FC<Props> = ({ navigation }) => {
  const { data: kycData, isLoading, refetch } = useGetKycMeQuery(undefined);

  if (isLoading || !kycData) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const isBusiness = kycData.kycProfile.kycType === 'business';
  const groups = isBusiness
    ? businessDocumentGroups(
        kycData.companyKyc?.id,
        kycData.companyKyc?.directors ?? [],
        kycData.companyKyc?.uboRecords ?? []
      )
    : [{ title: 'Your Documents', slots: individualDocumentSlots() }];

  const allSlots = groups.flatMap((g) => g.slots);
  const uploadedCount = allSlots.filter((slot) => {
    const doc = findSlotDocument(slot, kycData.documents);
    return !!doc && doc.status !== 'rejected';
  }).length;
  const allSatisfied = uploadedCount === allSlots.length;

  return (
    <KeyboardAwareScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      enableOnAndroid={true}
      extraScrollHeight={80}
    >
      <View style={styles.stepHeader}>
        <View style={styles.badgeRow}>
          <Text style={styles.stepBadge}>STEP 4 OF 6</Text>
          <Text style={styles.countBadge}>
            {uploadedCount} of {allSlots.length} uploaded
          </Text>
        </View>
        <Text style={styles.title}>Compliance Documents</Text>
        <Text style={styles.subtitle}>
          Upload clear scans or photos for each required document below. You can continue and return later — completeness is checked before final submission.
        </Text>
      </View>

      {groups.map((group) => (
        <View key={group.title} style={styles.groupSection}>
          {isBusiness && (
            <Text style={styles.groupTitle}>{group.title}</Text>
          )}
          {group.slots.map((slot) => (
            <DocumentSlotCard
              key={slot.key}
              slot={slot}
              existingDocument={findSlotDocument(slot, kycData.documents)}
              onUploaded={() => refetch()}
            />
          ))}
        </View>
      ))}

      {!allSatisfied && (
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>
            Some required documents are still missing or need replacement. You can proceed to Source of Funds now, but all documents must be uploaded before submitting.
          </Text>
        </View>
      )}

      <Button
        title="Continue to Source of Funds"
        onPress={() => navigation.navigate('SourceOfFunds')}
        style={styles.submitBtn}
      />
    </KeyboardAwareScrollView>
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
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 1,
  },
  countBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
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
  groupSection: {
    marginBottom: spacing.sm,
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  warningBox: {
    backgroundColor: '#FFF8E1',
    borderWidth: 1,
    borderColor: '#FFE082',
    borderRadius: spacing.radiusSm,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  warningText: {
    fontSize: 12,
    color: '#8D5B00',
    lineHeight: 17,
  },
  submitBtn: {
    marginTop: spacing.xs,
  },
});
