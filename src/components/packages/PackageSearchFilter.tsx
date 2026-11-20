import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

export type PackageFilterType = 'ALL' | 'DYNAMIC' | 'FIXED';
export type SortKey = 'name' | 'minInvestmentAsc' | 'minInvestmentDesc' | 'roiDesc';

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'name', label: 'Name (A-Z)' },
  { value: 'minInvestmentAsc', label: 'Min. investment: low to high' },
  { value: 'minInvestmentDesc', label: 'Min. investment: high to low' },
  { value: 'roiDesc', label: 'ROI: high to low' },
];

interface PackageSearchFilterProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filter: PackageFilterType;
  setFilter: (filter: PackageFilterType) => void;
  sort: SortKey;
  setSort: (sort: SortKey) => void;
}

export const PackageSearchFilter: React.FC<PackageSearchFilterProps> = ({
  searchQuery,
  setSearchQuery,
  filter,
  setFilter,
  sort,
  setSort,
}) => {
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const currentSortLabel =
    SORT_OPTIONS.find((s) => s.value === sort)?.label || 'Sort by';

  return (
    <>
      {/* Search Bar & Sort Dropdown Button */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={17} color={colors.primary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search packages..."
            placeholderTextColor="#A8A29E"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            autoCapitalize="none"
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.sortTriggerBtn}
          onPress={() => setSortModalVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="swap-vertical" size={15} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Segmented Filter Strip */}
      <View style={styles.filterStrip}>
        {(['ALL', 'FIXED', 'DYNAMIC'] as const).map((tab) => {
          const isSelected = filter === tab;
          const label =
            tab === 'ALL'
              ? 'All Offerings'
              : tab === 'FIXED'
              ? 'Fixed Yield'
              : 'Dynamic Allocation';

          return (
            <TouchableOpacity
              key={tab}
              style={[styles.filterChip, isSelected && styles.filterChipActive]}
              onPress={() => setFilter(tab)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.filterChipText,
                  isSelected && styles.filterChipTextActive,
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Sort Selection Modal */}
      <Modal
        visible={sortModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSortModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSortModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sort Packages</Text>
            {SORT_OPTIONS.map((opt) => {
              const isSelected = sort === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.modalOption, isSelected && styles.modalOptionActive]}
                  onPress={() => {
                    setSort(opt.value);
                    setSortModalVisible(false);
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      isSelected && styles.modalOptionTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark" size={16} color={colors.primary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 8,
    flexDirection: 'row',
    gap: 8,
  },
  searchBar: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7D7C1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 9 : 7,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    fontSize: 12.5,
    color: colors.text,
    padding: 0,
  },
  sortTriggerBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7D7C1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    paddingBottom: 10,
    gap: 6,
    backgroundColor: '#F8F7F4',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 14,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  modalOptionActive: {
    backgroundColor: '#FAF5EE',
  },
  modalOptionText: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    paddingRight: 8,
  },
  modalOptionTextActive: {
    fontWeight: '800',
    color: colors.primary,
  },
});
