import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AccountMenuItem } from './AccountMenuItem';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';

interface Props {
  isLocked: boolean;
  statusBadge: { label: string; bg: string; text: string; border?: string };
  onNavigate: (route: string, params?: any) => void;
}

export const KycSectionCard: React.FC<Props> = ({ isLocked, statusBadge, onNavigate }) => {
  const handlePress = () => {
    if (isLocked) {
      onNavigate('KycProfileView', { initialTab: 'personal' });
    } else {
      onNavigate('KycModal', { screen: 'Dashboard' });
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionHeader}>INVESTMENT PROFILE</Text>

      <View style={styles.card}>
        <AccountMenuItem
          icon="shield-checkmark-outline"
          title="Identity & Compliance"
          subtitle={
            isLocked
              ? 'Verified personal, entity & statutory records'
              : 'Complete identity, entity, and funding verification'
          }
          badge={statusBadge.label}
          badgeColor={statusBadge.text}
          badgeBg={statusBadge.bg}
          onPress={handlePress}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.md,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFECE6',
    overflow: 'hidden',
  },
});