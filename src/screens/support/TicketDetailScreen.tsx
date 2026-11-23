import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import {
  OwnTicketMessage,
  useGetTicketsByIdQuery,
  useLazyGetTicketsByIdAttachmentsAndAttachmentIdDownloadQuery,
  usePostTicketsByIdCloseMutation,
  usePostTicketsByIdRepliesMutation,
} from '../../api/generated/investorApi';
import {
  StatusFeedbackModal,
  FeedbackVariant,
} from '../../components/common/StatusFeedbackModal';
import { colors } from '../../theme/colors';
import { AttachmentPicker } from './AttachmentPicker';
import { ErrorStateView } from '../../components/common/ErrorStateView';
import { InlineErrorBanner } from '../../components/common/InlineErrorBanner';
import { normalizeError } from '../../utils/errorHandler';
import {
  MESSAGE_MAX,
  formatDateTime,
  issueTypeLabel,
  ticketStatusMeta,
  ticketStatusNote,
} from './ticketMeta';
import { useTicketAttachments } from './useTicketAttachments';

type Props = NativeStackScreenProps<RootStackParamList, 'TicketDetail'>;

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export const TicketDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { id } = route.params;
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);

  const { data, isLoading, error, refetch } = useGetTicketsByIdQuery(
    { id },
    { refetchOnMountOrArgChange: true }
  );
  const [sendReply, { isLoading: isReplying }] = usePostTicketsByIdRepliesMutation();
  const [closeTicket, { isLoading: isClosing }] = usePostTicketsByIdCloseMutation();
  const [triggerDownload] =
    useLazyGetTicketsByIdAttachmentsAndAttachmentIdDownloadQuery();

  const attachments = useTicketAttachments();
  const [replyText, setReplyText] = useState('');
  const [replyError, setReplyError] = useState<string | null>(null);
  const [rawReplyError, setRawReplyError] = useState<unknown>(null);
  const [downloadingAttId, setDownloadingAttId] = useState<string | null>(null);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  const [feedback, setFeedback] = useState<{
    visible: boolean;
    variant: FeedbackVariant;
    title: string;
    message: string;
  }>({
    visible: false,
    variant: 'info',
    title: '',
    message: '',
  });

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => {
      setIsKeyboardOpen(true);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setIsKeyboardOpen(false);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const ticket = data?.ticket;
  const busy = isReplying || attachments.uploading;
  const canSend = replyText.trim().length > 0 && !busy;

  const handleOpenAttachment = async (attachmentId: string, fileName: string) => {
    try {
      setDownloadingAttId(attachmentId);
      const res = await triggerDownload({ id, attachmentId }).unwrap();
      if (!res?.url) throw new Error('Download link unavailable');

      const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const localUri = `${FileSystem.documentDirectory}ticket_${attachmentId}_${safeName}`;
      const dl = await FileSystem.downloadAsync(res.url, localUri);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(dl.uri);
      } else {
        setFeedback({
          visible: true,
          variant: 'success',
          title: 'File Saved',
          message: `Saved to ${dl.uri}`,
        });
      }
    } catch (err: any) {
      const norm = normalizeError(err, { defaultMessage: "We couldn't download this attachment. Please try again." });
      setFeedback({
        visible: true,
        variant: 'error',
        title: norm.title,
        message: `${norm.message} Next step: ${norm.nextStep}`,
      });
    } finally {
      setDownloadingAttId(null);
    }
  };

  const handleSendReply = async () => {
    setReplyError(null);
    setRawReplyError(null);
    const trimmed = replyText.trim();
    if (!trimmed) {
      setReplyError('Write your reply first.');
      return;
    }
    if (trimmed.length > MESSAGE_MAX) {
      setReplyError(`Keep your reply under ${MESSAGE_MAX} characters.`);
      return;
    }
    if (attachments.failed) {
      setReplyError("Remove the file that didn't upload, or try attaching it again.");
      return;
    }

    try {
      await sendReply({
        id,
        body: {
          message: trimmed,
          ...(attachments.ready.length > 0 ? { attachments: attachments.ready } : {}),
        },
      }).unwrap();

      setReplyText('');
      attachments.clear();
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
    } catch (err: any) {
      setRawReplyError(err);
      setReplyError(
        err?.data?.message || "We couldn't send your reply. Please try again."
      );
    }
  };

  const handleConfirmClose = async () => {
    setShowCloseConfirm(false);
    try {
      await closeTicket({ id }).unwrap();
    } catch (err: any) {
      setFeedback({
        visible: true,
        variant: 'error',
        title: 'Could Not Close Ticket',
        message: err?.data?.message || 'Please try again.',
      });
    }
  };

  const renderBubble = (msg: OwnTicketMessage) => {
    const mine = msg.from === 'you';
    return (
      <View
        key={msg.id}
        style={[styles.bubbleRow, mine ? styles.bubbleRowMine : styles.bubbleRowSupport]}
      >
        {!mine && (
          <View style={styles.supportAvatar}>
            <Text style={styles.supportAvatarText} numberOfLines={1}>
              X
            </Text>
          </View>
        )}

        <View style={[styles.bubbleCol, mine ? styles.bubbleColMine : styles.bubbleColSupport]}>
          <Text style={styles.senderMeta} numberOfLines={1}>
            <Text style={styles.senderName}>{mine ? 'You' : 'BricketX Support'}</Text>
            {'  '}
            {formatDateTime(msg.createdAt)}
          </Text>

          <View style={[styles.bubbleBox, mine ? styles.bubbleMine : styles.bubbleSupport]}>
            <Text style={styles.bubbleBody} selectable>
              {msg.body}
            </Text>

            {msg.attachments.length > 0 && (
              <View style={styles.attList}>
                {msg.attachments.map((att) => {
                  const isBusy = downloadingAttId === att.id;
                  return (
                    <TouchableOpacity
                      key={att.id}
                      style={styles.attChip}
                      onPress={() => handleOpenAttachment(att.id, att.fileName)}
                      disabled={isBusy}
                      activeOpacity={0.75}
                    >
                      {isBusy ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                      ) : (
                        <Ionicons
                          name="document-text-outline"
                          size={15}
                          color={colors.primary}
                        />
                      )}
                      <Text style={styles.attName} numberOfLines={1}>
                        {att.fileName}
                      </Text>
                      <Text style={styles.attSize} numberOfLines={1}>
                        {formatBytes(att.sizeBytes)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  const statusMeta = ticket ? ticketStatusMeta(ticket.status) : null;
  const statusNote = ticket ? ticketStatusNote(ticket.status) : null;
  const isClosed = ticket?.status === 'closed';

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) + 6 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={21} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {ticket ? ticket.subject : 'Ticket Details'}
          </Text>
        </View>

        {ticket && !isClosed ? (
          <TouchableOpacity
            style={styles.closeTicketBtn}
            onPress={() => setShowCloseConfirm(true)}
            disabled={isClosing}
          >
            <Text style={styles.closeTicketBtnText} numberOfLines={1}>
              Close
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 44, flexShrink: 0 }} />
        )}
      </View>

      {isLoading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading conversation...</Text>
        </View>
      ) : error || !ticket ? (
        <View style={styles.centerBox}>
          <Ionicons name="alert-circle-outline" size={34} color={colors.text} />
          <Text style={styles.errorHeading}>Ticket Unavailable</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => {
              void refetch();
            }}
          >
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={styles.flexContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            ref={scrollRef}
            style={styles.flexContainer}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() =>
              scrollRef.current?.scrollToEnd({ animated: false })
            }
            showsVerticalScrollIndicator={false}
          >
            {/* Ticket Summary Header */}
            <View style={styles.ticketHeaderCard}>
              <View style={styles.subjectRow}>
                <Text style={styles.subjectTitle}>{ticket.subject}</Text>
                {statusMeta && (
                  <View
                    style={[
                      styles.statusPill,
                      statusMeta.tone === 'neutral'
                        ? styles.pillNeutral
                        : styles.pillGold,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        statusMeta.tone === 'neutral'
                          ? styles.pillTextNeutral
                          : styles.pillTextGold,
                      ]}
                      numberOfLines={1}
                    >
                      {statusMeta.label}
                    </Text>
                  </View>
                )}
              </View>

              <Text style={styles.metaLine}>
                {issueTypeLabel(ticket.issueType)}
                {ticket.investment ? ` • Investment ${ticket.investment.internalRef}` : ''}
                {ticket.package ? ` • ${ticket.package.name}` : ''}
                {` • Opened ${formatDateTime(ticket.createdAt)}`}
              </Text>

              {Boolean(statusNote) && !isClosed && (
                <View style={styles.noteBanner}>
                  <Ionicons
                    name="information-circle-outline"
                    size={16}
                    color={colors.primary}
                    style={{ flexShrink: 0, marginTop: 1 }}
                  />
                  <Text style={styles.noteBannerText}>{statusNote}</Text>
                </View>
              )}
            </View>

            {/* Messages Thread */}
            <View style={styles.threadList}>
              {ticket.messages.map(renderBubble)}
            </View>
          </ScrollView>

          {/* Sticky Footer Composer or Closed Notice */}
          {isClosed ? (
            <View
              style={[
                styles.closedFooter,
                { paddingBottom: Math.max(insets.bottom, 16) + 8 },
              ]}
            >
              <Text style={styles.closedText}>
                This ticket is closed, so it can&apos;t be replied to.{' '}
                <Text
                  style={styles.closedLink}
                  onPress={() => navigation.navigate('NewTicket')}
                >
                  Start a new ticket
                </Text>
              </Text>
            </View>
          ) : (
            <View
              style={[
                styles.composerBox,
                {
                  paddingBottom: isKeyboardOpen
                    ? 10
                    : Math.max(insets.bottom, 12) + 6,
                },
              ]}
            >
              <AttachmentPicker
                attachments={attachments}
                disabled={isReplying}
                compact
                mode="listOnly"
              />

              {Boolean(replyError) && (
                <InlineErrorBanner
                  error={rawReplyError}
                  appError={{
                    ...normalizeError(rawReplyError, {
                      defaultMessage: replyError || "We couldn't send your reply. Please try again.",
                    }),
                    message: replyError || "We couldn't send your reply. Please try again.",
                  }}
                  onDismiss={() => {
                    setReplyError(null);
                    setRawReplyError(null);
                  }}
                />
              )}

              <TextInput
                style={styles.replyInput}
                value={replyText}
                onChangeText={(t) => {
                  setReplyText(t);
                  if (replyError) setReplyError(null);
                }}
                onFocus={() =>
                  setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150)
                }
                placeholder="Write your reply..."
                placeholderTextColor={colors.slate}
                multiline
                maxLength={MESSAGE_MAX}
                editable={!isReplying}
              />

              <View style={styles.toolbarRow}>
                <View style={styles.toolbarLeft}>
                  <AttachmentPicker
                    attachments={attachments}
                    disabled={isReplying}
                    compact
                    mode="buttonsOnly"
                  />
                </View>

                <TouchableOpacity
                  style={[
                    styles.sendBtn,
                    !canSend && styles.sendBtnInactive,
                  ]}
                  onPress={() => {
                    void handleSendReply();
                  }}
                  disabled={busy}
                  activeOpacity={0.85}
                >
                  {isReplying ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="send" size={14} color="#FFFFFF" />
                      <Text style={styles.sendBtnText} numberOfLines={1}>
                        Send
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </KeyboardAvoidingView>
      )}

      <StatusFeedbackModal
        visible={showCloseConfirm}
        variant="confirm"
        iconName="lock-closed-outline"
        title="Close this ticket?"
        message="Once closed, nobody can add to it. If you need more help later, you can start a new ticket."
        primaryLabel="Yes, close it"
        secondaryLabel="Keep it open"
        onPrimary={handleConfirmClose}
        onSecondary={() => setShowCloseConfirm(false)}
      />

      <StatusFeedbackModal
        visible={feedback.visible}
        variant={feedback.variant}
        title={feedback.title}
        message={feedback.message}
        primaryLabel="OK"
        onPrimary={() => setFeedback((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flexContainer: {
    flex: 1,
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
  headerCenter: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  closeTicketBtn: {
    backgroundColor: colors.slateLight,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 8,
    flexShrink: 0,
  },
  closeTicketBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 20,
  },
  ticketHeaderCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 15,
    marginBottom: 18,
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  subjectTitle: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    lineHeight: 23,
  },
  statusPill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    flexShrink: 0,
  },
  pillGold: {
    backgroundColor: colors.primaryTint,
    borderColor: colors.primaryBorder,
  },
  pillNeutral: {
    backgroundColor: colors.slateLight,
    borderColor: colors.border,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  pillTextGold: {
    color: colors.primary,
  },
  pillTextNeutral: {
    color: colors.textMuted,
  },
  metaLine: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 6,
    lineHeight: 17,
    flexShrink: 1,
  },
  noteBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: colors.primaryTint,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
  },
  noteBannerText: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 17,
  },
  threadList: {
    gap: 16,
  },
  bubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  bubbleRowMine: {
    justifyContent: 'flex-end',
  },
  bubbleRowSupport: {
    justifyContent: 'flex-start',
  },
  supportAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
    flexShrink: 0,
  },
  supportAvatarText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  bubbleCol: {
    maxWidth: '82%',
    minWidth: 0,
    flexShrink: 1,
  },
  bubbleColMine: {
    alignItems: 'flex-end',
  },
  bubbleColSupport: {
    alignItems: 'flex-start',
  },
  senderMeta: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 4,
    paddingHorizontal: 2,
    flexShrink: 1,
  },
  senderName: {
    fontWeight: '700',
    color: colors.text,
  },
  bubbleBox: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: 1,
    minWidth: 0,
    flexShrink: 1,
  },
  bubbleMine: {
    backgroundColor: colors.primaryTint,
    borderColor: colors.primaryBorder,
    borderBottomRightRadius: 4,
  },
  bubbleSupport: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderBottomLeftRadius: 4,
  },
  bubbleBody: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    flexShrink: 1,
  },
  attList: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    gap: 6,
  },
  attChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  attName: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  attSize: {
    fontSize: 11,
    color: colors.textMuted,
    flexShrink: 0,
  },
  closedFooter: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 18,
    paddingTop: 14,
  },
  closedText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 19,
  },
  closedLink: {
    color: colors.primary,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  composerBox: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 14,
    paddingTop: 10,
    gap: 8,
  },
  replyInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 10,
    fontSize: 14,
    lineHeight: 19,
    color: colors.text,
    maxHeight: 100,
    minHeight: 42,
    textAlignVertical: 'top',
  },
  replyError: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 16,
    flexShrink: 1,
  },
  toolbarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  toolbarLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sendBtn: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 84,
  },
  sendBtnInactive: {
    backgroundColor: colors.slate,
  },
  sendBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    gap: 10,
  },
  loadingText: {
    fontSize: 13.5,
    color: colors.textMuted,
  },
  errorHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  retryBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 9,
    marginTop: 4,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
