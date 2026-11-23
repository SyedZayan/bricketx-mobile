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
    title: 'Nature of Platform & Eligibility',
    paragraphs: [
      'These Terms of Service summarize core participation terms under the Master Investment Management and Participation Agreement with BricketX Holdings Ltd (incorporated under the laws of the British Virgin Islands), covering private, asset-backed opportunities across commodities trading, gold trading, gold mining, real estate development and contracting, e-commerce, and multi-asset allocations.',
      'Participation is intended for eligible private, professional, qualified, high-net-worth, institutional, or sophisticated investors-not as a retail public offer or prospectus.',
    ],
  },
  {
    num: '02',
    title: 'Packages, Lock-In & Profit Allocation',
    paragraphs: [
      'Packages include Bronze (1-year lock-in, 14-17% target ROI), Silver (2-year lock-in, 16-19% target ROI), Gold (3-year lock-in, 18-22% target ROI), Platinum (4-year lock-in, 19-23% target ROI), Premium (5-year lock-in, 20-24% target ROI), and Multi-Asset Fund (1-5 years tenure, 18-26% target ROI), subject to minimum commitments (USD $50,000) and package terms.',
      'Unless expressly agreed otherwise in writing, Net Profit from realized operations is allocated 70% to participating investors and 30% to BricketX.',
    ],
  },
  {
    num: '03',
    title: 'No Guaranteed Returns & Material Risks',
    paragraphs: [
      'Indicative ROI ranges are commercial illustrations only and are not guaranteed, fixed, assured, or insured. Capital preservation, minimum profit, fixed income, liquidity, or early redemption are not guaranteed, and actual results may be lower or result in partial or total loss of capital.',
      'Private asset-backed investments are not daily-liquid instruments; Early Exit requests are subject to Company discretion, liquidity, operational obligations, and potential deductions.',
    ],
  },
  {
    num: '04',
    title: 'SPV Deployment & Operating Principles',
    paragraphs: [
      'Capital deployment occurs after cleared funds, KYC/AML clearance, and subscription acceptance, directly or through Operational SPVs without conferring direct equity, voting, or management rights in SPVs unless stated in writing.',
      'BricketX intends to structure activities on an asset-backed, profit-sharing, riba-free basis without interest accruing on delayed amounts.',
    ],
  },
  {
    num: '05',
    title: 'KYC/AML, Taxes & Confidentiality',
    paragraphs: [
      'Investors must supply accurate KYC, AML, source-of-funds, and tax details, bear personal taxes and bank/remittance/FX costs, and maintain confidentiality of non-public information.',
    ],
  },
  {
    num: '06',
    title: 'Liability, Termination & Governing Law',
    paragraphs: [
      'To the fullest extent permitted by law, BricketX is not liable for indirect or consequential losses, ordinary market/operational fluctuations, or force majeure events, except for direct losses finally determined to arise from proven fraud, willful misconduct, or gross negligence.',
      'Disputes not resolved in good faith within 30 days are referred to final and binding arbitration seated in Dubai, United Arab Emirates, in English.',
    ],
  },
];

export const TermsOfServiceScreen: React.FC = () => {
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
        <Text style={styles.docTag}>TERMS OF SERVICE</Text>
        <View style={{ width: 54 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.docHeader}>
          <Text style={styles.docTitle}>Terms of Service</Text>
          <Text style={styles.docMeta}>
            BricketX Holdings Ltd  -  Master Investment Management &amp; Participation Terms
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
            BricketX Holdings Ltd (British Virgin Islands)  -  Arbitration Seat: Dubai, UAE
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