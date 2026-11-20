import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { allCountries, countryName, CountryOption } from '../../features/kyc/kycUtils';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

interface CountryPickerFieldProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (code: string) => void;
  clearable?: boolean;
  error?: string;
}

export const CountryPickerField: React.FC<CountryPickerFieldProps> = ({
  label,
  placeholder = 'Select country',
  value,
  onChange,
  clearable = false,
  error,
}) => {
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState('');

  const countries = useMemo(() => allCountries(), []);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [countries, query]);

  const selectedLabel = value ? `${countryName(value)} (${value.toUpperCase()})` : '';

  const renderItem = ({ item }: { item: CountryOption }) => {
    const isSelected = item.code === value?.toUpperCase();
    return (
      <TouchableOpacity
        style={[styles.optionRow, isSelected && styles.optionRowSelected]}
        onPress={() => {
          onChange(item.code);
          setVisible(false);
          setQuery('');
        }}
        activeOpacity={0.7}
      >
        <View style={styles.codeBadge}>
          <Text style={styles.codeBadgeText}>{item.code}</Text>
        </View>
        <Text style={[styles.optionName, isSelected && styles.optionNameSelected]}>
          {item.name}
        </Text>
        {isSelected && <Ionicons name="checkmark" size={18} color={colors.primary} />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {!!label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={[styles.trigger, !!error && styles.triggerError]}
        onPress={() => setVisible(true)}
        activeOpacity={0.75}
      >
        <Text
          style={[styles.triggerText, !selectedLabel && styles.placeholderText]}
          numberOfLines={1}
        >
          {selectedLabel || placeholder}
        </Text>
        <View style={styles.triggerActions}>
          {clearable && !!value && (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
          <Ionicons name="chevron-down" size={18} color={colors.slate} />
        </View>
      </TouchableOpacity>
      {!!error && <Text style={styles.errorText}>{error}</Text>}

      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setVisible(false)}
      >
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{label ? label.replace(/\s*\*\s*$/, '') : 'Select Country'}</Text>
            <TouchableOpacity
              onPress={() => {
                setVisible(false);
                setQuery('');
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchWrap}>
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search country or code (e.g. Pakistan, AE)..."
              placeholderTextColor={colors.textMuted}
              value={query}
              onChangeText={setQuery}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {!!query && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={filtered}
            keyExtractor={(item) => item.code}
            renderItem={renderItem}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No matching countries found.</Text>
            }
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.radiusMd,
    paddingHorizontal: spacing.md,
    minHeight: 48,
  },
  triggerError: {
    borderColor: colors.error,
  },
  triggerText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  placeholderText: {
    color: colors.textMuted,
    fontWeight: '400',
  },
  triggerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: 4,
  },
  modalSafe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    margin: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: spacing.radiusMd,
    borderWidth: 1,
    borderColor: colors.border,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: 12,
  },
  optionRowSelected: {
    backgroundColor: '#FAF5EE',
    borderRadius: spacing.radiusSm,
  },
  codeBadge: {
    width: 34,
    height: 24,
    borderRadius: 4,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.slate,
  },
  optionName: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  optionNameSelected: {
    fontWeight: '700',
    color: colors.primary,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: spacing.xl,
    fontSize: 14,
  },
});

