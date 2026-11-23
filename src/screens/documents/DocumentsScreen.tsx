import React, { useMemo, useState, useEffect, useRef } from 'react';
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
  InvestorDocumentItem,
  InvestorDocumentKind,
  useGetDocumentsQuery,
} from '../../api/documentsApi';
import { useGetInvestmentsQuery } from '../../api/generated/investorApi';
import {
  buildDocumentRowPresentation,
  getKindMeta,
  isPeriodicStatement,
  PERIODIC_STATEMENT_KINDS,
  sortPeriodicStatements,
  statementMonthLabel,
} from '../../features/documents/documentHelpers';
import { useMobileDocumentDownload } from '../../features/documents/useMobileDocumentDownload';
import { AppHeader } from '../../components/common/AppHeader';
import { ErrorStateView } from '../../components/common/ErrorStateView';
import { normalizeError } from '../../utils/errorHandler';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

type Props = NativeStackScreenProps<RootStackParamList, 'Documents'>;

const GROUPS: { title: string; kinds: InvestorDocumentKind[] }[] = [
  { title: 'Agreements', kinds: ['agreement', 'countersigned_agreement'] },
  { title: 'Investment confirmations', kinds: ['investment_certificate'] },
  { title: 'Monthly statements', kinds: ['monthly_statement'] },
  { title: 'Quarterly and annual statements', kinds: [...PERIODIC_STATEMENT_KINDS] },
  { title: 'Payout advices', kinds: ['payout_advice'] },
  { title: 'Statements', kinds: ['statement'] },
  { title: 'Maturity and withdrawals', kinds: ['maturity_statement', 'withdrawal_confirmation'] },
];

type TypeFilter = 'all' | 'agreements' | 'confirmations' | 'statements' | 'payouts';

const TYPE_FILTERS: {
  value: TypeFilter;
  label: string;
  kinds: InvestorDocumentKind[] | null;
}[] = [
  { value: 'all', label: 'All', kinds: null },
  { value: 'agreements', label: 'Agreements', kinds: ['agreement', 'countersigned_agreement'] },
  {
    value: 'confirmations',
    label: 'Confirmations',
    kinds: ['investment_certificate', 'withdrawal_confirmation'],
  },
  {
    value: 'statements',
    label: 'Statements',
    kinds: [
      'monthly_statement',
      'quarterly_statement',
      'annual_statement',
      'statement',
      'maturity_statement',
    ],
  },
  { value: 'payouts', label: 'Payouts', kinds: ['payout_advice'] },
];

const GENERAL = '__general';
type GroupBy = 'type' | 'investment';

function ordered(kinds: InvestorDocumentKind[], docs: InvestorDocumentItem[]): InvestorDocumentItem[] {
  if (kinds.includes('monthly_statement')) {
    return [...docs].sort((a, b) => (b.periodStart ?? '').localeCompare(a.periodStart ?? ''));
  }
  if (kinds.some(isPeriodicStatement)) return sortPeriodicStatements(docs);
  return docs;
}

function isTarget(doc: InvestorDocumentItem, target: { kind: string; id: string }): boolean {
  if (doc.id !== target.id) return false;
  return (
    doc.kind === target.kind ||
    (isPeriodicStatement(doc.kind) && isPeriodicStatement(target.kind))
  );
}

function matchesSearch(
  doc: InvestorDocumentItem,
  query: string,
  packageName: string | undefined
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [
    doc.title,
    getKindMeta(doc.kind).label,
    statementMonthLabel(doc.periodStart),
    doc.internalRef,
    packageName,
  ]
    .filter(Boolean)
    .some((text) => text!.toLowerCase().includes(q));
}

