import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import {
  useGetDocumentsQuery,
  useGetStatementsQuery,
  usePostStatementsMutation,
} from '../../api/documentsApi';
import { useGetInvestmentsQuery } from '../../api/generated/investorApi';
import { formatUtcDateTime, formatUtcDay } from '../../features/documents/documentHelpers';
import {
  extractApiErrorMessage,
  useMobileDocumentDownload,
} from '../../features/documents/useMobileDocumentDownload';
import { AppHeader } from '../../components/common/AppHeader';
import { ErrorStateView } from '../../components/common/ErrorStateView';
import { InlineErrorBanner } from '../../components/common/InlineErrorBanner';
import { normalizeError } from '../../utils/errorHandler';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

type Props = NativeStackScreenProps<RootStackParamList, 'Statements'>;

type DateRange = { from: string; to: string };
type QuickRangeKey = 'this_month' | 'last_month' | 'this_quarter' | 'year_to_date' | 'custom';

function utcDayString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const QUICK_RANGES: {
  value: Exclude<QuickRangeKey, 'custom'>;
  label: string;
  compute: (now: Date) => DateRange;
}[] = [
  {
    value: 'this_month',
    label: 'This month',
    compute: (now) => ({
      from: utcDayString(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))),
      to: utcDayString(now),
    }),
  },
  {
    value: 'last_month',
    label: 'Last month',
    compute: (now) => ({
      from: utcDayString(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1))),
      to: utcDayString(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0))),
    }),
  },
  {
    value: 'this_quarter',
    label: 'This quarter',
    compute: (now) => ({
      from: utcDayString(
        new Date(Date.UTC(now.getUTCFullYear(), Math.floor(now.getUTCMonth() / 3) * 3, 1))
      ),
      to: utcDayString(now),
    }),
  },
  {
    value: 'year_to_date',
    label: 'Year to date',
    compute: (now) => ({
      from: utcDayString(new Date(Date.UTC(now.getUTCFullYear(), 0, 1))),
      to: utcDayString(now),
    }),
  },
];

function computeQuickRange(value: Exclude<QuickRangeKey, 'custom'>): DateRange {
  return QUICK_RANGES.find((q) => q.value === value)!.compute(new Date());
}

const HIDDEN_JOURNEY_STATUSES = new Set(['draft', 'cancelled', 'withdrawn', 'expired']);

