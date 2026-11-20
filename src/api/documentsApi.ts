import { baseApi } from './baseApi';

export type InvestorDocumentKind =
  | 'agreement'
  | 'countersigned_agreement'
  | 'payout_advice'
  | 'statement'
  | 'maturity_statement'
  | 'monthly_statement'
  | 'quarterly_statement'
  | 'annual_statement'
  | 'investment_certificate'
  | 'withdrawal_confirmation'
  | 'signing_certificate';

export interface InvestorDocumentItem {
  kind: InvestorDocumentKind;
  id: string;
  title: string;
  investmentId: string | null;
  internalRef: string | null;
  /** A calendar day, YYYY-MM-DD (UTC). */
  date: string;
  periodStart: string | null;
  periodEnd: string | null;
  corrected: boolean;
  replacesIssuedOn: string | null;
  signingCertificateId: string | null;
  periodNumber?: number | null;
  yearNumber?: number | null;
}

export interface GetDocumentsResponse {
  documents: InvestorDocumentItem[];
}

export interface DocumentDownloadLinkResponse {
  url: string;
  filename: string;
  expiresInSeconds: number;
}

export interface GeneratedStatementItem {
  id: string;
  kind: 'statement';
  title: string;
  periodStart: string;
  periodEnd: string;
  investmentId: string | null;
  internalRef: string | null;
  generatedAt: string;
}

export interface GetStatementsResponse {
  statements: GeneratedStatementItem[];
}

export interface PostStatementsRequest {
  from: string;
  to: string;
  investmentId?: string;
}

export interface PostStatementsResponse {
  statement: GeneratedStatementItem;
  totals: {
    deposits: string;
    depositsReversed: string;
    chargesCovered: string;
    deployed: string;
    refunds: string;
    refundsReturned: string;
    payouts: string;
    [key: string]: string;
  };
}

export const documentsApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (build) => ({
    getDocuments: build.query<GetDocumentsResponse, void>({
      query: () => ({ url: '/documents' }),
      providesTags: ['Investor Documents'],
    }),
    getDocumentsByKindAndIdDownload: build.query<
      DocumentDownloadLinkResponse,
      { kind: InvestorDocumentKind; id: string }
    >({
      query: ({ kind, id }) => ({
        url: `/documents/${kind}/${id}/download`,
      }),
      keepUnusedDataFor: 0,
    }),
    getStatements: build.query<GetStatementsResponse, void>({
      query: () => ({ url: '/statements' }),
      providesTags: ['Investor Documents'],
    }),
    postStatements: build.mutation<PostStatementsResponse, { body: PostStatementsRequest }>({
      query: ({ body }) => ({
        url: '/statements',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Investor Documents'],
    }),
    getStatementsByIdDownload: build.query<DocumentDownloadLinkResponse, { id: string }>({
      query: ({ id }) => ({
        url: `/statements/${id}/download`,
      }),
      keepUnusedDataFor: 0,
    }),
  }),
});

export const {
  useGetDocumentsQuery,
  useLazyGetDocumentsByKindAndIdDownloadQuery,
  useGetStatementsQuery,
  usePostStatementsMutation,
  useLazyGetStatementsByIdDownloadQuery,
} = documentsApi;
