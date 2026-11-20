import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';

interface CommitmentSuccessModalProps {
  visible: boolean;
  internalRef: string;
  amount: number;
  packageName: string;
  isPooled: boolean;
  onProceed: () => void;
}

const formatWholeUsd = (val: number): string => {
  if (!Number.isFinite(val) || val <= 0) return '$0';
  return `$${Math.trunc(val).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
};

export const CommitmentSuccessModal: React.FC<CommitmentSuccessModalProps> = ({
  visible,
  internalRef,
  amount,
  packageName,
  isPooled,
  onProceed,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalBackdrop}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Ionicons name="checkmark-done" size={30} color="#2E7D32" />
          </View>

          <Text style={styles.kicker} numberOfLines={1}>
            ALLOCATION DRAFTED
          </Text>
          <Text style={styles.title} numberOfLines={2}>
            Commitment Registered
          </Text>

          <View style={styles.detailsBox}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel} numberOfLines={2}>Internal Ref</Text>
              <Text style={styles.metaValRef} numberOfLines={1}>
                {internalRef}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel} numberOfLines={2}>Package</Text>
              <Text style={styles.metaVal} numberOfLines={2}>
                {packageName}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel} numberOfLines={2}>Committed Principal</Text>
              <Text
                style={styles.metaValGold}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
              >
                {formatWholeUsd(amount)} USD
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel} numberOfLines={2}>Structure</Text>
              <Text style={styles.metaVal} numberOfLines={1}>
                {isPooled ? 'Syndicate Pool' : 'Direct Custody'}
              </Text>
            </View>
          </View>

          <Text style={styles.subtext}>
            Your allocation position is now drafted. Proceed directly to review your subscription agreement and obtain wire instructions.
          </Text>

          <TouchableOpacity style={styles.actionBtn} onPress={onProceed} activeOpacity={0.85}>
            <Text style={styles.actionBtnText} numberOfLines={2}>
              Proceed to Agreement &amp; Wire
            </Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={{ flexShrink: 0 }} />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
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
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EFECE6',
    padding: 22,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.14,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#C8E6C9',
    flexShrink: 0,
  },
  kicker: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#2E7D32',
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
    marginTop: 2,
    marginBottom: 16,
    textAlign: 'center',
  },
  detailsBox: {
    width: '100%',
    backgroundColor: '#FAF9F6',
    borderWidth: 1,
    borderColor: '#EFECE6',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  metaLabel: {
    fontSize: 11.5,
    lineHeight: 16,
    color: colors.textMuted,
    flexShrink: 1,
    maxWidth: '45%',
  },
  metaVal: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'right',
  },
  metaValRef: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
    textAlign: 'right',
  },
  metaValGold: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'right',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#EFECE6',
    marginVertical: 8,
  },
  subtext: {
    fontSize: 11.5,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: 20,
    paddingHorizontal: 8,
    flexShrink: 1,
  },
  actionBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    lineHeight: 18,
    fontWeight: '700',
    textAlign: 'center',
    flexShrink: 1,
  },
});

