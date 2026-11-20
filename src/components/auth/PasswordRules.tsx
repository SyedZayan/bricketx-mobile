import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { validatePassword } from '../../utils/passwordRules';
import { colors } from '../../theme/colors';

interface Props {
  password: string;
}

export const PasswordRules: React.FC<Props> = ({ password }) => {
  const rules = validatePassword(password);

  const items = [
    { label: 'At least 8 characters', valid: rules.hasMinLength },
    { label: 'One uppercase letter (A-Z)', valid: rules.hasUpper },
    { label: 'One lowercase letter (a-z)', valid: rules.hasLower },
    { label: 'One number (0-9)', valid: rules.hasNumber },
  ];

  return (
    <View style={styles.container}>
      {items.map((item, idx) => (
        <View key={idx} style={styles.ruleRow}>
          <Ionicons
            name={item.valid ? 'checkmark-circle' : 'ellipse-outline'}
            size={15}
            color={item.valid ? '#2E7D32' : '#A39E93'}
          />
          <Text style={[styles.ruleText, item.valid && styles.ruleTextValid]}>
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFECE6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: -4,
    marginBottom: 15,
    gap: 6,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ruleText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
  ruleTextValid: {
    color: '#2E7D32',
    fontWeight: '600',
  },
});
