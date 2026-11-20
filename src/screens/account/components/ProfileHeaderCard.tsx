import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';

interface Props {
  name: string;
  email: string;
  investorType: string;
  investorRfid?: string | null;
  isApproved: boolean;
  statusBadge: { label: string; bg: string; text: string; border: string };
  activeHoldingsCount?: number;
  onOpenProfile: () => void;
}

export const ProfileHeaderCard: React.FC<Props> = ({
  name,
  email,
  investorType,
  investorRfid,
  isApproved,
  statusBadge,
  activeHoldingsCount = 0,
  onOpenProfile,
}) => {
  const [copied, setCopied] = useState(false);

  const initials = (name || 'B')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  const handleCopyRfid = async () => {
    if (!investorRfid) return;
    await Clipboard.setStringAsync(investorRfid);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <View style={styles.profileCard}>
      {/* Top Row: Avatar + Identity + Copyable Investor ID */}
      <View style={styles.topRow}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial} numberOfLines={1}>
              {initials || 'B'}
            </Text>
          </View>
          {isApproved && (
            <View style={styles.verifiedCornerBadge}>
              <Ionicons name="checkmark" size={11} color="#FFFFFF" />
            </View>
          )}
        </View>

        <View style={styles.profileInfo}>
          <Text style={styles.profileName} numberOfLines={2}>
            {name}
          </Text>
          <Text style={styles.profileEmail} numberOfLines={2}>
            {email}
          </Text>

          <View style={styles.metaPillsRow}>
            <View
              style={[
                styles.statusPill,
                { backgroundColor: statusBadge.bg, borderColor: statusBadge.border },
              ]}
            >
              <Ionicons
                name={isApproved ? 'shield-checkmark' : 'time-outline'}
                size={11}
                color={statusBadge.text}
              />
              <Text
                style={[styles.statusPillText, { color: statusBadge.text }]}
                numberOfLines={1}
              >
                {statusBadge.label}
              </Text>
            </View>

            {Boolean(investorRfid) && (
              <TouchableOpacity
                style={styles.rfidPill}
                onPress={handleCopyRfid}
                activeOpacity={0.75}
              >
                <Text style={styles.rfidText} numberOfLines={1}>
                  {investorRfid}
                </Text>
                <Ionicons
                  name={copied ? 'checkmark' : 'copy-outline'}
                  size={11}
                  color={copied ? '#2E7D32' : colors.textMuted}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* 3-Column Account Snapshot Strip */}
      <View style={styles.statsStrip}>
        <View style={styles.statCol}>
          <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
            {investorType === 'COMPANY' ? 'Entity' : 'Individual'}
          </Text>
          <Text style={styles.statLabel} numberOfLines={1}>
            Account Type
          </Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statCol}>
          <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
            {activeHoldingsCount}
          </Text>
          <Text style={styles.statLabel} numberOfLines={1}>
            Positions
          </Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statCol}>
          <Text
            style={[styles.statValue, { color: isApproved ? '#2E7D32' : colors.primary }]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {isApproved ? 'Active' : 'Pending'}
          </Text>
          <Text style={styles.statLabel} numberOfLines={1}>
            Compliance
          </Text>
        </View>
      </View>

      {/* Primary Profile CTA */}
      <TouchableOpacity
        style={styles.profileCtaBtn}
        onPress={onOpenProfile}
        activeOpacity={0.85}
      >
        <Text style={styles.profileCtaText} numberOfLines={2}>
          {isApproved ? 'View Full Investor Profile' : 'Complete Identity Verification'}
        </Text>
        <Ionicons name="arrow-forward" size={15} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  profileCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EFECE6',
    gap: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: {
        elevation: 1.5,
      },
    }),
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 13,
  },
  avatarWrap: {
    position: 'relative',
    flexShrink: 0,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#FAF5EE',
    borderWidth: 1.5,
    borderColor: '#E7D7C1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  verifiedCornerBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#2E7D32',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    gap: 3,
  },
  profileName: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
    lineHeight: 22,
  },
  profileEmail: {
    fontSize: 12.5,
    color: colors.textMuted,
    lineHeight: 17,
  },
  metaPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginTop: 5,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
    borderWidth: 1,
    flexShrink: 0,
  },
  statusPillText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  rfidPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
    backgroundColor: '#F8F7F4',
    borderWidth: 1,
    borderColor: '#E8E4DC',
    maxWidth: '100%',
    flexShrink: 1,
  },
  rfidText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.2,
    flexShrink: 1,
  },
  statsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF9F6',
    borderWidth: 1,
    borderColor: '#EFECE6',
    borderRadius: 13,
    paddingVertical: 11,
    paddingHorizontal: 6,
  },
  statCol: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
    gap: 2,
  },
  statValue: {
    fontSize: 13.5,
    fontWeight: '800',
    color: colors.text,
  },
  statLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: colors.textMuted,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E8E4DC',
    flexShrink: 0,
  },
  profileCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: colors.text,
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  profileCtaText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.1,
    textAlign: 'center',
    flexShrink: 1,
  },
});
