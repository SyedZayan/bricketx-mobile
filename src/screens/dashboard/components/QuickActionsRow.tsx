import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';

interface Props {
  isKycApproved: boolean;
  contractsCount: number;
  onPressPackages: () => void;
  onPressInvestments: () => void;
  onPressKyc: () => void;
  onPressSupport: () => void;
}

export const QuickActionsRow: React.FC<Props> = ({
  isKycApproved,
  contractsCount,
  onPressPackages,
  onPressInvestments,
  onPressKyc,
  onPressSupport,
}) => {
  const actions = [
    {
      key: 'packages',
      label: 'Invest',
      icon: 'layers-outline' as const,
      onPress: onPressPackages,
      showAlert: false,
    },
    {
      key: 'contracts',
      label: contractsCount > 0 ? `Portfolio (${contractsCount})` : 'Portfolio',
      icon: 'briefcase-outline' as const,
      onPress: onPressInvestments,
      showAlert: false,
    },
    {
      key: 'kyc',
      label: isKycApproved ? 'KYC Record' : 'Verify ID',
      icon: 'shield-checkmark-outline' as const,
      onPress: onPressKyc,
      showAlert: !isKycApproved,
    },
    {
      key: 'support',
      label: 'Support',
      icon: 'headset-outline' as const,
      onPress: onPressSupport,
      showAlert: false,
    },
  ];

  return (
    <View style={styles.row}>
      {actions.map((item) => (
        <TouchableOpacity
          key={item.key}
          style={styles.tile}
          onPress={item.onPress}
          activeOpacity={0.8}
        >
          <View style={styles.iconCircle}>
            <Ionicons name={item.icon} size={18} color={colors.primary} />
            {item.showAlert && <View style={styles.alertDot} />}
          </View>
          <Text style={styles.label} numberOfLines={2}>
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  tile: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFECE6',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#E7D7C1',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  alertDot: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  label: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 15,
    flexShrink: 1,
  },
});
