import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme/colors';

interface Clause {
  num: string;
  title: string;
  paragraphs: string[];
}

const CLAUSES: Clause[] = [
  {
    num: '01',
    title: 'Data Controller & Scope',
    paragraphs: [
      'This Privacy Policy sets out how BricketX Holdings Ltd (incorporated under the laws of the British Virgin Islands), together with its operating platform, affiliates, and Operational SPVs ("BricketX"), handles personal and financial data in connection with the investor portal and Master Investment Management and Participation Agreement.',
      'This notice applies to prospective and onboarded investors accessing BricketX digital onboarding, suitability reviews, reporting, and account management services.',
    ],
  },
  {
    num: '02',
    title: 'Categories of Information Collected',
    paragraphs: [
      'Identity & Contact Records: Full legal name, nationality, passport, national ID, or corporate registration details, residential or registered address, email address, and telephone or WhatsApp contact details.',
      'Compliance, Financial & Activity Records: Designated bank distribution account details, KYC/AML verification files, source-of-funds and source-of-wealth declarations, sanctions and PEP screening results, package subscriptions, capital deployments, and statement/distribution history.',
    ],
  },
  {
    num: '03',
    title: 'Purposes of Processing',
    paragraphs: [
      'We use your information to assess investor eligibility and suitability, perform KYC/AML and sanctions checks, process and deploy accepted Capital Contributions, calculate and distribute realized profit allocations, deliver reporting and statements, and comply with legal, tax, and regulatory duties.',
    ],
  },
  {
    num: '04',
    title: 'Permitted Disclosures & Service Providers',
    paragraphs: [
      'Information may be shared with Operational SPVs, affiliates, execution partners, banks, auditors, legal and tax advisers, Shariah advisers, compliance providers, and government, tax (including FATCA/CRS), or regulatory authorities where reasonably required for execution or mandated by law, subject to confidentiality and legal obligations.',
    ],
  },
  {
    num: '05',
    title: 'Electronic Communications & Security Safeguards',
    paragraphs: [
      'Operational updates, dashboard notices, electronic records, email messages, and WhatsApp communications may be used for routine administration, while formal notices follow written notice rules. You are responsible for safeguarding your email, phone, and portal credentials.',
    ],
  },
  {
    num: '06',
    title: 'Account Deletion, Retention & Contact',
    paragraphs: [
      'When you request account closure or deletion, portal sign-in credentials, local session tokens, and biometric links are removed, while KYC/AML files, executed agreements, and financial ledger records are retained for statutory periods required by law.',
      'For privacy or data protection requests, contact compliance@bricketx.com.',
    ],
  },
];

export const PrivacyPolicyScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 28 : 16);

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, 16),
          paddingBottom: bottomInset,
        },
      ]}
    >
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={20} color={colors.text} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.docTag}>PRIVACY NOTICE</Text>
        <View style={{ width: 54 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.docHeader}>
          <Text style={styles.docTitle}>Privacy Policy</Text>
          <Text style={styles.docMeta}>
            BricketX Holdings Ltd  -  Master Agreement Clause 22 &amp; Statutory Compliance
          </Text>
        </View>

        <View style={styles.divider} />

        {CLAUSES.map((clause, idx) => (
          <View key={clause.num}>
            <View style={styles.clauseRow}>
              <Text style={styles.clauseNum}>{clause.num}</Text>
              <View style={styles.clauseContent}>
                <Text style={styles.clauseTitle}>{clause.title}</Text>
                {clause.paragraphs.map((p, i) => (
                  <Text key={i} style={styles.clauseBody}>
                    {p}
                  </Text>
                ))}
              </View>
            </View>
            {idx < CLAUSES.length - 1 && <View style={styles.clauseDivider} />}
          </View>
        ))}

        <View style={styles.docFooter}>
          <Text style={styles.footerNote}>
            BricketX Holdings Ltd (British Virgin Islands)  -  Confidential Investor Documentation
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ECE8E1',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    width: 54,
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  docTag: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: '#6E6A63',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 24,
  },
  docHeader: {
    marginBottom: 16,
  },
  docTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  },
  docMeta: {
    fontSize: 12,
    color: '#6E6A63',
    marginTop: 6,
    lineHeight: 17,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E0D8',
    marginBottom: 20,
  },
  clauseRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  clauseNum: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 2,
    width: 22,
  },
  clauseContent: {
    flex: 1,
  },
  clauseTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  clauseBody: {
    fontSize: 13.5,
    lineHeight: 21,
    color: '#3D3A35',
    marginBottom: 8,
  },
  clauseDivider: {
    height: 1,
    backgroundColor: '#F1EEE8',
    marginVertical: 18,
  },
  docFooter: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#ECE8E1',
  },
  footerNote: {
    fontSize: 11.5,
    color: '#7A756D',
    lineHeight: 17,
  },
});