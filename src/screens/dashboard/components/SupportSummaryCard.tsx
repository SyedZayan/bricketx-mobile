import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGetTicketsSummaryQuery } from '../../../api/generated/investorApi';
import { colors } from '../../../theme/colors';

interface Props {
  onOpenSupport: () => void;
  onOpenNewTicket: () => void;
}

export const SupportSummaryCard: React.FC<Props> = ({
  onOpenSupport,
  onOpenNewTicket,
}) => {
  const { data, isLoading, isError, isFetching, refetch } =
    useGetTicketsSummaryQuery(undefined, { refetchOnMountOrArgChange: true });

  const awaitingYou = data?.awaitingInvestor ?? 0;

  return (
    <View style={styles.card}>
      {/* Card Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleLeft}>
          <View style={styles.iconRing}>
            <Ionicons name="headset-outline" size={18} color={colors.primary} />
          </View>
          <Text style={styles.cardTitle}>Support</Text>
        </View>

        <TouchableOpacity
          style={styles.headerLinkBtn}
          onPress={onOpenSupport}
          activeOpacity={0.75}
        >
          <Text style={styles.headerLinkText}>Go to Support</Text>
          <Ionicons name="arrow-forward" size={13} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Loading your support tickets...</Text>
        </View>
      ) : isError || !data ? (
        <View style={styles.errorRow}>
          <Text style={styles.errorText}>Couldn&apos;t load your tickets.</Text>
          <TouchableOpacity
            onPress={() => {
              void refetch();
            }}
            disabled={isFetching}
          >
            <Text style={styles.retryLink}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Highlighted "Awaiting you" banner or neutral 0 row */}
          {awaitingYou > 0 ? (
            <TouchableOpacity
              style={styles.awaitingHighlightBox}
              onPress={onOpenSupport}
              activeOpacity={0.82}
            >
              <Text style={styles.awaitingCount}>{awaitingYou}</Text>
              <View style={styles.awaitingTextCol}>
                <Text style={styles.awaitingTitle}>Awaiting you</Text>
                <Text style={styles.awaitingSub}>Support has replied</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.text} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.awaitingNeutralBox}
              onPress={onOpenSupport}
              activeOpacity={0.8}
            >
              <Text style={styles.neutralLabel}>Awaiting you</Text>
              <Text style={styles.neutralValue}>0</Text>
            </TouchableOpacity>
          )}

          {/* Ticket state breakdown */}
          <View style={styles.countsList}>
            <View style={styles.countRow}>
              <Text style={styles.countLabel}>Open, not answered yet</Text>
              <Text style={styles.countValue}>{data.open}</Text>
            </View>
            <View style={styles.rowDivider} />
            <View style={styles.countRow}>
              <Text style={styles.countLabel}>Waiting for support</Text>
              <Text style={styles.countValue}>{data.awaitingAdmin}</Text>
            </View>
            <View style={styles.rowDivider} />
            <View style={styles.countRow}>
              <Text style={styles.countLabel}>Resolved</Text>
              <Text style={styles.countValue}>{data.resolved}</Text>
            </View>
          </View>

          {/* Footer CTA */}
          <TouchableOpacity
            style={styles.newTicketBtn}
            onPress={onOpenNewTicket}
            activeOpacity={0.82}
          >
            <Ionicons name="create-outline" size={15} color={colors.primary} />
            <Text style={styles.newTicketText}>Open a new ticket</Text>
          </TouchableOpacity>
        </>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  titleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconRing: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#E7D7C1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: colors.text,
  },
  headerLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#E7D7C1',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  headerLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
  },
  loadingText: {
    fontSize: 12.5,
    color: colors.textMuted,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  errorText: {
    fontSize: 12.5,
    color: colors.textMuted,
  },
  retryLink: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  awaitingHighlightBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: colors.primary,
    borderLeftWidth: 4,
    borderRadius: 11,
    padding: 13,
  },
  awaitingCount: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    lineHeight: 26,
  },
  awaitingTextCol: {
    flex: 1,
  },
  awaitingTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.text,
  },
  awaitingSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1,
  },
  awaitingNeutralBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#EFECE6',
    borderRadius: 11,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  neutralLabel: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '500',
  },
  neutralValue: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.text,
  },
  countsList: {
    marginTop: 10,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#EFECE6',
  },
  countLabel: {
    fontSize: 13,
    color: colors.textMuted,
  },
  countValue: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.text,
  },
  newTicketBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#E7D7C1',
  },
  newTicketText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.primary,
  },
});
