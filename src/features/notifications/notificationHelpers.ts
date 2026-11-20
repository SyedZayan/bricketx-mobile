import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { colors } from '../../theme/colors';

const CLEARED_IDS_FILE = `${FileSystem.documentDirectory}bricketx_cleared_notifications_v1.json`;

export interface NotificationItemData {
  id: string;
  type: string;
  title: string;
  text: string;
  read: boolean;
  createdAt: string;
  link: {
    type: string;
    id?: string | null;
  } | null;
}

export type NotificationCategoryFilter =
  | 'all'
  | 'unread'
  | 'investments'
  | 'statements'
  | 'compliance';

export interface NotificationVisualMeta {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  bgColor: string;
  badge: string;
  category: Exclude<NotificationCategoryFilter, 'all' | 'unread'>;
  actionLabel: string | null;
}

export async function loadClearedNotificationIds(): Promise<Set<string>> {
  try {
    if (!FileSystem.documentDirectory) return new Set();
    const info = await FileSystem.getInfoAsync(CLEARED_IDS_FILE);
    if (!info.exists) return new Set();
    const raw = await FileSystem.readAsStringAsync(CLEARED_IDS_FILE);
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed) : new Set();
  } catch {
    return new Set();
  }
}

export async function saveClearedNotificationIds(ids: Set<string>): Promise<void> {
  try {
    if (!FileSystem.documentDirectory) return;
    const arr = Array.from(ids).slice(-500);
    await FileSystem.writeAsStringAsync(CLEARED_IDS_FILE, JSON.stringify(arr));
  } catch {
    // Ignore storage write errors
  }
}

export function formatShortRecordRef(link?: { type: string; id?: string | null } | null): string | null {
  if (!link?.id) return null;
  const clean = String(link.id).trim();
  if (!clean) return null;
  if (clean.length <= 12) return `#${clean.toUpperCase()}`;
  return `#${clean.slice(-6).toUpperCase()}`;
}

export function getNotificationVisualMeta(
  type?: string,
  linkType?: string | null,
  title?: string
): NotificationVisualMeta {
  const event = `${type || ''} ${title || ''}`.toLowerCase();
  const target = (linkType || '').toLowerCase();

  // KYC & Identity
  if (event.includes('kyc.approved') || event.includes('kyc.verified') || event.includes('verified')) {
    return {
      icon: 'shield-checkmark',
      iconColor: '#1E7E34',
      bgColor: '#E8F5E9',
      badge: 'Verified',
      category: 'compliance',
      actionLabel: 'View KYC',
    };
  }
  if (event.includes('kyc') || target === 'kyc') {
    return {
      icon: 'shield-half-outline',
      iconColor: '#B45309',
      bgColor: '#FEF3C7',
      badge: 'Compliance',
      category: 'compliance',
      actionLabel: 'Complete KYC',
    };
  }

  // Signed Agreements / E-Sign
  if (
    event.includes('agreement') ||
    event.includes('signed') ||
    event.includes('esign') ||
    event.includes('envelope')
  ) {
    return {
      icon: 'ribbon-outline',
      iconColor: colors.primary,
      bgColor: '#FAF5EE',
      badge: 'Agreement',
      category: 'investments',
      actionLabel: 'Next: Fund wire',
    };
  }

  // Payouts & Yield Distributions
  if (event.includes('payout') || event.includes('distribution') || event.includes('yield') || event.includes('profit')) {
    return {
      icon: 'wallet-outline',
      iconColor: '#1E7E34',
      bgColor: '#E8F5E9',
      badge: 'Payout',
      category: 'investments',
      actionLabel: 'View payout',
    };
  }

  // Wire / Payment Received
  if (event.includes('payment') || event.includes('wire') || event.includes('funded') || event.includes('receipt')) {
    return {
      icon: 'checkmark-circle-outline',
      iconColor: '#1E7E34',
      bgColor: '#E8F5E9',
      badge: 'Funding',
      category: 'investments',
      actionLabel: 'View receipt',
    };
  }

  // General Investment Events
  if (
    event.includes('investment') ||
    target === 'investment' ||
    target === 'investment_pool'
  ) {
    return {
      icon: 'trending-up',
      iconColor: colors.primary,
      bgColor: '#FAF5EE',
      badge: 'Investment',
      category: 'investments',
      actionLabel: 'Open contract',
    };
  }

  // Packages & Opportunities
  if (target === 'package' || target === 'project') {
    return {
      icon: 'business-outline',
      iconColor: colors.primary,
      bgColor: '#FAF5EE',
      badge: 'Offering',
      category: 'investments',
      actionLabel: 'View offering',
    };
  }

  // Statements & Tax/Financial Reports
  if (
    target === 'statement' ||
    target === 'statement_batch' ||
    target === 'report' ||
    event.includes('statement')
  ) {
    return {
      icon: 'document-text-outline',
      iconColor: '#1D4ED8',
      bgColor: '#EFF6FF',
      badge: 'Statement',
      category: 'statements',
      actionLabel: 'Open statement',
    };
  }

  // Support Tickets
  if (target === 'ticket' || event.includes('ticket') || event.includes('support') || event.includes('reply')) {
    return {
      icon: 'chatbubble-ellipses-outline',
      iconColor: colors.text,
      bgColor: '#F3F1EC',
      badge: 'Support',
      category: 'compliance',
      actionLabel: 'Open ticket',
    };
  }

  // Account Closure
  if (target === 'account_closure' || event.includes('closure')) {
    return {
      icon: 'lock-closed-outline',
      iconColor: colors.error,
      bgColor: '#FFEBEE',
      badge: 'Account',
      category: 'compliance',
      actionLabel: 'Review',
    };
  }

  return {
    icon: 'notifications-outline',
    iconColor: colors.primary,
    bgColor: '#FAF5EE',
    badge: 'Update',
    category: 'compliance',
    actionLabel: null,
  };
}

