import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

interface PackageEmptyStateProps {
  isError: boolean;
  searchQuery: string;
  onRetry: () => void;
}

export const PackageEmptyState: React.FC<PackageEmptyStateProps> = ({
  isError,
  searchQuery,
  onRetry,
}) => {
  if (isError) {
    return (
      <View style={styles.centered}>
        <View style={styles.errorIconBox}>
          <Ionicons name="cloud-offline-outline" size={32} color={colors.error} />
        </View>
        <Text style={styles.errorHeader}>Connection Interrupted</Text>
        <Text style={styles.errorSub}>
         Unable to load investment packages right now.
        </Text>
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={onRetry}
          activeOpacity={0.8}
        >
          <Ionicons name="refresh" size={14} color="#FFFFFF" />
          <Text style={styles.retryText}>Retry Connection</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.centered}>
      <View style={styles.emptyIconCircle}>
        <Ionicons name="cube-outline" size={32} color={colors.primary} />
      </View>
      <Text style={styles.emptyHeader}>
        {searchQuery ? 'No Matches Found' : 'No Packages Available'}
      </Text>
      <Text style={styles.emptySub}>
        {searchQuery
          ? `No offerings match "${searchQuery}". Try searching by another keyword.`
          : 'All allocations for this category are currently spoken for or undergoing governance review.'}
      </Text>
      <TouchableOpacity
        style={styles.refreshBtn}
        onPress={onRetry}
        activeOpacity={0.8}
      >
        <Ionicons name="refresh" size={14} color={colors.primary} />
        <Text style={styles.refreshBtnText}>
          {searchQuery ? 'Clear Search' : 'Check Live Status'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  errorIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFEBEE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  errorHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginTop: spacing.xs,
  },
  errorSub: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 280,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.md,
    paddingHorizontal: 16,
    paddingVertical: 9,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#E7D7C1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  emptyHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginTop: spacing.xs,
  },
  emptySub: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 17,
    maxWidth: 280,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.md,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#E7D7C1',
  },
  refreshBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
});