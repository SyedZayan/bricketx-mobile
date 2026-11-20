import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';

export interface AccountMenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  badgeBg?: string;
  valueText?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  isDestructive?: boolean;
}

export const AccountMenuItem: React.FC<AccountMenuItemProps> = ({
  icon,
  title,
  subtitle,
  badge,
  badgeColor,
  badgeBg,
  valueText,
  onPress,
  rightElement,
  isDestructive = false,
}) => (
  <TouchableOpacity
    style={styles.menuItem}
    onPress={onPress}
    disabled={!onPress && !rightElement}
    activeOpacity={0.72}
  >
    <View style={[styles.menuIconBox, isDestructive && styles.destructiveIconBox]}>
      <Ionicons
        name={icon}
        size={18}
        color={isDestructive ? colors.error : colors.primary}
      />
    </View>

    <View style={styles.menuContent}>
      <Text
        style={[styles.menuTitle, isDestructive && styles.destructiveText]}
        numberOfLines={1}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text style={styles.menuSubtitle} numberOfLines={2}>
          {subtitle}
        </Text>
      ) : null}
    </View>

    <View style={styles.rightSideContainer}>
      {valueText ? (
        <Text style={styles.valueText} numberOfLines={1}>
          {valueText}
        </Text>
      ) : null}

      {badge ? (
        <View style={[styles.menuBadge, { backgroundColor: badgeBg || '#E8F5E9' }]}>
          <Text style={[styles.menuBadgeText, { color: badgeColor || '#2E7D32' }]}>
            {badge}
          </Text>
        </View>
      ) : null}

      {rightElement ? (
        rightElement
      ) : onPress ? (
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      ) : null}
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13.5,
    paddingHorizontal: 14,
  },
  menuIconBox: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#EFE4D3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  destructiveIconBox: {
    backgroundColor: '#FFEBEE',
    borderColor: '#FFCDD2',
  },
  menuContent: {
    flex: 1,
    paddingRight: 8,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
  },
  menuSubtitle: {
    fontSize: 11.5,
    color: colors.textMuted,
    lineHeight: 16,
    marginTop: 2,
  },
  destructiveText: {
    color: colors.error,
  },
  rightSideContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  valueText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  menuBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
  },
  menuBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