export const StatementsScreen: React.FC<Props> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const statementIdParam = route.params?.highlightStatementId;
  const initialInvestmentId = route.params?.initialInvestmentId;

  const [quick, setQuick] = useState<QuickRangeKey>('this_month');
  const [range, setRange] = useState<DateRange>(() => computeQuickRange('this_month'));
  const [investmentId, setInvestmentId] = useState<string>(initialInvestmentId || '');
  const [localError, setLocalError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const [createStatement, createState] = usePostStatementsMutation();
  const investmentsQuery = useGetInvestmentsQuery();
  const statementsQuery = useGetStatementsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  // Notification link resolver: if ?statementId= is not in custom statements, check /documents
  const ownMatch = statementIdParam
    ? statementsQuery.data?.statements.some((st) => st.id === statementIdParam)
    : false;
  const ownSettled = Boolean(statementsQuery.data) && !statementsQuery.isFetching;

  const documentsQuery = useGetDocumentsQuery(undefined, {
    skip: !statementIdParam || !ownSettled || ownMatch,
    refetchOnMountOrArgChange: true,
  });

  const matchingDoc =
    statementIdParam && !ownMatch
      ? documentsQuery.data?.documents.find((d) => d.id === statementIdParam)
      : undefined;

  const missingLink = Boolean(
    statementIdParam &&
      ownSettled &&
      !ownMatch &&
      documentsQuery.data &&
      !documentsQuery.isFetching &&
      !matchingDoc
  );

  useEffect(() => {
    if (matchingDoc) {
      navigation.replace('Documents', {
        highlightKind: matchingDoc.kind,
        highlightId: matchingDoc.id,
      });
    }
  }, [matchingDoc, navigation]);

  const { downloadAndOpen, busyKey, errorState } = useMobileDocumentDownload();

  const investmentChoices = useMemo(() => {
    const rawList = Array.isArray(investmentsQuery.data)
      ? investmentsQuery.data
      : (investmentsQuery.data as any)?.investments ?? [];
    return rawList.filter(
      (inv: any) => inv?.id && !HIDDEN_JOURNEY_STATUSES.has(String(inv.status || '').toLowerCase())
    );
  }, [investmentsQuery.data]);

  const selectedInvestmentLabel = useMemo(() => {
    if (!investmentId) return 'All my investments';
    const found = investmentChoices.find((inv: any) => inv.id === investmentId);
    if (!found) return 'Selected investment';
    return `${found.package?.name || 'Investment'} · Ref ${found.internalRef}`;
  }, [investmentId, investmentChoices]);

  const createdStatement = createState.data?.statement;

  const handleSubmit = async () => {
    setLocalError(null);
    const fromClean = range.from.trim();
    const toClean = range.to.trim();
    if (!fromClean || !toClean) {
      setLocalError('Choose both a start and an end day.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fromClean) || !/^\d{4}-\d{2}-\d{2}$/.test(toClean)) {
      setLocalError('Enter dates in YYYY-MM-DD format (e.g. 2026-11-01).');
      return;
    }
    try {
      await createStatement({
        body: {
          from: fromClean,
          to: toClean,
          ...(investmentId ? { investmentId } : {}),
        },
      }).unwrap();
    } catch {
      // Displayed cleanly from createState.error below
    }
  };

  const statements = statementsQuery.data?.statements ?? [];

  return (
    <View style={styles.container}>
      <AppHeader hideNotifications title="Statements" showBack />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 36 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={Boolean(statementsQuery.isFetching && !statementsQuery.isLoading)}
            onRefresh={() => { statementsQuery.refetch(); }}
            tintColor={colors.primary}
          />
        }
      >
        {/* Intro */}
        <View style={styles.introBlock}>
          <Text style={styles.pageHeading}>Account Statements</Text>
          <Text style={styles.pageSub}>
            A statement lists the money that moved for your investments over the days you choose:
            what you sent, what was put to work, and what was paid or returned to you.
          </Text>
        </View>

        {missingLink && (
          <View style={styles.noticeBanner}>
            <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
            <Text style={styles.noticeText}>
              We couldn&apos;t find the statement that link points to. It may have been replaced by
              a corrected one, and your latest statements are in{' '}
              <Text
                style={styles.noticeLink}
                onPress={() => navigation.navigate('Documents')}
              >
                Documents
              </Text>
              .
            </Text>
          </View>
        )}

        {/* Create a Statement Card */}
        <View style={styles.formCard}>
          <Text style={styles.cardHeading}>Create a statement</Text>

          <Text style={styles.fieldLabel}>Period</Text>
          <View style={styles.quickPillsWrap}>
            {[...QUICK_RANGES, { value: 'custom' as const, label: 'Custom' }].map((q) => {
              const active = quick === q.value;
              return (
                <TouchableOpacity
                  key={q.value}
                  style={[styles.quickPill, active && styles.quickPillActive]}
                  activeOpacity={0.8}
                  onPress={() => {
                    setQuick(q.value);
                    if (q.value !== 'custom') {
                      setRange(computeQuickRange(q.value));
                    }
                  }}
                >
                  <Text style={[styles.quickPillText, active && styles.quickPillTextActive]}>
                    {q.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.datesRow}>
            <View style={styles.dateCol}>
              <Text style={styles.fieldLabel}>
                From <Text style={styles.reqMark}>*</Text>
              </Text>
              <View style={styles.inputBox}>
                <Ionicons name="calendar-outline" size={15} color={colors.textMuted} />
                <TextInput
                  style={styles.dateInput}
                  value={range.from}
                  onChangeText={(text) => {
                    setQuick('custom');
                    setRange((r) => ({ ...r, from: text }));
                  }}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.dateCol}>
              <Text style={styles.fieldLabel}>
                To <Text style={styles.reqMark}>*</Text>
              </Text>
              <View style={styles.inputBox}>
                <Ionicons name="calendar-outline" size={15} color={colors.textMuted} />
                <TextInput
                  style={styles.dateInput}
                  value={range.to}
                  onChangeText={(text) => {
                    setQuick('custom');
                    setRange((r) => ({ ...r, to: text }));
                  }}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              Investment <Text style={styles.optionalTag}>(optional)</Text>
            </Text>
            <TouchableOpacity
              style={styles.selectBox}
              activeOpacity={0.8}
              onPress={() => setPickerOpen(true)}
            >
              <Text style={styles.selectText} numberOfLines={1}>
                {selectedInvestmentLabel}
              </Text>
              <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, createState.isLoading && { opacity: 0.7 }]}
            activeOpacity={0.85}
            disabled={createState.isLoading}
            onPress={handleSubmit}
          >
            {createState.isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="document-text-outline" size={17} color="#FFFFFF" />
            )}
            <Text style={styles.submitBtnText}>
              {createState.isLoading ? 'Creating…' : 'Create a statement'}
            </Text>
          </TouchableOpacity>

          {(localError || createState.isError) && (
            <InlineErrorBanner
              error={createState.error}
              appError={{
                ...normalizeError(createState.error, {
                  defaultMessage:
                    localError ?? "We couldn't create the statement. Please try again.",
                }),
                ...(localError
                  ? {
                      category: 'validation',
                      title: 'Check Date Range',
                      message: localError,
                      nextStep: 'Select valid start and end dates in YYYY-MM-DD format and try again.',
                    }
                  : {}),
              }}
              onDismiss={() => {
                setLocalError(null);
                createState.reset();
              }}
            />
          )}

          {createdStatement && !createState.isError && (
            <View style={styles.readyBanner}>
              <View style={{ flex: 1 }}>
                <Text style={styles.readyTitle}>Your statement is ready.</Text>
                <Text style={styles.readySub}>{createdStatement.title}</Text>
              </View>
              <TouchableOpacity
                style={styles.openPdfBtn}
                disabled={busyKey !== null}
                onPress={() =>
                  downloadAndOpen({
                    via: 'statements',
                    id: createdStatement.id,
                    title: createdStatement.title,
                  })
                }
              >
                {busyKey === `statement:${createdStatement.id}` ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Ionicons name="open-outline" size={15} color={colors.primary} />
                )}
                <Text style={styles.openPdfText}>
                  {busyKey === `statement:${createdStatement.id}` ? 'Preparing…' : 'Open'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Your Statements List */}
        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>Your statements</Text>

          {statementsQuery.isLoading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading your statements…</Text>
            </View>
          ) : statementsQuery.isError ? (
            <ErrorStateView
              error={statementsQuery.error}
              appError={normalizeError(statementsQuery.error, {
                defaultMessage: "We couldn't load your generated statements right now.",
                defaultNextStep: 'Check your connection and tap Retry.',
              })}
              onAction={() => statementsQuery.refetch()}
              loading={statementsQuery.isFetching}
              compact
            />
          ) : statements.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="document-text-outline" size={24} color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>No statements yet</Text>
              <Text style={styles.emptySub}>
                Statements you create appear here, ready to download again.
              </Text>
            </View>
          ) : (
            <View style={styles.listCard}>
              {statements.map((st, idx) => {
                const key = `statement:${st.id}`;
                const isBusy = busyKey === key;
                const isHighlighted = statementIdParam === st.id;
                const rowError = errorState?.key === key ? errorState.message : null;
                const periodText = `${formatUtcDay(st.periodStart)} – ${formatUtcDay(st.periodEnd)}`;
                const scopeText = st.internalRef ? `Ref ${st.internalRef}` : 'All investments';
                const createdText = `Created ${formatUtcDateTime(st.generatedAt)}`;

                return (
                  <React.Fragment key={st.id}>
                    {idx > 0 && <View style={styles.divider} />}
                    <View style={[styles.stmtRow, isHighlighted && styles.stmtRowHighlighted]}>
                      <View style={styles.stmtIconBox}>
                        <Ionicons name="document-text-outline" size={18} color={colors.primary} />
                      </View>
                      <View style={styles.stmtMainCol}>
                        <Text style={styles.stmtTitle}>{st.title}</Text>
                        <Text style={styles.stmtMeta}>
                          {[periodText, scopeText, createdText].join(' · ')}
                        </Text>

                        <TouchableOpacity
                          style={styles.downloadChip}
                          disabled={busyKey !== null}
                          onPress={() =>
                            downloadAndOpen({
                              via: 'statements',
                              id: st.id,
                              title: st.title,
                            })
                          }
                          activeOpacity={0.75}
                        >
                          {isBusy ? (
                            <ActivityIndicator size="small" color={colors.primary} />
                          ) : (
                            <Ionicons name="download-outline" size={14} color={colors.primary} />
                          )}
                          <Text style={styles.downloadChipText}>
                            {isBusy ? 'Preparing…' : 'Download'}
                          </Text>
                        </TouchableOpacity>

                        {rowError && <Text style={styles.rowErrorText}>{rowError}</Text>}
                      </View>
                    </View>
                  </React.Fragment>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Investment Picker Modal */}
      <Modal
        visible={pickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setPickerOpen(false)}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback>
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>Select Investment</Text>
                <ScrollView style={{ maxHeight: 320 }}>
                  <TouchableOpacity
                    style={[styles.modalOption, !investmentId && styles.modalOptionSelected]}
                    onPress={() => {
                      setInvestmentId('');
                      setPickerOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        !investmentId && styles.modalOptionTextSelected,
                      ]}
                    >
                      All my investments
                    </Text>
                    {!investmentId && (
                      <Ionicons name="checkmark" size={18} color={colors.primary} />
                    )}
                  </TouchableOpacity>

                  {investmentChoices.map((inv: any) => {
                    const selected = investmentId === inv.id;
                    const label = `${inv.package?.name || 'Investment'} · Ref ${inv.internalRef}`;
                    return (
                      <TouchableOpacity
                        key={inv.id}
                        style={[styles.modalOption, selected && styles.modalOptionSelected]}
                        onPress={() => {
                          setInvestmentId(inv.id);
                          setPickerOpen(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.modalOptionText,
                            selected && styles.modalOptionTextSelected,
                          ]}
                        >
                          {label}
                        </Text>
                        {selected && (
                          <Ionicons name="checkmark" size={18} color={colors.primary} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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
    gap: spacing.md,
  },
  introBlock: {
    gap: 4,
    paddingHorizontal: 2,
  },
  pageHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  pageSub: {
    fontSize: 12.5,
    color: colors.textMuted,
    lineHeight: 18,
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#E7D7C1',
    borderRadius: 12,
    padding: 12,
  },
  noticeText: {
    flex: 1,
    fontSize: 12.5,
    color: colors.text,
    lineHeight: 18,
  },
  noticeLink: {
    fontWeight: '800',
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFECE6',
    padding: 16,
    gap: 12,
  },
  cardHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  fieldLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.text,
  },
  reqMark: {
    color: '#C62828',
  },
  optionalTag: {
    fontWeight: '500',
    color: colors.textMuted,
  },
  quickPillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  quickPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E1D8',
    backgroundColor: '#FFFFFF',
  },
  quickPillActive: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  quickPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  quickPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  datesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dateCol: {
    flex: 1,
    gap: 6,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderWidth: 1,
    borderColor: '#E2DDD4',
    backgroundColor: '#F8F7F4',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 42,
  },
  dateInput: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '600',
    color: colors.text,
    paddingVertical: 0,
  },
  fieldGroup: {
    gap: 6,
  },
  selectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2DDD4',
    backgroundColor: '#F8F7F4',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  selectText: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '600',
    color: colors.text,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: colors.primary,
    borderRadius: 12,
    height: 44,
    marginTop: 2,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  errorBannerText: {
    fontSize: 12.5,
    color: '#C62828',
    lineHeight: 18,
  },
  readyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#E7D7C1',
    borderRadius: 12,
    padding: 12,
  },
  readyTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },
  readySub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1,
  },
  openPdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7D7C1',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9,
  },
  openPdfText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: colors.primary,
  },
  listSection: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    paddingHorizontal: 2,
  },
  listCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFECE6',
    overflow: 'hidden',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#EFECE6',
    marginLeft: 62,
  },
  stmtRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    gap: 12,
  },
  stmtRowHighlighted: {
    backgroundColor: '#FAF5EE',
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  stmtIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#E7D7C1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stmtMainCol: {
    flex: 1,
    gap: 4,
  },
  stmtTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  stmtMeta: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 17,
  },
  downloadChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#E7D7C1',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 5,
  },
  downloadChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  rowErrorText: {
    fontSize: 11.5,
    color: '#C62828',
    marginTop: 4,
  },
  centerBox: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFECE6',
    padding: 26,
    alignItems: 'center',
    gap: 8,
  },
  emptyIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FAF5EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  emptySub: {
    fontSize: 12.5,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  retryBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 10,
    marginTop: 4,
  },
  retryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 22,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    gap: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  modalOptionSelected: {
    backgroundColor: '#FAF5EE',
  },
  modalOptionText: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '600',
    color: colors.text,
  },
  modalOptionTextSelected: {
    fontWeight: '800',
    color: colors.primary,
  },
});



