import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TouchableWithoutFeedback,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import {
  useGetNotificationsQuery,
  useGetNotificationsUnreadCountQuery,
  usePostNotificationsReadAllMutation,
  usePostNotificationsByIdReadMutation,
} from '../../api/generated/investorApi';
import {
  formatNotificationTime,
  getNotificationVisualMeta,
  loadClearedNotificationIds,
  navigateFromNotificationLink,
  NotificationItemData,
  saveClearedNotificationIds,
} from '../../features/notifications/notificationHelpers';

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  navigation: any;
}

export const NotificationsSheet: React.FC<SheetProps> = ({
  visible,
  onClose,
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<'all' | 'unread' | 'investments'>('all');
  const [clearedIds, setClearedIds] = useState<Set<string>>(new Set());
  const [localReadIds, setLocalReadIds] = useState<Set<string>>(new Set());
  const [allMarkedRead, setAllMarkedRead] = useState(false);

  const { data, isLoading, refetch } = useGetNotificationsQuery(
    { limit: 25 },
    { skip: !visible, refetchOnMountOrArgChange: true }
  );
  const { refetch: refetchUnread } = useGetNotificationsUnreadCountQuery();

  const [markAll, { isLoading: isMarkingAll }] = usePostNotificationsReadAllMutation();
  const [markSingle] = usePostNotificationsByIdReadMutation();

  useEffect(() => {
    if (visible) {
      loadClearedNotificationIds().then(setClearedIds);
    }
  }, [visible]);

  const items = useMemo(() => {
    const raw = (data?.items || []) as NotificationItemData[];
    return raw
      .filter((i) => !clearedIds.has(i.id))
      .map((i) => ({
        ...i,
        read: allMarkedRead || i.read || localReadIds.has(i.id),
      }));
  }, [data?.items, clearedIds, allMarkedRead, localReadIds]);

  const unreadCount = useMemo(
    () => items.filter((i) => !i.read).length,
    [items]
  );

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (filter === 'unread') return !item.read;
      if (filter === 'investments') {
        const meta = getNotificationVisualMeta(item.type, item.link?.type, item.title);
        return meta.category === 'investments';
      }
      return true;
    });
  }, [items, filter]);

  const handleMarkAll = async () => {
    setAllMarkedRead(true);
    try {
      await markAll().unwrap();
      refetch();
      refetchUnread();
    } catch {
      setAllMarkedRead(false);
    }
  };

  const handleClearAll = async () => {
    if (items.length === 0) return;
    const nextCleared = new Set(clearedIds);
    items.forEach((i) => nextCleared.add(i.id));
    setClearedIds(nextCleared);
    await saveClearedNotificationIds(nextCleared);

    if (unreadCount > 0) {
      setAllMarkedRead(true);
      markAll()
        .unwrap()
        .then(() => {
          refetch();
          refetchUnread();
        })
        .catch(() => {});
    }
  };

  const handleItemPress = async (item: NotificationItemData) => {
    if (!item.read && item.id) {
      setLocalReadIds((prev) => new Set(prev).add(item.id));
      try {
        await markSingle({ id: item.id }).unwrap();
        refetchUnread();
      } catch {
        // quiet catch
      }
    }
    onClose();
    navigateFromNotificationLink(navigation, item.link);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <View style={[styles.sheetContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.dragPill} />

        {/* Header: Left title + Right icon buttons so nothing clips */}
        <View style={styles.sheetHeader}>
          <View style={styles.titleBlock}>
            <View style={styles.titleRow}>
              <Text style={styles.sheetTitle}>Activity &amp; Alerts</Text>
              {unreadCount > 0 && (
                <View style={styles.badgePill}>
                  <Text style={styles.badgePillText}>{unreadCount}</Text>
                </View>
              )}
            </View>
            <Text style={styles.sheetSub}>
              Portfolio, compliance &amp; statement updates
            </Text>
          </View>

          <View style={styles.headerActions}>
            {unreadCount > 0 && (
              <TouchableOpacity
                style={styles.actionChip}
                onPress={handleMarkAll}
                disabled={isMarkingAll}
              >
                <Ionicons name="checkmark-done" size={14} color={colors.primary} />
                <Text style={styles.actionChipText}>Read all</Text>
              </TouchableOpacity>
            )}
            {items.length > 0 && (
              <TouchableOpacity
                style={styles.clearChip}
                onPress={handleClearAll}
              >
                <Ionicons name="trash-outline" size={14} color={colors.textMuted} />
                <Text style={styles.clearChipText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          {(['all', 'unread', 'investments'] as const).map((key) => {
            const active = filter === key;
            const label =
              key === 'all'
                ? 'All'
                : key === 'unread'
                ? `Unread${unreadCount > 0 ? ` (${unreadCount})` : ''}`
                : 'Investments';
            return (
              <TouchableOpacity
                key={key}
                style={[styles.filterPill, active && styles.filterPillActive]}
                onPress={() => setFilter(key)}
              >
                <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* List Content */}
        {isLoading && !items.length ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={filteredItems}
            keyExtractor={(i) => i.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const meta = getNotificationVisualMeta(item.type, item.link?.type, item.title);
              return (
                <TouchableOpacity
                  style={[styles.itemRow, !item.read && styles.itemUnread]}
                  onPress={() => handleItemPress(item)}
                  activeOpacity={0.82}
                >
                  <View style={[styles.itemIconRing, { backgroundColor: meta.bgColor }]}>
                    <Ionicons name={meta.icon} size={17} color={meta.iconColor} />
                  </View>

                  <View style={styles.itemTextWrap}>
                    <View style={styles.rowBetween}>
                      <View style={styles.titleWithRef}>
                        <Text
                          style={[styles.itemTitle, !item.read && styles.itemTitleBold]}
                          numberOfLines={1}
                        >
                          {item.title}
                        </Text>

                      </View>
                      <View style={styles.timeAndDot}>
                        <Text style={styles.timeText}>
                          {formatNotificationTime(item.createdAt)}
                        </Text>
                        {!item.read && <View style={styles.dot} />}
                      </View>
                    </View>

                    <Text style={styles.itemText} numberOfLines={3}>
                      {item.text}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={styles.emptyCircle}>
                  <Ionicons name="checkmark-done-outline" size={24} color={colors.primary} />
                </View>
                <Text style={styles.emptyTitle}>All caught up</Text>
                <Text style={styles.emptyText}>No active alerts in this view.</Text>
              </View>
            }
          />
        )}

        {/* Footer Button */}
        <TouchableOpacity
          style={styles.viewAllBtn}
          activeOpacity={0.85}
          onPress={() => {
            onClose();
            navigation.navigate('Notifications');
          }}
        >
          <Text style={styles.viewAllText}>Notification Center &amp; Settings</Text>
          <Ionicons name="arrow-forward" size={15} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    minHeight: '46%',
    paddingTop: 10,
  },
  dragPill: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0DDD7',
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    marginBottom: 12,
    gap: 10,
  },
  titleBlock: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  badgePill: {
    backgroundColor: colors.primary,
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: 9,
  },
  badgePillText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sheetSub: {
    fontSize: 11.5,
    color: colors.textMuted,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5.5,
    paddingHorizontal: 8,
    borderRadius: 9,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#E7D7C1',
  },
  actionChipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.primary,
  },
  clearChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5.5,
    paddingHorizontal: 8,
    borderRadius: 9,
    backgroundColor: '#F5F4F0',
    borderWidth: 1,
    borderColor: '#E8E4DC',
  },
  clearChipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.textMuted,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    gap: 8,
    marginBottom: 12,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 5.5,
    borderRadius: 16,
    backgroundColor: '#F5F4F0',
  },
  filterPillActive: {
    backgroundColor: colors.text,
  },
  filterPillText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.textMuted,
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 18,
    paddingBottom: 12,
    gap: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FAFAF7',
    borderWidth: 1,
    borderColor: '#ECEAE4',
    borderRadius: 14,
    padding: 12,
    gap: 11,
  },
  itemUnread: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DFD2BF',
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  itemIconRing: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  itemTextWrap: {
    flex: 1,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 6,
  },
  titleWithRef: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    flexShrink: 1,
  },
  itemTitleBold: {
    fontWeight: '800',
  },
  refPill: {
    backgroundColor: '#F2EFE9',
    paddingHorizontal: 5.5,
    paddingVertical: 1.5,
    borderRadius: 5,
  },
  refPillText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: colors.textMuted,
  },
  timeAndDot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexShrink: 0,
  },
  timeText: {
    fontSize: 10.5,
    color: colors.textMuted,
  },
  itemText: {
    fontSize: 11.5,
    color: colors.textMuted,
    marginTop: 3,
    lineHeight: 15.5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  centerBox: {
    padding: 30,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 6,
  },
  emptyCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FAF5EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  emptyText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginHorizontal: 18,
    marginTop: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#E7D7C1',
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
});

