import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import {
  useGetInvestmentsQuery,
  useGetPackagesQuery,
  usePostTicketsMutation,
} from '../../api/generated/investorApi';
import { colors } from '../../theme/colors';
import { AttachmentPicker } from './AttachmentPicker';
import { InlineErrorBanner } from '../../components/common/InlineErrorBanner';
import { normalizeError } from '../../utils/errorHandler';
import {
  ISSUE_TYPES,
  IssueType,
  MESSAGE_MAX,
  SUBJECT_MAX,
  issueTypeLabel,
} from './ticketMeta';
import { useTicketAttachments } from './useTicketAttachments';

type Props = NativeStackScreenProps<RootStackParamList, 'NewTicket'>;

interface RelatedOption {
  value: string;
  label: string;
  group: 'none' | 'investment' | 'package';
}

export const NewTicketScreen: React.FC<Props> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const initialInvestmentId = route.params?.initialInvestmentId;
  const initialPackageId = route.params?.initialPackageId;

  const [createTicket, { isLoading }] = usePostTicketsMutation();
  const { data: investmentsData } = useGetInvestmentsQuery();
  const { data: packagesData } = useGetPackagesQuery();
  const attachments = useTicketAttachments();

  const [issueType, setIssueType] = useState<IssueType | ''>('');
  const [about, setAbout] = useState<string>(() => {
    if (initialInvestmentId) return `inv:${initialInvestmentId}`;
    if (initialPackageId) return `pkg:${initialPackageId}`;
    return '';
  });
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showRelatedModal, setShowRelatedModal] = useState(false);
  const [rawFormError, setRawFormError] = useState<unknown>(null);

  const [errors, setErrors] = useState<{
    issueType?: string;
    subject?: string;
    message?: string;
    form?: string;
  }>({});

  const busy = isLoading || attachments.uploading;

  const relatedOptions = useMemo<RelatedOption[]>(() => {
    const opts: RelatedOption[] = [
      { value: '', label: 'Nothing in particular', group: 'none' },
    ];
    const investments = investmentsData?.investments ?? [];
    investments.forEach((inv) => {
      opts.push({
        value: `inv:${inv.id}`,
        label: `${inv.internalRef} - ${inv.package.name}`,
        group: 'investment',
      });
    });
    const packages = packagesData?.packages ?? [];
    packages.forEach((pkg) => {
      opts.push({
        value: `pkg:${pkg.id}`,
        label: pkg.name,
        group: 'package',
      });
    });
    return opts;
  }, [investmentsData, packagesData]);

  const selectedRelatedLabel = useMemo(() => {
    const found = relatedOptions.find((o) => o.value === about);
    return found ? found.label : 'Nothing in particular';
  }, [relatedOptions, about]);

  const validate = () => {
    const next: typeof errors = {};
    if (!issueType) next.issueType = 'Choose what this is about.';
    if (!subject.trim()) next.subject = 'Add a subject.';
    else if (subject.trim().length > SUBJECT_MAX)
      next.subject = `Keep the subject to ${SUBJECT_MAX} characters.`;
    if (!message.trim()) next.message = 'Write your message.';
    else if (message.trim().length > MESSAGE_MAX)
      next.message = `Keep the message to ${MESSAGE_MAX} characters.`;
    return next;
  };

  const handleSubmit = async () => {
    const found = validate();
    if (attachments.failed) {
      found.form = "Remove the file that didn't upload, or try attaching it again.";
    }
    if (Object.keys(found).length > 0 || !issueType) {
      setErrors(found);
      return;
    }

    setErrors({});
    setRawFormError(null);
    try {
      const res = await createTicket({
        body: {
          issueType,
          subject: subject.trim(),
          message: message.trim(),
          ...(about.startsWith('inv:') ? { investmentId: about.slice(4) } : {}),
          ...(about.startsWith('pkg:') ? { packageId: about.slice(4) } : {}),
          ...(attachments.ready.length > 0 ? { attachments: attachments.ready } : {}),
        },
      }).unwrap();

      navigation.replace('TicketDetail', { id: res.ticket.id });
    } catch (err: any) {
      setRawFormError(err);
      const apiMsg =
        err?.data?.message || "We couldn't send your message. Please try again.";
      setErrors({ form: apiMsg });
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) + 6 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          disabled={isLoading}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={21} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          New ticket
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 24) + 32 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.subtitle}>
            Tell us what you need. The more detail you give, the sooner we can help.
          </Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              What is this about? <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={[styles.selectBox, errors.issueType && styles.inputErrorBorder]}
              onPress={() => setShowIssueModal(true)}
              disabled={busy}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.selectText,
                  !issueType && styles.placeholderText,
                ]}
                numberOfLines={2}
              >
                {issueType ? issueTypeLabel(issueType) : 'Choose...'}
              </Text>
              <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
            </TouchableOpacity>
            {Boolean(errors.issueType) && (
              <Text style={styles.errorText}>{errors.issueType}</Text>
            )}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              Related to <Text style={styles.optional}>(optional)</Text>
            </Text>
            <TouchableOpacity
              style={styles.selectBox}
              onPress={() => setShowRelatedModal(true)}
              disabled={busy}
              activeOpacity={0.8}
            >
              <Text style={styles.selectText} numberOfLines={2}>
                {selectedRelatedLabel}
              </Text>
              <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              Subject <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.textInput, errors.subject && styles.inputErrorBorder]}
              value={subject}
              onChangeText={setSubject}
              maxLength={SUBJECT_MAX}
              placeholder="Brief summary of your request"
              placeholderTextColor={colors.slate}
              editable={!busy}
            />
            {Boolean(errors.subject) && (
              <Text style={styles.errorText}>{errors.subject}</Text>
            )}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              Message <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.textArea, errors.message && styles.inputErrorBorder]}
              value={message}
              onChangeText={setMessage}
              maxLength={MESSAGE_MAX}
              multiline
              textAlignVertical="top"
              placeholder="Describe your question or issue in detail..."
              placeholderTextColor={colors.slate}
              editable={!busy}
            />
            <View style={styles.counterRow}>
              {Boolean(errors.message) ? (
                <Text style={styles.errorText}>{errors.message}</Text>
              ) : (
                <View style={{ flex: 1 }} />
              )}
              <Text style={styles.counterText} numberOfLines={1}>
                {message.length} / {MESSAGE_MAX}
              </Text>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <AttachmentPicker attachments={attachments} disabled={isLoading} />
          </View>

          {Boolean(errors.form) && (
            <InlineErrorBanner
              error={rawFormError}
              appError={{
                ...normalizeError(rawFormError, {
                  defaultMessage: errors.form || "We couldn't send your message. Please try again.",
                }),
                message: errors.form || "We couldn't send your message. Please try again.",
              }}
              onDismiss={() => {
                setErrors((prev) => ({ ...prev, form: undefined }));
                setRawFormError(null);
              }}
            />
          )}

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.submitBtn, busy && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={busy}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText} numberOfLines={2}>
                  {attachments.uploading ? 'Uploading files...' : 'Send to support'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => navigation.goBack()}
              disabled={isLoading}
            >
              <Text style={styles.cancelBtnText} numberOfLines={1}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={showIssueModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowIssueModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.sheetCard,
              { paddingBottom: Math.max(insets.bottom, 20) + 8 },
            ]}
          >
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle} numberOfLines={1}>
                What is this about?
              </Text>
              <TouchableOpacity
                style={styles.sheetCloseBtn}
                onPress={() => setShowIssueModal(false)}
              >
                <Ionicons name="close" size={19} color={colors.text} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={ISSUE_TYPES}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const active = issueType === item;
                return (
                  <TouchableOpacity
                    style={[styles.optionRow, active && styles.optionRowActive]}
                    onPress={() => {
                      setIssueType(item);
                      setShowIssueModal(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        active && styles.optionTextActive,
                      ]}
                      numberOfLines={2}
                    >
                      {issueTypeLabel(item)}
                    </Text>
                    {active && (
                      <Ionicons name="checkmark" size={18} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      <Modal
        visible={showRelatedModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRelatedModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.sheetCard,
              { paddingBottom: Math.max(insets.bottom, 20) + 8 },
            ]}
          >
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle} numberOfLines={1}>
                Related to
              </Text>
              <TouchableOpacity
                style={styles.sheetCloseBtn}
                onPress={() => setShowRelatedModal(false)}
              >
                <Ionicons name="close" size={19} color={colors.text} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={relatedOptions}
              keyExtractor={(item) => item.value || 'none'}
              renderItem={({ item, index }) => {
                const active = about === item.value;
                const prevGroup = index > 0 ? relatedOptions[index - 1].group : null;
                const showGroupHeader =
                  item.group !== 'none' && item.group !== prevGroup;

                return (
                  <View>
                    {showGroupHeader && (
                      <Text style={styles.groupHeader}>
                        {item.group === 'investment'
                          ? 'ONE OF MY INVESTMENTS'
                          : 'A PACKAGE'}
                      </Text>
                    )}
                    <TouchableOpacity
                      style={[styles.optionRow, active && styles.optionRowActive]}
                      onPress={() => {
                        setAbout(item.value);
                        setShowRelatedModal(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          active && styles.optionTextActive,
                        ]}
                        numberOfLines={2}
                      >
                        {item.label}
                      </Text>
                      {active && (
                        <Ionicons
                          name="checkmark"
                          size={18}
                          color={colors.primary}
                        />
                      )}
                    </TouchableOpacity>
                  </View>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.slateLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerTitle: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  scrollContent: {
    padding: 18,
    gap: 18,
  },
  subtitle: {
    fontSize: 13.5,
    color: colors.textMuted,
    lineHeight: 19.5,
  },
  fieldGroup: {
    gap: 7,
  },
  label: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 18,
    flexShrink: 1,
  },
  required: {
    color: colors.primary,
  },
  optional: {
    fontWeight: '500',
    color: colors.textMuted,
  },
  selectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 11,
    paddingHorizontal: 14,
    paddingVertical: 13,
    minHeight: 48,
    gap: 10,
  },
  selectText: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 19,
  },
  placeholderText: {
    color: colors.textMuted,
    fontWeight: '500',
  },
  textInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 11,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 48,
    fontSize: 14,
    lineHeight: 19,
    color: colors.text,
  },
  textArea: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 11,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
    minHeight: 140,
  },
  inputErrorBorder: {
    borderColor: colors.text,
    borderWidth: 1.5,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  counterText: {
    fontSize: 11.5,
    color: colors.textMuted,
    flexShrink: 0,
  },
  errorText: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 16,
  },
  formErrorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: colors.slateLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
  },
  formErrorText: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  submitBtn: {
    flex: 1,
    minWidth: 0,
    minHeight: 48,
    backgroundColor: colors.primary,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.65,
  },
  submitBtnText: {
    fontSize: 14.5,
    lineHeight: 19,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    flexShrink: 1,
  },
  cancelBtn: {
    paddingVertical: 13,
    paddingHorizontal: 14,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    textDecorationLine: 'underline',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(33, 33, 33, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: '78%',
    paddingTop: 16,
    paddingHorizontal: 18,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 8,
    gap: 10,
  },
  sheetTitle: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  sheetCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.slateLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  groupHeader: {
    fontSize: 10.5,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.6,
    marginTop: 12,
    marginBottom: 6,
    paddingHorizontal: 6,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 10,
  },
  optionRowActive: {
    backgroundColor: colors.primaryTint,
  },
  optionText: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '600',
    color: colors.text,
  },
  optionTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
});
