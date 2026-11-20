import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { useGetNotificationsUnreadCountQuery } from '../../api/generated/investorApi';
import { NotificationsSheet } from '../notifications/NotificationsSheet';

interface AppHeaderProps {
  /** Screen title for secondary tabs or detail pages */
  title?: string;
  /** Optional context line shown beneath the title */
  subtitle?: string;
  /** Enables detail-screen back button */
  showBack?: boolean;
  /** Hide notification bell on focused flows like KYC or Commitment */
  hideNotifications?: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  hideNotifications = false,
}) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isReadyForNotifications, setIsReadyForNotifications] = useState(false);

  useEffect(() => {
    const timer: ReturnType<typeof setTimeout> = setTimeout(() => {
      setIsReadyForNotifications(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const { data: unreadData } = useGetNotificationsUnreadCountQuery(undefined, {
    skip: !isReadyForNotifications || hideNotifications,
    pollingInterval: 30000,
    refetchOnMountOrArgChange: false,
  });

  const unreadCount = Number(unreadData?.unreadCount ?? 0);
  const isDetailView = showBack;
  const isTabTitleView = !showBack && Boolean(title);

  return (
    <>
      <View
        style={[
          styles.container,
          { paddingTop: Math.max(insets.top, 12) + 8 },
        ]}
      >
        {isDetailView ? (
          /* 1. Detail / Flow Header */
          <View style={styles.detailGroup}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={19} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.titleCol}>
              <Text style={styles.detailTitle} numberOfLines={2}>
                {title}
              </Text>
              {Boolean(subtitle) && (
                <Text style={styles.subtitleText} numberOfLines={1}>
                  {subtitle}
                </Text>
              )}
            </View>
          </View>
        ) : isTabTitleView ? (
          /* 2. Secondary Tab Header (Packages, Investments, Account) */
          <View style={styles.titleCol}>
            <Text style={styles.tabTitle} numberOfLines={1}>
              {title}
            </Text>
            {Boolean(subtitle) && (
              <Text style={styles.subtitleText} numberOfLines={1}>
                {subtitle}
              </Text>
            )}
          </View>
        ) : (
          /* 3. Dashboard Brand Masthead — Clean editorial wordmark without generic icon boxes */
          <View style={styles.mastheadCol}>
            <View style={styles.wordmarkRow}>
              <Text style={styles.wordmark} numberOfLines={1}>
                BRICKET
              </Text>
              <Text style={styles.wordmarkAccent} numberOfLines={1}>
                X
              </Text>
            </View>
            <View style={styles.taglineRow}>
              <View style={styles.accentBar} />
              <Text style={styles.taglineText} numberOfLines={1}>
                PRIVATE WEALTH PORTAL
              </Text>
            </View>
          </View>
        )}

        {/* Right Action: Minimalist Notification Trigger */}
        {!hideNotifications && (
          <TouchableOpacity
            style={[
              styles.iconActionBtn,
              unreadCount > 0 && styles.iconActionBtnActive,
            ]}
            onPress={() => setSheetOpen(true)}
            accessibilityLabel="Notifications"
            activeOpacity={0.75}
          >
            <Ionicons
              name={unreadCount > 0 ? 'notifications' : 'notifications-outline'}
              size={20}
              color={unreadCount > 0 ? colors.primary : colors.text}
            />
            {unreadCount > 0 && (
              <View style={styles.counterBadge}>
                <Text style={styles.counterText} numberOfLines={1}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>

      <NotificationsSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        navigation={navigation}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 14,
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EFECE6',
  },
  mastheadCol: {
    flex: 1,
    flexShrink: 1,
    justifyContent: 'center',
  },
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  wordmark: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: 2.2,
  },
  wordmarkAccent: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 2.2,
  },
  taglineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  accentBar: {
    width: 14,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.primary,
    flexShrink: 0,
  },
  taglineText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1.2,
    flexShrink: 1,
  },
  titleCol: {
    flex: 1,
    flexShrink: 1,
  },
  tabTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.4,
  },
  subtitleText: {
    fontSize: 11.5,
    fontWeight: '500',
    color: colors.textMuted,
    marginTop: 2,
  },
  detailGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    flexShrink: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FAF9F6',
    borderWidth: 1,
    borderColor: '#EFECE6',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  detailTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  iconActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FAF9F6',
    borderWidth: 1,
    borderColor: '#EFECE6',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    flexShrink: 0,
  },
  iconActionBtnActive: {
    backgroundColor: '#FAF5EE',
    borderColor: '#E7D7C1',
  },
  counterBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: colors.primary,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  counterText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
