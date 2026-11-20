export const DYNAMIC_TENURE_LABEL = "1-5 years (investor's choice)";

export const stripHtml = (html: string | null | undefined): string => {
  if (!html) return '';
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
};

export const formatRoi = (min: string | null, max: string | null): string => {
  const minNum = min ? Number(min) : null;
  const maxNum = max ? Number(max) : null;
  if (minNum !== null && maxNum !== null) {
    return minNum === maxNum ? `${minNum}%` : `${minNum}-${maxNum}%`;
  }
  if (minNum !== null) return `${minNum}%+`;
  if (maxNum !== null) return `Up to ${maxNum}%`;
  return '-';
};

export const formatCurrency = (amount: string | number | null | undefined): string => {
  if (amount === null || amount === undefined) return '$0';
  const num = typeof amount === 'string' ? Number(amount) : amount;
  return !isNaN(num) && num >= 0 ? `$${num.toLocaleString()}` : String(amount);
};

export const formatTenure = (
  years: number | null | undefined,
  isDynamic?: boolean
): string => {
  if (isDynamic) return DYNAMIC_TENURE_LABEL;
  if (!years) return '-';
  return years === 1 ? '1 year' : `${years} years`;
};

export const formatCadence = (cadence: string): string => {
  switch (cadence) {
    case 'quarterly':
      return 'Quarterly';
    case 'half_yearly':
      return 'Half-yearly';
    case 'yearly':
      return 'Yearly';
    default:
      return cadence.charAt(0).toUpperCase() + cadence.slice(1);
  }
};

export const formatPayoutOptions = (
  options: ('quarterly' | 'half_yearly' | 'yearly')[] | undefined
): string => {
  if (!options || options.length === 0) return '-';
  return options.map(formatCadence).join(', ');
};

export const getUrlDomain = (url: string): string => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

export const documentMeta = (title: string, fileName: string | null): string | undefined => {
  if (!fileName) return undefined;
  const match = /\.([a-zA-Z0-9]+)$/.exec(fileName.trim());
  const extLabel = match ? match[1].toUpperCase() : undefined;

  const normalize = (s: string) => s.trim().toLowerCase();
  const withoutExtension = fileName.replace(/\.[^./\\]+$/, '');
  const showName =
    normalize(fileName) !== normalize(title) &&
    normalize(withoutExtension) !== normalize(title);

  if (extLabel && showName) return `${extLabel} · ${fileName}`;
  return extLabel ?? (showName ? fileName : undefined);
};