import type {
  CompanyDirector,
  GetKycMeApiResponse,
  KycDocumentInvestor,
  SourceOfFunds,
  UboRecord,
} from '../../api/generated/investorApi';
import type { KycStackParamList } from '../../navigation/types';

// ---------------------------------------------------------------------------
// 1. Latin Name Validation (mirrors backend NAME_NOT_LATIN check)
// ---------------------------------------------------------------------------
export const NAME_NOT_LATIN = 'NAME_NOT_LATIN';
export const LATIN_NAME_MESSAGE =
  'Please enter the name in Latin letters exactly as on passport/ID (accents are fine).';

export function hasNonLatinLetters(value: string | null | undefined): boolean {
  if (!value) return false;
  try {
    return Array.from(value).some(
      (ch) => /\p{L}/u.test(ch) && !/[\p{Script=Latin}\p{Script=Common}]/u.test(ch)
    );
  } catch {
    // Fallback if Unicode property escapes behave differently on older JS runtimes
    return /[^\u0000-\u024F\u1E00-\u1EFF\s.,'"()\-/0-9]/.test(value);
  }
}

export function latinNameError(value: string | null | undefined): string | undefined {
  return hasNonLatinLetters(value) ? LATIN_NAME_MESSAGE : undefined;
}

// ---------------------------------------------------------------------------
// 2. Countries (ISO 3166-1 alpha-2 with Hermes-safe fallback)
// ---------------------------------------------------------------------------
export interface CountryOption {
  code: string;
  name: string;
}

const FALLBACK_COUNTRIES: CountryOption[] = [
  { code: 'AF', name: 'Afghanistan' },
  { code: 'AL', name: 'Albania' },
  { code: 'DZ', name: 'Algeria' },
  { code: 'AR', name: 'Argentina' },
  { code: 'AM', name: 'Armenia' },
  { code: 'AU', name: 'Australia' },
  { code: 'AT', name: 'Austria' },
  { code: 'AZ', name: 'Azerbaijan' },
  { code: 'BH', name: 'Bahrain' },
  { code: 'BD', name: 'Bangladesh' },
  { code: 'BE', name: 'Belgium' },
  { code: 'BR', name: 'Brazil' },
  { code: 'BN', name: 'Brunei' },
  { code: 'BG', name: 'Bulgaria' },
  { code: 'CA', name: 'Canada' },
  { code: 'CL', name: 'Chile' },
  { code: 'CN', name: 'China' },
  { code: 'CO', name: 'Colombia' },
  { code: 'HR', name: 'Croatia' },
  { code: 'CY', name: 'Cyprus' },
  { code: 'CZ', name: 'Czechia' },
  { code: 'DK', name: 'Denmark' },
  { code: 'EG', name: 'Egypt' },
  { code: 'EE', name: 'Estonia' },
  { code: 'FI', name: 'Finland' },
  { code: 'FR', name: 'France' },
  { code: 'GE', name: 'Georgia' },
  { code: 'DE', name: 'Germany' },
  { code: 'GH', name: 'Ghana' },
  { code: 'GR', name: 'Greece' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'HU', name: 'Hungary' },
  { code: 'IS', name: 'Iceland' },
  { code: 'IN', name: 'India' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'IQ', name: 'Iraq' },
  { code: 'IE', name: 'Ireland' },
  { code: 'IT', name: 'Italy' },
  { code: 'JP', name: 'Japan' },
  { code: 'JO', name: 'Jordan' },
  { code: 'KZ', name: 'Kazakhstan' },
  { code: 'KE', name: 'Kenya' },
  { code: 'KW', name: 'Kuwait' },
  { code: 'KG', name: 'Kyrgyzstan' },
  { code: 'LV', name: 'Latvia' },
  { code: 'LB', name: 'Lebanon' },
  { code: 'LY', name: 'Libya' },
  { code: 'LI', name: 'Liechtenstein' },
  { code: 'LT', name: 'Lithuania' },
  { code: 'LU', name: 'Luxembourg' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'MV', name: 'Maldives' },
  { code: 'MT', name: 'Malta' },
  { code: 'MU', name: 'Mauritius' },
  { code: 'MX', name: 'Mexico' },
  { code: 'MC', name: 'Monaco' },
  { code: 'MA', name: 'Morocco' },
  { code: 'NP', name: 'Nepal' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'NO', name: 'Norway' },
  { code: 'OM', name: 'Oman' },
  { code: 'PK', name: 'Pakistan' },
  { code: 'PS', name: 'Palestine' },
  { code: 'PH', name: 'Philippines' },
  { code: 'PL', name: 'Poland' },
  { code: 'PT', name: 'Portugal' },
  { code: 'QA', name: 'Qatar' },
  { code: 'RO', name: 'Romania' },
  { code: 'RU', name: 'Russia' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'SG', name: 'Singapore' },
  { code: 'SK', name: 'Slovakia' },
  { code: 'SI', name: 'Slovenia' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'KR', name: 'South Korea' },
  { code: 'ES', name: 'Spain' },
  { code: 'LK', name: 'Sri Lanka' },
  { code: 'SE', name: 'Sweden' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'TW', name: 'Taiwan' },
  { code: 'TJ', name: 'Tajikistan' },
  { code: 'TZ', name: 'Tanzania' },
  { code: 'TH', name: 'Thailand' },
  { code: 'TN', name: 'Tunisia' },
  { code: 'TR', name: 'Turkey' },
  { code: 'TM', name: 'Turkmenistan' },
  { code: 'UG', name: 'Uganda' },
  { code: 'UA', name: 'Ukraine' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
  { code: 'UZ', name: 'Uzbekistan' },
  { code: 'VN', name: 'Vietnam' },
  { code: 'YE', name: 'Yemen' },
  { code: 'ZM', name: 'Zambia' },
  { code: 'ZW', name: 'Zimbabwe' },
];

const NOT_A_COUNTRY = new Set([
  'EU',
  'UN',
  'ZZ',
  'QO',
  'XA',
  'XB',
  'EZ',
  'AC',
  'CP',
  'DG',
  'EA',
  'IC',
  'TA',
]);

let cachedCountries: CountryOption[] | null = null;
let namesByCode: Map<string, string> | null = null;

function buildCountries(): CountryOption[] {
  try {
    if (typeof Intl !== 'undefined' && typeof (Intl as any).DisplayNames === 'function') {
      const display = new (Intl as any).DisplayNames(['en'], {
        type: 'region',
        fallback: 'none',
      });
      const out: CountryOption[] = [];
      for (let a = 65; a <= 90; a++) {
        for (let b = 65; b <= 90; b++) {
          const code = String.fromCharCode(a, b);
          if (NOT_A_COUNTRY.has(code)) continue;
          try {
            if (Intl.getCanonicalLocales(`und-${code}`)[0] !== `und-${code}`) continue;
            const name = display.of(code);
            if (name && name !== code) out.push({ code, name });
          } catch {
            // Skip invalid subtags
          }
        }
      }
      if (out.length > 50) {
        return out.sort((x, y) => x.name.localeCompare(y.name, 'en'));
      }
    }
  } catch {
    // Fallback below
  }
  return FALLBACK_COUNTRIES;
}

export function allCountries(): CountryOption[] {
  if (!cachedCountries) {
    cachedCountries = buildCountries();
    namesByCode = new Map(cachedCountries.map((c) => [c.code, c.name]));
  }
  return cachedCountries;
}

export function countryName(code: string | null | undefined): string {
  if (!code) return '';
  allCountries();
  return namesByCode?.get(code.trim().toUpperCase()) ?? code.toUpperCase();
}

export function isCountryCode(value: string | null | undefined): boolean {
  if (!value) return false;
  allCountries();
  return namesByCode?.has(value.trim().toUpperCase()) ?? false;
}

export function toCountryCode(value: string | null | undefined): string {
  return isCountryCode(value) ? (value as string).trim().toUpperCase() : '';
}

// ---------------------------------------------------------------------------
// 3. Amounts, Dates & Formatting
// ---------------------------------------------------------------------------
export const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/;

export function cleanAmount(raw: string): string {
  return raw.replace(/[,\s]/g, '');
}

export function isValidAmount(raw: string): boolean {
  return AMOUNT_PATTERN.test(cleanAmount(raw));
}

export function cleanPercentage(raw: string): string {
  return raw.replace(/[\s%]/g, '');
}

export function toDateInputValue(raw: string | null | undefined): string {
  if (!raw) return '';
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(raw.trim());
  return match ? match[1] : raw.trim();
}

export const PRIMARY_SOURCE_OPTIONS: {
  value: SourceOfFunds['primarySource'];
  label: string;
}[] = [
  { value: 'salary', label: 'Employment Salary' },
  { value: 'business_income', label: 'Business / Corporate Income' },
  { value: 'investment_returns', label: 'Investment Returns' },
  { value: 'property_sale', label: 'Real Estate / Property Sale' },
  { value: 'inheritance_gift', label: 'Inheritance / Gift' },
  { value: 'other', label: 'Other' },
];

export function formatPrimarySource(value: string | null | undefined): string {
  if (!value) return '-';
  return (
    PRIMARY_SOURCE_OPTIONS.find((o) => o.value === value)?.label ??
    value.replace(/_/g, ' ')
  );
}

export function formatMoney(value: string | null | undefined, currency?: string | null): string {
  if (!value?.trim()) return '-';
  const num = Number(value);
  if (Number.isNaN(num)) return value;
  const code = currency?.trim().toUpperCase() || 'USD';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
      maximumFractionDigits: 0,
    }).format(num);
  } catch {
    return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(num)} ${code}`;
  }
}

// ---------------------------------------------------------------------------
// 4. Document Requirements & Slots (mirrors web documentRequirements.ts)
// ---------------------------------------------------------------------------
export type DocumentType = KycDocumentInvestor['documentType'];
export type DocumentCategory = KycDocumentInvestor['category'];
export type DocumentOwnerType = KycDocumentInvestor['ownerType'];

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  passport: 'Passport',
  national_id: 'National ID (CNIC / Emirates ID)',
  driving_license: 'Driving License',
  proof_of_address: 'Proof of Address (Utility Bill / Bank Statement)',
  company_reg_cert: 'Company Registration Certificate',
  trade_license: 'Trade License',
  moa_aoa: 'MOA / AOA',
  bank_statement: 'Bank Statement',
  tax_certificate: 'Tax Certificate',
  financial_statements: 'Financial Statements',
  board_resolution: 'Board Resolution',
  power_of_attorney: 'Power of Attorney',
  cap_table: 'Cap Table',
  ubo_declaration: 'UBO Declaration Form',
  salary_slip: 'Salary Slip',
  property_deed: 'Property Deed',
  inheritance_doc: 'Inheritance Document',
  fatca_crs: 'FATCA/CRS Form',
};

export interface DocumentSlot {
  key: string;
  label: string;
  anyOf: DocumentType[];
  category: DocumentCategory;
  ownerType: DocumentOwnerType;
  ownerId?: string;
}

export interface DocumentSlotGroup {
  title: string;
  slots: DocumentSlot[];
}

export function individualDocumentSlots(): DocumentSlot[] {
  return [
    {
      key: 'applicant-identity',
      label: 'Identity Document',
      anyOf: ['passport', 'national_id', 'driving_license'],
      category: 'identity',
      ownerType: 'applicant',
    },
    {
      key: 'applicant-address',
      label: 'Proof of Address',
      anyOf: ['proof_of_address'],
      category: 'address',
      ownerType: 'applicant',
    },
    {
      key: 'applicant-source-of-funds',
      label: 'Source of Funds Proof',
      anyOf: [
        'bank_statement',
        'salary_slip',
        'financial_statements',
        'property_deed',
        'inheritance_doc',
      ],
      category: 'source_of_funds',
      ownerType: 'applicant',
    },
  ];
}

export function businessDocumentGroups(
  companyKycId: string | undefined,
  directors: CompanyDirector[],
  uboRecords: UboRecord[]
): DocumentSlotGroup[] {
  const companySlots: DocumentSlot[] = [
    {
      key: 'company-registration',
      label: 'Company Registration / Trade License',
      anyOf: ['company_reg_cert', 'trade_license', 'moa_aoa'],
      category: 'company',
      ownerType: 'company',
      ownerId: companyKycId,
    },
    {
      key: 'company-ubo-declaration',
      label: 'UBO Declaration Form',
      anyOf: ['ubo_declaration'],
      category: 'company',
      ownerType: 'company',
      ownerId: companyKycId,
    },
    {
      key: 'company-authorization',
      label: 'Authorization Document',
      anyOf: ['board_resolution', 'power_of_attorney'],
      category: 'authorization',
      ownerType: 'company',
      ownerId: companyKycId,
    },
    {
      key: 'company-source-of-funds',
      label: 'Company Source of Funds',
      anyOf: ['bank_statement', 'financial_statements'],
      category: 'source_of_funds',
      ownerType: 'company',
      ownerId: companyKycId,
    },
  ];

  const directorGroups: DocumentSlotGroup[] = directors.map((director) => ({
    title: `Director: ${director.fullName || 'Director'}`,
    slots: [
      {
        key: `director-identity-${director.id}`,
        label: `Identity — ${director.fullName}`,
        anyOf: ['passport', 'national_id', 'driving_license'],
        category: 'identity',
        ownerType: 'director',
        ownerId: director.id,
      },
      {
        key: `director-address-${director.id}`,
        label: `Proof of Address — ${director.fullName}`,
        anyOf: ['proof_of_address'],
        category: 'address',
        ownerType: 'director',
        ownerId: director.id,
      },
    ],
  }));

  const uboGroups: DocumentSlotGroup[] = uboRecords.map((ubo) => ({
    title: `UBO: ${ubo.fullName || 'UBO'}`,
    slots: [
      {
        key: `ubo-identity-${ubo.id}`,
        label: `Identity — ${ubo.fullName}`,
        anyOf: ['passport', 'national_id', 'driving_license'],
        category: 'identity',
        ownerType: 'ubo',
        ownerId: ubo.id,
      },
    ],
  }));

  return [
    { title: 'Company Documents', slots: companySlots },
    ...directorGroups,
    ...uboGroups,
  ];
}

export function businessDocumentSlots(
  companyKycId: string | undefined,
  directors: CompanyDirector[],
  uboRecords: UboRecord[]
): DocumentSlot[] {
  return businessDocumentGroups(companyKycId, directors, uboRecords).flatMap(
    (g) => g.slots
  );
}

export function findSlotDocument(
  slot: DocumentSlot,
  documents: KycDocumentInvestor[]
): KycDocumentInvestor | undefined {
  return documents.find(
    (doc) =>
      slot.anyOf.includes(doc.documentType) &&
      doc.ownerType === slot.ownerType &&
      (slot.ownerId ? doc.ownerId === slot.ownerId : true)
  );
}

export function slotToMissingKey(slot: DocumentSlot): string {
  switch (slot.key) {
    case 'applicant-identity':
      return 'identity_document';
    case 'applicant-address':
      return 'address_document';
    case 'applicant-source-of-funds':
      return 'source_of_funds_document';
    case 'company-registration':
      return 'company_identity_document';
    case 'company-ubo-declaration':
      return 'ubo_declaration_document';
    case 'company-authorization':
      return 'authorization_document';
    case 'company-source-of-funds':
      return 'company_source_of_funds_document';
    default:
      if (slot.key.startsWith('director-identity-')) {
        return `director_identity_document:${slot.ownerId}`;
      }
      if (slot.key.startsWith('director-address-')) {
        return `director_address_document:${slot.ownerId}`;
      }
      if (slot.key.startsWith('ubo-identity-')) {
        return `ubo_identity_document:${slot.ownerId}`;
      }
      return slot.key;
  }
}

// ---------------------------------------------------------------------------
// 5. Readiness Check & Missing Items Resolution (mirrors backend B9 check)
// ---------------------------------------------------------------------------
export interface MissingItem {
  raw: string;
  label: string;
  targetRoute: keyof KycStackParamList;
}

const OWNER_SPECIFIC_KEY = /^(director|ubo)_(identity|address)_document:(.+)$/;

export function humanizeMissingKey(raw: string): string {
  const withoutId = raw.split(':')[0];
  const words = withoutId.replace(/_document$/, '').split('_');
  return words
    .map((w, i) => (i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ');
}

export function toMissingItem(
  raw: string,
  slots: DocumentSlot[],
  kycType?: 'individual' | 'business' | null
): MissingItem {
  const ownerMatch = OWNER_SPECIFIC_KEY.exec(raw);
  if (ownerMatch) {
    const [, ownerType, purpose, id] = ownerMatch;
    const slotKey = `${ownerType}-${purpose}-${id}`;
    const matched = slots.find((s) => s.key === slotKey);
    return {
      raw,
      label: matched?.label ?? humanizeMissingKey(raw),
      targetRoute: 'IdentityDocs',
    };
  }

  switch (raw) {
    case 'basic_info':
      return { raw, label: 'Personal / Basic Information', targetRoute: 'BasicInfo' };
    case 'investor_type':
      return { raw, label: 'Investor Classification', targetRoute: 'InvestorType' };
    case 'individual_details':
      return { raw, label: 'Residential & Employment Details', targetRoute: 'IndividualDetails' };
    case 'company_details':
    case 'company_directors':
    case 'beneficial_owners':
      return {
        raw,
        label:
          raw === 'company_directors'
            ? 'At least one Company Director'
            : raw === 'beneficial_owners'
              ? 'Beneficial Owners (Acting on Behalf)'
              : 'Company Details',
        targetRoute: 'CompanyKyb',
      };
    case 'source_of_funds':
      return { raw, label: 'Source of Funds Declaration', targetRoute: 'SourceOfFunds' };
    case 'identity_document':
    case 'address_document':
    case 'source_of_funds_document':
    case 'company_identity_document':
    case 'ubo_declaration_document':
    case 'authorization_document':
    case 'company_source_of_funds_document': {
      const matched = slots.find((s) => slotToMissingKey(s) === raw);
      return {
        raw,
        label: matched?.label ?? humanizeMissingKey(raw),
        targetRoute: 'IdentityDocs',
      };
    }
    default:
      return {
        raw,
        label: humanizeMissingKey(raw),
        targetRoute:
          kycType === 'business' ? 'CompanyKyb' : 'BasicInfo',
      };
  }
}

export function computeMissingItems(data: GetKycMeApiResponse): MissingItem[] {
  const { kycProfile, individualDetails, companyKyc, documents, sourceOfFunds } = data;
  const missing: string[] = [];

  const slots =
    kycProfile.kycType === 'business'
      ? businessDocumentSlots(
          companyKyc?.id,
          companyKyc?.directors ?? [],
          companyKyc?.uboRecords ?? []
        )
      : individualDocumentSlots();

  if (
    !kycProfile.fullLegalName ||
    !kycProfile.dateOfBirth ||
    !kycProfile.nationality ||
    !kycProfile.countryOfResidence ||
    !kycProfile.countryOfCitizenship ||
    !kycProfile.expectedInvestmentAmount
  ) {
    missing.push('basic_info');
  }

  if (kycProfile.kycType === 'individual') {
    if (!individualDetails) missing.push('individual_details');
    for (const slot of slots) {
      const doc = findSlotDocument(slot, documents);
      if (!doc || doc.status === 'rejected') missing.push(slotToMissingKey(slot));
    }
  } else if (kycProfile.kycType === 'business') {
    if (!companyKyc) {
      missing.push('company_details');
    } else {
      if (!companyKyc.directors.length) missing.push('company_directors');
      for (const slot of slots) {
        const doc = findSlotDocument(slot, documents);
        if (!doc || doc.status === 'rejected') missing.push(slotToMissingKey(slot));
      }
      if (kycProfile.actingOnBehalf && !companyKyc.beneficialOwners.length) {
        missing.push('beneficial_owners');
      }
    }
  } else {
    missing.push('investor_type');
  }

  if (!sourceOfFunds) missing.push('source_of_funds');

  return missing.map((raw) => toMissingItem(raw, slots, kycProfile.kycType));
}

export function getMissingItemsFromError(
  err: unknown,
  data?: GetKycMeApiResponse
): MissingItem[] {
  const payload =
    err &&
    typeof err === 'object' &&
    'data' in err &&
    err.data &&
    typeof err.data === 'object' &&
    'error' in err.data
      ? (err.data as any).error
      : null;
  const missingArr = payload?.details?.missing;
  if (!Array.isArray(missingArr)) return [];

  const slots =
    data?.kycProfile.kycType === 'business'
      ? businessDocumentSlots(
          data.companyKyc?.id,
          data.companyKyc?.directors ?? [],
          data.companyKyc?.uboRecords ?? []
        )
      : individualDocumentSlots();

  return missingArr.map((item: unknown) =>
    toMissingItem(
      typeof item === 'string' ? item : JSON.stringify(item),
      slots,
      data?.kycProfile.kycType
    )
  );
}

export function getKycErrorMessage(
  err: unknown,
  fallback = 'Something went wrong. Please try again.'
): string {
  const payload =
    err &&
    typeof err === 'object' &&
    'data' in err &&
    err.data &&
    typeof err.data === 'object' &&
    'error' in err.data
      ? (err.data as any).error
      : null;

  const fieldErrors = payload?.details?.fieldErrors;
  if (fieldErrors && typeof fieldErrors === 'object') {
    const firstKey = Object.keys(fieldErrors)[0];
    if (firstKey && Array.isArray(fieldErrors[firstKey]) && fieldErrors[firstKey][0]) {
      return `${firstKey}: ${fieldErrors[firstKey][0]}`;
    }
  }

  if (typeof payload?.message === 'string' && payload.message.trim()) {
    return payload.message;
  }
  return fallback;
}

// ---------------------------------------------------------------------------
// 6. Step Resume Resolution (mirrors web resolveStepFromServer)
// ---------------------------------------------------------------------------
export function resolveMobileStepFromServer(
  data: GetKycMeApiResponse
): keyof KycStackParamList {
  const { kycProfile, individualDetails, companyKyc, currentStep } = data;

  if (!currentStep || currentStep === 'basic_info') return 'BasicInfo';
  if (currentStep === 'investor_type') return 'InvestorType';

  if (currentStep === 'identity' || currentStep === 'face') {
    if (!kycProfile.kycType) return 'InvestorType';
    if (kycProfile.kycType === 'individual') {
      return individualDetails?.residentialAddress ? 'IdentityDocs' : 'IndividualDetails';
    }
    return companyKyc?.companyName ? 'IdentityDocs' : 'CompanyKyb';
  }

  if (currentStep === 'address') return 'IdentityDocs';
  if (currentStep === 'source_of_funds') return 'SourceOfFunds';
  if (currentStep === 'review') return 'ReviewSubmit';

  return 'BasicInfo';
}
