import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';

interface PoolingModalsProps {
  packageName: string;
  amount: number;
  minPackageAmount: number;
  showWarningModal: boolean;
  onCloseWarning: () => void;
  onProceedToTerms: () => void;
  showTermsModal: boolean;
  onCloseTerms: () => void;
  onAcceptTerms: () => void;
  version?: number;
  disclaimerText: string;
  topInset: number;
  bottomInset: number;
}

const formatWholeUsd = (val: number): string => {
  if (!Number.isFinite(val) || val <= 0) return '$0';
  return `$${Math.trunc(val).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
};

export const PoolingModals: React.FC<PoolingModalsProps> = ({
  packageName,
  amount,
  minPackageAmount,
  showWarningModal,
  onCloseWarning,
  onProceedToTerms,
  showTermsModal,
  onCloseTerms,
  onAcceptTerms,
  version = 1,
  disclaimerText,
  topInset,
  bottomInset,
}) => {
  return (
    <>
      {/* STAGE 1: Threshold Warning Dialog */}
      <Modal visible={showWarningModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.dialogCard}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.dialogScrollContent}
            >
              <View style={styles.iconCircle}>
                <Ionicons name="people" size={26} color="#B78103" />
              </View>
              <Text style={styles.dialogTitle} numberOfLines={2}>
                Allocation Below Minimum
              </Text>
              <Text style={styles.dialogText}>
                The standard single-allocation ticket for {packageName} is{'\n\n'}
                <Text style={styles.boldText}>{formatWholeUsd(minPackageAmount)}</Text>.
                {'\n\n'}
                Your allocation of <Text style={styles.boldText}>{formatWholeUsd(amount)}</Text> will be combined with other accredited investors through a syndicate pool until target subscription is reached.
              </Text>

              <TouchableOpacity style={styles.primaryModalBtn} onPress={onProceedToTerms} activeOpacity={0.85}>
                <Text style={styles.primaryModalBtnText} numberOfLines={2}>
                  Read Pooling Agreement
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelModalBtn} onPress={onCloseWarning} activeOpacity={0.7}>
                <Text style={styles.cancelModalBtnText} numberOfLines={2}>
                  Adjust Ticket Size
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* STAGE 2: Full Screen Versioned Terms Sheet */}
      <Modal visible={showTermsModal} animationType="slide">
        <View style={[styles.sheetContainer, { paddingTop: Math.max(topInset, 20) }]}>
          <View style={styles.sheetHeader}>
            <View style={styles.sheetTitleCol}>
              <Text style={styles.sheetKicker} numberOfLines={1}>
                GOVERNANCE &amp; SYNDICATION
              </Text>
              <Text style={styles.sheetTitle} numberOfLines={2}>
                Syndicate Pooling Terms
              </Text>
            </View>
            <TouchableOpacity style={styles.sheetCloseBtn} onPress={onCloseTerms}>
              <Ionicons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.sheetScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.versionBadgeRow}>
              <View style={styles.versionBadge}>
                <Text style={styles.versionBadgeText} numberOfLines={1}>
                  TERMS VERSION {version}
                </Text>
              </View>
              <View style={styles.activeTag}>
                <Text style={styles.activeTagText} numberOfLines={1}>
                  GOVERNANCE RATIFIED
                </Text>
              </View>
            </View>

            <Text style={styles.declarationSectionHeader}>1. Investor Declaration</Text>
            <Text style={styles.declarationBody}>
              By proceeding with an allocation below the minimum single-allocation threshold, you acknowledge and agree that your capital will participate via a communal syndicate pool until aggregate funding closes.
            </Text>

            <Text style={styles.declarationSectionHeader}>2. Pool Operations &amp; Liquidity</Text>
            <Text style={styles.declarationBody}>
              {disclaimerText ||
                'Communal syndicate allocations remain grouped under single custody title. Distributions and return payouts are calculated proportionally based on fractional member weight.'}
            </Text>

            <View style={styles.sheetDisclaimerFootnote}>
              <Ionicons
                name="shield-checkmark"
                size={16}
                color={colors.primary}
                style={{ flexShrink: 0, marginTop: 1 }}
              />
              <Text style={styles.footnoteText}>
                Acceptance records your signature against terms version {version} in the audit ledger.
              </Text>
            </View>
          </ScrollView>

          <View style={[styles.sheetFooter, { paddingBottom: Math.max(bottomInset, 16) + 6 }]}>
            <TouchableOpacity style={styles.acceptPoolBtn} onPress={onAcceptTerms} activeOpacity={0.85}>
              <Text style={styles.acceptPoolBtnText} numberOfLines={2}>
                Accept Terms &amp; Proceed
              </Text>
              <Ionicons
                name="checkmark-circle"
                size={18}
                color="#FFFFFF"
                style={{ flexShrink: 0 }}
              />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(26, 24, 21, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EFECE6',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.14,
        shadowRadius: 20,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  dialogScrollContent: {
    padding: 22,
    alignItems: 'center',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFF8E1',
    borderWidth: 1,
    borderColor: '#FFE082',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    flexShrink: 0,
  },
  dialogTitle: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  dialogText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
    flexShrink: 1,
  },
  boldText: {
    fontWeight: '800',
    color: colors.text,
  },
  primaryModalBtn: {
    width: '100%',
    backgroundColor: colors.primary,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryModalBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    lineHeight: 18,
    fontWeight: '700',
    textAlign: 'center',
    flexShrink: 1,
  },
  cancelModalBtn: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cancelModalBtnText: {
    fontSize: 12.5,
    lineHeight: 17,
    color: colors.textMuted,
    fontWeight: '600',
    textAlign: 'center',
  },
  sheetContainer: {
    flex: 1,
    backgroundColor: '#F8F7F4',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EFECE6',
    backgroundColor: '#FFFFFF',
  },
  sheetTitleCol: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
  },
  sheetKicker: {
    fontSize: 9.5,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.primary,
  },
  sheetTitle: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '800',
    color: colors.text,
    marginTop: 2,
    flexShrink: 1,
  },
  sheetCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8F7F4',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sheetScroll: {
    flex: 1,
    padding: 20,
  },
  versionBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  versionBadge: {
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#E7D7C1',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
  },
  versionBadgeText: {
    fontSize: 9.5,
    lineHeight: 14,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  activeTag: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#C8E6C9',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activeTagText: {
    fontSize: 9.5,
    lineHeight: 14,
    fontWeight: '800',
    color: '#2E7D32',
    letterSpacing: 0.5,
  },
  declarationSectionHeader: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
    color: colors.text,
    marginTop: 14,
    marginBottom: 6,
  },
  declarationBody: {
    fontSize: 12.5,
    color: colors.textMuted,
    lineHeight: 19,
  },
  sheetDisclaimerFootnote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFECE6',
    borderRadius: 10,
    padding: 12,
    marginTop: 24,
    marginBottom: 40,
  },
  footnoteText: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 16,
  },
  sheetFooter: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EFECE6',
  },
  acceptPoolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  acceptPoolBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    lineHeight: 18,
    fontWeight: '700',
    textAlign: 'center',
    flexShrink: 1,
  },
});




