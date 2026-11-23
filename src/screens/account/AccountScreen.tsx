import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Linking,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useGetKycMeQuery,
  useGetAuthMeQuery,
  useGetTicketsSummaryQuery,
  useGetInvestmentsQuery,
  useGetNotificationsPreferencesQuery,
} from '../../api/generated/investorApi';
import { baseApi } from '../../api/baseApi';
import { tokenMemory } from '../../api/tokenMemory';
import { secureSession } from '../../utils/secureSession';
import { BiometricsService } from '../../services/biometrics';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logoutAction } from '../../store/authSlice';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

import { AppHeader } from '../../components/common/AppHeader';
import {
  StatusFeedbackModal,
  FeedbackVariant,
} from '../../components/common/StatusFeedbackModal';
import { NotificationPreferencesModal } from '../../components/notifications/NotificationPreferencesModal';
import { ProfileHeaderCard } from './components/ProfileHeaderCard';
import { AccountMenuItem } from './components/AccountMenuItem';

interface ModalState {
  visible: boolean;
  variant: FeedbackVariant;
  title: string;
  message: string;
  primaryLabel: string;
  secondaryLabel?: string;
  destructive?: boolean;
  iconName?: keyof typeof Ionicons.glyphMap;
  onPrimary: () => void;
}

export const AccountScreen: React.FC<NativeStackScreenProps<any>> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const authUser = useAppSelector((state) => state.auth.user);

  const { data: authData } = useGetAuthMeQuery();
  const { data: kycData } = useGetKycMeQuery(undefined);
  const { data: ticketSummary } = useGetTicketsSummaryQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const { data: investmentsData } = useGetInvestmentsQuery(undefined);
  const { data: notifPrefs } = useGetNotificationsPreferencesQuery();

  const awaitingInvestorCount = ticketSummary?.awaitingInvestor ?? 0;
  const activeHoldingsCount = Array.isArray((investmentsData as any)?.items)
    ? (investmentsData as any).items.length
    : Array.isArray(investmentsData)
    ? (investmentsData as any).length
    : 0;

  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [biometricTypeName, setBiometricTypeName] = useState('Face ID / Fingerprint');
  const [notifPrefsVisible, setNotifPrefsVisible] = useState(false);

  const [modal, setModal] = useState<ModalState>({
    visible: false,
    variant: 'info',
    title: '',
    message: '',
    primaryLabel: 'OK',
    onPrimary: () => {},
  });

  const closeModal = useCallback(() => {
    setModal((prev) => ({ ...prev, visible: false }));
  }, []);

  const rawKycStatus =
    (kycData?.kycProfile as any)?.status || (kycData as any)?.status || 'NOT_STARTED';
  const kycStatus = String(rawKycStatus).toUpperCase();
  const isApproved = kycStatus === 'APPROVED' || kycStatus === 'VERIFIED';
  const investorType = (
    (kycData?.kycProfile as any)?.investorType ||
    (kycData?.kycProfile as any)?.type ||
    (kycData as any)?.investorType ||
    (kycData?.companyKyc ? 'COMPANY' : 'INDIVIDUAL')
  ).toUpperCase();
  const kycIndividual = kycData?.individualDetails || (kycData as any)?.individual;
  const applicantName =
    authData?.fullName ||
    authUser?.fullName ||
    (kycIndividual
      ? `${kycIndividual.firstName || ''} ${kycIndividual.lastName || ''}`.trim()
      : '') ||
    'Investor';

  const applicantEmail =
    authData?.email ||
    authUser?.email ||
    (kycData as any)?.applicantEmail ||
    'investor@bricketx.com';

  useEffect(() => {
    initBiometricState();
  }, []);

  const initBiometricState = async () => {
    const enabled = await BiometricsService.isEnabled();
    setBiometricsEnabled(enabled);

    const isAvailable = await BiometricsService.isAvailable();
    if (isAvailable) {
      const typeName = await BiometricsService.getBiometricTypeName();
      setBiometricTypeName(typeName);
    }
  };

  const handleToggleBiometrics = async (nextValue: boolean) => {
    if (nextValue) {
      const available = await BiometricsService.isAvailable();
      if (!available) {
        setModal({
          visible: true,
          variant: 'warning',
          iconName: 'finger-print-outline',
          title: 'Biometrics Not Enrolled',
          message:
            'No biometric credentials (Fingerprint or Face ID) are enrolled on this device. Please register them in your phone settings first.',
          primaryLabel: 'Got It',
          onPrimary: closeModal,
        });
        return;
      }

      const authResult = await BiometricsService.authenticate(
        `Authorize ${biometricTypeName} for BricketX unlock`
      );

      if (authResult.success) {
        const currentRefreshToken = await secureSession.getRefreshToken();
        setBiometricsEnabled(true);
        await BiometricsService.setEnabled(
          true,
          applicantEmail,
          currentRefreshToken || undefined
        );
      } else if (!authResult.cancelled) {
        setModal({
          visible: true,
          variant: 'warning',
          iconName: 'finger-print-outline',
          title: `${biometricTypeName} Unavailable`,
          message:
            authResult.message ||
            'Biometric verification was not completed. Please try again or use your password.',
          primaryLabel: 'Got It',
          onPrimary: closeModal,
        });
      }
    } else {
      setBiometricsEnabled(false);
      await BiometricsService.setEnabled(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'VERIFIED':
        return { label: 'Verified', bg: '#E8F5E9', text: '#2E7D32', border: '#C8E6C9' };
      case 'IN_REVIEW':
        return { label: 'In Review', bg: '#FFF8E1', text: '#B78103', border: '#FFE082' };
      case 'REJECTED':
        return { label: 'Action Required', bg: '#FFEBEE', text: '#C62828', border: '#FFCDD2' };
      default:
        return { label: 'Unverified', bg: '#FAF5EE', text: colors.primary, border: '#E7D7C1' };
    }
  };

  const statusBadge = getStatusBadge(kycStatus);

  const handleNavigation = (routeName: string, params?: any) => {
    const rootNav: any = navigation.getParent() || navigation;
    rootNav.navigate(routeName, params);
  };

  const handleOpenProfile = () => {
    if (isApproved) {
      handleNavigation('KycProfileView', { initialTab: 'personal' });
    } else {
      handleNavigation('KycModal', { screen: 'Dashboard' });
    }
  };

  const executeSignOut = async () => {
    closeModal();
    try {
      tokenMemory.setAccessToken(null);

      const isBioEnabled = await BiometricsService.isEnabled();
      if (!isBioEnabled) {
        if (typeof (secureSession as any).clear === 'function') {
          await (secureSession as any).clear();
        } else if (typeof secureSession.setRefreshToken === 'function') {
          await secureSession.setRefreshToken('');
        }
        await BiometricsService.setEnabled(false);
      }

      dispatch(baseApi.util.resetApiState());
      dispatch(logoutAction());
    } catch {
      dispatch(logoutAction());
    }
  };

  const handleLogoutPress = () => {
    setModal({
      visible: true,
      variant: 'confirm',
      iconName: 'log-out-outline',
      title: 'Sign Out',
      message: 'Are you sure you want to end your investor session on this device?',
      primaryLabel: 'Sign Out',
      secondaryLabel: 'Cancel',
      destructive: true,
      onPrimary: executeSignOut,
    });
  };

  const openExternalUrl = (url: string) => {
    Linking.openURL(url).catch(() => {
      setModal({
        visible: true,
        variant: 'info',
        title: 'Unable to Open Link',
        message: 'Could not launch the external page on this device.',
        primaryLabel: 'OK',
        onPrimary: closeModal,
      });
    });
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Account" subtitle="Security, KYC & preferences" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Investor Identity & Profile Card */}
        <ProfileHeaderCard
          name={applicantName}
          email={applicantEmail}
          investorType={investorType}
          investorRfid={authData?.investorRfid}
          isApproved={isApproved}
          statusBadge={statusBadge}
          activeHoldingsCount={activeHoldingsCount}
          onOpenProfile={handleOpenProfile}
        />

        {/* Quick-Access Investor Vault Tiles */}
        <View style={styles.quickGrid}>
          <TouchableOpacity
            style={styles.quickTile}
            onPress={() => handleNavigation('Documents')}
            activeOpacity={0.8}
          >
            <View style={styles.quickIconCircle}>
              <Ionicons name="folder-open-outline" size={20} color={colors.primary} />
            </View>
            <Text style={styles.quickTitle} numberOfLines={1}>Documents</Text>
            <Text style={styles.quickSub} numberOfLines={2}>Agreements &amp; certs</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickTile}
            onPress={() => handleNavigation('Statements')}
            activeOpacity={0.8}
          >
            <View style={styles.quickIconCircle}>
              <Ionicons name="document-text-outline" size={20} color={colors.primary} />
            </View>
            <Text style={styles.quickTitle} numberOfLines={1}>Statements</Text>
            <Text style={styles.quickSub} numberOfLines={2}>Account ledgers</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickTile}
            onPress={() => handleNavigation('Support')}
            activeOpacity={0.8}
          >
            <View style={styles.quickIconCircle}>
              <Ionicons name="headset-outline" size={20} color={colors.primary} />
              {awaitingInvestorCount > 0 && <View style={styles.quickAlertDot} />}
            </View>
            <Text style={styles.quickTitle} numberOfLines={1}>Support</Text>
            <Text style={styles.quickSub}>
              {awaitingInvestorCount > 0 ? `${awaitingInvestorCount} reply` : 'Help desk'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Compliance & Verification */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>COMPLIANCE &amp; RECORDS</Text>
          <View style={styles.card}>
            <AccountMenuItem
              icon="shield-checkmark-outline"
              title="Identity & KYC Records"
              subtitle={
                isApproved
                  ? 'Verified personal, entity & statutory filings'
                  : 'Complete identity, entity & funding verification'
              }
              badge={statusBadge.label}
              badgeColor={statusBadge.text}
              badgeBg={statusBadge.bg}
              onPress={handleOpenProfile}
            />
          </View>
        </View>

        {/* Security & Notification Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>SECURITY &amp; PREFERENCES</Text>
          <View style={styles.card}>
            <AccountMenuItem
              icon="finger-print-outline"
              title="Biometric Authentication"
              subtitle={`Require ${biometricTypeName} on sign in`}
              rightElement={
                <Switch
                  value={biometricsEnabled}
                  onValueChange={handleToggleBiometrics}
                  trackColor={{ false: '#E0DDD6', true: colors.primary }}
                  thumbColor="#FFFFFF"
                />
              }
            />
            <View style={styles.divider} />

            <AccountMenuItem
              icon="notifications-outline"
              title="Notification Preferences"
              subtitle="Email delivery for payouts, statements & updates"
              valueText={
                notifPrefs
                  ? notifPrefs.updatesByEmail
                    ? 'On'
                    : 'Security only'
                  : undefined
              }
              onPress={() => setNotifPrefsVisible(true)}
            />
            <View style={styles.divider} />

            <AccountMenuItem
              icon="lock-closed-outline"
              title="Update Password"
              subtitle="Change your portal login credentials"
              onPress={() => handleNavigation('UpdatePassword')}
            />
          </View>
        </View>

        {/* Legal & Disclosures */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>LEGAL &amp; DISCLOSURES</Text>
          <View style={styles.card}>
            <AccountMenuItem
              icon="newspaper-outline"
              title="Investor Agreement"
              subtitle="Terms of participation, pooling & returns"
              onPress={() => openExternalUrl('https://bricketx.com/terms')}
            />
            <View style={styles.divider} />
            <AccountMenuItem
              icon="shield-outline"
              title="Privacy Policy"
              subtitle="Data encryption & banking standards"
              onPress={() => openExternalUrl('https://bricketx.com/privacy')}
            />
          </View>
        </View>

        {/* Session & Account Management */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>SESSION &amp; ACCOUNT</Text>
          <View style={styles.card}>
            <AccountMenuItem
              icon="log-out-outline"
              title="Sign Out"
              subtitle="Safely end your session on this device"
              onPress={handleLogoutPress}
              isDestructive
            />
            <View style={styles.divider} />
            <AccountMenuItem
              icon="trash-outline"
              title="Close Account"
              subtitle="Review liquidation & account termination"
              onPress={() => handleNavigation('AccountClosure')}
              isDestructive
            />
          </View>
        </View>

        <Text style={styles.footerVersion}>
          BricketX Private Wealth  •  v1.0.0 (Build 42)
        </Text>
        <Text style={styles.footerSecurity}>
          Bank-grade 256-bit AES encryption active
        </Text>
      </ScrollView>

      <NotificationPreferencesModal
        visible={notifPrefsVisible}
        onClose={() => setNotifPrefsVisible(false)}
      />

      <StatusFeedbackModal
        visible={modal.visible}
        variant={modal.variant}
        title={modal.title}
        message={modal.message}
        primaryLabel={modal.primaryLabel}
        secondaryLabel={modal.secondaryLabel}
        destructive={modal.destructive}
        iconName={modal.iconName}
        onPrimary={modal.onPrimary}
        onSecondary={modal.secondaryLabel ? closeModal : undefined}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7F4',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    gap: 14,
  },
  quickGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  quickTile: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#EFECE6',
    paddingVertical: 13,
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 4,
  },
  quickIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#EFE4D3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
    position: 'relative',
  },
  quickAlertDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.primary,
  },
  quickTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: colors.text,
  },
  quickSub: {
    fontSize: 10.5,
    color: colors.textMuted,
    textAlign: 'center',
  },
  section: {
    gap: 7,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.7,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFECE6',
    overflow: 'hidden',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#EFECE6',
    marginLeft: 64,
  },
  footerVersion: {
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    marginTop: 6,
  },
  footerSecurity: {
    textAlign: 'center',
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
});



