import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { usePostAuthChangePasswordMutation } from '../../api/generated/investorApi';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { normalizeError } from '../../utils/errorHandler';
import {
  StatusFeedbackModal,
  FeedbackVariant,
} from '../../components/common/StatusFeedbackModal';

interface ModalState {
  visible: boolean;
  variant: FeedbackVariant;
  title: string;
  message: string;
  onPrimary: () => void;
}

export const UpdatePasswordScreen: React.FC<NativeStackScreenProps<any>> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [changePassword, { isLoading }] = usePostAuthChangePasswordMutation();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [modal, setModal] = useState<ModalState>({
    visible: false,
    variant: 'info',
    title: '',
    message: '',
    onPrimary: () => {},
  });

  const closeModal = useCallback(() => {
    setModal((prev) => ({ ...prev, visible: false }));
  }, []);

  // Validation rules
  const hasMinLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const isMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isValid = hasMinLength && hasUpper && hasNumber && isMatch && currentPassword.length > 0;

  const handleSubmit = async () => {
    if (!currentPassword) {
      setModal({
        visible: true,
        variant: 'warning',
        title: 'Required',
        message: 'Please enter your current account password.',
        onPrimary: closeModal,
      });
      return;
    }
    if (!isValid) {
      setModal({
        visible: true,
        variant: 'warning',
        title: 'Invalid Password',
        message: 'Ensure your new password satisfies all security rules.',
        onPrimary: closeModal,
      });
      return;
    }

    try {
      await changePassword({
        body: {
          currentPassword,
          newPassword,
        },
      } as any).unwrap();

      setModal({
        visible: true,
        variant: 'success',
        title: 'Password Updated',
        message: 'Your security password has been changed successfully.',
        onPrimary: () => {
          closeModal();
          navigation.goBack();
        },
      });
    } catch (err: any) {
      setModal({
        visible: true,
        variant: 'error',
        title: 'Update Failed',
        message:
          err?.data?.message ||
          err?.error ||
          'Unable to update password. Please check your current password and try again.',
        onPrimary: closeModal,
      });
    }
  };

  const renderRequirement = (label: string, met: boolean) => (
    <View style={styles.reqRow}>
      <Ionicons
        name={met ? 'checkmark-circle' : 'ellipse-outline'}
        size={15}
        color={met ? '#2E7D32' : colors.textMuted}
      />
      <Text style={[styles.reqText, met && styles.reqTextMet]} numberOfLines={2}>{label}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 16) + 4 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Update Password</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 36 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          {/* Current Password */}
          <Text style={styles.fieldLabel}>CURRENT PASSWORD</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              secureTextEntry={!showCurrent}
              placeholder="Enter current password"
              placeholderTextColor={colors.textMuted}
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowCurrent(!showCurrent)}
            >
              <Ionicons
                name={showCurrent ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* New Password */}
          <Text style={styles.fieldLabel}>NEW PASSWORD</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              secureTextEntry={!showNew}
              placeholder="Enter new secure password"
              placeholderTextColor={colors.textMuted}
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowNew(!showNew)}
            >
              <Ionicons
                name={showNew ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          </View>

          {/* Confirm New Password */}
          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>CONFIRM NEW PASSWORD</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              secureTextEntry={!showConfirm}
              placeholder="Re-enter new password"
              placeholderTextColor={colors.textMuted}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowConfirm(!showConfirm)}
            >
              <Ionicons
                name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          </View>

          {/* Checklist */}
          <View style={styles.reqContainer}>
            <Text style={styles.reqTitle}>Password requirements:</Text>
            {renderRequirement('At least 8 characters long', hasMinLength)}
            {renderRequirement('Contains at least one uppercase letter (A-Z)', hasUpper)}
            {renderRequirement('Contains at least one number (0-9)', hasNumber)}
            {renderRequirement('Passwords match', isMatch)}
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, (!isValid || isLoading) && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={!isValid || isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.submitBtnText} numberOfLines={2}>Save Password</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <StatusFeedbackModal
        visible={modal.visible}
        variant={modal.variant}
        title={modal.title}
        message={modal.message}
        onPrimary={modal.onPrimary}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7F4',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EFECE6',
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  placeholder: {
    width: 36,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFECE6',
    padding: 16,
  },
  fieldLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF9F6',
    borderWidth: 1,
    borderColor: '#EFECE6',
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  textInput: {
    flex: 1,
    minWidth: 0,
    minHeight: 46,
    paddingVertical: 10,
    fontSize: 13.5,
    color: colors.text,
  },
  eyeBtn: {
    padding: 6,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#EFECE6',
    marginVertical: 16,
  },
  reqContainer: {
    backgroundColor: '#FAF9F6',
    borderRadius: 10,
    padding: 12,
    marginTop: 18,
    marginBottom: 20,
    gap: 6,
  },
  reqTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  reqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reqText: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textMuted,
  },
  reqTextMet: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
