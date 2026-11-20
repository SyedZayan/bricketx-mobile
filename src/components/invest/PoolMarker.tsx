import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getPoolStateMeta } from '../../utils/pooling';
import { colors } from '../../theme/colors';

interface PoolMarkerProps {
  poolInvestment?: { state: string } | null;
}

export const PoolMarker: React.FC<PoolMarkerProps> = ({ poolInvestment }) => {
  if (!poolInvestment) return null;

  const meta = getPoolStateMeta(poolInvestment.state);
  const isSuccess = meta.tone === 'success';

  return (
    <View style={styles.container}>
      <View style={styles.poolChip}>
        <Ionicons name="people-outline" size={11} color={colors.primary} />
        <Text style={styles.poolChipText}>Pool Investment</Text>
      </View>

      <View
        style={[
          styles.statusPill,
          isSuccess ? styles.statusPillSuccess : styles.statusPillWarning,
        ]}
      >
        <View
          style={[
            styles.dot,
            { backgroundColor: isSuccess ? '#C39967' : '#8C6A3E' },
          ]}
        />
        <Text
          style={[
            styles.statusPillText,
            isSuccess ? styles.statusTextSuccess : styles.statusTextWarning,
          ]}
        >
          {meta.label}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  poolChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#E7D7C1',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  poolChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusPillWarning: {
    backgroundColor: '#FAF5EE',
    borderColor: '#DFC7A7',
  },
  statusPillSuccess: {
    backgroundColor: '#FAF5EE',
    borderColor: '#DFC7A7',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusTextWarning: {
    color: '#8C6A3E',
  },
  statusTextSuccess: {
    color: '#C39967',
  },
});