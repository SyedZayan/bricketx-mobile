import { Ionicons } from '@expo/vector-icons';
import { InvestorDocumentItem, InvestorDocumentKind } from '../../api/documentsApi';

export interface KindMeta {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const KIND_META: Record<InvestorDocumentKind, KindMeta> = {
  agreement: { label: 'Signed agreement', icon: 'create-outline' },
  countersigned_agreement: { label: 'Countersigned copy', icon: 'document-attach-outline' },
  payout_advice: { label: 'Payout advice', icon: 'receipt-outline' },
  statement: { label: 'Statement', icon: 'document-text-outline' },
  maturity_statement: { label: 'Maturity statement', icon: 'ribbon-outline' },
  monthly_statement: { label: 'Monthly statement', icon: 'calendar-outline' },
  quarterly_statement: { label: 'Quarterly statement', icon: 'calendar-number-outline' },
  annual_statement: { label: 'Annual statement', icon: 'checkmark-done-circle-outline' },
  investment_certificate: { label: 'Investment confirmation', icon: 'shield-checkmark-outline' },
  withdrawal_confirmation: { label: 'Withdrawal confirmation', icon: 'cash-outline' },
  signing_certificate: { label: 'Signing certificate', icon: 'finger-print-outline' },
};

export function getKindMeta(kind: string): KindMeta {
  return (
    (KIND_META as Record<string, KindMeta>)[kind] ?? {
      label: 'Document',
      icon: 'document-text-outline',
    }
  );
}

export const PERIODIC_STATEMENT_KINDS: readonly InvestorDocumentKind[] = [
  'quarterly_statement',
  'annual_statement',
] as const;

export function isPeriodicStatement(kind: string): boolean {
  return (PERIODIC_STATEMENT_KINDS as readonly string[]).includes(kind);
}

export function sortPeriodicStatements<
  T extends Pick<InvestorDocumentItem, 'kind' | 'periodEnd' | 'internalRef'>
>(docs: T[]): T[] {
  return [...docs].sort(
    (a, b) =>
      (b.periodEnd ?? '').localeCompare(a.periodEnd ?? '') ||
      Number(b.kind === 'annual_statement') - Number(a.kind === 'annual_statement') ||
      (a.internalRef ?? '').localeCompare(b.internalRef ?? '')
  );
}

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function formatUtcDay(isoDay: string | null | undefined): string {
  if (!isoDay) return '';
  const clean = isoDay.slice(0, 10);
  const parts = clean.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return isoDay;
  const [year, month, day] = parts;
  const monthName = MONTHS_SHORT[month - 1] ?? '';
  return `${String(day).padStart(2, '0')} ${monthName} ${year}`;
}

export function formatUtcDateTime(isoTimestamp: string | null | undefined): string {
  if (!isoTimestamp) return '';
  const parsed = new Date(isoTimestamp);
  if (Number.isNaN(parsed.getTime())) return formatUtcDay(isoTimestamp);
  const day = String(parsed.getUTCDate()).padStart(2, '0');
  const month = MONTHS_SHORT[parsed.getUTCMonth()] ?? '';
  const year = parsed.getUTCFullYear();
  const hours = String(parsed.getUTCHours()).padStart(2, '0');
  const mins = String(parsed.getUTCMinutes()).padStart(2, '0');
  return `${day} ${month} ${year}, ${hours}:${mins}`;
}

export function statementMonthLabel(periodStart: string | null | undefined): string | null {
  if (!periodStart) return null;
  const clean = periodStart.slice(0, 7);
  const [yearStr, monthStr] = clean.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  if (!year || !month || month < 1 || month > 12) return null;
  return `${MONTHS_LONG[month - 1]} ${year}`;
}

function periodicWindowText(
  doc: Pick<InvestorDocumentItem, 'kind' | 'periodNumber' | 'yearNumber'>
): string | null {
  if (doc.periodNumber == null) return null;
  if (doc.kind === 'annual_statement') return `Investment year ${doc.periodNumber}`;
  return doc.yearNumber != null
    ? `Investment year ${doc.yearNumber}, quarter ${doc.periodNumber}`
    : `Investment quarter ${doc.periodNumber}`;
}

function formatPeriodRange(periodStart: string | null, periodEnd: string | null): string | null {
  if (!periodStart || !periodEnd) return null;
  const startParts = periodStart.slice(0, 10).split('-').map(Number);
  const endParts = periodEnd.slice(0, 10).split('-').map(Number);
  if (startParts.length !== 3 || endParts.length !== 3) return null;
  const [sy, sm, sd] = startParts;
  const [ey, em, ed] = endParts;
  const endFormatted = `${String(ed).padStart(2, '0')} ${MONTHS_SHORT[em - 1] ?? ''} ${ey}`;
  const startFormatted =
    sy === ey
      ? `${String(sd).padStart(2, '0')} ${MONTHS_SHORT[sm - 1] ?? ''}`
      : `${String(sd).padStart(2, '0')} ${MONTHS_SHORT[sm - 1] ?? ''} ${sy}`;
  return `${startFormatted} – ${endFormatted}`;
}

export function documentDateText(
  doc: Pick<InvestorDocumentItem, 'date' | 'periodStart' | 'periodEnd'>
): string {
  if (doc.periodStart && doc.periodEnd) {
    return `${formatUtcDay(doc.periodStart)} – ${formatUtcDay(doc.periodEnd)}`;
  }
  return formatUtcDay(doc.date);
}

function issuedText(doc: InvestorDocumentItem): string {
  if (doc.corrected) {
    return [
      `Corrected on ${formatUtcDay(doc.date)}`,
      doc.replacesIssuedOn ? `replaces the statement issued on ${formatUtcDay(doc.replacesIssuedOn)}` : null,
    ]
      .filter(Boolean)
      .join(' · ');
  }
  return `Issued ${formatUtcDay(doc.date)}`;
}

function rowDateText(doc: InvestorDocumentItem): string {
  switch (doc.kind) {
    case 'monthly_statement':
      return issuedText(doc);
    case 'quarterly_statement':
    case 'annual_statement':
      return [formatPeriodRange(doc.periodStart, doc.periodEnd), issuedText(doc)]
        .filter(Boolean)
        .join(' · ');
    case 'investment_certificate':
      return [
        `Issued ${formatUtcDay(doc.date)}`,
        doc.periodStart && doc.periodEnd ? `term ${documentDateText(doc)}` : null,
      ]
        .filter(Boolean)
        .join(' · ');
    case 'withdrawal_confirmation':
      return [
        doc.periodStart ? `Paid ${formatUtcDay(doc.periodStart)}` : null,
        `Issued ${formatUtcDay(doc.date)}`,
      ]
        .filter(Boolean)
        .join(' · ');
    default:
      return documentDateText(doc);
  }
}

export function buildDocumentRowPresentation(doc: InvestorDocumentItem) {
  const { label, icon } = getKindMeta(doc.kind);
  const periodic = isPeriodicStatement(doc.kind);
  const month = doc.kind === 'monthly_statement' ? statementMonthLabel(doc.periodStart) : null;
  const corrected = (doc.kind === 'monthly_statement' || periodic) && Boolean(doc.corrected);
  const lead = periodic ? periodicWindowText(doc) : label;
  const dateText = rowDateText(doc);
  const meta = [lead, dateText, doc.internalRef ? `Ref ${doc.internalRef}` : null]
    .filter(Boolean)
    .join(' · ');

  return {
    icon,
    title: month ?? (periodic ? label : doc.title),
    meta,
    corrected,
    certificateId: doc.kind === 'agreement' ? doc.signingCertificateId : null,
  };
}