export function navigateFromNotificationLink(
  navigation: any,
  link: { type: string; id?: string | null } | null | undefined
): void {
  if (!link) return;
  const id = link.id ?? undefined;

  switch (link.type) {
    case 'kyc':
      navigation.navigate('KycModal');
      break;
    case 'investment':
    case 'investment_pool':
      if (id) navigation.navigate('InvestmentDetail', { id });
      else navigation.navigate('MainRoot', { screen: 'Investments' });
      break;
    case 'package':
      if (id) navigation.navigate('PackageDetail', { id });
      else navigation.navigate('MainRoot', { screen: 'Packages' });
      break;
    case 'statement':
    case 'statement_batch':
      navigation.navigate('Statements', id ? { highlightStatementId: id } : undefined);
      break;
    case 'report':
      navigation.navigate('Documents');
      break;
    case 'ticket':
      if (id) navigation.navigate('TicketDetail', { id });
      else navigation.navigate('Support');
      break;
    case 'account_closure':
      navigation.navigate('AccountClosure');
      break;
    default:
      break;
  }
}

export function formatNotificationTime(isoString?: string): string {
  if (!isoString) return 'Recent';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return 'Recent';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24 && date.getDate() === now.getDate()) {
    return `${diffHours}h ago`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  ) {
    return 'Yesterday';
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(date.getFullYear() !== now.getFullYear() ? { year: 'numeric' } : {}),
  });
}

export interface NotificationSection {
  title: string;
  data: NotificationItemData[];
}

export function groupNotificationsChronologically(
  items: NotificationItemData[]
): NotificationSection[] {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const sevenDaysAgo = startOfToday - 6 * 24 * 60 * 60 * 1000;

  const today: NotificationItemData[] = [];
  const thisWeek: NotificationItemData[] = [];
  const previously: NotificationItemData[] = [];

  for (const item of items) {
    const ts = item.createdAt ? new Date(item.createdAt).getTime() : 0;
    if (ts >= startOfToday) {
      today.push(item);
    } else if (ts >= sevenDaysAgo) {
      thisWeek.push(item);
    } else {
      previously.push(item);
    }
  }

  const sections: NotificationSection[] = [];
  if (today.length > 0) sections.push({ title: 'Today', data: today });
  if (thisWeek.length > 0) sections.push({ title: 'This Week', data: thisWeek });
  if (previously.length > 0) sections.push({ title: 'Previously', data: previously });
  return sections;
}

