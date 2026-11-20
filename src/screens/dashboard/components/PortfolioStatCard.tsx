import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';

interface Props {
  title: string;
  value: string;
  subtitle: string;
  iconName: keyof typeof Ionicons.glyphMap;
  accentColor?: string;
}

export const PortfolioStatCard: React.FC<Props> = ({
  title,
  value,
  subtitle,
  iconName,
  accentColor = colors.primary,
}) => {
  return (
    <View style={styles.card}>
      <View style={[styles.iconRing, { borderColor: `${accentColor}30` }]}>
        <Ionicons name={iconName} size={16} color={accentColor} />
      </View>
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
      <Text
        style={[
          styles.value,
          { color: accentColor === '#2E7D32' ? '#2E7D32' : colors.text },
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
      <Text style={styles.subtitle} numberOfLines={1}>
        {subtitle}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexBasis: '48%',
    minWidth: 0,
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFECE6',
    borderRadius: 14,
    padding: 14,
  },
  iconRing: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  value: {
    fontSize: 16,
    flexShrink: 1,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginTop: 4,
  },
  subtitle: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 4,
  },
});
