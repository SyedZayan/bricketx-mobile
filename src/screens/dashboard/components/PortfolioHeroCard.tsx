import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';

interface Props {
  fullName?: string | null;
  investorRfid?: string | null;
  isKycApproved: boolean;
  isKycInReview: boolean;
  totalCommitted: string | number | null | undefined;
  activeCapital: string | number | null | undefined;
  paidToDate: string | number | null | undefined;
  nextPayoutText: string;
  nextPayoutSub: string;
  formatCurrency: (val: string | number | null | undefined) => string;
  onPressKyc: () => void;
}

const toNumber = (val: string | number | null | undefined): number => {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return Number.isFinite(val) ? val : 0;
  const cleaned = String(val).replace(/[^0-9.-]/g, '');
  const num = parseFloat(cleaned);
  return Number.isFinite(num) ? num : 0;
};

export const PortfolioHeroCard: React.FC<Props> = ({
  fullName,
  investorRfid,
  isKycApproved,
  isKycInReview,
  totalCommitted,
  activeCapital,
  paidToDate,
  nextPayoutText,
  nextPayoutSub,
  formatCurrency,
  onPressKyc,
}) => {
  const [rfidCopied, setRfidCopied] = useState(false);
  const [hideBalances, setHideBalances] = useState(false);

  const committedNum = toNumber(totalCommitted);
  const activeNum = toNumber(activeCapital);
  const rawPct = committedNum > 0 ? (activeNum / committedNum) * 100 : 0;
  const deploymentPct =
    committedNum > 0 ? Math.min(Math.round(rawPct), 100) : 0;
  const deploymentLabel =
    activeNum > 0 && deploymentPct === 0
      ? '<1% deployed'
      : `${deploymentPct}% deployed`;
  const nameParts = fullName?.trim().split(/\s+/).filter(Boolean) || [];
  const firstName =
    nameParts.length >= 3
      ? `${nameParts[0][0].toUpperCase()}. ${nameParts[1]}`
      : nameParts[0] || 'Investor';
  const mask = (formatted: string) => (hideBalances ? '••••••' : formatted);

  const handleCopyRfid = async () => {
    if (!investorRfid) return;
    await Clipboard.setStringAsync(investorRfid);
    setRfidCopied(true);
    setTimeout(() => setRfidCopied(false), 1800);
  };

  return (
    <View style={styles.wrapper}>
      {/* Top Greeting, RFID & Verification Status */}
      <View style={styles.topRow}>
        <View style={styles.identityCol}>
          <Text style={styles.greeting} numberOfLines={2}>
            Welcome back, {firstName}
          </Text>
          {Boolean(investorRfid) && (
            <TouchableOpacity
              style={styles.rfidPill}
              onPress={handleCopyRfid}
              activeOpacity={0.75}
            >
              <Ionicons name="radio-outline" size={12} color={colors.primary} />
              <Text style={styles.rfidText} numberOfLines={1}>
                {investorRfid}
              </Text>
              <Ionicons
                name={rfidCopied ? 'checkmark' : 'copy-outline'}
                size={12}
                color={rfidCopied ? '#2E7D32' : colors.textMuted}
              />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.statusPill,
            isKycApproved
              ? styles.statusApproved
              : isKycInReview
                ? styles.statusReview
                : styles.statusPending,
          ]}
          onPress={onPressKyc}
          activeOpacity={0.8}
        >
          <Ionicons
            name={
              isKycApproved
                ? 'shield-checkmark'
                : isKycInReview
                  ? 'time-outline'
                  : 'alert-circle-outline'
            }
            size={13}
            color={isKycApproved ? '#2E7D32' : colors.primary}
          />
          <Text
            style={[
              styles.statusText,
              { color: isKycApproved ? '#2E7D32' : colors.primary },
            ]}
            numberOfLines={1}
          >
            {isKycApproved ? 'Verified' : isKycInReview ? 'In Review' : 'Verify ID'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Primary Balance Surface */}
      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <Text style={styles.heroEyebrow} numberOfLines={1}>
            ACTIVE DEPLOYED CAPITAL
          </Text>
          <TouchableOpacity
            onPress={() => setHideBalances((prev) => !prev)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={hideBalances ? 'eye-off-outline' : 'eye-outline'}
              size={16}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.heroAmount} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>
          {mask(formatCurrency(activeCapital))}
        </Text>

        <View style={styles.progressBlock}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${deploymentPct}%` }]} />
          </View>
          <View style={styles.progressMeta}>
            <Text style={styles.progressPct} numberOfLines={1}>
              {deploymentLabel}
            </Text>
            <Text style={styles.progressSub} numberOfLines={1}>
              {mask(formatCurrency(totalCommitted))} total committed
            </Text>
          </View>
        </View>
      </View>

      {/* Key Metrics Strip */}
      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel} numberOfLines={1}>
            Paid to Date
          </Text>
          <Text style={[styles.metricValue, { color: '#2E7D32' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>
            {mask(formatCurrency(paidToDate))}
          </Text>
          <Text style={styles.metricHint} numberOfLines={1}>
            Settled distributions
          </Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricLabel} numberOfLines={1}>
            Next Payout
          </Text>
          <Text style={styles.metricValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>
            {mask(nextPayoutText)}
          </Text>
          <Text style={styles.metricHint} numberOfLines={1}>
            {nextPayoutSub}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    gap: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  identityCol: {
    flex: 1,
    flexShrink: 1,
    gap: 6,
  },
  greeting: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.2,
  },
  rfidPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#E7D7C1',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    maxWidth: '100%',
  },
  rfidText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.text,
    flexShrink: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    flexShrink: 0,
  },
  statusApproved: {
    backgroundColor: '#E8F5E9',
    borderColor: '#C8E6C9',
  },
  statusReview: {
    backgroundColor: '#FFF8E1',
    borderColor: '#FFE082',
  },
  statusPending: {
    backgroundColor: '#FAF5EE',
    borderColor: '#E7D7C1',
  },
  statusText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFECE6',
    borderRadius: 16,
    padding: 16,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  heroEyebrow: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: colors.textMuted,
    flexShrink: 1,
  },
  heroAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.6,
    marginTop: 6,
  },
  progressBlock: {
    marginTop: 14,
    gap: 6,
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: '#F3EFE8',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  progressMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 6,
  },
  progressPct: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.primary,
  },
  progressSub: {
    fontSize: 11.5,
    fontWeight: '500',
    color: colors.textMuted,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFECE6',
    borderRadius: 14,
    padding: 13,
  },
  metricLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.textMuted,
  },
  metricValue: {
    fontSize: 16.5,
    fontWeight: '800',
    color: colors.text,
    marginTop: 5,
  },
  metricHint: {
    fontSize: 10.5,
    color: colors.textMuted,
    marginTop: 2,
  },
});

