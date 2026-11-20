import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

export interface DialCountry {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
  example: string;
}

export const DIAL_COUNTRIES: DialCountry[] = [
  { code: 'AE', name: 'United Arab Emirates', dialCode: '+971', flag: '🇦🇪', example: '50 123 4567' },
  { code: 'PK', name: 'Pakistan', dialCode: '+92', flag: '🇵🇰', example: '300 1234567' },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', flag: '🇸🇦', example: '50 123 4567' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧', example: '7700 900077' },
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸', example: '202 555 0143' },
  { code: 'QA', name: 'Qatar', dialCode: '+974', flag: '🇶🇦', example: '3312 3456' },
  { code: 'KW', name: 'Kuwait', dialCode: '+965', flag: '🇰🇼', example: '5001 2345' },
  { code: 'BH', name: 'Bahrain', dialCode: '+973', flag: '🇧🇭', example: '3600 1234' },
  { code: 'OM', name: 'Oman', dialCode: '+968', flag: '🇴🇲', example: '9212 3456' },
  { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳', example: '98765 43210' },
  { code: 'EG', name: 'Egypt', dialCode: '+20', flag: '🇪🇬', example: '100 123 4567' },
  { code: 'JO', name: 'Jordan', dialCode: '+962', flag: '🇯🇴', example: '7 9012 3456' },
  { code: 'LB', name: 'Lebanon', dialCode: '+961', flag: '🇱🇧', example: '71 123 456' },
  { code: 'TR', name: 'Turkey', dialCode: '+90', flag: '🇹🇷', example: '532 123 4567' },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪', example: '151 23456789' },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷', example: '6 12 34 56 78' },
  { code: 'CH', name: 'Switzerland', dialCode: '+41', flag: '🇨🇭', example: '79 123 45 67' },
  { code: 'NL', name: 'Netherlands', dialCode: '+31', flag: '🇳🇱', example: '6 12345678' },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦', example: '416 555 0199' },
  { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺', example: '412 345 678' },
  { code: 'SG', name: 'Singapore', dialCode: '+65', flag: '🇸🇬', example: '8123 4567' },
  { code: 'MY', name: 'Malaysia', dialCode: '+60', flag: '🇲🇾', example: '12 345 6789' },
  { code: 'HK', name: 'Hong Kong', dialCode: '+852', flag: '🇭🇰', example: '5123 4567' },
  { code: 'ZA', name: 'South Africa', dialCode: '+27', flag: '🇿🇦', example: '71 123 4567' },
  { code: 'NG', name: 'Nigeria', dialCode: '+234', flag: '🇳🇬', example: '802 123 4567' },
];

interface Props {
  selected: DialCountry;
  onSelect: (country: DialCountry) => void;
}

export const CountryDialCodePicker: React.FC<Props> = ({ selected, onSelect }) => {
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return DIAL_COUNTRIES;
    return DIAL_COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dialCode.includes(q) ||
        c.code.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <>
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => {
          setQuery('');
          setVisible(true);
        }}
        activeOpacity={0.75}
      >
        <Text style={styles.flag}>{selected.flag}</Text>
        <Text style={styles.dialCode}>{selected.dialCode}</Text>
        <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
      </TouchableOpacity>

      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Country Code</Text>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setVisible(false)}
            >
              <Ionicons name="close" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchWrap}>
            <Ionicons name="search-outline" size={17} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search country or dial code (e.g. +971, Pakistan)"
              placeholderTextColor={colors.textMuted}
              value={query}
              onChangeText={setQuery}
              autoFocus
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <Ionicons name="close-circle" size={17} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={filtered}
            keyExtractor={(item) => `${item.code}-${item.dialCode}`}
            keyboardShouldPersistTaps="handled"
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            renderItem={({ item }) => {
              const isSelected = item.code === selected.code;
              return (
                <TouchableOpacity
                  style={[styles.row, isSelected && styles.rowSelected]}
                  onPress={() => {
                    onSelect(item);
                    setVisible(false);
                  }}
                >
                  <Text style={styles.rowFlag}>{item.flag}</Text>
                  <Text style={styles.rowName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.rowDial}>{item.dialCode}</Text>
                  {isSelected && (
                    <Ionicons name="checkmark" size={18} color={colors.primary} />
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </SafeAreaView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: '100%',
    paddingLeft: 13,
    paddingRight: 10,
    borderRightWidth: 1,
    borderRightColor: '#EBE6DD',
  },
  flag: {
    fontSize: 17,
  },
  dialCode: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8F7F4',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EFECE6',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F8F7F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    margin: 14,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E0D8',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 18,
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  rowSelected: {
    backgroundColor: '#FAF5EE',
  },
  rowFlag: {
    fontSize: 20,
  },
  rowName: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '600',
    color: colors.text,
  },
  rowDial: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textMuted,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#EFECE6',
    marginLeft: 50,
  },
});


