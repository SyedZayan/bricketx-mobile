import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useGetTicketsQuery } from '../../api/generated/investorApi';
import { colors } from '../../theme/colors';
import {
  Ticket,
  formatRelativeTime,
  issueTypeLabel,
  ticketStatusMeta,
} from './ticketMeta';

type Props = NativeStackScreenProps<RootStackParamList, 'Support'>;

const PAGE_SIZE = 20;

export const SupportScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching, error, refetch } = useGetTicketsQuery(
    { page, pageSize: PAGE_SIZE },
    { refetchOnMountOrArgChange: true }
  );

  const tickets = data?.tickets ?? [];
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  const renderTicketCard = ({ item }: { item: Ticket }) => {
    const status = ticketStatusMeta(item.status);
    const related = item.investment
      ? `Investment ${item.investment.internalRef}`
      : item.package
      ? item.package.name
      : null;
    const supportReplied =
      item.lastMessageFrom === 'support' && item.status !== 'closed';

    const pillStyle =
      status.tone === 'neutral'
        ? styles.pillNeutral
        : status.tone === 'danger'
        ? styles.pillHighlight
        : styles.pillGold;

    const pillTextStyle =
      status.tone === 'neutral'
        ? styles.pillTextNeutral
        : styles.pillTextGold;

    return (
      <TouchableOpacity
        style={styles.ticketCard}
        onPress={() => navigation.navigate('TicketDetail', { id: item.id })}
        activeOpacity={0.8}
      >
        <View style={styles.cardTopRow}>
          <Text style={styles.ticketSubject} numberOfLines={2}>
            {item.subject}
          </Text>
          <Ionicons name="chevron-forward" size={17} color={colors.slate} />
        </View>

        <Text style={styles.ticketMeta} numberOfLines={1}>
          {issueTypeLabel(item.issueType)}
          {related ? ` • ${related}` : ''}
        </Text>

        <View style={styles.cardBottomRow}>
          <View style={styles.badgesLeft}>
            <View style={[styles.statusPill, pillStyle]}>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor:
                      status.tone === 'neutral' ? colors.slate : colors.primary,
                  },
                ]}
              />
              <Text style={[styles.statusPillText, pillTextStyle]}>
                {status.label}
              </Text>
            </View>

            {supportReplied && (
              <View style={styles.repliedBadge}>
                <View style={styles.repliedDot} />
                <Text style={styles.repliedText}>Support replied</Text>
              </View>
            )}
          </View>

          <Text style={styles.timeText}>
            {formatRelativeTime(item.lastMessageAt)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) + 6 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={21} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Support</Text>
        </View>

        <TouchableOpacity
          style={styles.newTicketBtn}
          onPress={() => navigation.navigate('NewTicket')}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={16} color="#FFFFFF" />
          <Text style={styles.newTicketBtnText}>New ticket</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading your support tickets...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerBox}>
          <View style={styles.iconCircle}>
            <Ionicons name="alert-circle-outline" size={32} color={colors.text} />
          </View>
          <Text style={styles.emptyTitle}>Unable to Load Tickets</Text>
          <Text style={styles.emptySub}>
            We couldn&apos;t load your support requests right now.
          </Text>
          <TouchableOpacity
            style={styles.primaryActionBtn}
            onPress={() => refetch()}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryActionBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(item) => item.id}
          renderItem={renderTicketCard}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, 24) + 20 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isLoading}
              onRefresh={() => { void refetch(); }}
              tintColor={colors.primary}
            />
          }
          ListHeaderComponent={
            <Text style={styles.introBanner}>
              Ask us anything about your account, your investments, or a package. Our team replies here, and you&apos;ll receive a notification when they do.
            </Text>
          }
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <View style={styles.iconCircle}>
                <Ionicons name="chatbubbles-outline" size={30} color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>No Support Tickets Yet</Text>
              <Text style={styles.emptySub}>
                You haven&apos;t contacted support yet. Start a conversation whenever you need help.
              </Text>
              <TouchableOpacity
                style={styles.primaryActionBtn}
                onPress={() => navigation.navigate('NewTicket')}
                activeOpacity={0.85}
              >
                <Ionicons name="create-outline" size={16} color="#FFFFFF" />
                <Text style={styles.primaryActionBtnText}>Start a New Ticket</Text>
              </TouchableOpacity>
            </View>
          }
          ListFooterComponent={
            totalPages > 1 ? (
              <View style={styles.paginationRow}>
                <TouchableOpacity
                  style={[styles.pageBtn, page <= 1 && styles.pageBtnDisabled]}
                  disabled={page <= 1 || isFetching}
                  onPress={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <Text style={styles.pageBtnText}>Newer</Text>
                </TouchableOpacity>
                <Text style={styles.pageInfo}>
                  Page {page} of {totalPages}
                </Text>
                <TouchableOpacity
                  style={[styles.pageBtn, page >= totalPages && styles.pageBtnDisabled]}
                  disabled={page >= totalPages || isFetching}
                  onPress={() => setPage((p) => p + 1)}
                >
                  <Text style={styles.pageBtnText}>Older</Text>
                </TouchableOpacity>
              </View>
            ) : undefined
          }
          showsVerticalScrollIndicator={false}
        />
      )}
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
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.slateLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    paddingHorizontal: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  newTicketBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primary,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 10,
  },
  newTicketBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  introBanner: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 19,
    marginBottom: 4,
  },
  ticketCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 15,
    ...Platform.select({
      ios: {
        shadowColor: '#212121',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  ticketSubject: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 20,
  },
  ticketMeta: {
    fontSize: 12.5,
    color: colors.textMuted,
    marginTop: 4,
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    gap: 8,
  },
  badgesLeft: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillGold: {
    backgroundColor: colors.primaryTint,
    borderColor: colors.primaryBorder,
  },
  pillHighlight: {
    backgroundColor: colors.primaryTint,
    borderColor: colors.primary,
  },
  pillNeutral: {
    backgroundColor: colors.slateLight,
    borderColor: colors.border,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusPillText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  pillTextGold: {
    color: colors.primary,
  },
  pillTextNeutral: {
    color: colors.textMuted,
  },
  repliedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  repliedDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.primary,
  },
  repliedText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.text,
  },
  timeText: {
    fontSize: 11.5,
    color: colors.textMuted,
    fontWeight: '500',
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13.5,
    color: colors.textMuted,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 28,
    alignItems: 'center',
    marginTop: 12,
  },
  iconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primaryTint,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 18,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 10,
  },
  primaryActionBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  pageBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9,
  },
  pageBtnDisabled: {
    opacity: 0.45,
  },
  pageBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.text,
  },
  pageInfo: {
    fontSize: 12.5,
    color: colors.textMuted,
    fontWeight: '600',
  },
});

