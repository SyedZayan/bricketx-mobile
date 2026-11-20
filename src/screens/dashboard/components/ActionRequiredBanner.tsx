import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';

interface Props {
  packageName: string;
  internalRef: string;
  amount: string;
  onPressDetails: () => void;
}

export const ActionRequiredBanner: React.FC<Props> = ({
  packageName,
  internalRef,
  amount,
  onPressDetails,
}) => {
  const [copied, setCopied] = useState(false);

  const copyRef = async () => {
    await Clipboard.setStringAsync(internalRef);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.kickerBox}>
          <Ionicons name="time-outline" size={15} color={colors.primary} />
          <Text style={styles.kickerText} numberOfLines={1}>
            ACTION REQUIRED
          </Text>
        </View>
        <View style={styles.badgePill}>
          <Text style={styles.badgeText} numberOfLines={1}>
            Pending Transfer
          </Text>
        </View>
      </View>

      <Text style={styles.title}>
        Complete transfer of {amount} for {packageName}
      </Text>
      <Text style={styles.body}>
        Your agreement is signed. Please send your bank transfer using the payment reference below:
      </Text>

      <View style={styles.refRow}>
        <View style={styles.refTextCol}>
          <Text style={styles.refLabel} numberOfLines={1}>
            PAYMENT REFERENCE
          </Text>
          <Text
            style={styles.refValue}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
          >
            {internalRef}
          </Text>
        </View>
        <TouchableOpacity style={styles.copyBtn} onPress={copyRef} activeOpacity={0.8}>
          <Ionicons
            name={copied ? 'checkmark' : 'copy-outline'}
            size={14}
            color={colors.primary}
          />
          <Text style={styles.copyBtnText} numberOfLines={1}>
            {copied ? 'Copied' : 'Copy'}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.actionBtn} onPress={onPressDetails} activeOpacity={0.85}>
        <Text style={styles.actionBtnText} numberOfLines={2}>
          View Bank Transfer Details
        </Text>
        <Ionicons name="arrow-forward" size={15} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.primaryTint,
    borderWidth: 1.5,
    borderColor: colors.primaryBorder,
    borderRadius: 14,
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  kickerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexShrink: 1,
  },
  kickerText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.6,
  },
  badgePill: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    flexShrink: 0,
  },
  badgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.primary,
  },
  title: {
    fontSize: 14.5,
    fontWeight: '800',
    color: colors.text,
    marginTop: 10,
    lineHeight: 20,
    flexShrink: 1,
  },
  body: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 17,
    marginTop: 4,
    flexShrink: 1,
  },
  refRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginVertical: 12,
    gap: 10,
  },
  refTextCol: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
  },
  refLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  refValue: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryTint,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    flexShrink: 0,
  },
  copyBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.primary,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    textAlign: 'center',
    flexShrink: 1,
  },
});
