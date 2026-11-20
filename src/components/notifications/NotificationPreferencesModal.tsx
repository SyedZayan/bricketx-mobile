import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useGetNotificationsPreferencesQuery,
  usePatchNotificationsPreferencesMutation,
} from '../../api/generated/investorApi';
import { colors } from '../../theme/colors';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const DEFAULT_ALWAYS_EMAILED = [
  'Sign-in verification codes and security alerts',
  'KYC identity review outcomes',
  'Signed investment agreements and wire acknowledgments',
  'Account closure confirmations',
];

export const NotificationPreferencesModal: React.FC<Props> = ({ visible, onClose }) => {
  const insets = useSafeAreaInsets();
  const { data, isLoading, isError, refetch } = useGetNotificationsPreferencesQuery(undefined, {
    skip: !visible,
    refetchOnMountOrArgChange: true,
  });
  const [updatePrefs, { isLoading: isSaving }] = usePatchNotificationsPreferencesMutation();

  const [updatesByEmail, setUpdatesByEmail] = useState<boolean>(true);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (data && typeof data.updatesByEmail === 'boolean') {
      setUpdatesByEmail(data.updatesByEmail);
    }
  }, [data]);

  const handleToggle = async (nextValue: boolean) => {
    const previous = updatesByEmail;
    setUpdatesByEmail(nextValue);
    setSaveError(null);

    try {
      await updatePrefs({ body: { updatesByEmail: nextValue } }).unwrap();
    } catch {
      setUpdatesByEmail(previous);
      setSaveError("Couldn't save your preference right now. Please try again.");
    }
  };

  const alwaysEmailed =
    data?.alwaysEmailed && data.alwaysEmailed.length > 0
      ? data.alwaysEmailed
      : DEFAULT_ALWAYS_EMAILED;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={styles.dragPill} />

        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Notification Settings</Text>
            <Text style={styles.subtitle}>Control how BricketX keeps you informed</Text>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {isLoading && !data ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>Loading preferences…</Text>
          </View>
        ) : isError && !data ? (
          <View style={styles.centerBox}>
            <Text style={styles.errorText}>Couldn&apos;t load notification settings.</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollBody}
          >
            {/* Optional Activity Emails Toggle Card */}
            <View style={styles.toggleCard}>
              <View style={styles.toggleRow}>
                <View style={styles.iconBox}>
                  <Ionicons name="mail-outline" size={19} color={colors.primary} />
                </View>
                <View style={styles.toggleTextCol}>
                  <Text style={styles.toggleTitle}>Portfolio & Statement Emails</Text>
                  <Text style={styles.toggleDesc}>
                    Receive email notifications for payouts, monthly &amp; quarterly statements,
                    funding updates, and support replies.
                  </Text>
                </View>
                {isSaving ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Switch
                    value={updatesByEmail}
                    onValueChange={handleToggle}
                    trackColor={{ false: '#E0DDD6', true: colors.primary }}
                    thumbColor="#FFFFFF"
                  />
                )}
              </View>

              {saveError && <Text style={styles.saveErrorText}>{saveError}</Text>}
            </View>

            {/* Mandatory Security & Legal Notices */}
            <View style={styles.alwaysCard}>
              <View style={styles.alwaysHeader}>
                <Ionicons name="shield-checkmark-outline" size={16} color="#2E7D32" />
                <Text style={styles.alwaysTitle}>Always sent for your security</Text>
              </View>
              <Text style={styles.alwaysSub}>
                To protect your account and keep a complete compliance record, we always send:
              </Text>

              <View style={styles.bulletList}>
                {alwaysEmailed.map((item, idx) => (
                  <View key={idx} style={styles.bulletRow}>
                    <View style={styles.bulletDot} />
                    <Text style={styles.bulletText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>

            <TouchableOpacity style={styles.doneBtn} activeOpacity={0.85} onPress={onClose}>
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    maxHeight: '82%',
  },
  dragPill: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0DDD7',
    alignSelf: 'center',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EDE6',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F6F4EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    padding: 20,
    gap: 14,
  },
  toggleCard: {
    backgroundColor: '#FAFAF7',
    borderWidth: 1,
    borderColor: '#E8E4DC',
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#E7D7C1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleTextCol: {
    flex: 1,
    gap: 3,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  toggleDesc: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 16.5,
  },
  saveErrorText: {
    fontSize: 12,
    color: colors.error,
  },
  alwaysCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFECE6',
    borderRadius: 16,
    padding: 14,
    gap: 8,
  },
  alwaysHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  alwaysTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: colors.text,
  },
  alwaysSub: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 17,
  },
  bulletList: {
    gap: 7,
    marginTop: 4,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#2E7D32',
    marginTop: 6,
  },
  bulletText: {
    flex: 1,
    fontSize: 12.5,
    color: colors.text,
    lineHeight: 17.5,
  },
  doneBtn: {
    backgroundColor: colors.text,
    borderRadius: 12,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  doneBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  centerBox: {
    paddingVertical: 36,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 12.5,
    color: colors.textMuted,
  },
  errorText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  retryBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9,
  },
  retryText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

