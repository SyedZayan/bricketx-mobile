import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';

export type PayoutFreq = 'quarterly' | 'half_yearly' | 'yearly';

interface CommitmentInputsProps {
  amount: number;
  minPackageAmount: number;
  isPooled: boolean;
  onAmountChange: (text: string) => void;
  onQuickAdd: (increment: number) => void;
  onResetMin: () => void;
  payoutOptions: string[];
  selectedCadence: PayoutFreq;
  onCadenceSelect: (cadence: PayoutFreq) => void;
  isDynamic?: boolean;
  tenureYears: number;
  onTenureSelect: (years: number) => void;
}

const formatWholeNumber = (val: number): string => {
  if (!Number.isFinite(val) || val <= 0) return '0';
  return Math.trunc(val).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const cadenceLabel = (c: PayoutFreq) => {
  switch (c) {
    case 'quarterly':
      return 'Quarterly';
    case 'half_yearly':
      return 'Semi-Annual';
    case 'yearly':
      return 'Annual';
    default:
      return c;
  }
};

export const CommitmentInputs: React.FC<CommitmentInputsProps> = ({
  amount,
  minPackageAmount,
  isPooled,
  onAmountChange,
  onQuickAdd,
  onResetMin,
  payoutOptions,
  selectedCadence,
  onCadenceSelect,
  isDynamic,
  tenureYears,
  onTenureSelect,
}) => {
  const formattedMin = formatWholeNumber(minPackageAmount);

  return (
    <>
      {/* 1. Principal Input Card */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle} numberOfLines={2}>
          Principal Commitment
        </Text>
        <Text style={styles.sectionSubtitle} numberOfLines={2}>
          Select ticket size in USD for allocation
        </Text>

        <View style={[styles.inputContainer, isPooled && styles.inputContainerPooled]}>
          <Text style={styles.currencyPrefix} numberOfLines={1}>
            $
          </Text>
          <TextInput
            style={styles.amountInput}
            keyboardType="numeric"
            value={amount > 0 ? formatWholeNumber(amount) : ''}
            onChangeText={onAmountChange}
            placeholder="0"
            placeholderTextColor="#BDBDBD"
            maxLength={16}
          />
        </View>

        {isPooled && (
          <View style={styles.belowMinNotice}>
            <Ionicons
              name="information-circle"
              size={16}
              color="#8C6A3E"
              style={{ flexShrink: 0, marginTop: 1 }}
            />
            <Text style={styles.belowMinNoticeText}>
              Below standard minimum (${formattedMin}). Capital participates via syndicate pool.
            </Text>
          </View>
        )}

        {/* Quick Increment Buttons */}
        <View style={styles.quickChipRow}>
          <TouchableOpacity style={styles.quickChip} onPress={onResetMin} activeOpacity={0.7}>
            <Text
              style={styles.quickChipText}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              Min Ticket
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickChip} onPress={() => onQuickAdd(10000)} activeOpacity={0.7}>
            <Text
              style={styles.quickChipText}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              +$10k
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickChip} onPress={() => onQuickAdd(25000)} activeOpacity={0.7}>
            <Text
              style={styles.quickChipText}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              +$25k
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickChip} onPress={() => onQuickAdd(50000)} activeOpacity={0.7}>
            <Text
              style={styles.quickChipText}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              +$50k
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Payout Frequency */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle} numberOfLines={2}>
          Disbursement Frequency
        </Text>
        <Text style={styles.sectionSubtitle} numberOfLines={2}>
          Select cadence for return disbursements
        </Text>

        <View style={styles.payoutGrid}>
          {payoutOptions.map((opt) => {
            const isSelected = selectedCadence === opt;
            return (
              <TouchableOpacity
                key={opt}
                style={[styles.payoutOption, isSelected && styles.payoutOptionSelected]}
                onPress={() => onCadenceSelect(opt as PayoutFreq)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                  size={16}
                  color={isSelected ? colors.primary : colors.textMuted}
                  style={{ flexShrink: 0 }}
                />
                <Text
                  style={[styles.payoutOptionText, isSelected && styles.payoutOptionTextSelected]}
                  numberOfLines={1}
                >
                  {cadenceLabel(opt as PayoutFreq)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 3. Dynamic Tenure Options */}
      {isDynamic && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle} numberOfLines={2}>
            Tenure Duration
          </Text>
          <Text style={styles.sectionSubtitle} numberOfLines={2}>
            Choose portfolio hold period
          </Text>
          <View style={styles.tenureRow}>
            {[1, 2, 3, 5].map((years) => {
              const isSelected = tenureYears === years;
              return (
                <TouchableOpacity
                  key={years}
                  style={[styles.tenureChip, isSelected && styles.tenureChipSelected]}
                  onPress={() => onTenureSelect(years)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[styles.tenureChipText, isSelected && styles.tenureChipTextSelected]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.8}
                  >
                    {years} {years === 1 ? 'Year' : 'Years'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFECE6',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '800',
    color: colors.text,
  },
  sectionSubtitle: {
    fontSize: 11.5,
    lineHeight: 16,
    color: colors.textMuted,
    marginTop: 2,
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    backgroundColor: '#FFFFFF',
  },
  inputContainerPooled: {
    borderColor: '#C39967',
  },
  currencyPrefix: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '800',
    color: colors.primary,
    marginRight: 6,
    flexShrink: 0,
  },
  amountInput: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '800',
    color: colors.text,
    fontVariant: ['tabular-nums'],
    padding: 0,
  },
  belowMinNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#DFC7A7',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  belowMinNoticeText: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    fontSize: 11,
    color: '#8C6A3E',
    lineHeight: 16,
    fontWeight: '600',
  },
  quickChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  quickChip: {
    flexBasis: '22%',
    flexGrow: 1,
    minWidth: 68,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#FAF9F6',
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  quickChipText: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  payoutGrid: {
    gap: 8,
  },
  payoutOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#FAF9F6',
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  payoutOptionSelected: {
    backgroundColor: '#FAF5EE',
    borderColor: colors.primary,
  },
  payoutOptionText: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    fontSize: 12.5,
    lineHeight: 17,
    fontWeight: '600',
    color: colors.text,
  },
  payoutOptionTextSelected: {
    fontWeight: '800',
    color: colors.primary,
  },
  tenureRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tenureChip: {
    flexBasis: '22%',
    flexGrow: 1,
    minWidth: 68,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#FAF9F6',
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  tenureChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tenureChipText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  tenureChipTextSelected: {
    color: '#FFFFFF',
  },
});


