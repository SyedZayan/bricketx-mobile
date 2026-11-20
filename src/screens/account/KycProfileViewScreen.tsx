import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useGetKycMeQuery,
  useGetAuthMeQuery,
  useLazyGetKycDocumentsByIdDownloadQuery,
} from '../../api/generated/investorApi';
import {
  countryName,
  formatMoney,
  formatPrimarySource,
  toDateInputValue,
  DOCUMENT_TYPE_LABELS,
} from '../../features/kyc/kycUtils';
import { useAppSelector } from '../../store/hooks';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { StatusFeedbackModal } from '../../components/common/StatusFeedbackModal';

type TabKey = 'personal' | 'entity' | 'identity' | 'funds';

export const KycProfileViewScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const insets = useSafeAreaInsets();
  const initialTab = (route.params?.initialTab as TabKey) || 'personal';
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [supportModalVisible, setSupportModalVisible] = useState(false);

  const closeSupportModal = useCallback(() => {
    setSupportModalVisible(false);
  }, []);

  const authUser = useAppSelector((state) => state.auth.user);
  const { data: authData } = useGetAuthMeQuery();
  const { data: kycData, isLoading } = useGetKycMeQuery(undefined);
  const [fetchDownloadUrl] = useLazyGetKycDocumentsByIdDownloadQuery();

  if (isLoading || !kycData) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const { kycProfile, individualDetails, companyKyc, documents, sourceOfFunds } = kycData;
  const isCompany = kycProfile.kycType === 'business';
  const isApproved = kycProfile.status === 'approved';

  const fullName =
    kycProfile.fullLegalName || authData?.fullName || authUser?.fullName || 'Investor';
  const email = authData?.email || authUser?.email || '-';

  const openSupportMail = () => {
    Linking.openURL(
      'mailto:compliance@bricketx.com?subject=Request%20to%20Amend%20KYC%20Details'
    ).catch(() => {
      setSupportModalVisible(true);
    });
  };

  const handleOpenDoc = async (docId: string) => {
    try {
      const res = await fetchDownloadUrl({ id: docId }).unwrap();
      if (res?.url) {
        await Linking.openURL(res.url);
      }
    } catch {
      // Ignore preview failures
    }
  };

  const renderInfoRow = (label: string, value?: string | null, isMonospace = false) => (
    <View style={styles.infoRow}>
      <Text style={styles.rowLabel} numberOfLines={2}>
        {label}
      </Text>
      <Text style={[styles.rowValue, isMonospace && styles.monoValue]}>
        {value || '-'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 16) + 4 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle} numberOfLines={1}>
          KYC Compliance Record
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sealCard}>
          <View style={styles.sealIconBox}>
            <Ionicons
              name={isApproved ? 'shield-checkmark' : 'time-outline'}
              size={24}
              color={isApproved ? '#2E7D32' : colors.primary}
            />
          </View>
          <View style={styles.sealTextCol}>
            <Text style={styles.sealTitle}>
              {isApproved
                ? 'Statutory Verification Locked'
                : `Status: ${kycProfile.status.replace(/_/g, ' ').toUpperCase()}`}
            </Text>
            <Text style={styles.sealBody}>
              {isApproved
                ? 'Your compliance records are verified under AML and statutory investor regulations.'
                : 'Your KYC profile details and submitted compliance documents are summarized below.'}
            </Text>
          </View>
        </View>

        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'personal' && styles.tabItemActive]}
            onPress={() => setActiveTab('personal')}
          >
            <Text
              style={[styles.tabText, activeTab === 'personal' && styles.tabTextActive]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              Personal
            </Text>
          </TouchableOpacity>

          {isCompany && (
            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'entity' && styles.tabItemActive]}
              onPress={() => setActiveTab('entity')}
            >
              <Text
                style={[styles.tabText, activeTab === 'entity' && styles.tabTextActive]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                Entity
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'identity' && styles.tabItemActive]}
            onPress={() => setActiveTab('identity')}
          >
            <Text
              style={[styles.tabText, activeTab === 'identity' && styles.tabTextActive]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              Documents
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'funds' && styles.tabItemActive]}
            onPress={() => setActiveTab('funds')}
          >
            <Text
              style={[styles.tabText, activeTab === 'funds' && styles.tabTextActive]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              Funds
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'personal' && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Personal & Residency</Text>
            {renderInfoRow('Legal Name', fullName)}
            {renderInfoRow('Email Address', email)}
            {renderInfoRow('Date of Birth', toDateInputValue(kycProfile.dateOfBirth))}
            {renderInfoRow('Nationality', countryName(kycProfile.nationality))}
            {renderInfoRow('Country of Residence', countryName(kycProfile.countryOfResidence))}
            {renderInfoRow('Country of Citizenship', countryName(kycProfile.countryOfCitizenship))}
            {!isCompany &&
              renderInfoRow('Residential Address', individualDetails?.residentialAddress)}
            {!isCompany && renderInfoRow('Occupation', individualDetails?.occupation)}
            {renderInfoRow(
              'Expected Investment',
              formatMoney(kycProfile.expectedInvestmentAmount)
            )}
          </View>
        )}

        {activeTab === 'entity' && isCompany && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Corporate Entity Filing</Text>
            {renderInfoRow('Company Legal Name', companyKyc?.companyName)}
            {renderInfoRow('Registration / License No.', companyKyc?.regNumber, true)}
            {renderInfoRow('Jurisdiction', countryName(companyKyc?.jurisdiction))}
            {renderInfoRow('Registered Address', companyKyc?.registeredAddress)}
            {renderInfoRow('Nature of Business', companyKyc?.natureOfBusiness)}
            {renderInfoRow(
              'Directors',
              companyKyc?.directors?.length
                ? companyKyc.directors.map((d) => d.fullName).join(', ')
                : '-'
            )}
          </View>
        )}

        {activeTab === 'identity' && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Submitted Compliance Documents</Text>
            {documents.length === 0 ? (
              <Text style={styles.rowValue}>No documents uploaded yet.</Text>
            ) : (
              documents.map((doc) => (
                <View key={doc.id} style={styles.docRow}>
                  <View style={styles.docMetaCol}>
                    <Text style={styles.rowValue} numberOfLines={2}>
                      {DOCUMENT_TYPE_LABELS[doc.documentType] || doc.documentType}
                    </Text>
                    <Text style={styles.rowLabel} numberOfLines={1}>
                      Status: {doc.status.replace(/_/g, ' ')}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleOpenDoc(doc.id)}
                    style={styles.viewDocBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.viewDocLink} numberOfLines={1}>
                      View
                    </Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'funds' && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Source of Wealth & Funds</Text>
            {renderInfoRow(
              'Primary Source',
              formatPrimarySource(sourceOfFunds?.primarySource)
            )}
            {renderInfoRow('Source of Overall Wealth', sourceOfFunds?.sourceOfWealth)}
            {renderInfoRow(
              'Estimated Annual Income',
              formatMoney(sourceOfFunds?.annualIncome, sourceOfFunds?.currency)
            )}
            {renderInfoRow('Explanation', sourceOfFunds?.explanation)}
          </View>
        )}

        <View style={styles.supportBox}>
          <Text style={styles.supportTitle}>Need to update verified details?</Text>
          <Text style={styles.supportSub}>
            Changes to verified legal names, identity documents, or corporate filings require compliance officer review.
          </Text>
          <TouchableOpacity
            style={styles.supportBtn}
            onPress={openSupportMail}
            activeOpacity={0.85}
          >
            <Ionicons name="mail-outline" size={16} color={colors.primary} />
            <Text style={styles.supportBtnText} numberOfLines={2}>
              Contact Compliance Officer
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <StatusFeedbackModal
        visible={supportModalVisible}
        variant="info"
        iconName="mail-outline"
        title="Support Desk"
        message="Please contact compliance@bricketx.com to update verified records."
        primaryLabel="Got It"
        onPrimary={closeSupportModal}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7F4',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EFECE6',
    gap: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  topBarTitle: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  placeholder: {
    width: 36,
    flexShrink: 0,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
  },
  sealCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#C8E6C9',
    borderRadius: 14,
    padding: 14,
  },
  sealIconBox: {
    marginTop: 2,
    flexShrink: 0,
  },
  sealTextCol: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
  },
  sealTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2E7D32',
    lineHeight: 18,
  },
  sealBody: {
    fontSize: 11.5,
    color: '#1B5E20',
    lineHeight: 16,
    marginTop: 2,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FAF5EE',
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: '#E7D7C1',
    gap: 2,
  },
  tabItem: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  tabItemActive: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFECE6',
    borderRadius: 14,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 14,
  },
  infoRow: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EFECE6',
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EFECE6',
    gap: 12,
  },
  docMetaCol: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
  },
  viewDocBtn: {
    flexShrink: 0,
  },
  viewDocLink: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  rowLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    lineHeight: 15,
    flexShrink: 1,
  },
  rowValue: {
    fontSize: 13.5,
    fontWeight: '600',
    color: colors.text,
    marginTop: 2,
    lineHeight: 19,
    flexShrink: 1,
  },
  monoValue: {
    letterSpacing: 0.5,
  },
  supportBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFECE6',
    borderRadius: 14,
    padding: 16,
  },
  supportTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  supportSub: {
    fontSize: 11.5,
    color: colors.textMuted,
    lineHeight: 16,
    marginTop: 4,
  },
  supportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#E7D7C1',
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 12,
    marginTop: 12,
  },
  supportBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    flexShrink: 1,
    textAlign: 'center',
  },
});
