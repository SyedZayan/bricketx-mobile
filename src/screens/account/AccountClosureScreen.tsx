import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';

interface Props {
  onClose?: () => void;
  onSuccess?: () => void;
}

export const AccountClosureScreen: React.FC<Props> = ({ onClose, onSuccess }) => {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 28 : 16);

  const [step, setStep] = useState<'confirm' | 'feedback' | 'success'>('confirm');
  const [acknowledged, setAcknowledged] = useState(false);
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [banner, setBanner] = useState<{ type: 'error' | 'warning' | 'success' | 'info'; title: string; message: string } | null>(null);

  const handleInitiateClosure = () => {
    setBanner(null);
    if (!acknowledged) {
      setBanner({
        type: 'warning',
        title: 'Confirmation Required',
        message: 'Please accept the liquidation and statutory waiver.',
      });
      return;
    }
    setStep('feedback');
  };

  const handleSubmitClosure = async () => {
    setBanner(null);
    setIsLoading(true);
    try {
      // Simulate API call for account closure request
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setStep('success');
    } catch (err: any) {
      setBanner({
        type: 'error',
        title: 'Error',
        message: err?.data?.message || 'Failed to submit closure request.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactSupport = () => {
    setBanner({
      type: 'info',
      title: 'Support Desk',
      message: 'Please email compliance@bricketx.com.',
    });
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 16), paddingBottom: bottomInset }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={styles.kicker}>ACCOUNT MANAGEMENT</Text>
          <Text style={styles.title}>Account Closure & Liquidation</Text>
        </View>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="close" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      {banner && (
        <View style={[styles.bannerBox, banner.type === 'error' ? styles.bannerError : styles.bannerWarning]}>
          <Ionicons
            name={banner.type === 'error' ? 'alert-circle' : 'warning'}
            size={18}
            color={banner.type === 'error' ? '#C62828' : '#B78103'}
          />
          <View style={{ flex: 1 }}>
            <Text style={[styles.bannerTitle, { color: banner.type === 'error' ? '#C62828' : '#B78103' }]}>
              {banner.title}
            </Text>
            <Text style={styles.bannerMessage}>{banner.message}</Text>
          </View>
          <TouchableOpacity onPress={() => setBanner(null)}>
            <Ionicons name="close" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {step === 'confirm' && (
          <View>
            <View style={styles.warningCard}>
              <Ionicons name="warning-outline" size={28} color="#B78103" />
              <Text style={styles.warningCardTitle}>Permanent Account Termination</Text>
              <Text style={styles.warningCardText}>
                Closing your account will liquidate all active positions, cancel pending syndicate subscriptions, and archive your investor profile in compliance with statutory retention laws.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setAcknowledged(!acknowledged)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, acknowledged && styles.checkboxChecked]}>
                {acknowledged && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
              </View>
              <Text style={styles.checkboxLabel}>
                I understand this action is irreversible and agree to statutory liquidation terms.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.primaryBtn} onPress={handleInitiateClosure} activeOpacity={0.85}>
              <Text style={styles.primaryBtnText}>Proceed with Closure</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 'feedback' && (
          <View>
            <Text style={styles.sectionLabel}>Help us improve (Optional)</Text>
            <Text style={styles.sectionSub}>Please let us know why you are closing your BricketX account.</Text>

            <TextInput
              style={styles.textInput}
              value={reason}
              onChangeText={setReason}
              placeholder="Enter your feedback here..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
            />

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleSubmitClosure}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryBtnText}>Submit Final Request</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {step === 'success' && (
          <View style={styles.successContainer}>
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark-done" size={32} color="#2E7D32" />
            </View>
            <Text style={styles.successTitle}>Closure Request Submitted</Text>
            <Text style={styles.successSub}>
              Your account liquidation request has been successfully registered. Our compliance team will review your holdings and process remaining distributions.
            </Text>

            <TouchableOpacity style={styles.primaryBtn} onPress={onSuccess} activeOpacity={0.85}>
              <Text style={styles.primaryBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.footerHelp}>
          <Text style={styles.footerHelpText}>Need assistance with your account?</Text>
          <TouchableOpacity onPress={handleContactSupport}>
            <Text style={styles.footerHelpLink}>Contact Support Desk</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EFECE6',
  },
  kicker: {
    fontSize: 9.5,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8F7F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginHorizontal: 20,
    marginTop: 14,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  bannerError: {
    backgroundColor: '#FFEBEE',
    borderColor: '#FFCDD2',
  },
  bannerWarning: {
    backgroundColor: '#FFF8E1',
    borderColor: '#FFE082',
  },
  bannerTitle: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  bannerMessage: {
    fontSize: 12,
    color: colors.text,
    marginTop: 2,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  warningCard: {
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#E7D7C1',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginBottom: 20,
  },
  warningCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    marginTop: 10,
    marginBottom: 6,
  },
  warningCardText: {
    fontSize: 12.5,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 24,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#D1C7BD',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    backgroundColor: '#FAF9F6',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 12.5,
    color: colors.text,
    lineHeight: 18,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 16,
  },
  textInput: {
    backgroundColor: '#FAF9F6',
    borderWidth: 1,
    borderColor: '#EFECE6',
    borderRadius: 12,
    padding: 14,
    fontSize: 13.5,
    color: colors.text,
    textAlignVertical: 'top',
    height: 120,
    marginBottom: 20,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#C8E6C9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  successSub: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 24,
  },
  footerHelp: {
    alignItems: 'center',
    marginTop: 32,
    paddingBottom: 20,
  },
  footerHelpText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  footerHelpLink: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 4,
  },
});