export const DocumentsScreen: React.FC<Props> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const targetKind = route.params?.highlightKind;
  const targetId = route.params?.highlightId;
  const initialInvestmentId = route.params?.initialInvestmentId;
  const target = targetKind && targetId ? { kind: targetKind, id: targetId } : null;
  const targetKey = target ? `${target.kind}:${target.id}` : null;

  const { data, isLoading, isFetching, isError, error, refetch } = useGetDocumentsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const investmentsQuery = useGetInvestmentsQuery();
  const { downloadAndOpen, busyKey, errorState } = useMobileDocumentDownload();

  const documents = data?.documents ?? [];
  const found = useMemo(
    () => (target ? documents.find((d) => isTarget(d, target)) : undefined),
    [documents, target]
  );

  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [investmentFilter, setInvestmentFilter] = useState<string>(initialInvestmentId || 'all');
  const [groupBy, setGroupBy] = useState<GroupBy>('type');
  const [investmentModalOpen, setInvestmentModalOpen] = useState(false);

  const handledRef = useRef<{ key: string | null; refetched: boolean }>({
    key: null,
    refetched: false,
  });

  useEffect(() => {
    if (handledRef.current.key !== targetKey) {
      handledRef.current = { key: targetKey, refetched: false };
    }
    if (!targetKey || !data || isFetching) return;
    if (!found && !handledRef.current.refetched) {
      handledRef.current.refetched = true;
      refetch();
    }
  }, [targetKey, data, isFetching, found, refetch]);

  const missing = Boolean(target && data && !isFetching && !found);

  const packageById = useMemo(() => {
    const rawList = Array.isArray(investmentsQuery.data)
      ? investmentsQuery.data
      : (investmentsQuery.data as any)?.investments ?? [];
    const map = new Map<string, string>();
    for (const inv of rawList) {
      if (inv?.id && inv?.package?.name) {
        map.set(inv.id, inv.package.name);
      }
    }
    return map;
  }, [investmentsQuery.data]);

  const investmentOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = [];
    const seen = new Set<string>();
    for (const doc of documents) {
      if (!doc.investmentId || seen.has(doc.investmentId)) continue;
      seen.add(doc.investmentId);
      const name = packageById.get(doc.investmentId);
      opts.push({
        value: doc.investmentId,
        label: name ? `${name} · Ref ${doc.internalRef}` : `Ref ${doc.internalRef}`,
      });
    }
    return opts;
  }, [documents, packageById]);

  const hasGeneral = useMemo(() => documents.some((d) => !d.investmentId), [documents]);

  const activeKinds = TYPE_FILTERS.find((f) => f.value === typeFilter)?.kinds ?? null;

  const shown = useMemo(
    () =>
      documents.filter(
        (doc) =>
          (!activeKinds || activeKinds.includes(doc.kind)) &&
          (investmentFilter === 'all' ||
            (investmentFilter === GENERAL
              ? !doc.investmentId
              : doc.investmentId === investmentFilter)) &&
          matchesSearch(doc, query, doc.investmentId ? packageById.get(doc.investmentId) : undefined)
      ),
    [documents, activeKinds, investmentFilter, query, packageById]
  );

  const isFiltering =
    query.trim() !== '' || typeFilter !== 'all' || investmentFilter !== 'all';

  const clearFilters = () => {
    setQuery('');
    setTypeFilter('all');
    setInvestmentFilter('all');
  };

  const groups = useMemo(() => {
    let result: { key: string; title: string; detail?: string; docs: InvestorDocumentItem[] }[];
    if (groupBy === 'type') {
      result = GROUPS.map((g) => ({
        key: g.title,
        title: g.title,
        docs: ordered(
          g.kinds,
          shown.filter((d) => g.kinds.includes(d.kind))
        ),
      }));
    } else {
      const byInvestment = new Map<string, InvestorDocumentItem[]>();
      for (const doc of shown) {
        const key = doc.investmentId ?? GENERAL;
        byInvestment.set(key, [...(byInvestment.get(key) ?? []), doc]);
      }
      result = [...byInvestment.entries()]
        .sort(([a], [b]) => Number(a === GENERAL) - Number(b === GENERAL))
        .map(([key, docs]) => {
          if (key === GENERAL) return { key, title: 'Across your investments', docs };
          const name = packageById.get(key);
          return {
            key,
            title: name ?? `Ref ${docs[0].internalRef}`,
            detail: name ? `Ref ${docs[0].internalRef}` : undefined,
            docs,
          };
        });
    }
    return result.filter((g) => g.docs.length > 0);
  }, [groupBy, shown, packageById]);

  const allInvestmentFilterChoices = useMemo(
    () => [
      { value: 'all', label: 'All investments' },
      ...investmentOptions,
      ...(hasGeneral ? [{ value: GENERAL, label: 'Across your investments' }] : []),
    ],
    [investmentOptions, hasGeneral]
  );

  const selectedInvestmentLabel =
    allInvestmentFilterChoices.find((o) => o.value === investmentFilter)?.label ?? 'All investments';

  return (
    <View style={styles.container}>
      <AppHeader hideNotifications title="Documents" showBack />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 36 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={Boolean(isFetching && !isLoading)}
            onRefresh={() => { refetch(); }}
            tintColor={colors.primary}
          />
        }
      >
        {/* Compact Custom Statement Action Strip */}
        <TouchableOpacity
          style={styles.statementBanner}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Statements')}
        >
          <View style={styles.statementBannerIcon}>
            <Ionicons name="document-text-outline" size={18} color={colors.primary} />
          </View>
          <View style={styles.statementBannerBody}>
            <Text style={styles.statementBannerTitle}>Custom Account Statement</Text>
            <Text style={styles.statementBannerSub} numberOfLines={1}>
              Generate PDF for any date range or contract
            </Text>
          </View>
          <View style={styles.statementBannerCta}>
            <Text style={styles.statementBannerCtaText}>Create</Text>
            <Ionicons name="chevron-forward" size={13} color={colors.primary} />
          </View>
        </TouchableOpacity>

        {/* Missing Deep-Link Notice */}
        {missing && (
          <View style={styles.noticeBanner}>
            <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
            <Text style={styles.noticeText}>
              {target?.kind === 'monthly_statement'
                ? "That statement isn't in your documents any more. If it was corrected, the corrected statement replaces it under Monthly statements."
                : target && isPeriodicStatement(target.kind)
                ? "That statement isn't in your documents any more. If it was corrected, the corrected statement replaces it under Quarterly and annual statements."
                : "That document isn't in your documents any more."}
            </Text>
          </View>
        )}

        {isLoading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading your documents…</Text>
          </View>
        ) : isError ? (
          <ErrorStateView
            error={error}
            appError={normalizeError(error, {
              defaultMessage: "We couldn't load your investor documents right now.",
              defaultNextStep: 'Check your internet connection and tap Retry.',
            })}
            onAction={() => refetch()}
            loading={isFetching}
            compact
          />
        ) : documents.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="document-text-outline" size={26} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>Nothing here yet</Text>
            <Text style={styles.emptySub}>
              Documents appear as you sign agreements and as payouts or statements are issued.
            </Text>
          </View>
        ) : (
          <>
            {/* Search & Filter Controls */}
            <View style={styles.filterSection}>
              <View style={styles.searchBox}>
                <Ionicons name="search-outline" size={16} color={colors.textMuted} />
                <TextInput
                  style={styles.searchInput}
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search title, month, or Ref..."
                  placeholderTextColor={colors.textMuted}
                  returnKeyType="search"
                />
                {query.length > 0 && (
                  <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
                    <Ionicons name="close-circle" size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.typePillsRow}
              >
                {TYPE_FILTERS.map((f) => {
                  const active = typeFilter === f.value;
                  return (
                    <TouchableOpacity
                      key={f.value}
                      style={[styles.filterPill, active && styles.filterPillActive]}
                      onPress={() => setTypeFilter(f.value)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[styles.filterPillText, active && styles.filterPillTextActive]}
                      >
                        {f.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <View style={styles.controlsRow}>
                {allInvestmentFilterChoices.length > 1 ? (
                  <TouchableOpacity
                    style={styles.selectChip}
                    onPress={() => setInvestmentModalOpen(true)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="briefcase-outline" size={13} color={colors.primary} />
                    <Text style={styles.selectChipText} numberOfLines={1}>
                      {selectedInvestmentLabel}
                    </Text>
                    <Ionicons name="chevron-down" size={13} color={colors.textMuted} />
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.totalCountLabel}>
                    {shown.length} {shown.length === 1 ? 'document' : 'documents'}
                  </Text>
                )}

                <View style={styles.segmentWrap}>
                  {(['type', 'investment'] as const).map((g) => {
                    const active = groupBy === g;
                    return (
                      <TouchableOpacity
                        key={g}
                        style={[styles.segmentBtn, active && styles.segmentBtnActive]}
                        onPress={() => setGroupBy(g)}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[styles.segmentText, active && styles.segmentTextActive]}
                        >
                          By {g}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* Grouped Document Lists */}
            {groups.length === 0 ? (
              <View style={styles.emptyCard}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="search-outline" size={24} color={colors.primary} />
                </View>
                <Text style={styles.emptyTitle}>No documents match</Text>
                <Text style={styles.emptySub}>Try another keyword, type, or investment.</Text>
                <TouchableOpacity style={styles.secondaryBtn} onPress={clearFilters}>
                  <Text style={styles.secondaryBtnText}>Clear filters</Text>
                </TouchableOpacity>
              </View>
            ) : (
              groups.map((group) => (
                <View key={group.key} style={styles.groupSection}>
                  <View style={styles.groupHeader}>
                    <Text style={styles.groupTitle}>{group.title}</Text>
                    <View style={styles.countBadge}>
                      <Text style={styles.countBadgeText}>{group.docs.length}</Text>
                    </View>
                    {group.detail && <Text style={styles.groupDetail}>{group.detail}</Text>}
                  </View>

                  <View style={styles.groupCard}>
                    {group.docs.map((doc, index) => {
                      const pres = buildDocumentRowPresentation(doc);
                      const isHighlighted = doc === found;
                      const primaryKey = `${doc.kind}:${doc.id}`;
                      const isPrimaryBusy = busyKey === primaryKey;
                      const rowError =
                        errorState && errorState.key === primaryKey ? errorState.message : null;

                      return (
                        <React.Fragment key={primaryKey}>
                          {index > 0 && <View style={styles.divider} />}
                          <View
                            style={[
                              styles.docRow,
                              isHighlighted && styles.docRowHighlighted,
                            ]}
                          >
                            <View style={styles.docIconBox}>
                              <Ionicons name={pres.icon} size={18} color={colors.primary} />
                            </View>

                            <View style={styles.docContentCol}>
                              <Text style={styles.docTitle}>{pres.title}</Text>

                              {Boolean(pres.meta) && (
                                <Text style={styles.docMeta}>{pres.meta}</Text>
                              )}

                              <View style={styles.bottomMetaRow}>
                                <View style={styles.badgesCluster}>
                                  {pres.corrected && (
                                    <View style={styles.correctedBadge}>
                                      <Text style={styles.correctedBadgeText}>Corrected</Text>
                                    </View>
                                  )}
                                  {pres.certificateId && (
                                    <View style={styles.certBadge}>
                                      <Ionicons
                                        name="shield-checkmark"
                                        size={11}
                                        color="#2E7D32"
                                      />
                                      <Text style={styles.certBadgeText}>
                                        Signing Certificate
                                      </Text>
                                    </View>
                                  )}
                                </View>

                                <TouchableOpacity
                                  style={styles.downloadBtn}
                                  disabled={busyKey !== null}
                                  onPress={() =>
                                    downloadAndOpen({
                                      via: 'documents',
                                      kind: doc.kind,
                                      id: doc.id,
                                      title: pres.title,
                                    })
                                  }
                                  activeOpacity={0.75}
                                >
                                  {isPrimaryBusy ? (
                                    <ActivityIndicator size="small" color={colors.primary} />
                                  ) : (
                                    <Ionicons
                                      name="download-outline"
                                      size={14}
                                      color={colors.primary}
                                    />
                                  )}
                                  <Text style={styles.downloadBtnText}>
                                    {isPrimaryBusy ? 'Opening…' : 'Download'}
                                  </Text>
                                </TouchableOpacity>
                              </View>

                              {rowError && <Text style={styles.rowErrorText}>{rowError}</Text>}
                            </View>
                          </View>
                        </React.Fragment>
                      );
                    })}
                  </View>
                </View>
              ))
            )}

            {isFiltering && groups.length > 0 && (
              <View style={styles.filterSummaryRow}>
                <Text style={styles.filterSummaryText}>
                  Showing {shown.length} of {documents.length} documents.{' '}
                </Text>
                <TouchableOpacity onPress={clearFilters}>
                  <Text style={styles.showAllLink}>Show all</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Investment Filter Picker Modal */}
      <Modal
        visible={investmentModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setInvestmentModalOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setInvestmentModalOpen(false)}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback>
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>Filter by Investment</Text>
                <ScrollView style={{ maxHeight: 320 }}>
                  {allInvestmentFilterChoices.map((choice) => {
                    const selected = choice.value === investmentFilter;
                    return (
                      <TouchableOpacity
                        key={choice.value}
                        style={[styles.modalOption, selected && styles.modalOptionSelected]}
                        onPress={() => {
                          setInvestmentFilter(choice.value);
                          setInvestmentModalOpen(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.modalOptionText,
                            selected && styles.modalOptionTextSelected,
                          ]}
                        >
                          {choice.label}
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
    paddingHorizontal: spacing.md,
    paddingTop: 12,
    gap: 14,
  },
  statementBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E7D7C1',
    paddingVertical: 11,
    paddingHorizontal: 12,
    gap: 10,
  },
  statementBannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FAF5EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statementBannerBody: {
    flex: 1,
  },
  statementBannerTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: colors.text,
  },
  statementBannerSub: {
    fontSize: 11.5,
    color: colors.textMuted,
    marginTop: 1,
  },
  statementBannerCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#FAF5EE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statementBannerCtaText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
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
  filterSection: {
    gap: 9,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7E3DA',
    borderRadius: 11,
    paddingHorizontal: 11,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: colors.text,
    paddingVertical: 0,
  },
  typePillsRow: {
    gap: 6,
  },
  filterPill: {
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E4DC',
  },
  filterPillActive: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  totalCountLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    paddingLeft: 2,
  },
  selectChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E1D8',
    borderRadius: 9,
    paddingHorizontal: 9,
    height: 33,
  },
  selectChipText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  segmentWrap: {
    flexDirection: 'row',
    backgroundColor: '#EFECE6',
    borderRadius: 9,
    padding: 2,
    flexShrink: 0,
  },
  segmentBtn: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 7,
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
  },
  segmentText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.textMuted,
  },
  segmentTextActive: {
    color: colors.text,
    fontWeight: '800',
  },
  groupSection: {
    gap: 8,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 7,
    paddingHorizontal: 2,
  },
  groupTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: colors.text,
  },
  countBadge: {
    backgroundColor: '#EFECE6',
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: 9,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
  },
  groupDetail: {
    fontSize: 12,
    color: colors.textMuted,
  },
  groupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#EFECE6',
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    backgroundColor: '#F2EFE9',
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    gap: 11,
  },
  docRowHighlighted: {
    backgroundColor: '#FAF5EE',
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  docIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#E7D7C1',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  docContentCol: {
    flex: 1,
    gap: 4,
  },
  docTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 18.5,
  },
  docMeta: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 16.5,
  },
  bottomMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 6,
  },
  badgesCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  correctedBadge: {
    backgroundColor: '#F3F2EE',
    borderWidth: 1,
    borderColor: '#DCD9D0',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 7,
  },
  correctedBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.text,
  },
  certBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#C8E6C9',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 7,
  },
  certBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#2E7D32',
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#E7D7C1',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 8,
    flexShrink: 0,
  },
  downloadBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  rowErrorText: {
    fontSize: 11.5,
    color: '#C62828',
    marginTop: 4,
  },
  filterSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  filterSummaryText: {
    fontSize: 12.5,
    color: colors.textMuted,
  },
  showAllLink: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  centerBox: {
    paddingVertical: 48,
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
    padding: 28,
    alignItems: 'center',
    gap: 8,
  },
  emptyIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
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
  primaryBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 6,
  },
  primaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryBtn: {
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#E7D7C1',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    marginTop: 6,
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
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



