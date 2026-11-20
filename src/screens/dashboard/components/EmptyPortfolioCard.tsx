import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';

interface EmptyPortfolioCardProps {
  kycApproved: boolean;
  onExplorePackages: () => void;
  onCompleteKyc: () => void;
}

export const EmptyPortfolioCard: React.FC<EmptyPortfolioCardProps> = ({
  kycApproved,
  onExplorePackages,
  onCompleteKyc,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.iconCircle}>
        <Ionicons
          name={kycApproved ? 'briefcase-outline' : 'shield-outline'}
          size={28}
          color={colors.primary}
        />
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {kycApproved ? 'Build Your Real Estate Portfolio' : 'Welcome to BricketX'}
      </Text>

      <Text style={styles.description}>
        {kycApproved
          ? 'Browse our vetted institutional property packages, view projected yields, and start deploying capital.'
          : 'Complete your accredited investor verification (KYC) to unlock syndicated real estate packages and quarterly yields.'}
      </Text>

      <View style={styles.stepsList}>
        <View style={styles.stepItem}>
          <View style={[styles.stepDot, kycApproved && styles.stepDotDone]}>
            <Ionicons
              name={kycApproved ? 'checkmark' : 'ellipse'}
              size={10}
              color={kycApproved ? '#FFFFFF' : colors.primary}
            />
          </View>
          <Text style={[styles.stepText, kycApproved && styles.stepTextDone]}>
            1. Identity &amp; Compliance Verification (KYC)
          </Text>
        </View>

        <View style={styles.stepItem}>
          <View style={styles.stepDot}>
            <Ionicons name="ellipse" size={10} color={colors.primary} />
          </View>
          <Text style={styles.stepText}>2. Select &amp; Commit to an Investment Package</Text>
        </View>

        <View style={styles.stepItem}>
          <View style={styles.stepDot}>
            <Ionicons name="ellipse" size={10} color={colors.primary} />
          </View>
          <Text style={styles.stepText}>3. Sign Terms &amp; Wire Capital</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={kycApproved ? onExplorePackages : onCompleteKyc}
        activeOpacity={0.85}
      >
        <Ionicons
          name={kycApproved ? 'layers-outline' : 'arrow-forward-outline'}
          size={16}
          color="#FFFFFF"
          style={{ flexShrink: 0 }}
        />
        <Text style={styles.primaryBtnText} numberOfLines={2}>
          {kycApproved ? 'Explore Investment Packages' : 'Complete Verification'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFECE6',
    padding: 20,
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#E7D7C1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    flexShrink: 0,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 22,
    flexShrink: 1,
  },
  description: {
    fontSize: 12.5,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 16,
    paddingHorizontal: 8,
    flexShrink: 1,
  },
  stepsList: {
    width: '100%',
    backgroundColor: '#FAF9F6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EFECE6',
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#E7D7C1',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepDotDone: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  stepText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    lineHeight: 17,
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
  },
  stepTextDone: {
    color: '#2E7D32',
    textDecorationLine: 'line-through',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 14,
  },
  primaryBtnText: {
    fontSize: 13.5,
    lineHeight: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    flexShrink: 1,
  },
});
