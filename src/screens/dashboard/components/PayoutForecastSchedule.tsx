import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';

interface MonthProjection {
  month: string;
  min: string;
  max: string;
  amount?: string | null;
  count: number;
}

interface PaidMonth {
  month: string;
  amount: string;
}

interface Props {
  upcoming: MonthProjection[];
  history: PaidMonth[];
  formatCurrency: (val: string | number | null | undefined) => string;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatMonthShort = (yyyyMm: string) => {
  if (!yyyyMm) return '';
  const [, month] = yyyyMm.split('-');
  return MONTHS[parseInt(month, 10) - 1] || month;
};

const formatMonthLabel = (yyyyMm: string) => {
  if (!yyyyMm) return '';
  const [year, month] = yyyyMm.split('-');
  const monthName = MONTHS[parseInt(month, 10) - 1] || month;
  return `${monthName} ${year}`;
};

const parseAmount = (val: string | number | null | undefined): number => {
  if (val === null || val === undefined) return 0;
  const num = typeof val === 'string' ? parseFloat(val.replace(/,/g, '')) : val;
  return isNaN(num) ? 0 : num;
};

const MAX_VISIBLE_ROWS = 4;

export const PayoutForecastSchedule: React.FC<Props> = ({
  upcoming,
  history,
  formatCurrency,
}) => {
  const [tab, setTab] = useState<'upcoming' | 'history'>('upcoming');
  const [expanded, setExpanded] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  const activeUpcoming = useMemo(
    () =>
      upcoming.filter(
        (item) => parseAmount(item.min) > 0 || parseAmount(item.max) > 0 || item.count > 0
      ),
    [upcoming]
  );

  const activeHistory = useMemo(
    () =>
      [...history]
        .filter((item) => parseAmount(item.amount) > 0)
        .sort((a, b) => b.month.localeCompare(a.month)),
    [history]
  );

  const upcomingTotals = useMemo(() => {
    return activeUpcoming.reduce(
      (acc, item) => ({
        min: acc.min + parseAmount(item.min),
        max: acc.max + parseAmount(item.max),
      }),
      { min: 0, max: 0 }
    );
  }, [activeUpcoming]);

  const historyTotal = useMemo(
    () => activeHistory.reduce((sum, item) => sum + parseAmount(item.amount), 0),
    [activeHistory]
  );

  const chartItems = useMemo(() => {
    if (tab === 'upcoming') {
      return upcoming.map((u) => ({
        key: u.month,
        shortLabel: formatMonthShort(u.month),
        fullLabel: formatMonthLabel(u.month),
        value: parseAmount(u.max),
        subText: `${formatCurrency(u.min)} - ${formatCurrency(u.max)}`,
        badge: u.count > 1 ? `${u.count} payouts` : u.count === 1 ? '1 payout' : 'No payout',
      }));
    }
    const chronologicalHistory = [...activeHistory].reverse();
    return chronologicalHistory.map((h) => ({
      key: h.month,
      shortLabel: formatMonthShort(h.month),
      fullLabel: formatMonthLabel(h.month),
      value: parseAmount(h.amount),
      subText: `+${formatCurrency(h.amount)}`,
      badge: 'Paid',
    }));
  }, [tab, upcoming, activeHistory, formatCurrency]);

  const maxChartVal = Math.max(...chartItems.map((c) => c.value), 1);

  const activePoint = useMemo(() => {
    if (!selectedMonth) return null;
    return chartItems.find((c) => c.key === selectedMonth) || null;
  }, [selectedMonth, chartItems]);

  const visibleUpcoming = expanded
    ? activeUpcoming
    : activeUpcoming.slice(0, MAX_VISIBLE_ROWS);

  const visibleHistory = expanded
    ? activeHistory
    : activeHistory.slice(0, MAX_VISIBLE_ROWS);

  const handleTabSwitch = (nextTab: 'upcoming' | 'history') => {
    setTab(nextTab);
    setExpanded(false);
    setSelectedMonth(null);
  };

  return (
    <View style={styles.card}>
      {/* Header + Segmented Control */}
      <View style={styles.headerRow}>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Payout Schedule</Text>
          <Text style={styles.subtitle}>
            {tab === 'upcoming'
              ? `${activeUpcoming.length} scheduled ${activeUpcoming.length === 1 ? 'month' : 'months'}`
              : `${activeHistory.length} settled ${activeHistory.length === 1 ? 'payout' : 'payouts'}`}
          </Text>
        </View>

        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[styles.segmentBtn, tab === 'upcoming' && styles.segmentBtnActive]}
            onPress={() => handleTabSwitch('upcoming')}
            activeOpacity={0.8}
          >
            <Text style={[styles.segmentText, tab === 'upcoming' && styles.segmentTextActive]}>
              Upcoming
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentBtn, tab === 'history' && styles.segmentBtnActive]}
            onPress={() => handleTabSwitch('history')}
            activeOpacity={0.8}
          >
            <Text style={[styles.segmentText, tab === 'history' && styles.segmentTextActive]}>
              History
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Summary Bar */}
      <View style={[styles.summaryStrip, tab === 'history' && styles.summaryStripGreen]}>
        <Text style={styles.summaryLabel} numberOfLines={1}>
          {tab === 'upcoming' ? '12-Mo Projected Yield' : 'Total Settled Payouts'}
        </Text>
        <Text
          style={[styles.summaryValue, tab === 'history' && { color: '#2E7D32' }]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {tab === 'upcoming'
            ? `${formatCurrency(upcomingTotals.min)} - ${formatCurrency(upcomingTotals.max)}`
            : `+${formatCurrency(historyTotal)}`}
        </Text>
      </View>

      {/* Proper Bar Chart */}
      {chartItems.length > 0 && (
        <View style={styles.chartBox}>
          <View style={styles.chartTopMeta}>
            <Text style={styles.chartCaption} numberOfLines={1}>
              {activePoint
                ? `${activePoint.fullLabel}: ${activePoint.subText}`
                : tab === 'upcoming'
                  ? 'Tap a month bar to inspect projection'
                  : 'Tap a month bar to inspect payout'}
            </Text>
            {activePoint && (
              <TouchableOpacity onPress={() => setSelectedMonth(null)}>
                <Text style={styles.resetLink}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.chartPlotArea}>
            <View style={styles.gridLine} />
            <View style={[styles.gridLine, { top: '50%' }]} />
            <View style={styles.barsRow}>
              {chartItems.map((item) => {
                const hasVal = item.value > 0;
                const pct = hasVal ? Math.max(Math.round((item.value / maxChartVal) * 100), 14) : 4;
                const isSelected = selectedMonth === item.key;

                return (
                  <TouchableOpacity
                    key={item.key}
                    style={styles.barColumn}
                    onPress={() => setSelectedMonth(isSelected ? null : item.key)}
                    activeOpacity={0.75}
                  >
                    <View style={styles.barSlot}>
                      <View
                        style={[
                          styles.barColumnFill,
                          { height: `${pct}%` },
                          hasVal
                            ? tab === 'history'
                              ? styles.barPaid
                              : isSelected
                                ? styles.barSelected
                                : styles.barActive
                            : styles.barEmpty,
                        ]}
                      />
                    </View>
                    <Text
                      style={[
                        styles.monthAxisText,
                        (hasVal || isSelected) && styles.monthAxisBold,
                      ]}
                      numberOfLines={1}
                    >
                      {item.shortLabel}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      )}

      {/* Schedule List */}
      {tab === 'upcoming' ? (
        <View style={styles.list}>
          {activeUpcoming.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="calendar-outline" size={24} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No Upcoming Payouts</Text>
              <Text style={styles.emptySub}>
                Scheduled distributions will appear once contracts begin deploying.
              </Text>
            </View>
          ) : (
            <>
              {visibleUpcoming.map((item, idx) => (
                <View key={item.month || idx} style={styles.rowCard}>
                  <View style={styles.rowLeft}>
                    <Text style={styles.rowMonth} numberOfLines={1}>
                      {formatMonthLabel(item.month)}
                    </Text>
                    <Text style={styles.rowMeta} numberOfLines={1}>
                      {item.count > 1 ? `${item.count} distributions` : '1 distribution'}
                    </Text>
                  </View>

                  <View style={styles.rowRight}>
                    <Text style={styles.rowAmount} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>
                      {formatCurrency(item.min)} - {formatCurrency(item.max)}
                    </Text>
                    <View style={styles.tagGold}>
                      <Text style={styles.tagGoldText}>ESTIMATED</Text>
                    </View>
                  </View>
                </View>
              ))}

              {activeUpcoming.length > MAX_VISIBLE_ROWS && (
                <TouchableOpacity
                  style={styles.expandBtn}
                  onPress={() => setExpanded(!expanded)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.expandText}>
                    {expanded ? 'Show fewer' : `Show all ${activeUpcoming.length} months`}
                  </Text>
                  <Ionicons
                    name={expanded ? 'chevron-up' : 'chevron-down'}
                    size={14}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      ) : (
        <View style={styles.list}>
          {activeHistory.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="receipt-outline" size={24} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No Settled Payouts Yet</Text>
              <Text style={styles.emptySub}>
                Completed distributions will appear here once paid.
              </Text>
            </View>
          ) : (
            <>
              {visibleHistory.map((item, idx) => (
                <View key={item.month || idx} style={styles.rowCard}>
                  <View style={styles.rowLeft}>
                    <Text style={styles.rowMonth} numberOfLines={1}>
                      {formatMonthLabel(item.month)}
                    </Text>
                    <Text style={styles.rowMeta} numberOfLines={1}>
                      Settled distribution
                    </Text>
                  </View>

                  <View style={styles.rowRight}>
                    <Text style={[styles.rowAmount, { color: '#2E7D32' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>
                      +{formatCurrency(item.amount)}
                    </Text>
                    <View style={styles.tagGreen}>
                      <Text style={styles.tagGreenText}>PAID</Text>
                    </View>
                  </View>
                </View>
              ))}

              {activeHistory.length > MAX_VISIBLE_ROWS && (
                <TouchableOpacity
                  style={styles.expandBtn}
                  onPress={() => setExpanded(!expanded)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.expandText}>
                    {expanded ? 'Show fewer' : `Show all ${activeHistory.length} payouts`}
                  </Text>
                  <Ionicons
                    name={expanded ? 'chevron-up' : 'chevron-down'}
                    size={14}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFECE6',
    borderRadius: 16,
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  titleBlock: {
    flex: 1,
    minWidth: 130,
  },
  title: {
    fontSize: 15.5,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 11.5,
    color: colors.textMuted,
    marginTop: 2,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#F8F7F4',
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: '#EFECE6',
    flexShrink: 0,
  },
  segmentBtn: {
    paddingHorizontal: 11,
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
  summaryStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#E7D7C1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 12,
  },
  summaryStripGreen: {
    backgroundColor: '#E8F5E9',
    borderColor: '#C8E6C9',
  },
  summaryLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.text,
    flexShrink: 1,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  chartBox: {
    backgroundColor: '#FAF9F6',
    borderWidth: 1,
    borderColor: '#EFECE6',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  chartTopMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  chartCaption: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    flex: 1,
  },
  resetLink: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  chartPlotArea: {
    position: 'relative',
    paddingTop: 4,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 4,
    height: 1,
    backgroundColor: '#EAE5DC',
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 3,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
  },
  barSlot: {
    width: '100%',
    maxWidth: 16,
    height: 76,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  barColumnFill: {
    width: '100%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  barActive: {
    backgroundColor: colors.primary,
  },
  barSelected: {
    backgroundColor: '#8C6239',
  },
  barPaid: {
    backgroundColor: '#2E7D32',
  },
  barEmpty: {
    backgroundColor: '#E6E1D8',
  },
  monthAxisText: {
    fontSize: 9.5,
    color: colors.textMuted,
    marginTop: 6,
    fontWeight: '500',
  },
  monthAxisBold: {
    color: colors.text,
    fontWeight: '700',
  },
  list: {
    gap: 8,
  },
  rowCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FAF9F6',
    borderWidth: 1,
    borderColor: '#EFECE6',
    borderRadius: 11,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  rowLeft: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
  },
  rowMonth: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },
  rowMeta: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  rowRight: {
    alignItems: 'flex-end',
    maxWidth: '58%',
    flexShrink: 1,
    gap: 3,
  },
  rowAmount: {
    fontSize: 12.5,
    fontWeight: '800',
    color: colors.primary,
  },
  tagGold: {
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#E7D7C1',
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  tagGoldText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.4,
  },
  tagGreen: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#C8E6C9',
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  tagGreenText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#2E7D32',
    letterSpacing: 0.4,
  },
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#E7D7C1',
  },
  expandText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 14,
    backgroundColor: '#FAF9F6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EFECE6',
    gap: 4,
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  emptySub: {
    fontSize: 11.5,
    color: colors.textMuted,
    textAlign: 'center',
  },
});

