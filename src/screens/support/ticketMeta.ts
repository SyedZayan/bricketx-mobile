import { OwnTicket } from '../../api/generated/investorApi';

export type Ticket = OwnTicket;
export type IssueType = Ticket['issueType'];
export type TicketStatus = Ticket['status'];

export const ISSUE_TYPE_LABELS: Record<IssueType, string> = {
  kyc: 'Identity verification (KYC)',
  payment: 'Payment or funding',
  documents: 'Documents',
  payout: 'Payouts and returns',
  withdrawal: 'Withdrawal',
  package_query: 'A question about a package',
  technical: 'A technical problem',
  general: 'Something else',
};

export const ISSUE_TYPES = Object.keys(ISSUE_TYPE_LABELS) as IssueType[];

export function issueTypeLabel(type: string): string {
  return (ISSUE_TYPE_LABELS as Record<string, string | undefined>)[type] ?? 'Other';
}

export type StatusTone = 'warning' | 'danger' | 'success' | 'neutral';

const STATUS_META: Record<TicketStatus, { label: string; tone: StatusTone }> = {
  open: { label: 'Received', tone: 'warning' },
  awaiting_admin: { label: 'With our team', tone: 'warning' },
  awaiting_investor: { label: 'Waiting for you', tone: 'danger' },
  resolved: { label: 'Answered', tone: 'success' },
  closed: { label: 'Closed', tone: 'neutral' },
};

const STATUS_NOTE: Record<TicketStatus, string> = {
  open: "We've received your ticket. Our team will reply here.",
  awaiting_admin: "Our team is looking at it. We'll let you know when they reply.",
  awaiting_investor: 'Our team has replied and is waiting for you.',
  resolved: 'We consider this answered. Replying brings it back to our team.',
  closed: "This ticket is closed, so it can't be replied to.",
};

export function ticketStatusNote(status: string): string | null {
  return (STATUS_NOTE as Record<string, string | undefined>)[status] ?? null;
}

export function ticketStatusMeta(status: string): { label: string; tone: StatusTone } {
  return (
    (STATUS_META as Record<string, { label: string; tone: StatusTone } | undefined>)[status] ?? {
      label: 'Unknown',
      tone: 'neutral',
    }
  );
}

export function formatRelativeTime(iso?: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (isNaN(date.getTime())) return '';
  const diffSec = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDateTime(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const SUBJECT_MAX = 200;
export const MESSAGE_MAX = 5000;
export const MAX_ATTACHMENTS = 5;
export const MAX_FILE_BYTES = 10 * 1024 * 1024;

export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'application/pdf'] as const;
export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];
