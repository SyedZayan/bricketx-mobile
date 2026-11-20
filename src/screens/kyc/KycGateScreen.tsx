import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useGetKycMeQuery } from '../../api/generated/investorApi';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logoutAction } from '../../store/authSlice';
import { tokenMemory } from '../../api/tokenMemory';
import { secureSession } from '../../utils/secureSession';
import { Button } from '../../components/ui/Button';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

export const KycGateScreen = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  const { data, error, isLoading, refetch } = useGetKycMeQuery(undefined);

  useEffect(() => {
    if (data) {
      console.log('KYC Profile fetched:', {
        status: data.status,
        currentStep: data.currentStep,
      });
    }
    if (error) {
      console.log('Error fetching KYC profile:', JSON.stringify(error, null, 2));
    }
  }, [data, error]);

  const handleLogout = async () => {
    tokenMemory.clear();
    await secureSession.clear();
    dispatch(logoutAction());
    dispatch({ type: 'api/resetApiState' });
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading investor KYC profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.badge}>INVESTOR ACCOUNT</Text>
        <Text style={styles.title}>KYC Verification</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Verification Status:</Text>
          <Text style={styles.detailValue}>{data?.status ?? 'Not Started'}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Current Step:</Text>
          <Text style={styles.detailValue}>{data?.currentStep ?? 'basic_info'}</Text>
        </View>

        {!!error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>
              Unable to load KYC data from server. Tap retry below.
            </Text>
          </View>
        )}

        <Button
          title="Refresh Profile"
          variant="outline"
          onPress={() => refetch()}
          style={styles.actionButton}
        />

        <Button
          title="Sign Out"
          variant="outline"
          onPress={handleLogout}
          style={styles.logoutButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.background,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  badge: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 1.2,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  userEmail: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  divider: {
    height: 1,
    width: '100%',
    backgroundColor: colors.slateLight,
    marginVertical: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: spacing.xs,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textMuted,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textTransform: 'capitalize',
  },
  errorBox: {
    backgroundColor: colors.errorBg,
    padding: spacing.sm,
    borderRadius: spacing.radiusSm,
    marginTop: spacing.md,
    width: '100%',
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    textAlign: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.textMuted,
    fontSize: 14,
  },
  actionButton: {
    marginTop: spacing.lg,
    width: '100%',
  },
  logoutButton: {
    marginTop: spacing.sm,
    width: '100%',
    borderColor: colors.error,
  },
});