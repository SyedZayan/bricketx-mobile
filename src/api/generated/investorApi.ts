import { baseApi as api } from "../baseApi";
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    postAuthRegister: build.mutation<
      PostAuthRegisterApiResponse,
      PostAuthRegisterApiArg
    >({
      query: (queryArg) => ({
        url: `/auth/register`,
        method: "POST",
        body: queryArg.body,
      }),
    }),
    postAuthVerifyEmail: build.mutation<
      PostAuthVerifyEmailApiResponse,
      PostAuthVerifyEmailApiArg
    >({
      query: (queryArg) => ({
        url: `/auth/verify-email`,
        method: "POST",
        body: queryArg.body,
      }),
    }),
    postAuthResendOtp: build.mutation<
      PostAuthResendOtpApiResponse,
      PostAuthResendOtpApiArg
    >({
      query: (queryArg) => ({
        url: `/auth/resend-otp`,
        method: "POST",
        body: queryArg.body,
      }),
    }),
    postAuthMfaVerify: build.mutation<
      PostAuthMfaVerifyApiResponse,
      PostAuthMfaVerifyApiArg
    >({
      query: (queryArg) => ({
        url: `/auth/mfa/verify`,
        method: "POST",
        body: queryArg.body,
      }),
    }),
    postAuthForgotPassword: build.mutation<
      PostAuthForgotPasswordApiResponse,
      PostAuthForgotPasswordApiArg
    >({
      query: (queryArg) => ({
        url: `/auth/forgot-password`,
        method: "POST",
        body: queryArg.body,
      }),
    }),
    postAuthResetPassword: build.mutation<
      PostAuthResetPasswordApiResponse,
      PostAuthResetPasswordApiArg
    >({
      query: (queryArg) => ({
        url: `/auth/reset-password`,
        method: "POST",
        body: queryArg.body,
      }),
    }),
    postAuthChangePassword: build.mutation<
      PostAuthChangePasswordApiResponse,
      PostAuthChangePasswordApiArg
    >({
      query: (queryArg) => ({
        url: `/auth/change-password`,
        method: "POST",
        body: queryArg.body,
      }),
    }),
    getAuthMe: build.query<GetAuthMeApiResponse, GetAuthMeApiArg>({
      query: () => ({ url: `/auth/me` }),
    }),
    getInvestorsMeAgreementProfile: build.query<
      GetInvestorsMeAgreementProfileApiResponse,
      GetInvestorsMeAgreementProfileApiArg
    >({
      query: () => ({ url: `/investors/me/agreement-profile` }),
    }),
    patchInvestorsMeAgreementProfile: build.mutation<
      PatchInvestorsMeAgreementProfileApiResponse,
      PatchInvestorsMeAgreementProfileApiArg
    >({
      query: (queryArg) => ({
        url: `/investors/me/agreement-profile`,
        method: "PATCH",
        body: queryArg.body,
      }),
    }),
    postInvestments: build.mutation<
      PostInvestmentsApiResponse,
      PostInvestmentsApiArg
    >({
      query: (queryArg) => ({
        url: `/investments`,
        method: "POST",
        body: queryArg.body,
      }),
    }),
    getInvestments: build.query<
      GetInvestmentsApiResponse,
      GetInvestmentsApiArg
    >({
      query: () => ({ url: `/investments` }),
    }),
    getInvestmentsById: build.query<
      GetInvestmentsByIdApiResponse,
      GetInvestmentsByIdApiArg
    >({
      query: (queryArg) => ({ url: `/investments/${queryArg.id}` }),
    }),
    patchInvestmentsById: build.mutation<
      PatchInvestmentsByIdApiResponse,
      PatchInvestmentsByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/investments/${queryArg.id}`,
        method: "PATCH",
        body: queryArg.body,
      }),
    }),
    getInvestmentsByIdFundingInstructions: build.query<
      GetInvestmentsByIdFundingInstructionsApiResponse,
      GetInvestmentsByIdFundingInstructionsApiArg
    >({
      query: (queryArg) => ({
        url: `/investments/${queryArg.id}/funding-instructions`,
      }),
    }),
    postInvestmentsByIdCancel: build.mutation<
      PostInvestmentsByIdCancelApiResponse,
      PostInvestmentsByIdCancelApiArg
    >({
      query: (queryArg) => ({
        url: `/investments/${queryArg.id}/cancel`,
        method: "POST",
      }),
    }),
    postInvestmentsByIdPaymentSent: build.mutation<
      PostInvestmentsByIdPaymentSentApiResponse,
      PostInvestmentsByIdPaymentSentApiArg
    >({
      query: (queryArg) => ({
        url: `/investments/${queryArg.id}/payment-sent`,
        method: "POST",
      }),
    }),
    getInvestmentsByIdPaymentInstructions: build.query<
      GetInvestmentsByIdPaymentInstructionsApiResponse,
      GetInvestmentsByIdPaymentInstructionsApiArg
    >({
      query: (queryArg) => ({
        url: `/investments/${queryArg.id}/payment-instructions`,
      }),
    }),
    getKycMe: build.query<GetKycMeApiResponse, GetKycMeApiArg>({
      query: () => ({ url: `/kyc/me` }),
    }),
    getKycMeDocumentRequests: build.query<
      GetKycMeDocumentRequestsApiResponse,
      GetKycMeDocumentRequestsApiArg
    >({
      query: () => ({ url: `/kyc/me/document-requests` }),
    }),
    patchKycMeBasicInfo: build.mutation<
      PatchKycMeBasicInfoApiResponse,
      PatchKycMeBasicInfoApiArg
    >({
      query: (queryArg) => ({
        url: `/kyc/me/basic-info`,
        method: "PATCH",
        body: queryArg.body,
      }),
    }),
    patchKycMeInvestorType: build.mutation<
      PatchKycMeInvestorTypeApiResponse,
      PatchKycMeInvestorTypeApiArg
    >({
      query: (queryArg) => ({
        url: `/kyc/me/investor-type`,
        method: "PATCH",
        body: queryArg.body,
      }),
    }),
    putKycMeIndividualDetails: build.mutation<
      PutKycMeIndividualDetailsApiResponse,
      PutKycMeIndividualDetailsApiArg
    >({
      query: (queryArg) => ({
        url: `/kyc/me/individual-details`,
        method: "PUT",
        body: queryArg.body,
      }),
    }),
    putKycMeCompany: build.mutation<
      PutKycMeCompanyApiResponse,
      PutKycMeCompanyApiArg
    >({
      query: (queryArg) => ({
        url: `/kyc/me/company`,
        method: "PUT",
        body: queryArg.body,
      }),
    }),
    putKycMeSourceOfFunds: build.mutation<
      PutKycMeSourceOfFundsApiResponse,
      PutKycMeSourceOfFundsApiArg
    >({
      query: (queryArg) => ({
        url: `/kyc/me/source-of-funds`,
        method: "PUT",
        body: queryArg.body,
      }),
    }),
    postKycMeSubmit: build.mutation<
      PostKycMeSubmitApiResponse,
      PostKycMeSubmitApiArg
    >({
      query: (queryArg) => ({
        url: `/kyc/me/submit`,
        method: "POST",
        body: queryArg.body,
      }),
    }),
    postKycMeRestart: build.mutation<
      PostKycMeRestartApiResponse,
      PostKycMeRestartApiArg
    >({
      query: () => ({ url: `/kyc/me/restart`, method: "POST" }),
    }),
    postKycDocumentsPresign: build.mutation<
      PostKycDocumentsPresignApiResponse,
      PostKycDocumentsPresignApiArg
    >({
      query: (queryArg) => ({
        url: `/kyc/documents/presign`,
        method: "POST",
        body: queryArg.body,
      }),
    }),
    postKycDocuments: build.mutation<
      PostKycDocumentsApiResponse,
      PostKycDocumentsApiArg
    >({
      query: (queryArg) => ({
        url: `/kyc/documents`,
        method: "POST",
        body: queryArg.body,
      }),
    }),
    getKycDocumentsByIdDownload: build.query<
      GetKycDocumentsByIdDownloadApiResponse,
      GetKycDocumentsByIdDownloadApiArg
    >({
      query: (queryArg) => ({ url: `/kyc/documents/${queryArg.id}/download` }),
    }),
    deleteKycDocumentsById: build.mutation<
      DeleteKycDocumentsByIdApiResponse,
      DeleteKycDocumentsByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/kyc/documents/${queryArg.id}`,
        method: "DELETE",
      }),
    }),
    getPackages: build.query<GetPackagesApiResponse, GetPackagesApiArg>({
      query: () => ({ url: `/packages` }),
    }),
    getPackagesById: build.query<
      GetPackagesByIdApiResponse,
      GetPackagesByIdApiArg
    >({
      query: (queryArg) => ({ url: `/packages/${queryArg.id}` }),
    }),
    getPackagesByIdUpdates: build.query<
      GetPackagesByIdUpdatesApiResponse,
      GetPackagesByIdUpdatesApiArg
    >({
      query: (queryArg) => ({
        url: `/packages/${queryArg.id}/updates`,
        params: {
          page: queryArg.page,
          pageSize: queryArg.pageSize,
        },
      }),
    }),
    getPackagesByIdPreview: build.query<
      GetPackagesByIdPreviewApiResponse,
      GetPackagesByIdPreviewApiArg
    >({
      query: (queryArg) => ({
        url: `/packages/${queryArg.id}/preview`,
        headers: {
          "x-preview-token": queryArg["x-preview-token"],
        },
      }),
    }),
    getPackagesByIdPerformance: build.query<
      GetPackagesByIdPerformanceApiResponse,
      GetPackagesByIdPerformanceApiArg
    >({
      query: (queryArg) => ({ url: `/packages/${queryArg.id}/performance` }),
    }),
    postEsignInvestmentsByInvestmentIdEnvelope: build.mutation<
      PostEsignInvestmentsByInvestmentIdEnvelopeApiResponse,
      PostEsignInvestmentsByInvestmentIdEnvelopeApiArg
    >({
      query: (queryArg) => ({
        url: `/esign/investments/${queryArg.investmentId}/envelope`,
        method: "POST",
      }),
    }),
    getEsignEnvelopesByEnvelopeIdPreview: build.query<
      GetEsignEnvelopesByEnvelopeIdPreviewApiResponse,
      GetEsignEnvelopesByEnvelopeIdPreviewApiArg
    >({
      query: (queryArg) => ({
        url: `/esign/envelopes/${queryArg.envelopeId}/preview`,
      }),
    }),
    getEsignEnvelopesByEnvelopeIdPartyDetails: build.query<
      GetEsignEnvelopesByEnvelopeIdPartyDetailsApiResponse,
      GetEsignEnvelopesByEnvelopeIdPartyDetailsApiArg
    >({
      query: (queryArg) => ({
        url: `/esign/envelopes/${queryArg.envelopeId}/party-details`,
      }),
    }),
    patchEsignEnvelopesByEnvelopeIdPartyDetails: build.mutation<
      PatchEsignEnvelopesByEnvelopeIdPartyDetailsApiResponse,
      PatchEsignEnvelopesByEnvelopeIdPartyDetailsApiArg
    >({
      query: (queryArg) => ({
        url: `/esign/envelopes/${queryArg.envelopeId}/party-details`,
        method: "PATCH",
        body: queryArg.body,
      }),
    }),
    getEsignEnvelopesByEnvelopeIdTerms: build.query<
      GetEsignEnvelopesByEnvelopeIdTermsApiResponse,
      GetEsignEnvelopesByEnvelopeIdTermsApiArg
    >({
      query: (queryArg) => ({
        url: `/esign/envelopes/${queryArg.envelopeId}/terms`,
      }),
    }),
    patchEsignEnvelopesByEnvelopeIdTerms: build.mutation<
      PatchEsignEnvelopesByEnvelopeIdTermsApiResponse,
      PatchEsignEnvelopesByEnvelopeIdTermsApiArg
    >({
      query: (queryArg) => ({
        url: `/esign/envelopes/${queryArg.envelopeId}/terms`,
        method: "PATCH",
        body: queryArg.body,
      }),
    }),
    postEsignEnvelopesByEnvelopeIdSignatureUploadsPresign: build.mutation<
      PostEsignEnvelopesByEnvelopeIdSignatureUploadsPresignApiResponse,
      PostEsignEnvelopesByEnvelopeIdSignatureUploadsPresignApiArg
    >({
      query: (queryArg) => ({
        url: `/esign/envelopes/${queryArg.envelopeId}/signature-uploads/presign`,
        method: "POST",
        body: queryArg.body,
      }),
    }),
    postEsignEnvelopesByEnvelopeIdSign: build.mutation<
      PostEsignEnvelopesByEnvelopeIdSignApiResponse,
      PostEsignEnvelopesByEnvelopeIdSignApiArg
    >({
      query: (queryArg) => ({
        url: `/esign/envelopes/${queryArg.envelopeId}/sign`,
        method: "POST",
        body: queryArg.body,
      }),
    }),
    getEsignEnvelopesByEnvelopeIdDownload: build.query<
      GetEsignEnvelopesByEnvelopeIdDownloadApiResponse,
      GetEsignEnvelopesByEnvelopeIdDownloadApiArg
    >({
      query: (queryArg) => ({
        url: `/esign/envelopes/${queryArg.envelopeId}/download`,
      }),
    }),
    getInvestorsMeBankAccount: build.query<
      GetInvestorsMeBankAccountApiResponse,
      GetInvestorsMeBankAccountApiArg
    >({
      query: () => ({ url: `/investors/me/bank-account` }),
    }),
    getInvestorsMeBankAccountRequirements: build.query<
      GetInvestorsMeBankAccountRequirementsApiResponse,
      GetInvestorsMeBankAccountRequirementsApiArg
    >({
      query: (queryArg) => ({
        url: `/investors/me/bank-account/requirements`,
        params: {
          country: queryArg.country,
        },
      }),
    }),
    postInvestorsMeBankAccountChanges: build.mutation<
      PostInvestorsMeBankAccountChangesApiResponse,
      PostInvestorsMeBankAccountChangesApiArg
    >({
      query: (queryArg) => ({
        url: `/investors/me/bank-account/changes`,
        method: "POST",
        body: queryArg.body,
      }),
    }),
    postInvestorsMeBankAccountChangesByChangeIdConfirm: build.mutation<
      PostInvestorsMeBankAccountChangesByChangeIdConfirmApiResponse,
      PostInvestorsMeBankAccountChangesByChangeIdConfirmApiArg
    >({
      query: (queryArg) => ({
        url: `/investors/me/bank-account/changes/${queryArg.changeId}/confirm`,
        method: "POST",
        body: queryArg.body,
      }),
    }),
    postInvestorsMeBankAccountChangesByChangeIdCancel: build.mutation<
      PostInvestorsMeBankAccountChangesByChangeIdCancelApiResponse,
      PostInvestorsMeBankAccountChangesByChangeIdCancelApiArg
    >({
      query: (queryArg) => ({
        url: `/investors/me/bank-account/changes/${queryArg.changeId}/cancel`,
        method: "POST",
      }),
    }),
    postInvestorsMeBankAccountChangesByChangeIdResend: build.mutation<
      PostInvestorsMeBankAccountChangesByChangeIdResendApiResponse,
      PostInvestorsMeBankAccountChangesByChangeIdResendApiArg
    >({
      query: (queryArg) => ({
        url: `/investors/me/bank-account/changes/${queryArg.changeId}/resend`,
        method: "POST",
      }),
    }),
    getPortfolio: build.query<GetPortfolioApiResponse, GetPortfolioApiArg>({
      query: () => ({ url: `/portfolio` }),
    }),
    getPortfolioActivity: build.query<
      GetPortfolioActivityApiResponse,
      GetPortfolioActivityApiArg
    >({
      query: (queryArg) => ({
        url: `/portfolio/activity`,
        params: {
          limit: queryArg.limit,
          before: queryArg.before,
        },
      }),
    }),
    getPortfolioTransactions: build.query<
      GetPortfolioTransactionsApiResponse,
      GetPortfolioTransactionsApiArg
    >({
      query: (queryArg) => ({
        url: `/portfolio/transactions`,
        params: {
          limit: queryArg.limit,
          before: queryArg.before,
        },
      }),
    }),
    getInvestmentsByIdSpread: build.query<
      GetInvestmentsByIdSpreadApiResponse,
      GetInvestmentsByIdSpreadApiArg
    >({
      query: (queryArg) => ({ url: `/investments/${queryArg.id}/spread` }),
    }),
    getNotifications: build.query<
      GetNotificationsApiResponse,
      GetNotificationsApiArg
    >({
      query: (queryArg) => ({
        url: `/notifications`,
        params: {
          limit: queryArg.limit,
          before: queryArg.before,
        },
      }),
    }),
    getNotificationsUnreadCount: build.query<
      GetNotificationsUnreadCountApiResponse,
      GetNotificationsUnreadCountApiArg
    >({
      query: () => ({ url: `/notifications/unread-count` }),
    }),
    postNotificationsReadAll: build.mutation<
      PostNotificationsReadAllApiResponse,
      PostNotificationsReadAllApiArg
    >({
      query: () => ({ url: `/notifications/read-all`, method: "POST" }),
    }),
    postNotificationsByIdRead: build.mutation<
      PostNotificationsByIdReadApiResponse,
      PostNotificationsByIdReadApiArg
    >({
      query: (queryArg) => ({
        url: `/notifications/${queryArg.id}/read`,
        method: "POST",
      }),
    }),
    getNotificationsPreferences: build.query<
      GetNotificationsPreferencesApiResponse,
      GetNotificationsPreferencesApiArg
    >({
      query: () => ({ url: `/notifications/preferences` }),
    }),
    patchNotificationsPreferences: build.mutation<
      PatchNotificationsPreferencesApiResponse,
      PatchNotificationsPreferencesApiArg
    >({
      query: (queryArg) => ({
        url: `/notifications/preferences`,
        method: "PATCH",
        body: queryArg.body,
      }),
    }),
    getDashboardOverview: build.query<
      GetDashboardOverviewApiResponse,
      GetDashboardOverviewApiArg
    >({
      query: () => ({ url: `/dashboard/overview` }),
    }),
    postAuthMobileLogin: build.mutation<
      PostAuthMobileLoginApiResponse,
      PostAuthMobileLoginApiArg
    >({
      query: (queryArg) => ({
        url: `/auth/mobile/login`,
        method: "POST",
        body: queryArg.body,
      }),
    }),
    postAuthMobileMfaVerify: build.mutation<
      PostAuthMobileMfaVerifyApiResponse,
      PostAuthMobileMfaVerifyApiArg
    >({
      query: (queryArg) => ({
        url: `/auth/mobile/mfa/verify`,
        method: "POST",
        body: queryArg.body,
      }),
    }),
    postAuthMobileRefresh: build.mutation<
      PostAuthMobileRefreshApiResponse,
      PostAuthMobileRefreshApiArg
    >({
      query: (queryArg) => ({
        url: `/auth/mobile/refresh`,
        method: "POST",
        body: queryArg.body,
      }),
    }),
    postAuthMobileLogout: build.mutation<
      PostAuthMobileLogoutApiResponse,
      PostAuthMobileLogoutApiArg
    >({
      query: (queryArg) => ({
        url: `/auth/mobile/logout`,
        method: "POST",
        body: queryArg.body,
      }),
    }),
    getAccountClosure: build.query<
      GetAccountClosureApiResponse,
      GetAccountClosureApiArg
    >({
      query: () => ({ url: `/account-closure` }),
    }),
    postAccountClosure: build.mutation<
      PostAccountClosureApiResponse,
      PostAccountClosureApiArg
    >({
      query: (queryArg) => ({
        url: `/account-closure`,
        method: "POST",
        body: queryArg.body,
      }),
    }),
    postAccountClosureCancel: build.mutation<
      PostAccountClosureCancelApiResponse,
      PostAccountClosureCancelApiArg
    >({
      query: () => ({ url: `/account-closure/cancel`, method: "POST" }),
    }),
    getTickets: build.query<GetTicketsApiResponse, GetTicketsApiArg>({
      query: (queryArg) => ({
        url: `/tickets`,
        params: {
          status: queryArg.status,
          page: queryArg.page,
          pageSize: queryArg.pageSize,
        },
      }),
    }),
    postTickets: build.mutation<PostTicketsApiResponse, PostTicketsApiArg>({
      query: (queryArg) => ({
        url: `/tickets`,
        method: "POST",
        body: queryArg.body,
      }),
    }),
    getTicketsSummary: build.query<
      GetTicketsSummaryApiResponse,
      GetTicketsSummaryApiArg
    >({
      query: () => ({ url: `/tickets/summary` }),
    }),
    postTicketsAttachmentsPresign: build.mutation<
      PostTicketsAttachmentsPresignApiResponse,
      PostTicketsAttachmentsPresignApiArg
    >({
      query: (queryArg) => ({
        url: `/tickets/attachments/presign`,
        method: "POST",
        body: queryArg.body,
      }),
    }),
    getTicketsById: build.query<
      GetTicketsByIdApiResponse,
      GetTicketsByIdApiArg
    >({
      query: (queryArg) => ({ url: `/tickets/${queryArg.id}` }),
    }),
    postTicketsByIdReplies: build.mutation<
      PostTicketsByIdRepliesApiResponse,
      PostTicketsByIdRepliesApiArg
    >({
      query: (queryArg) => ({
        url: `/tickets/${queryArg.id}/replies`,
        method: "POST",
        body: queryArg.body,
      }),
    }),
    postTicketsByIdClose: build.mutation<
      PostTicketsByIdCloseApiResponse,
      PostTicketsByIdCloseApiArg
    >({
      query: (queryArg) => ({
        url: `/tickets/${queryArg.id}/close`,
        method: "POST",
      }),
    }),
    getTicketsByIdAttachmentsAndAttachmentIdDownload: build.query<
      GetTicketsByIdAttachmentsAndAttachmentIdDownloadApiResponse,
      GetTicketsByIdAttachmentsAndAttachmentIdDownloadApiArg
    >({
      query: (queryArg) => ({
        url: `/tickets/${queryArg.id}/attachments/${queryArg.attachmentId}/download`,
      }),
    }),
    getInvestmentsPoolingDisclaimer: build.query<
      GetInvestmentsPoolingDisclaimerApiResponse,
      GetInvestmentsPoolingDisclaimerApiArg
    >({
      query: () => ({ url: `/investments/pooling-disclaimer` }),
    }),
    getInvestmentsByIdMaturity: build.query<
      GetInvestmentsByIdMaturityApiResponse,
      GetInvestmentsByIdMaturityApiArg
    >({
      query: (queryArg) => ({ url: `/investments/${queryArg.id}/maturity` }),
    }),
    postInvestmentsByIdMaturityRequest: build.mutation<
      PostInvestmentsByIdMaturityRequestApiResponse,
      PostInvestmentsByIdMaturityRequestApiArg
    >({
      query: (queryArg) => ({
        url: `/investments/${queryArg.id}/maturity/request`,
        method: "POST",
        body: queryArg.maturityRequestInput,
      }),
    }),
    postInvestmentsByIdMaturityRequestCancel: build.mutation<
      PostInvestmentsByIdMaturityRequestCancelApiResponse,
      PostInvestmentsByIdMaturityRequestCancelApiArg
    >({
      query: (queryArg) => ({
        url: `/investments/${queryArg.id}/maturity/request/cancel`,
        method: "POST",
      }),
    }),
    getInvestmentsByIdEarlyExit: build.query<
      GetInvestmentsByIdEarlyExitApiResponse,
      GetInvestmentsByIdEarlyExitApiArg
    >({
      query: (queryArg) => ({ url: `/investments/${queryArg.id}/early-exit` }),
    }),
    postInvestmentsByIdEarlyExit: build.mutation<
      PostInvestmentsByIdEarlyExitApiResponse,
      PostInvestmentsByIdEarlyExitApiArg
    >({
      query: (queryArg) => ({
        url: `/investments/${queryArg.id}/early-exit`,
        method: "POST",
        body: queryArg.earlyExitRequestInput,
      }),
    }),
    postInvestmentsByIdEarlyExitCancel: build.mutation<
      PostInvestmentsByIdEarlyExitCancelApiResponse,
      PostInvestmentsByIdEarlyExitCancelApiArg
    >({
      query: (queryArg) => ({
        url: `/investments/${queryArg.id}/early-exit/cancel`,
        method: "POST",
      }),
    }),
    postMaturityRequestsByIdCommitReinvestment: build.mutation<
      PostMaturityRequestsByIdCommitReinvestmentApiResponse,
      PostMaturityRequestsByIdCommitReinvestmentApiArg
    >({
      query: (queryArg) => ({
        url: `/maturity/requests/${queryArg.id}/commit-reinvestment`,
        method: "POST",
        body: queryArg.body,
      }),
    }),
    getDashboardStats: build.query<
      GetDashboardStatsApiResponse,
      GetDashboardStatsApiArg
    >({
      query: () => ({ url: `/dashboard/stats` }),
    }),
  }),
  overrideExisting: false,
});
export { injectedRtkApi as investorApi };
export type PostAuthRegisterApiResponse =
  /** status 201 Accepted. A code (or an "already registered" notice) is on its way to the address. */ {
    /** The address as stored (trimmed, lower-case) - use it for verify-email and resend-otp. */
    email: string;
    message: string;
  };
export type PostAuthRegisterApiArg = {
  body: {
    fullName: string;
    email: string;
    phone: string;
    password: any & any & any;
    country?: string;
    referralCode?: string;
  };
};
export type PostAuthVerifyEmailApiResponse = /** status 200 Email verified */ {
  verified: true;
};
export type PostAuthVerifyEmailApiArg = {
  body: {
    email: string;
    otp: string;
  };
};
export type PostAuthResendOtpApiResponse = /** status 200 OTP resent */ {
  message: string;
};
export type PostAuthResendOtpApiArg = {
  body: {
    email: string;
  };
};
export type PostAuthMfaVerifyApiResponse =
  /** status 200 MFA verified, tokens issued. Sets `refreshToken` as an httpOnly cookie. */ {
    accessToken: string;
    /** Present only when a recovery code was used: how many unused ones the admin has left. Warn them when it is low and offer POST /auth/mfa/recovery-codes/regenerate. */
    recoveryCodesRemaining?: number;
  };
export type PostAuthMfaVerifyApiArg = {
  body: {
    mfaToken: string;
    totp?: string;
    recoveryCode?: string;
  };
};
export type PostAuthForgotPasswordApiResponse =
  /** status 200 Generic success - does not reveal whether the email is registered */ {
    message: string;
  };
export type PostAuthForgotPasswordApiArg = {
  body: {
    email: string;
  };
};
export type PostAuthResetPasswordApiResponse =
  /** status 200 Password reset, all refresh tokens revoked */ {
    message: string;
  };
export type PostAuthResetPasswordApiArg = {
  body: {
    email: string;
    otp: string;
    newPassword: any & any & any;
  };
};
export type PostAuthChangePasswordApiResponse =
  /** status 200 Password changed, every other session ended */ {
    message: string;
    /** Present when the request carried this browser's refresh cookie: a new access token for this session (a new refresh cookie is set too). Every other session, and every earlier access token, has ended. */
    accessToken?: string;
  };
export type PostAuthChangePasswordApiArg = {
  body: {
    currentPassword: string;
    newPassword: any & any & any;
  };
};
export type GetAuthMeApiResponse =
  /** status 200 The caller's own id/email/roles/fullName */ {
    id: string;
    email: string;
    roles: string[];
    fullName: string | null;
    /** The investor's RFID (BX-RFID-xxxxxx), generated once at their first activation and never changed; null until then, and for accounts with no investor profile. */
    investorRfid: string | null;
  };
export type GetAuthMeApiArg = void;
export type GetInvestorsMeAgreementProfileApiResponse =
  /** status 200 Current values - null where nothing has been saved yet */ {
    agreementProfile: {
      identityDocumentType: ("passport" | "national_id") | null;
      /** The investor's own record only, masked to its last four characters (••••1234) - the whole number is never returned here. To change it, send the new number in a PATCH. */
      identityDocumentNumber: string | null;
      nextOfKin: {
        name: string;
        relationship: string | null;
        phone: string | null;
        email: string | null;
        address: string | null;
      } | null;
      /** The payout bank account, masked: the account number or IBAN shows only its last four characters. */
      investingAccount: BankAccount | null;
    };
    requirements: AgreementRequirements;
    /** A bank-details change waiting for the investor's emailed code, if any. Signing is refused (409) while one is waiting. */
    pendingBankChange: PendingBankChange | null;
    /** Only on PATCH: what happened to the bank-account parts of the request (applied at once when no bank details existed yet; waiting for the emailed code when it changes existing ones; or unchanged). Null when none were sent. Everything else in the request applied at once. */
    bankAccountChange: BankChangeOutcome | null;
  };
export type GetInvestorsMeAgreementProfileApiArg = void;
export type PatchInvestorsMeAgreementProfileApiResponse =
  /** status 200 Updated values */ {
    agreementProfile: {
      identityDocumentType: ("passport" | "national_id") | null;
      /** The investor's own record only, masked to its last four characters (••••1234) - the whole number is never returned here. To change it, send the new number in a PATCH. */
      identityDocumentNumber: string | null;
      nextOfKin: {
        name: string;
        relationship: string | null;
        phone: string | null;
        email: string | null;
        address: string | null;
      } | null;
      /** The payout bank account, masked: the account number or IBAN shows only its last four characters. */
      investingAccount: BankAccount | null;
    };
    requirements: AgreementRequirements;
    /** A bank-details change waiting for the investor's emailed code, if any. Signing is refused (409) while one is waiting. */
    pendingBankChange: PendingBankChange | null;
    /** Only on PATCH: what happened to the bank-account parts of the request (applied at once when no bank details existed yet; waiting for the emailed code when it changes existing ones; or unchanged). Null when none were sent. Everything else in the request applied at once. */
    bankAccountChange: BankChangeOutcome | null;
  };
export type PatchInvestorsMeAgreementProfileApiArg = {
  body: {
    identityDocumentType?: ("passport" | "national_id") | null;
    identityDocumentNumber?: string | null;
    nextOfKin?: {
      name: string;
      relationship?: string;
      phone?: string;
      email?: string;
      address?: string;
    } | null;
    /** Refused - send nothing here. The account holder is entered as a first and last name (accountHolder), not a single legal name. */
    legalName?: string;
    accountHolder?: {
      firstName?: string;
      lastName?: string;
    };
    accountAddress?: {
      street?: string;
      city?: string;
      state?: string;
      postcode?: string;
      /** ISO 3166-1 alpha-2, e.g. GB (not UK). */
      country?: string;
    };
    bankDetails?: {
      bankName?: string;
      country?: string;
      /** Refused - send nothing here. Currency can't be chosen - all investments and payouts are in US dollars. */
      currency?: string;
      accountNumber?: string;
      iban?: string;
      swiftBic?: string;
      localClearingCode?: string;
      additionalDetails?: {
        [key: string]: string;
      };
    };
  };
};
export type PostInvestmentsApiResponse =
  | /** status 200 An existing draft for this package was found and returned instead (resume) */ {
      /** disclaimerAcceptedText (HTML, sanitise before rendering) and agreementPartySnapshot (what the signed agreement says; null before signing) are the investor's own agreement data. status can be "funding_shortfall" - a shortfall over the limit BricketX covers automatically blocks activation for an admin to resolve manually; admins see it on the admin investment screens, and an investor sees it as this status value and shortfall's sign/size. */
      investment: {
        id: string;
        investorId: string;
        /** The investor's own RFID (BX-RFID-xxxxxx); null until their first investment has been activated. */
        investorRfid: string | null;
        packageId: string;
        agentId: string | null;
        maturityKind: ("maturity" | "early_exit") | null;
        maturityOutcome: ("withdrawn" | "reinvested" | "partial") | null;
        /** On a reinvestment: the matured investment its money came from. Null otherwise. */
        reinvestedFromInvestmentId: string | null;
        /** On a matured investment: the investment started from it by a reinvestment (a cancelled draft does not count). Null while none exists. */
        reinvestedIntoInvestmentId: string | null;
        principal: string;
        amountReceived: string | null;
        shortfall: string | null;
        currency: string;
        payoutFrequency: ("quarterly" | "half_yearly" | "yearly") | null;
        chosenTenureYears: number | null;
        internalRef: string;
        status:
          | "draft"
          | "docs_signed"
          | "pending_funding"
          | "funding_received"
          | "funding_shortfall"
          | "pending_approval"
          | "active"
          | "matured"
          | "funding_reversed"
          | "withdrawn"
          | "cancelled";
        paymentSentAt: string | null;
        topUpSentAt: string | null;
        professionalDeclarationAccepted: boolean;
        professionalDeclarationAcceptedAt: string | null;
        disclaimerAcceptedAt: string | null;
        disclaimerAcceptedText: string | null;
        /** Null unless the investor accepted pooling. Only the marker: never a pool id, its size or its other investors. */
        poolInvestment: {
          state: "waiting_for_pool" | "in_pool";
        } | null;
        poolingAcceptedAt: string | null;
        /** The pooling disclaimer exactly as the investor accepted it. HTML: sanitise before rendering. */
        poolingAcceptedText: string | null;
        agreementPartySnapshot: {
          partyType?: "individual" | "business";
          fullName?: string;
          email?: string;
          phone?: string;
          nationalityOrJurisdiction?: string | null;
          primaryIdentityNumber?: string | null;
          taxId?: string | null;
          address?: string | null;
          identityDocumentType: string | null;
          identityDocumentNumber: string | null;
          nextOfKin: {
            name: string;
            relationship: string | null;
            phone: string | null;
            email: string | null;
            address: string | null;
          } | null;
          bankDetails: {
            legalName: string;
            /** The bank as printed on the signed agreement, with the account number, IBAN and clearing code MASKED to their last four characters (••••6819). The whole values are on the signed PDF only. */
            details: {
              [key: string]: any;
            };
          } | null;
        } | null;
        startDate: string | null;
        /** When the investment ends: the signed date, or the exit date once an early exit has taken effect. */
        maturityDate: string | null;
        /** Read only. The maturity date printed on the signed agreement, kept when an early exit moved `maturityDate` to the exit date. Null for an investment whose date never moved. */
        originalMaturityDate: string | null;
        lockInEnd: string | null;
        createdAt: string;
        package: {
          id: string;
          name: string;
          isDynamic: boolean;
          tenureYears: number | null;
        };
      };
    }
  | /** status 201 New draft investment created */ {
      /** disclaimerAcceptedText (HTML, sanitise before rendering) and agreementPartySnapshot (what the signed agreement says; null before signing) are the investor's own agreement data. status can be "funding_shortfall" - a shortfall over the limit BricketX covers automatically blocks activation for an admin to resolve manually; admins see it on the admin investment screens, and an investor sees it as this status value and shortfall's sign/size. */
      investment: {
        id: string;
        investorId: string;
        /** The investor's own RFID (BX-RFID-xxxxxx); null until their first investment has been activated. */
        investorRfid: string | null;
        packageId: string;
        agentId: string | null;
        maturityKind: ("maturity" | "early_exit") | null;
        maturityOutcome: ("withdrawn" | "reinvested" | "partial") | null;
        /** On a reinvestment: the matured investment its money came from. Null otherwise. */
        reinvestedFromInvestmentId: string | null;
        /** On a matured investment: the investment started from it by a reinvestment (a cancelled draft does not count). Null while none exists. */
        reinvestedIntoInvestmentId: string | null;
        principal: string;
        amountReceived: string | null;
        shortfall: string | null;
        currency: string;
        payoutFrequency: ("quarterly" | "half_yearly" | "yearly") | null;
        chosenTenureYears: number | null;
        internalRef: string;
        status:
          | "draft"
          | "docs_signed"
          | "pending_funding"
          | "funding_received"
          | "funding_shortfall"
          | "pending_approval"
          | "active"
          | "matured"
          | "funding_reversed"
          | "withdrawn"
          | "cancelled";
        paymentSentAt: string | null;
        topUpSentAt: string | null;
        professionalDeclarationAccepted: boolean;
        professionalDeclarationAcceptedAt: string | null;
        disclaimerAcceptedAt: string | null;
        disclaimerAcceptedText: string | null;
        /** Null unless the investor accepted pooling. Only the marker: never a pool id, its size or its other investors. */
        poolInvestment: {
          state: "waiting_for_pool" | "in_pool";
        } | null;
        poolingAcceptedAt: string | null;
        /** The pooling disclaimer exactly as the investor accepted it. HTML: sanitise before rendering. */
        poolingAcceptedText: string | null;
        agreementPartySnapshot: {
          partyType?: "individual" | "business";
          fullName?: string;
          email?: string;
          phone?: string;
          nationalityOrJurisdiction?: string | null;
          primaryIdentityNumber?: string | null;
          taxId?: string | null;
          address?: string | null;
          identityDocumentType: string | null;
          identityDocumentNumber: string | null;
          nextOfKin: {
            name: string;
            relationship: string | null;
            phone: string | null;
            email: string | null;
            address: string | null;
          } | null;
          bankDetails: {
            legalName: string;
            /** The bank as printed on the signed agreement, with the account number, IBAN and clearing code MASKED to their last four characters (••••6819). The whole values are on the signed PDF only. */
            details: {
              [key: string]: any;
            };
          } | null;
        } | null;
        startDate: string | null;
        /** When the investment ends: the signed date, or the exit date once an early exit has taken effect. */
        maturityDate: string | null;
        /** Read only. The maturity date printed on the signed agreement, kept when an early exit moved `maturityDate` to the exit date. Null for an investment whose date never moved. */
        originalMaturityDate: string | null;
        lockInEnd: string | null;
        createdAt: string;
        package: {
          id: string;
          name: string;
          isDynamic: boolean;
          tenureYears: number | null;
        };
      };
    };
export type PostInvestmentsApiArg = {
  body: {
    packageId: string;
    principal: string;
    payoutFrequency: "quarterly" | "half_yearly" | "yearly";
    chosenTenureYears?: number;
    professionalDeclarationAccepted: boolean;
    disclaimerAccepted: boolean;
    poolingAccepted?: boolean;
    poolingDisclaimerVersion?: number;
  };
};
export type GetInvestmentsApiResponse =
  /** status 200 Every investment belonging to the caller, most recent first */ {
    investments: {
      id: string;
      investorId: string;
      /** The investor's own RFID (BX-RFID-xxxxxx); null until their first investment has been activated. */
      investorRfid: string | null;
      packageId: string;
      agentId: string | null;
      maturityKind: ("maturity" | "early_exit") | null;
      maturityOutcome: ("withdrawn" | "reinvested" | "partial") | null;
      /** On a reinvestment: the matured investment its money came from. Null otherwise. */
      reinvestedFromInvestmentId: string | null;
      /** On a matured investment: the investment started from it by a reinvestment (a cancelled draft does not count). Null while none exists. */
      reinvestedIntoInvestmentId: string | null;
      principal: string;
      amountReceived: string | null;
      shortfall: string | null;
      currency: string;
      payoutFrequency: ("quarterly" | "half_yearly" | "yearly") | null;
      chosenTenureYears: number | null;
      internalRef: string;
      status:
        | "draft"
        | "docs_signed"
        | "pending_funding"
        | "funding_received"
        | "funding_shortfall"
        | "pending_approval"
        | "active"
        | "matured"
        | "funding_reversed"
        | "withdrawn"
        | "cancelled";
      paymentSentAt: string | null;
      topUpSentAt: string | null;
      professionalDeclarationAccepted: boolean;
      professionalDeclarationAcceptedAt: string | null;
      disclaimerAcceptedAt: string | null;
      disclaimerAcceptedText: string | null;
      /** Null unless the investor accepted pooling. Only the marker: never a pool id, its size or its other investors. */
      poolInvestment: {
        state: "waiting_for_pool" | "in_pool";
      } | null;
      poolingAcceptedAt: string | null;
      /** The pooling disclaimer exactly as the investor accepted it. HTML: sanitise before rendering. */
      poolingAcceptedText: string | null;
      agreementPartySnapshot: {
        partyType?: "individual" | "business";
        fullName?: string;
        email?: string;
        phone?: string;
        nationalityOrJurisdiction?: string | null;
        primaryIdentityNumber?: string | null;
        taxId?: string | null;
        address?: string | null;
        identityDocumentType: string | null;
        identityDocumentNumber: string | null;
        nextOfKin: {
          name: string;
          relationship: string | null;
          phone: string | null;
          email: string | null;
          address: string | null;
        } | null;
        bankDetails: {
          legalName: string;
          /** The bank as printed on the signed agreement, with the account number, IBAN and clearing code MASKED to their last four characters (••••6819). The whole values are on the signed PDF only. */
          details: {
            [key: string]: any;
          };
        } | null;
      } | null;
      startDate: string | null;
      /** When the investment ends: the signed date, or the exit date once an early exit has taken effect. */
      maturityDate: string | null;
      /** Read only. The maturity date printed on the signed agreement, kept when an early exit moved `maturityDate` to the exit date. Null for an investment whose date never moved. */
      originalMaturityDate: string | null;
      lockInEnd: string | null;
      createdAt: string;
      package: {
        id: string;
        name: string;
        isDynamic: boolean;
        tenureYears: number | null;
      };
    }[];
  };
export type GetInvestmentsApiArg = void;
export type GetInvestmentsByIdApiResponse = /** status 200 The investment */ {
  /** disclaimerAcceptedText (HTML, sanitise before rendering) and agreementPartySnapshot (what the signed agreement says; null before signing) are the investor's own agreement data. status can be "funding_shortfall" - a shortfall over the limit BricketX covers automatically blocks activation for an admin to resolve manually; admins see it on the admin investment screens, and an investor sees it as this status value and shortfall's sign/size. */
  investment: {
    id: string;
    investorId: string;
    /** The investor's own RFID (BX-RFID-xxxxxx); null until their first investment has been activated. */
    investorRfid: string | null;
    packageId: string;
    agentId: string | null;
    maturityKind: ("maturity" | "early_exit") | null;
    maturityOutcome: ("withdrawn" | "reinvested" | "partial") | null;
    /** On a reinvestment: the matured investment its money came from. Null otherwise. */
    reinvestedFromInvestmentId: string | null;
    /** On a matured investment: the investment started from it by a reinvestment (a cancelled draft does not count). Null while none exists. */
    reinvestedIntoInvestmentId: string | null;
    principal: string;
    amountReceived: string | null;
    shortfall: string | null;
    currency: string;
    payoutFrequency: ("quarterly" | "half_yearly" | "yearly") | null;
    chosenTenureYears: number | null;
    internalRef: string;
    status:
      | "draft"
      | "docs_signed"
      | "pending_funding"
      | "funding_received"
      | "funding_shortfall"
      | "pending_approval"
      | "active"
      | "matured"
      | "funding_reversed"
      | "withdrawn"
      | "cancelled";
    paymentSentAt: string | null;
    topUpSentAt: string | null;
    professionalDeclarationAccepted: boolean;
    professionalDeclarationAcceptedAt: string | null;
    disclaimerAcceptedAt: string | null;
    disclaimerAcceptedText: string | null;
    /** Null unless the investor accepted pooling. Only the marker: never a pool id, its size or its other investors. */
    poolInvestment: {
      state: "waiting_for_pool" | "in_pool";
    } | null;
    poolingAcceptedAt: string | null;
    /** The pooling disclaimer exactly as the investor accepted it. HTML: sanitise before rendering. */
    poolingAcceptedText: string | null;
    agreementPartySnapshot: {
      partyType?: "individual" | "business";
      fullName?: string;
      email?: string;
      phone?: string;
      nationalityOrJurisdiction?: string | null;
      primaryIdentityNumber?: string | null;
      taxId?: string | null;
      address?: string | null;
      identityDocumentType: string | null;
      identityDocumentNumber: string | null;
      nextOfKin: {
        name: string;
        relationship: string | null;
        phone: string | null;
        email: string | null;
        address: string | null;
      } | null;
      bankDetails: {
        legalName: string;
        /** The bank as printed on the signed agreement, with the account number, IBAN and clearing code MASKED to their last four characters (••••6819). The whole values are on the signed PDF only. */
        details: {
          [key: string]: any;
        };
      } | null;
    } | null;
    startDate: string | null;
    /** When the investment ends: the signed date, or the exit date once an early exit has taken effect. */
    maturityDate: string | null;
    /** Read only. The maturity date printed on the signed agreement, kept when an early exit moved `maturityDate` to the exit date. Null for an investment whose date never moved. */
    originalMaturityDate: string | null;
    lockInEnd: string | null;
    createdAt: string;
    package: {
      id: string;
      name: string;
      isDynamic: boolean;
      tenureYears: number | null;
    };
  };
};
export type GetInvestmentsByIdApiArg = {
  id: string;
};
export type PatchInvestmentsByIdApiResponse =
  /** status 200 Updated investment */ {
    /** disclaimerAcceptedText (HTML, sanitise before rendering) and agreementPartySnapshot (what the signed agreement says; null before signing) are the investor's own agreement data. status can be "funding_shortfall" - a shortfall over the limit BricketX covers automatically blocks activation for an admin to resolve manually; admins see it on the admin investment screens, and an investor sees it as this status value and shortfall's sign/size. */
    investment: {
      id: string;
      investorId: string;
      /** The investor's own RFID (BX-RFID-xxxxxx); null until their first investment has been activated. */
      investorRfid: string | null;
      packageId: string;
      agentId: string | null;
      maturityKind: ("maturity" | "early_exit") | null;
      maturityOutcome: ("withdrawn" | "reinvested" | "partial") | null;
      /** On a reinvestment: the matured investment its money came from. Null otherwise. */
      reinvestedFromInvestmentId: string | null;
      /** On a matured investment: the investment started from it by a reinvestment (a cancelled draft does not count). Null while none exists. */
      reinvestedIntoInvestmentId: string | null;
      principal: string;
      amountReceived: string | null;
      shortfall: string | null;
      currency: string;
      payoutFrequency: ("quarterly" | "half_yearly" | "yearly") | null;
      chosenTenureYears: number | null;
      internalRef: string;
      status:
        | "draft"
        | "docs_signed"
        | "pending_funding"
        | "funding_received"
        | "funding_shortfall"
        | "pending_approval"
        | "active"
        | "matured"
        | "funding_reversed"
        | "withdrawn"
        | "cancelled";
      paymentSentAt: string | null;
      topUpSentAt: string | null;
      professionalDeclarationAccepted: boolean;
      professionalDeclarationAcceptedAt: string | null;
      disclaimerAcceptedAt: string | null;
      disclaimerAcceptedText: string | null;
      /** Null unless the investor accepted pooling. Only the marker: never a pool id, its size or its other investors. */
      poolInvestment: {
        state: "waiting_for_pool" | "in_pool";
      } | null;
      poolingAcceptedAt: string | null;
      /** The pooling disclaimer exactly as the investor accepted it. HTML: sanitise before rendering. */
      poolingAcceptedText: string | null;
      agreementPartySnapshot: {
        partyType?: "individual" | "business";
        fullName?: string;
        email?: string;
        phone?: string;
        nationalityOrJurisdiction?: string | null;
        primaryIdentityNumber?: string | null;
        taxId?: string | null;
        address?: string | null;
        identityDocumentType: string | null;
        identityDocumentNumber: string | null;
        nextOfKin: {
          name: string;
          relationship: string | null;
          phone: string | null;
          email: string | null;
          address: string | null;
        } | null;
        bankDetails: {
          legalName: string;
          /** The bank as printed on the signed agreement, with the account number, IBAN and clearing code MASKED to their last four characters (••••6819). The whole values are on the signed PDF only. */
          details: {
            [key: string]: any;
          };
        } | null;
      } | null;
      startDate: string | null;
      /** When the investment ends: the signed date, or the exit date once an early exit has taken effect. */
      maturityDate: string | null;
      /** Read only. The maturity date printed on the signed agreement, kept when an early exit moved `maturityDate` to the exit date. Null for an investment whose date never moved. */
      originalMaturityDate: string | null;
      lockInEnd: string | null;
      createdAt: string;
      package: {
        id: string;
        name: string;
        isDynamic: boolean;
        tenureYears: number | null;
      };
    };
  };
export type PatchInvestmentsByIdApiArg = {
  id: string;
  body: {
    principal?: string;
    payoutFrequency?: "quarterly" | "half_yearly" | "yearly";
    chosenTenureYears?: number;
    poolingAccepted?: boolean;
    poolingDisclaimerVersion?: number;
  };
};
export type GetInvestmentsByIdFundingInstructionsApiResponse =
  /** status 200 Bank details, the payment reference, and factual notes about the transfer */ {
    reference: string;
    bankDetails: {
      bankName: string;
      accountName: string;
      accountNumber: string | null;
      iban: string | null;
      swiftBic: string | null;
      achRoutingNumber: string | null;
      fedwireRoutingNumber: string | null;
      bankAddress: string;
      city: string | null;
      stateProvince: string | null;
      postalCode: string | null;
      country: string | null;
      countryName: string | null;
      currency: string;
    };
    notes: string[];
  };
export type GetInvestmentsByIdFundingInstructionsApiArg = {
  id: string;
};
export type PostInvestmentsByIdCancelApiResponse =
  /** status 200 The investment, with status cancelled */ {
    /** disclaimerAcceptedText (HTML, sanitise before rendering) and agreementPartySnapshot (what the signed agreement says; null before signing) are the investor's own agreement data. status can be "funding_shortfall" - a shortfall over the limit BricketX covers automatically blocks activation for an admin to resolve manually; admins see it on the admin investment screens, and an investor sees it as this status value and shortfall's sign/size. */
    investment: {
      id: string;
      investorId: string;
      /** The investor's own RFID (BX-RFID-xxxxxx); null until their first investment has been activated. */
      investorRfid: string | null;
      packageId: string;
      agentId: string | null;
      maturityKind: ("maturity" | "early_exit") | null;
      maturityOutcome: ("withdrawn" | "reinvested" | "partial") | null;
      /** On a reinvestment: the matured investment its money came from. Null otherwise. */
      reinvestedFromInvestmentId: string | null;
      /** On a matured investment: the investment started from it by a reinvestment (a cancelled draft does not count). Null while none exists. */
      reinvestedIntoInvestmentId: string | null;
      principal: string;
      amountReceived: string | null;
      shortfall: string | null;
      currency: string;
      payoutFrequency: ("quarterly" | "half_yearly" | "yearly") | null;
      chosenTenureYears: number | null;
      internalRef: string;
      status:
        | "draft"
        | "docs_signed"
        | "pending_funding"
        | "funding_received"
        | "funding_shortfall"
        | "pending_approval"
        | "active"
        | "matured"
        | "funding_reversed"
        | "withdrawn"
        | "cancelled";
      paymentSentAt: string | null;
      topUpSentAt: string | null;
      professionalDeclarationAccepted: boolean;
      professionalDeclarationAcceptedAt: string | null;
      disclaimerAcceptedAt: string | null;
      disclaimerAcceptedText: string | null;
      /** Null unless the investor accepted pooling. Only the marker: never a pool id, its size or its other investors. */
      poolInvestment: {
        state: "waiting_for_pool" | "in_pool";
      } | null;
      poolingAcceptedAt: string | null;
      /** The pooling disclaimer exactly as the investor accepted it. HTML: sanitise before rendering. */
      poolingAcceptedText: string | null;
      agreementPartySnapshot: {
        partyType?: "individual" | "business";
        fullName?: string;
        email?: string;
        phone?: string;
        nationalityOrJurisdiction?: string | null;
        primaryIdentityNumber?: string | null;
        taxId?: string | null;
        address?: string | null;
        identityDocumentType: string | null;
        identityDocumentNumber: string | null;
        nextOfKin: {
          name: string;
          relationship: string | null;
          phone: string | null;
          email: string | null;
          address: string | null;
        } | null;
        bankDetails: {
          legalName: string;
          /** The bank as printed on the signed agreement, with the account number, IBAN and clearing code MASKED to their last four characters (••••6819). The whole values are on the signed PDF only. */
          details: {
            [key: string]: any;
          };
        } | null;
      } | null;
      startDate: string | null;
      /** When the investment ends: the signed date, or the exit date once an early exit has taken effect. */
      maturityDate: string | null;
      /** Read only. The maturity date printed on the signed agreement, kept when an early exit moved `maturityDate` to the exit date. Null for an investment whose date never moved. */
      originalMaturityDate: string | null;
      lockInEnd: string | null;
      createdAt: string;
      package: {
        id: string;
        name: string;
        isDynamic: boolean;
        tenureYears: number | null;
      };
    };
  };
export type PostInvestmentsByIdCancelApiArg = {
  id: string;
};
export type PostInvestmentsByIdPaymentSentApiResponse =
  /** status 200 The investment, with paymentSentAt set */ {
    /** disclaimerAcceptedText (HTML, sanitise before rendering) and agreementPartySnapshot (what the signed agreement says; null before signing) are the investor's own agreement data. status can be "funding_shortfall" - a shortfall over the limit BricketX covers automatically blocks activation for an admin to resolve manually; admins see it on the admin investment screens, and an investor sees it as this status value and shortfall's sign/size. */
    investment: {
      id: string;
      investorId: string;
      /** The investor's own RFID (BX-RFID-xxxxxx); null until their first investment has been activated. */
      investorRfid: string | null;
      packageId: string;
      agentId: string | null;
      maturityKind: ("maturity" | "early_exit") | null;
      maturityOutcome: ("withdrawn" | "reinvested" | "partial") | null;
      /** On a reinvestment: the matured investment its money came from. Null otherwise. */
      reinvestedFromInvestmentId: string | null;
      /** On a matured investment: the investment started from it by a reinvestment (a cancelled draft does not count). Null while none exists. */
      reinvestedIntoInvestmentId: string | null;
      principal: string;
      amountReceived: string | null;
      shortfall: string | null;
      currency: string;
      payoutFrequency: ("quarterly" | "half_yearly" | "yearly") | null;
      chosenTenureYears: number | null;
      internalRef: string;
      status:
        | "draft"
        | "docs_signed"
        | "pending_funding"
        | "funding_received"
        | "funding_shortfall"
        | "pending_approval"
        | "active"
        | "matured"
        | "funding_reversed"
        | "withdrawn"
        | "cancelled";
      paymentSentAt: string | null;
      topUpSentAt: string | null;
      professionalDeclarationAccepted: boolean;
      professionalDeclarationAcceptedAt: string | null;
      disclaimerAcceptedAt: string | null;
      disclaimerAcceptedText: string | null;
      /** Null unless the investor accepted pooling. Only the marker: never a pool id, its size or its other investors. */
      poolInvestment: {
        state: "waiting_for_pool" | "in_pool";
      } | null;
      poolingAcceptedAt: string | null;
      /** The pooling disclaimer exactly as the investor accepted it. HTML: sanitise before rendering. */
      poolingAcceptedText: string | null;
      agreementPartySnapshot: {
        partyType?: "individual" | "business";
        fullName?: string;
        email?: string;
        phone?: string;
        nationalityOrJurisdiction?: string | null;
        primaryIdentityNumber?: string | null;
        taxId?: string | null;
        address?: string | null;
        identityDocumentType: string | null;
        identityDocumentNumber: string | null;
        nextOfKin: {
          name: string;
          relationship: string | null;
          phone: string | null;
          email: string | null;
          address: string | null;
        } | null;
        bankDetails: {
          legalName: string;
          /** The bank as printed on the signed agreement, with the account number, IBAN and clearing code MASKED to their last four characters (••••6819). The whole values are on the signed PDF only. */
          details: {
            [key: string]: any;
          };
        } | null;
      } | null;
      startDate: string | null;
      /** When the investment ends: the signed date, or the exit date once an early exit has taken effect. */
      maturityDate: string | null;
      /** Read only. The maturity date printed on the signed agreement, kept when an early exit moved `maturityDate` to the exit date. Null for an investment whose date never moved. */
      originalMaturityDate: string | null;
      lockInEnd: string | null;
      createdAt: string;
      package: {
        id: string;
        name: string;
        isDynamic: boolean;
        tenureYears: number | null;
      };
    };
  };
export type PostInvestmentsByIdPaymentSentApiArg = {
  id: string;
};
export type GetInvestmentsByIdPaymentInstructionsApiResponse = unknown;
export type GetInvestmentsByIdPaymentInstructionsApiArg = {
  id: string;
};
export type GetKycMeApiResponse =
  /** status 200 Full KYC case as it stands (wizard resume state) */ {
    kycProfile: KycProfileInvestor;
    individualDetails: KycIndividualDetails | null;
    companyKyc: {
      id: string;
      kycProfileId: string;
      companyName: string | null;
      regNumber: string | null;
      jurisdiction: string | null;
      incorporationDate: string | null;
      natureOfBusiness: string | null;
      registeredAddress: string | null;
      taxId: string | null;
      bankDetails: {
        [key: string]: any;
      } | null;
      directors: CompanyDirector[];
      uboRecords: UboRecord[];
      beneficialOwners: BeneficialOwner[];
    } | null;
    documents: KycDocumentInvestor[];
    sourceOfFunds: SourceOfFunds | null;
    reviews: KycReviewInvestor[];
    events: KycEvent[];
    currentStep:
      | (
          | "basic_info"
          | "investor_type"
          | "identity"
          | "face"
          | "address"
          | "source_of_funds"
          | "review"
        )
      | null;
    status:
      | "draft"
      | "submitted"
      | "under_review"
      | "approved"
      | "rejected"
      | "more_info_requested";
  };
export type GetKycMeApiArg = void;
export type GetKycMeDocumentRequestsApiResponse =
  /** status 200 The caller's document requests (empty before a KYC case exists) */ {
    requests: KycDocumentRequestInvestor[];
  };
export type GetKycMeDocumentRequestsApiArg = void;
export type PatchKycMeBasicInfoApiResponse =
  /** status 200 current_step advances to investor_type */ {
    kycProfile: KycProfileInvestor;
  };
export type PatchKycMeBasicInfoApiArg = {
  body: {
    fullLegalName: string;
    dateOfBirth: string;
    nationality: string;
    countryOfResidence: string;
    countryOfCitizenship: string;
    expectedInvestmentAmount: string;
    taxId?: string;
    isPep: boolean;
    pepDetails?: string;
    heardAboutUs?: string;
  };
};
export type PatchKycMeInvestorTypeApiResponse =
  /** status 200 current_step advances to identity */ {
    kycProfile: KycProfileInvestor;
  };
export type PatchKycMeInvestorTypeApiArg = {
  body: {
    kycType: "individual" | "business";
    actingOnBehalf: boolean;
  };
};
export type PutKycMeIndividualDetailsApiResponse =
  /** status 200 Individual details saved */ {
    individualDetails: KycIndividualDetails;
  };
export type PutKycMeIndividualDetailsApiArg = {
  body: {
    fatherOrHusbandName?: string;
    residentialAddress: string;
    occupation?: string;
    employerName?: string;
  };
};
export type PutKycMeCompanyApiResponse =
  /** status 200 Company details saved. Directors/UBOs/beneficial owners are id-reconciled - pass an existing row's `id` back to update it in place, omit it to create a new row, drop it to remove it (blocked with 400 if a document is still attached to that row). */ {
    companyKyc: CompanyKyc;
    directors: CompanyDirector[];
    uboRecords: UboRecord[];
    beneficialOwners: BeneficialOwner[];
  };
export type PutKycMeCompanyApiArg = {
  body: {
    companyName: string;
    regNumber: string;
    jurisdiction: string;
    incorporationDate?: string;
    natureOfBusiness?: string;
    registeredAddress: string;
    taxId?: string;
    bankDetails?: {
      [key: string]: any;
    };
    directors: {
      id?: string;
      fullName: string;
      nationality?: string;
      designation?: string;
      isAuthorizedSignatory?: boolean;
    }[];
    uboRecords?: {
      id?: string;
      fullName: string;
      nationality?: string;
      ownershipPercentage?: string;
      isPep?: boolean;
    }[];
    beneficialOwners?: {
      id?: string;
      fullName: string;
      nationality?: string;
      relationship?: string;
    }[];
  };
};
export type PutKycMeSourceOfFundsApiResponse =
  /** status 200 current_step advances to review */ {
    sourceOfFunds: SourceOfFunds;
  };
export type PutKycMeSourceOfFundsApiArg = {
  body: {
    primarySource:
      | "salary"
      | "business_income"
      | "investment_returns"
      | "property_sale"
      | "inheritance_gift"
      | "other";
    sourceOfWealth?: string;
    annualIncome?: string;
    currency?: string;
    explanation?: string;
  };
};
export type PostKycMeSubmitApiResponse = /** status 200 status → submitted */ {
  status: "submitted";
};
export type PostKycMeSubmitApiArg = {
  body: {
    declarationAccepted: boolean;
  };
};
export type PostKycMeRestartApiResponse =
  /** status 200 status → draft, current_step → review, all prior data intact */ {
    kycProfile: KycProfileInvestor;
  };
export type PostKycMeRestartApiArg = void;
export type PostKycDocumentsPresignApiResponse =
  /** status 200 Upload the file directly to `uploadUrl` (browser → S3), not through the API */ {
    /** Pre-signed S3 PUT url - upload the file directly to this, not to the API */
    uploadUrl: string;
    objectKey: string;
    expiresIn: number;
  };
export type PostKycDocumentsPresignApiArg = {
  body: {
    documentType:
      | "passport"
      | "national_id"
      | "driving_license"
      | "proof_of_address"
      | "company_reg_cert"
      | "trade_license"
      | "moa_aoa"
      | "bank_statement"
      | "tax_certificate"
      | "financial_statements"
      | "board_resolution"
      | "power_of_attorney"
      | "cap_table"
      | "ubo_declaration"
      | "salary_slip"
      | "property_deed"
      | "inheritance_doc"
      | "fatca_crs";
    category:
      "identity" | "address" | "source_of_funds" | "company" | "authorization";
    /** Whose document this is. Required unless `requestId` is sent; with a `requestId` the owner is taken from that request and this is ignored. */
    ownerType?:
      "applicant" | "director" | "ubo" | "beneficial_owner" | "company";
    /** The director, UBO, beneficial owner or company record. Required for those owner types unless `requestId` is sent; with a `requestId` it is ignored. */
    ownerId?: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    /** The open document request this upload answers (GET /kyc/me/document-requests). Required once the caller's KYC is approved; its category must match. The owner (type and id) is taken from the request, so `ownerType` and `ownerId` are not needed and are ignored. */
    requestId?: string;
  };
};
export type PostKycDocumentsApiResponse =
  /** status 201 Document registered. current_step may auto-advance (identity→address→source_of_funds) if this category satisfies the current step. */ {
    document: KycDocumentInvestor;
  };
export type PostKycDocumentsApiArg = {
  body: {
    objectKey: string;
    documentType:
      | "passport"
      | "national_id"
      | "driving_license"
      | "proof_of_address"
      | "company_reg_cert"
      | "trade_license"
      | "moa_aoa"
      | "bank_statement"
      | "tax_certificate"
      | "financial_statements"
      | "board_resolution"
      | "power_of_attorney"
      | "cap_table"
      | "ubo_declaration"
      | "salary_slip"
      | "property_deed"
      | "inheritance_doc"
      | "fatca_crs";
    category:
      "identity" | "address" | "source_of_funds" | "company" | "authorization";
    /** Whose document this is. Required unless `requestId` is sent; with a `requestId` the owner is taken from that request and this is ignored. */
    ownerType?:
      "applicant" | "director" | "ubo" | "beneficial_owner" | "company";
    /** The director, UBO, beneficial owner or company record. Required for those owner types unless `requestId` is sent; with a `requestId` it is ignored. */
    ownerId?: string;
    /** The open document request this upload answers (GET /kyc/me/document-requests). Required once the caller's KYC is approved; its category must match. The owner (type and id) is taken from the request, so `ownerType` and `ownerId` are not needed and are ignored. */
    requestId?: string;
  };
};
export type GetKycDocumentsByIdDownloadApiResponse =
  /** status 200 Ownership-checked - 404s if the document belongs to a different investor */ {
    /** Pre-signed S3 GET url, short-lived */
    url: string;
  };
export type GetKycDocumentsByIdDownloadApiArg = {
  id: string;
};
export type DeleteKycDocumentsByIdApiResponse =
  /** status 200 Document deleted */ {
    deleted: true;
  };
export type DeleteKycDocumentsByIdApiArg = {
  id: string;
};
export type GetPackagesApiResponse = /** status 200 Published packages */ {
  packages: {
    id: string;
    name: string;
    subtitle: string | null;
    roiMin: string | null;
    roiMax: string | null;
    minInvestment: string;
    tenureYears: number | null;
    isDynamic: boolean;
    /** COMPUTED, not stored - the distinct set of payoutCadence values across this package's allocated categories. Not settable via B3/B4; changes automatically as allocations (B5) or a category's own payoutCadence change. */
    payoutOptions: ("quarterly" | "half_yearly" | "yearly")[];
    /** Pre-signed S3 GET url, short-lived - generated fresh on every response, not stored. Null if no cover image is set. */
    coverImageViewUrl: string | null;
  }[];
};
export type GetPackagesApiArg = void;
export type GetPackagesByIdApiResponse =
  /** status 200 Package + allocations + full data-room content */ {
    package: {
      id: string;
      name: string;
      subtitle: string | null;
      status: "draft" | "published" | "archived";
      roiMin: string | null;
      roiMax: string | null;
      minInvestment: string;
      tenureYears: number | null;
      isDynamic: boolean;
      active: boolean;
      /** COMPUTED, not stored - the distinct set of payoutCadence values across this package's allocated categories. Not settable via B3/B4; changes automatically as allocations (B5) or a category's own payoutCadence change. */
      payoutOptions: ("quarterly" | "half_yearly" | "yearly")[];
      /** Raw S3 object key - not directly viewable, see coverImageViewUrl */
      coverImageUrl: string | null;
      /** Pre-signed S3 GET url, short-lived - generated fresh on every response, not stored. Null if no cover image is set. */
      coverImageViewUrl: string | null;
      /** Per-package investment disclaimer, authored by an admin with the same rich-text editor as content sections (HTML: formatting/headings/lists/links; images and video are rejected). Must be sanitized with the same DOMPurify profile used for content sections before rendering - never a separate, weaker allowlist. The investor accepts it with a checkbox on every investment; the accepted HTML is copied onto that investment verbatim (investments.disclaimerAcceptedText) so editing this field never changes what a past investor already accepted. */
      disclaimerText: string | null;
      /** How many updates have been published for this package. */
      updateCount: number;
      /** When the newest published update was published; null when there is none. */
      latestUpdateAt: string | null;
    };
    allocations: {
      packageId: string;
      categoryId: string;
      weight: string;
      category: {
        id: string;
        name: string;
        /** The category's description: sanitised HTML with no media, null when there is none. Sanitise again before rendering. */
        descriptionHtml: string | null;
        /** The category's cover image: a short-lived signed link, made fresh on every response; null when there is none. */
        coverImageViewUrl: string | null;
      };
    }[];
    galleries: {
      id: string;
      packageId: string;
      categoryId: string | null;
      title: string | null;
      displayOrder: number | null;
      media: {
        id: string;
        packageId: string;
        galleryId: string | null;
        /** true for rich-text inline content media (always galleryId: null); false for gallery-attached media. Explicit discriminator. */
        isContentMedia: boolean;
        type: "image" | "video";
        /** Raw S3 object key - not directly viewable, see viewUrl */
        url: string;
        /** Original uploaded file name (e.g. 'gold-trading-1.jpg'), captured at upload time. Null for media rows created before this field existed. */
        fileName: string | null;
        caption: string | null;
        displayOrder: number | null;
        /** Pre-signed S3 GET url, short-lived - generated fresh on every response, not stored */
        viewUrl: string;
      }[];
    }[];
    keyInfo: {
      id: string;
      packageId: string;
      label: string;
      value: string;
      displayOrder: number | null;
    }[];
    resources: {
      id: string;
      packageId: string;
      label: string;
      url: string;
    }[];
    documents: {
      id: string;
      packageId: string;
      title: string;
      /** Raw S3 object key - not directly viewable, see viewUrl */
      fileUrl: string;
      /** Original uploaded file name (e.g. 'Investment Brochure.pdf'), captured at upload time. Null for document rows created before this field existed. */
      fileName: string | null;
      displayOrder: number | null;
      /** Pre-signed S3 GET url, short-lived - generated fresh on every response, not stored */
      viewUrl: string;
    }[];
    contentMedia: {
      id: string;
      packageId: string;
      galleryId: string | null;
      /** true for rich-text inline content media (always galleryId: null); false for gallery-attached media. Explicit discriminator. */
      isContentMedia: boolean;
      type: "image" | "video";
      /** Raw S3 object key - not directly viewable, see viewUrl */
      url: string;
      /** Original uploaded file name (e.g. 'gold-trading-1.jpg'), captured at upload time. Null for media rows created before this field existed. */
      fileName: string | null;
      caption: string | null;
      displayOrder: number | null;
      /** Pre-signed S3 GET url, short-lived - generated fresh on every response, not stored */
      viewUrl: string;
    }[];
    sections: {
      id: string;
      packageId: string;
      heading: string | null;
      blockType: "richtext" | "table" | "metrics" | "callout";
      /** Richtext/table HTML/text content. Always null for callout/metrics blocks - see blockData. */
      content: string | null;
      /** Structured payload for callout ({variant, title?, body}) or metrics ({metrics: [{label, value, caption?}]}) blocks. Always null for richtext/table. */
      blockData:
        | (
            | {
                variant: "info" | "warning" | "success";
                title?: string;
                body: string;
              }
            | {
                metrics: {
                  label: string;
                  value: string;
                  caption?: string;
                }[];
              }
          )
        | null;
      displayOrder: number | null;
    }[];
    /** In display order. */
    faqs: {
      id: string;
      question: string;
      /** HTML, sanitised when it was saved; carries no images, video or embedded frames. Sanitise again with the same DOMPurify profile before rendering. */
      answerHtml: string;
      displayOrder: number;
    }[];
  };
export type GetPackagesByIdApiArg = {
  id: string;
};
export type GetPackagesByIdUpdatesApiResponse = /** status 200 Updates */ {
  /** Newest first (by when it was published, then id). */
  items: {
    id: string;
    title: string;
    /** Sanitised HTML with no media. Sanitise again before rendering. */
    bodyHtml: string;
    publishedAt: string;
    images: {
      id: string;
      fileName: string | null;
      altText: string | null;
      displayOrder: number;
      /** Short-lived signed link, made fresh on every response, never stored. */
      viewUrl: string;
    }[];
  }[];
  total: number;
  page: number;
  pageSize: number;
  /** The package these updates belong to, so an updates page has a title even when GET /packages/{id} is a 404 (an archived package a holder still holds). */
  package: {
    id: string;
    name: string;
  };
};
export type GetPackagesByIdUpdatesApiArg = {
  id: string;
  page?: number;
  pageSize?: number;
};
export type GetPackagesByIdPreviewApiResponse = /** status 200 The package */ {
  package: {
    id: string;
    name: string;
    subtitle: string | null;
    status: "draft" | "published" | "archived";
    roiMin: string | null;
    roiMax: string | null;
    minInvestment: string;
    tenureYears: number | null;
    isDynamic: boolean;
    active: boolean;
    /** COMPUTED, not stored - the distinct set of payoutCadence values across this package's allocated categories. Not settable via B3/B4; changes automatically as allocations (B5) or a category's own payoutCadence change. */
    payoutOptions: ("quarterly" | "half_yearly" | "yearly")[];
    /** Raw S3 object key - not directly viewable, see coverImageViewUrl */
    coverImageUrl: string | null;
    /** Pre-signed S3 GET url, short-lived - generated fresh on every response, not stored. Null if no cover image is set. */
    coverImageViewUrl: string | null;
    /** Per-package investment disclaimer, authored by an admin with the same rich-text editor as content sections (HTML: formatting/headings/lists/links; images and video are rejected). Must be sanitized with the same DOMPurify profile used for content sections before rendering - never a separate, weaker allowlist. The investor accepts it with a checkbox on every investment; the accepted HTML is copied onto that investment verbatim (investments.disclaimerAcceptedText) so editing this field never changes what a past investor already accepted. */
    disclaimerText: string | null;
    /** How many updates have been published for this package. */
    updateCount: number;
    /** When the newest published update was published; null when there is none. */
    latestUpdateAt: string | null;
  };
  allocations: {
    packageId: string;
    categoryId: string;
    weight: string;
    category: {
      id: string;
      name: string;
      /** The category's description: sanitised HTML with no media, null when there is none. Sanitise again before rendering. */
      descriptionHtml: string | null;
      /** The category's cover image: a short-lived signed link, made fresh on every response; null when there is none. */
      coverImageViewUrl: string | null;
    };
  }[];
  galleries: {
    id: string;
    packageId: string;
    categoryId: string | null;
    title: string | null;
    displayOrder: number | null;
    media: {
      id: string;
      packageId: string;
      galleryId: string | null;
      /** true for rich-text inline content media (always galleryId: null); false for gallery-attached media. Explicit discriminator. */
      isContentMedia: boolean;
      type: "image" | "video";
      /** Raw S3 object key - not directly viewable, see viewUrl */
      url: string;
      /** Original uploaded file name (e.g. 'gold-trading-1.jpg'), captured at upload time. Null for media rows created before this field existed. */
      fileName: string | null;
      caption: string | null;
      displayOrder: number | null;
      /** Pre-signed S3 GET url, short-lived - generated fresh on every response, not stored */
      viewUrl: string;
    }[];
  }[];
  keyInfo: {
    id: string;
    packageId: string;
    label: string;
    value: string;
    displayOrder: number | null;
  }[];
  resources: {
    id: string;
    packageId: string;
    label: string;
    url: string;
  }[];
  documents: {
    id: string;
    packageId: string;
    title: string;
    /** Raw S3 object key - not directly viewable, see viewUrl */
    fileUrl: string;
    /** Original uploaded file name (e.g. 'Investment Brochure.pdf'), captured at upload time. Null for document rows created before this field existed. */
    fileName: string | null;
    displayOrder: number | null;
    /** Pre-signed S3 GET url, short-lived - generated fresh on every response, not stored */
    viewUrl: string;
  }[];
  contentMedia: {
    id: string;
    packageId: string;
    galleryId: string | null;
    /** true for rich-text inline content media (always galleryId: null); false for gallery-attached media. Explicit discriminator. */
    isContentMedia: boolean;
    type: "image" | "video";
    /** Raw S3 object key - not directly viewable, see viewUrl */
    url: string;
    /** Original uploaded file name (e.g. 'gold-trading-1.jpg'), captured at upload time. Null for media rows created before this field existed. */
    fileName: string | null;
    caption: string | null;
    displayOrder: number | null;
    /** Pre-signed S3 GET url, short-lived - generated fresh on every response, not stored */
    viewUrl: string;
  }[];
  sections: {
    id: string;
    packageId: string;
    heading: string | null;
    blockType: "richtext" | "table" | "metrics" | "callout";
    /** Richtext/table HTML/text content. Always null for callout/metrics blocks - see blockData. */
    content: string | null;
    /** Structured payload for callout ({variant, title?, body}) or metrics ({metrics: [{label, value, caption?}]}) blocks. Always null for richtext/table. */
    blockData:
      | (
          | {
              variant: "info" | "warning" | "success";
              title?: string;
              body: string;
            }
          | {
              metrics: {
                label: string;
                value: string;
                caption?: string;
              }[];
            }
        )
      | null;
    displayOrder: number | null;
  }[];
  /** In display order. */
  faqs: {
    id: string;
    question: string;
    /** HTML, sanitised when it was saved; carries no images, video or embedded frames. Sanitise again with the same DOMPurify profile before rendering. */
    answerHtml: string;
    displayOrder: number;
  }[];
  /** The first page of published updates. */
  updates: {
    /** Newest first (by when it was published, then id). */
    items: {
      id: string;
      title: string;
      /** Sanitised HTML with no media. Sanitise again before rendering. */
      bodyHtml: string;
      publishedAt: string;
      images: {
        id: string;
        fileName: string | null;
        altText: string | null;
        displayOrder: number;
        /** Short-lived signed link, made fresh on every response, never stored. */
        viewUrl: string;
      }[];
    }[];
    total: number;
    page: number;
    pageSize: number;
  };
  previewExpiresAt: string;
};
export type GetPackagesByIdPreviewApiArg = {
  id: string;
  "x-preview-token"?: string;
};
export type GetPackagesByIdPerformanceApiResponse =
  /** status 200 The published figures */ {
    package: {
      id: string;
      name: string;
    };
    /** Published figures only, newest year first. Empty when there are none (show nothing). */
    years: {
      year: number;
      /** The first day the figure covers (YYYY-MM-DD): 1 January, or the package's first earning day in its first year. */
      from: string;
      /** Always 31 December of the year. */
      to: string;
      /** True for a first year that starts after 1 January (shown "From <date>"). */
      partial: boolean;
      /** What to show beside the figure: "2025", or "From 14 March 2025" for a partial first year. */
      label: string;
      /** The average annual return credited to the package's investors that year, one decimal. */
      averageAnnualReturnPct: string;
    }[];
    /** The fixed footnote to show with the figures, as-is (wording pending legal review). */
    footnote: string;
  };
export type GetPackagesByIdPerformanceApiArg = {
  id: string;
};
export type PostEsignInvestmentsByInvestmentIdEnvelopeApiResponse =
  /** status 200 Envelope + its template's fields */ {
    envelope: EsignEnvelope;
    fields: EsignField[];
    /** Everyone who signs besides the investor, in signing order. Each signs in person on this device, after the investor: ask about each optional one (prompt), collect the boxes whose signerKey is theirs (name, and any email, phone or address), then hand them the device for their signature. Empty: the investor signs alone. */
    signers: EsignSigner[];
    /** What the agreement still needs from the investor. Opening the document is allowed with details missing (they can be corrected on the document), but signing is refused until requirements.complete is true - so show what is missing before the investor tries to sign. */
    requirements: AgreementRequirements;
  };
export type PostEsignInvestmentsByInvestmentIdEnvelopeApiArg = {
  investmentId: string;
};
export type GetEsignEnvelopesByEnvelopeIdPreviewApiResponse = unknown;
export type GetEsignEnvelopesByEnvelopeIdPreviewApiArg = {
  envelopeId: string;
};
export type GetEsignEnvelopesByEnvelopeIdPartyDetailsApiResponse =
  /** status 200 The details as they will appear on the agreement */ {
    partyDetails: AgreementPartyDetails;
  };
export type GetEsignEnvelopesByEnvelopeIdPartyDetailsApiArg = {
  envelopeId: string;
};
export type PatchEsignEnvelopesByEnvelopeIdPartyDetailsApiResponse =
  /** status 200 The updated details and which fields changed */ {
    partyDetails: AgreementPartyDetails;
    /** What happened to the bank-account parts of the request (accountHolder, accountAddress, bankDetails): applied at once (the details did not exist yet), a change to existing details waiting for the emailed code, or unchanged. Null when none were sent. */
    bankAccountChange: BankChangeOutcome | null;
    /** The fields whose value on the agreement actually changed (empty if everything sent matched what was already there). Re-fetch the preview PDF after a change. */
    changed: string[];
  };
export type PatchEsignEnvelopesByEnvelopeIdPartyDetailsApiArg = {
  envelopeId: string;
  body: {
    fullName?: string;
    phone?: string;
    nationality?: string;
    address?: string;
    taxId?: string;
    identityDocumentType?: ("passport" | "national_id") | null;
    identityDocumentNumber?: string | null;
    nextOfKin?: {
      name: string;
      relationship?: string;
      phone?: string;
      email?: string;
      address?: string;
    } | null;
    /** Refused - send nothing here. The account holder is entered as a first and last name (accountHolder), not a single legal name. */
    legalName?: string;
    accountHolder?: {
      firstName?: string;
      lastName?: string;
    };
    accountAddress?: {
      street?: string;
      city?: string;
      state?: string;
      postcode?: string;
      /** ISO 3166-1 alpha-2, e.g. GB (not UK). */
      country?: string;
    };
    bankDetails?: {
      bankName?: string;
      country?: string;
      /** Refused - send nothing here. Currency can't be chosen - all investments and payouts are in US dollars. */
      currency?: string;
      accountNumber?: string;
      iban?: string;
      swiftBic?: string;
      localClearingCode?: string;
      additionalDetails?: {
        [key: string]: string;
      };
    };
  };
};
export type GetEsignEnvelopesByEnvelopeIdTermsApiResponse =
  /** status 200 The terms as they will appear on the agreement */ {
    terms: AgreementTerms;
  };
export type GetEsignEnvelopesByEnvelopeIdTermsApiArg = {
  envelopeId: string;
};
export type PatchEsignEnvelopesByEnvelopeIdTermsApiResponse =
  /** status 200 The updated terms and which of them changed */ {
    terms: AgreementTerms;
    /** The terms whose value actually changed (empty if everything sent matched what was already there). Re-fetch the preview PDF after a change. */
    changed: string[];
  };
export type PatchEsignEnvelopesByEnvelopeIdTermsApiArg = {
  envelopeId: string;
  body: {
    /** Must be one of the options the package offers (see `payoutOptions` on GET .../terms). */
    payoutFrequency?: "quarterly" | "half_yearly" | "yearly";
    /** Only for a package where the investor chooses the lock-in period (`tenureEditable`); refused for a fixed-tenure package. */
    chosenTenureYears?: number;
  };
};
export type PostEsignEnvelopesByEnvelopeIdSignatureUploadsPresignApiResponse =
  /** status 200 Upload the PNG directly to uploadUrl */ {
    /** Pre-signed S3 PUT url - PUT the drawn signature PNG directly here */
    uploadUrl: string;
    objectKey: string;
    expiresIn: number;
  };
export type PostEsignEnvelopesByEnvelopeIdSignatureUploadsPresignApiArg = {
  envelopeId: string;
  body: {
    mimeType: "image/png";
    sizeBytes: number;
  };
};
export type PostEsignEnvelopesByEnvelopeIdSignApiResponse =
  /** status 200 Envelope completed */ {
    envelope: EsignEnvelope;
    recipients: EsignRecipient[];
  };
export type PostEsignEnvelopesByEnvelopeIdSignApiArg = {
  envelopeId: string;
  body: {
    /** The keys (signers[].key from the envelope) of every signer besides the investor who is signing now, on this device, after the investor. Every signer with required: true must be listed (else 422 ROLE_REQUIRED); a key that isn't one of this agreement's signers is 422 ROLE_UNKNOWN. A signer left out is skipped: their boxes are ignored and nothing is recorded for them. */
    presentRoles?: string[];
    /** Deprecated: send presentRoles instead. true means presentRoles ["witness"], false or left out means none. Sent together with presentRoles, the two must agree about the witness (else 422 PRESENT_ROLES_CONFLICT). true on an agreement with no witness: 400. */
    witnessPresent?: boolean;
    values: {
      fieldId: string;
      value?: string;
      signature?:
        | {
            method: "drawn";
            objectKey: string;
          }
        | {
            method: "typed";
            text: string;
          };
    }[];
  };
};
export type GetEsignEnvelopesByEnvelopeIdDownloadApiResponse =
  /** status 200 Short-lived download url */ {
    /** Pre-signed S3 GET url, short-lived */
    url: string;
  };
export type GetEsignEnvelopesByEnvelopeIdDownloadApiArg = {
  envelopeId: string;
};
export type GetInvestorsMeBankAccountApiResponse =
  /** status 200 The account */ {
    bankAccount: BankAccount | null;
    readiness: BankReadiness;
    pendingChange: PendingBankChange | null;
  };
export type GetInvestorsMeBankAccountApiArg = void;
export type GetInvestorsMeBankAccountRequirementsApiResponse =
  /** status 200 The requirements */ {
    requirements: BankRequirements;
  };
export type GetInvestorsMeBankAccountRequirementsApiArg = {
  country: string;
};
export type PostInvestorsMeBankAccountChangesApiResponse =
  | /** status 200 status unchanged (nothing differed) or applied (first entry, saved at once with no code) */ {
      outcome: BankChangeOutcome;
    }
  | /** status 202 status pending_confirmation: a change to existing details; a code was emailed and it applies only when confirmed */ {
      outcome: BankChangeOutcome;
    };
export type PostInvestorsMeBankAccountChangesApiArg = {
  body: {
    accountHolder?: {
      firstName?: string;
      lastName?: string;
    };
    accountAddress?: {
      street?: string;
      city?: string;
      state?: string;
      postcode?: string;
      /** ISO 3166-1 alpha-2, e.g. GB (not UK). */
      country?: string;
    };
    bankDetails?: {
      bankName?: string;
      country?: string;
      /** Refused - send nothing here. Currency can't be chosen - all investments and payouts are in US dollars. */
      currency?: string;
      accountNumber?: string;
      iban?: string;
      swiftBic?: string;
      localClearingCode?: string;
      additionalDetails?: {
        [key: string]: string;
      };
    };
  };
};
export type PostInvestorsMeBankAccountChangesByChangeIdConfirmApiResponse =
  /** status 200 Applied */ {
    bankAccount: BankAccount;
    readiness: BankReadiness;
  };
export type PostInvestorsMeBankAccountChangesByChangeIdConfirmApiArg = {
  changeId: string;
  body: {
    code: string;
  };
};
export type PostInvestorsMeBankAccountChangesByChangeIdCancelApiResponse =
  /** status 200 Cancelled */ {
    change: {
      id: string;
      status: "cancelled";
    };
  };
export type PostInvestorsMeBankAccountChangesByChangeIdCancelApiArg = {
  changeId: string;
};
export type PostInvestorsMeBankAccountChangesByChangeIdResendApiResponse =
  /** status 200 A new code was emailed */ {
    change: PendingBankChange;
  };
export type PostInvestorsMeBankAccountChangesByChangeIdResendApiArg = {
  changeId: string;
};
export type GetPortfolioApiResponse = /** status 200 The portfolio */ {
  /** A calendar day, YYYY-MM-DD (UTC). */
  asOf: string;
  totals: {
    /** The total of the signed investments that stand (signed up to matured). */
    committed: string;
    /** Everything the investor has ever invested: the principal of every investment that was activated (running, matured, exited early, withdrawn or reinvested). A reinvestment counts only for new money it brought, never the reinvested principal a second time. Profit is not in it. */
    totalInvested: string;
    /** Capital currently locked in running investments, from the ledger. */
    activeCapital: string;
    /** Principal of matured (or exited) investments that is the investor's to withdraw or reinvest and is not yet on its way: the amount due, less anything already withdrawn, reinvested or being withdrawn. From the ledger. */
    withdrawable: string;
    /** Principal in a withdrawal that was approved and has not been paid yet. From the ledger. */
    withdrawalOnItsWay: string;
    /** activeCapital + withdrawable + withdrawalOnItsWay: the investor's principal still with BricketX. The same money is only ever in one of the three, so it is counted once; a paid withdrawal leaves it. Profit is not in it (payouts are in paidToDate). */
    currentValue: string;
    /** Every payout paid so far across all the investments, closed ones included: the sum of each investment's `paid.total`. */
    paidToDate: string;
    remaining: {
      /** A range in whole dollars: the minimum rounded down and the maximum rounded up. Worked out from the investor's own signed annual range, their principal and the days (actual/365) - an estimate, not a promise. */
      range: {
        /** A USD amount with two decimals, e.g. "4250.00". */
        min: string;
        /** A USD amount with two decimals, e.g. "4250.00". */
        max: string;
      };
    };
    /** The soonest next payout across the investments. */
    nextPayout: {
      /** scheduled: not due yet. being_prepared: due, or already being prepared and approved (the amount shows once it is raised for approval). on_its_way: sent to the bank, not yet paid. */
      state: "scheduled" | "being_prepared" | "on_its_way";
      /** The day it is expected: the day after the period it covers ends. A date that has passed means it is being prepared, not that it was missed. */
      expectedDate: string;
      /** A calendar day, YYYY-MM-DD (UTC). */
      periodEnd: string;
      /** A range in whole dollars: the minimum rounded down and the maximum rounded up. Worked out from the investor's own signed annual range, their principal and the days (actual/365) - an estimate, not a promise. */
      range: {
        /** A USD amount with two decimals, e.g. "4250.00". */
        min: string;
        /** A USD amount with two decimals, e.g. "4250.00". */
        max: string;
      };
      /** The payout's amount; null until it has been raised for approval (and while it is held or being redone). */
      amount: string | null;
      /** Plain text when we have paused this payout and chose to tell you why; null otherwise. It is the whole message: there is nothing more to show. */
      holdMessage: string | null;
      investmentId: string;
      internalRef: string;
    } | null;
    /** Every investment past draft is counted in exactly one: active, matured, in progress (signed, funding or waiting for activation), or closed (paid out or reinvested in full, cancelled, or funding reversed). */
    counts: {
      active: number;
      matured: number;
      inProgress: number;
      closed: number;
    };
  };
  investments: {
    id: string;
    internalRef: string;
    packageName: string;
    status:
      | "draft"
      | "docs_signed"
      | "pending_funding"
      | "funding_received"
      | "funding_shortfall"
      | "pending_approval"
      | "active"
      | "matured"
      | "funding_reversed"
      | "withdrawn"
      | "cancelled";
    maturityKind: ("maturity" | "early_exit") | null;
    maturityOutcome: ("withdrawn" | "reinvested" | "partial") | null;
    /** Null unless the investor accepted pooling. Only the marker: never a pool id, its size or its other investors. */
    poolInvestment: {
      state: "waiting_for_pool" | "in_pool";
    } | null;
    /** On a matured investment: the investment started from it by a reinvestment (a cancelled draft does not count). Null while none exists. */
    reinvestedIntoInvestmentId: string | null;
    /** A USD amount with two decimals, e.g. "4250.00". */
    principal: string;
    currency: string;
    startDate: string | null;
    maturityDate: string | null;
    payoutFrequency: ("quarterly" | "half_yearly" | "yearly") | null;
    /** The investor's own annual return range, fixed when they signed. Null before signing. */
    annualReturnRange: {
      minPct: string;
      maxPct: string;
    } | null;
    /** Payouts paid so far, for a running, matured or closed (withdrawn) investment. Null before the investment is active. */
    paid: {
      /** A USD amount with two decimals, e.g. "4250.00". */
      total: string;
      count: number;
      lastPaidDate: string | null;
    } | null;
    /** Null until the investment is active, and once its last payout has been paid. */
    nextPayout: {
      /** scheduled: not due yet. being_prepared: due, or already being prepared and approved (the amount shows once it is raised for approval). on_its_way: sent to the bank, not yet paid. */
      state: "scheduled" | "being_prepared" | "on_its_way";
      /** The day it is expected: the day after the period it covers ends. A date that has passed means it is being prepared, not that it was missed. */
      expectedDate: string;
      /** A calendar day, YYYY-MM-DD (UTC). */
      periodEnd: string;
      /** A range in whole dollars: the minimum rounded down and the maximum rounded up. Worked out from the investor's own signed annual range, their principal and the days (actual/365) - an estimate, not a promise. */
      range: {
        /** A USD amount with two decimals, e.g. "4250.00". */
        min: string;
        /** A USD amount with two decimals, e.g. "4250.00". */
        max: string;
      };
      /** The payout's amount; null until it has been raised for approval (and while it is held or being redone). */
      amount: string | null;
      /** Plain text when we have paused this payout and chose to tell you why; null otherwise. It is the whole message: there is nothing more to show. */
      holdMessage: string | null;
    } | null;
    /** An estimate of what is still to come up to maturity, the next payout included. Null until the investment is active. */
    remaining: {
      /** A range in whole dollars: the minimum rounded down and the maximum rounded up. Worked out from the investor's own signed annual range, their principal and the days (actual/365) - an estimate, not a promise. */
      range: {
        /** A USD amount with two decimals, e.g. "4250.00". */
        min: string;
        /** A USD amount with two decimals, e.g. "4250.00". */
        max: string;
      };
    } | null;
  }[];
};
export type GetPortfolioApiArg = void;
export type GetPortfolioActivityApiResponse =
  /** status 200 A page of activity */ {
    items: {
      id: string;
      /** When it happened (ISO 8601). */
      at: string;
      type:
        | "committed"
        | "signed"
        | "funds_received"
        | "activated"
        | "payout_sent"
        | "payout_paid"
        | "refund_sent";
      investmentId: string;
      internalRef: string;
      /** Set for funds received, a payout sent or paid, and a refund sent. */
      amount: string | null;
    }[];
    /** Pass as `before` to get the next, older page; null at the end. */
    nextCursor: string | null;
  };
export type GetPortfolioActivityApiArg = {
  limit?: number;
  before?: string;
};
export type GetPortfolioTransactionsApiResponse =
  /** status 200 A page of transactions */ {
    items: {
      id: string;
      /** When the money moved (ISO 8601): the deposit was applied to the investment, the payout or withdrawal settled, the refund was accepted by the bank. */
      at: string;
      /** deposit_received: the first deposit on an investment. top_up_received: a later deposit on the same investment. payout_paid, withdrawal_paid, refund_sent: money sent to the investor's bank. */
      kind:
        | "deposit_received"
        | "top_up_received"
        | "payout_paid"
        | "withdrawal_paid"
        | "refund_sent";
      /** in: money the investor sent to BricketX. out: money BricketX sent to the investor's bank. */
      direction: "in" | "out";
      /** A USD amount with two decimals, e.g. "4250.00". */
      amount: string;
      investmentId: string;
      internalRef: string;
    }[];
    /** Pass as `before` to get the next, older page; null at the end. */
    nextCursor: string | null;
  };
export type GetPortfolioTransactionsApiArg = {
  limit?: number;
  before?: string;
};
export type GetInvestmentsByIdSpreadApiResponse = /** status 200 The spread */ {
  investmentId: string;
  internalRef: string;
  /** The total deployed at activation; null before the investment was activated. */
  deployed: string | null;
  categories: {
    categoryId: string;
    name: string;
    /** The share of the mix when the investment was activated, as a fraction ("0.4000" = 40%). Later changes to the package's mix do not change it. */
    weight: string;
    /** What was deployed into the category at activation. */
    amount: string;
  }[];
};
export type GetInvestmentsByIdSpreadApiArg = {
  id: string;
};
export type GetNotificationsApiResponse =
  /** status 200 A page of notifications */ {
    items: {
      id: string;
      /** The event, e.g. investment.activated. Stable: safe to switch an icon on. */
      type: string;
      title: string;
      /** One short sentence for a person; never an amount, a name or an account. */
      text: string;
      /** What opening the item should show; null when it points at nothing in particular. */
      link: {
        /** The kind of record the item opens; each audience only receives the kinds its own pages show (an admin's report item is `report`, opened from Reports). */
        type:
          | "investment"
          | "statement"
          | "statement_batch"
          | "report"
          | "ticket"
          | "kyc"
          | "account_closure"
          | "approval_request"
          | "refund"
          | "reconciliation"
          | "investment_pool"
          | "commission"
          | "agent"
          | "note"
          | "package"
          | "project";
        id: string;
      } | null;
      read: boolean;
      /** ISO 8601. */
      createdAt: string;
    }[];
    nextCursor: string | null;
    unreadCount: number;
  };
export type GetNotificationsApiArg = {
  limit?: number;
  /** Page with the previous page's `nextCursor`. */
  before?: string;
};
export type GetNotificationsUnreadCountApiResponse =
  /** status 200 The count */ {
    unreadCount: number;
  };
export type GetNotificationsUnreadCountApiArg = void;
export type PostNotificationsReadAllApiResponse =
  /** status 200 How many were marked */ {
    marked: number;
    unreadCount: number;
  };
export type PostNotificationsReadAllApiArg = void;
export type PostNotificationsByIdReadApiResponse =
  /** status 200 The item and the new unread count */ {
    notification: {
      id: string;
      /** The event, e.g. investment.activated. Stable: safe to switch an icon on. */
      type: string;
      title: string;
      /** One short sentence for a person; never an amount, a name or an account. */
      text: string;
      /** What opening the item should show; null when it points at nothing in particular. */
      link: {
        /** The kind of record the item opens; each audience only receives the kinds its own pages show (an admin's report item is `report`, opened from Reports). */
        type:
          | "investment"
          | "statement"
          | "statement_batch"
          | "report"
          | "ticket"
          | "kyc"
          | "account_closure"
          | "approval_request"
          | "refund"
          | "reconciliation"
          | "investment_pool"
          | "commission"
          | "agent"
          | "note"
          | "package"
          | "project";
        id: string;
      } | null;
      read: boolean;
      /** ISO 8601. */
      createdAt: string;
    };
    unreadCount: number;
  };
export type PostNotificationsByIdReadApiArg = {
  id: string;
};
export type GetNotificationsPreferencesApiResponse =
  /** status 200 The settings */ {
    updatesByEmail: boolean;
    /** What is emailed whatever the setting says, written for the investor. */
    alwaysEmailed: string[];
  };
export type GetNotificationsPreferencesApiArg = void;
export type PatchNotificationsPreferencesApiResponse =
  /** status 200 The settings */ {
    updatesByEmail: boolean;
    /** What is emailed whatever the setting says, written for the investor. */
    alwaysEmailed: string[];
  };
export type PatchNotificationsPreferencesApiArg = {
  body: {
    /** Also email me about updates (payments, payouts, statements, support replies). Security and account emails are always sent. */
    updatesByEmail: boolean;
  };
};
export type GetDashboardOverviewApiResponse = /** status 200 The panel */ {
  /** Null until an administrator has written it: show nothing. */
  overview: {
    title: string;
    /** Sanitised HTML. Render it through your own sanitiser as well. */
    bodyHtml: string;
    /** A short-lived link to the image (about five minutes); fetch the overview again for a fresh one. Null when there is no image. */
    imageUrl: string | null;
    updatedAt: string;
  } | null;
};
export type GetDashboardOverviewApiArg = void;
export type PostAuthMobileLoginApiResponse =
  | /** status 200 Tokens (or a second step) */ {
      accessToken: string;
      /** Single-use: send it to POST /auth/mobile/refresh for the next pair and store the NEW one (the old one is spent). Keep it in the device keychain/keystore, never in plain storage. */
      refreshToken: string;
      user: {
        id: string;
        role: string;
        email: string;
      };
    }
  | {
      user: {
        id: string;
        role: string;
        email: string;
      };
      mfaRequired: true;
      /** Single-use, 5 minutes, bound to this sign-in. Send it with the code to POST /auth/mobile/mfa/verify. */
      mfaToken: string;
    };
export type PostAuthMobileLoginApiArg = {
  body: {
    email: string;
    password: string;
  };
};
export type PostAuthMobileMfaVerifyApiResponse = /** status 200 Tokens */ {
  accessToken: string;
  /** Single-use: send it to POST /auth/mobile/refresh for the next pair and store the NEW one (the old one is spent). Keep it in the device keychain/keystore, never in plain storage. */
  refreshToken: string;
  recoveryCodesRemaining?: number;
};
export type PostAuthMobileMfaVerifyApiArg = {
  body: {
    mfaToken: string;
    totp?: string;
    recoveryCode?: string;
  };
};
export type PostAuthMobileRefreshApiResponse = /** status 200 A new pair */ {
  accessToken: string;
  /** Single-use: send it to POST /auth/mobile/refresh for the next pair and store the NEW one (the old one is spent). Keep it in the device keychain/keystore, never in plain storage. */
  refreshToken: string;
};
export type PostAuthMobileRefreshApiArg = {
  body: {
    /** The refresh token the app stored in the device keychain from the last sign-in or refresh. */
    refreshToken: string;
  };
};
export type PostAuthMobileLogoutApiResponse = unknown;
export type PostAuthMobileLogoutApiArg = {
  body: {
    /** The refresh token the app stored in the device keychain from the last sign-in or refresh. */
    refreshToken: string;
  };
};
export type GetAccountClosureApiResponse = /** status 200 The request */ {
  /** The investor's latest request, or null if they have never made one. */
  request: AccountClosureRequest | null;
};
export type GetAccountClosureApiArg = void;
export type PostAccountClosureApiResponse =
  | /** status 200 Already pending */ {
      request: AccountClosureRequest;
    }
  | /** status 201 Request made */ {
      request: AccountClosureRequest;
    };
export type PostAccountClosureApiArg = {
  body: {
    /** Why, in the investor's own words. Optional. */
    reason?: string;
  };
};
export type PostAccountClosureCancelApiResponse = /** status 200 Cancelled */ {
  request: AccountClosureRequest;
};
export type PostAccountClosureCancelApiArg = void;
export type GetTicketsApiResponse = /** status 200 A page of tickets */ {
  tickets: OwnTicket[];
  total: number;
  page: number;
  pageSize: number;
};
export type GetTicketsApiArg = {
  status?:
    "open" | "awaiting_investor" | "awaiting_admin" | "resolved" | "closed";
  page?: number;
  pageSize?: number;
};
export type PostTicketsApiResponse =
  /** status 201 The ticket with its thread */ {
    ticket: OwnTicketDetail;
  };
export type PostTicketsApiArg = {
  body: {
    issueType:
      | "kyc"
      | "payment"
      | "documents"
      | "payout"
      | "withdrawal"
      | "package_query"
      | "technical"
      | "general";
    subject: string;
    /** Plain text, up to 5,000 characters. Escape it when showing it. */
    message: string;
    /** One of the investor's own investments this is about. Not their own: 404. */
    investmentId?: string;
    /** A package this is about. Not together with `investmentId`. */
    packageId?: string;
    /** Up to 5 files (PDF, JPEG or PNG, 10 MB each), each uploaded through a presign first. Read back and checked when the message is sent; a refused file is deleted. */
    attachments?: {
      /** The `objectKey` from the presign call, after the file was uploaded to its `uploadUrl`. */
      objectKey: string;
      /** The name to show for the file. */
      fileName: string;
    }[];
  };
};
export type GetTicketsSummaryApiResponse = /** status 200 The counts */ {
  /** Opened and not yet answered by support. */
  open: number;
  /** Support answered and is waiting for the investor. */
  awaitingInvestor: number;
  /** The investor replied and is waiting for support. */
  awaitingAdmin: number;
  resolved: number;
};
export type GetTicketsSummaryApiArg = void;
export type PostTicketsAttachmentsPresignApiResponse =
  /** status 200 The upload URL */ {
    /** Pre-signed PUT url: upload the file directly to this with the same Content-Type, not to the API. */
    uploadUrl: string;
    objectKey: string;
    expiresIn: number;
  };
export type PostTicketsAttachmentsPresignApiArg = {
  body: {
    fileName: string;
    mimeType: "image/jpeg" | "image/png" | "application/pdf";
    sizeBytes: number;
  };
};
export type GetTicketsByIdApiResponse = /** status 200 The ticket */ {
  ticket: OwnTicketDetail;
};
export type GetTicketsByIdApiArg = {
  id: string;
};
export type PostTicketsByIdRepliesApiResponse =
  /** status 201 The ticket with its thread */ {
    ticket: OwnTicketDetail;
  };
export type PostTicketsByIdRepliesApiArg = {
  id: string;
  body: {
    /** Plain text, up to 5,000 characters. Escape it when showing it. */
    message: string;
    /** Up to 5 files (PDF, JPEG or PNG, 10 MB each), each uploaded through a presign first. Read back and checked when the message is sent; a refused file is deleted. */
    attachments?: {
      /** The `objectKey` from the presign call, after the file was uploaded to its `uploadUrl`. */
      objectKey: string;
      /** The name to show for the file. */
      fileName: string;
    }[];
  };
};
export type PostTicketsByIdCloseApiResponse =
  /** status 200 The closed ticket */ {
    ticket: OwnTicketDetail;
  };
export type PostTicketsByIdCloseApiArg = {
  id: string;
};
export type GetTicketsByIdAttachmentsAndAttachmentIdDownloadApiResponse =
  /** status 200 The link */ {
    /** A link good for about five minutes. */
    url: string;
  };
export type GetTicketsByIdAttachmentsAndAttachmentIdDownloadApiArg = {
  id: string;
  attachmentId: string;
};
export type GetInvestmentsPoolingDisclaimerApiResponse =
  /** status 200 The disclaimer */ {
    /** False until an administrator has written the pooling disclaimer; do not offer pooling then. */
    available: boolean;
    /** HTML. Sanitise before rendering. */
    html: string | null;
    /** Send this back as `poolingDisclaimerVersion` with `poolingAccepted: true`; a stale one is refused. */
    version: number;
    /** The smallest amount that can be invested through a pool. */
    minMemberAmount: string;
  };
export type GetInvestmentsPoolingDisclaimerApiArg = void;
export type GetInvestmentsByIdMaturityApiResponse =
  /** status 200 Where it stands */ {
    maturity: OwnMaturity;
  };
export type GetInvestmentsByIdMaturityApiArg = {
  id: string;
};
export type PostInvestmentsByIdMaturityRequestApiResponse =
  | /** status 200 You already had an open request */ {
      request: MaturityRequest;
      /** True when you already had an open request: nothing new was made and it is returned. */
      alreadyOpen: boolean;
    }
  | /** status 201 Your request */ {
      request: MaturityRequest;
      /** True when you already had an open request: nothing new was made and it is returned. */
      alreadyOpen: boolean;
    };
export type PostInvestmentsByIdMaturityRequestApiArg = {
  id: string;
  maturityRequestInput: MaturityRequestInput;
};
export type PostInvestmentsByIdMaturityRequestCancelApiResponse =
  /** status 200 The cancelled request */ {
    request: MaturityRequest;
  };
export type PostInvestmentsByIdMaturityRequestCancelApiArg = {
  id: string;
};
export type GetInvestmentsByIdEarlyExitApiResponse =
  /** status 200 Your latest request */ {
    /** Your latest early exit request, or null. */
    request: OwnEarlyExit | null;
  };
export type GetInvestmentsByIdEarlyExitApiArg = {
  id: string;
};
export type PostInvestmentsByIdEarlyExitApiResponse =
  | /** status 200 You already had an open request */ {
      request: OwnEarlyExit;
      /** True when you already had an open request: nothing new was made and it is returned. */
      alreadyOpen: boolean;
    }
  | /** status 201 Your request */ {
      request: OwnEarlyExit;
      /** True when you already had an open request: nothing new was made and it is returned. */
      alreadyOpen: boolean;
    };
export type PostInvestmentsByIdEarlyExitApiArg = {
  id: string;
  earlyExitRequestInput: EarlyExitRequestInput;
};
export type PostInvestmentsByIdEarlyExitCancelApiResponse =
  /** status 200 The cancelled request */ {
    request: OwnEarlyExit;
  };
export type PostInvestmentsByIdEarlyExitCancelApiArg = {
  id: string;
};
export type PostMaturityRequestsByIdCommitReinvestmentApiResponse =
  | /** status 200 It was already started */ {
      /** disclaimerAcceptedText (HTML, sanitise before rendering) and agreementPartySnapshot (what the signed agreement says; null before signing) are the investor's own agreement data. status can be "funding_shortfall" - a shortfall over the limit BricketX covers automatically blocks activation for an admin to resolve manually; admins see it on the admin investment screens, and an investor sees it as this status value and shortfall's sign/size. */
      investment: {
        id: string;
        investorId: string;
        /** The investor's own RFID (BX-RFID-xxxxxx); null until their first investment has been activated. */
        investorRfid: string | null;
        packageId: string;
        agentId: string | null;
        maturityKind: ("maturity" | "early_exit") | null;
        maturityOutcome: ("withdrawn" | "reinvested" | "partial") | null;
        /** On a reinvestment: the matured investment its money came from. Null otherwise. */
        reinvestedFromInvestmentId: string | null;
        /** On a matured investment: the investment started from it by a reinvestment (a cancelled draft does not count). Null while none exists. */
        reinvestedIntoInvestmentId: string | null;
        principal: string;
        amountReceived: string | null;
        shortfall: string | null;
        currency: string;
        payoutFrequency: ("quarterly" | "half_yearly" | "yearly") | null;
        chosenTenureYears: number | null;
        internalRef: string;
        status:
          | "draft"
          | "docs_signed"
          | "pending_funding"
          | "funding_received"
          | "funding_shortfall"
          | "pending_approval"
          | "active"
          | "matured"
          | "funding_reversed"
          | "withdrawn"
          | "cancelled";
        paymentSentAt: string | null;
        topUpSentAt: string | null;
        professionalDeclarationAccepted: boolean;
        professionalDeclarationAcceptedAt: string | null;
        disclaimerAcceptedAt: string | null;
        disclaimerAcceptedText: string | null;
        /** Null unless the investor accepted pooling. Only the marker: never a pool id, its size or its other investors. */
        poolInvestment: {
          state: "waiting_for_pool" | "in_pool";
        } | null;
        poolingAcceptedAt: string | null;
        /** The pooling disclaimer exactly as the investor accepted it. HTML: sanitise before rendering. */
        poolingAcceptedText: string | null;
        agreementPartySnapshot: {
          partyType?: "individual" | "business";
          fullName?: string;
          email?: string;
          phone?: string;
          nationalityOrJurisdiction?: string | null;
          primaryIdentityNumber?: string | null;
          taxId?: string | null;
          address?: string | null;
          identityDocumentType: string | null;
          identityDocumentNumber: string | null;
          nextOfKin: {
            name: string;
            relationship: string | null;
            phone: string | null;
            email: string | null;
            address: string | null;
          } | null;
          bankDetails: {
            legalName: string;
            /** The bank as printed on the signed agreement, with the account number, IBAN and clearing code MASKED to their last four characters (••••6819). The whole values are on the signed PDF only. */
            details: {
              [key: string]: any;
            };
          } | null;
        } | null;
        startDate: string | null;
        /** When the investment ends: the signed date, or the exit date once an early exit has taken effect. */
        maturityDate: string | null;
        /** Read only. The maturity date printed on the signed agreement, kept when an early exit moved `maturityDate` to the exit date. Null for an investment whose date never moved. */
        originalMaturityDate: string | null;
        lockInEnd: string | null;
        createdAt: string;
        package: {
          id: string;
          name: string;
          isDynamic: boolean;
          tenureYears: number | null;
        };
      };
      /** True when the new investment had already been started: nothing new was made. */
      resumed: boolean;
    }
  | /** status 201 The new draft investment */ {
      /** disclaimerAcceptedText (HTML, sanitise before rendering) and agreementPartySnapshot (what the signed agreement says; null before signing) are the investor's own agreement data. status can be "funding_shortfall" - a shortfall over the limit BricketX covers automatically blocks activation for an admin to resolve manually; admins see it on the admin investment screens, and an investor sees it as this status value and shortfall's sign/size. */
      investment: {
        id: string;
        investorId: string;
        /** The investor's own RFID (BX-RFID-xxxxxx); null until their first investment has been activated. */
        investorRfid: string | null;
        packageId: string;
        agentId: string | null;
        maturityKind: ("maturity" | "early_exit") | null;
        maturityOutcome: ("withdrawn" | "reinvested" | "partial") | null;
        /** On a reinvestment: the matured investment its money came from. Null otherwise. */
        reinvestedFromInvestmentId: string | null;
        /** On a matured investment: the investment started from it by a reinvestment (a cancelled draft does not count). Null while none exists. */
        reinvestedIntoInvestmentId: string | null;
        principal: string;
        amountReceived: string | null;
        shortfall: string | null;
        currency: string;
        payoutFrequency: ("quarterly" | "half_yearly" | "yearly") | null;
        chosenTenureYears: number | null;
        internalRef: string;
        status:
          | "draft"
          | "docs_signed"
          | "pending_funding"
          | "funding_received"
          | "funding_shortfall"
          | "pending_approval"
          | "active"
          | "matured"
          | "funding_reversed"
          | "withdrawn"
          | "cancelled";
        paymentSentAt: string | null;
        topUpSentAt: string | null;
        professionalDeclarationAccepted: boolean;
        professionalDeclarationAcceptedAt: string | null;
        disclaimerAcceptedAt: string | null;
        disclaimerAcceptedText: string | null;
        /** Null unless the investor accepted pooling. Only the marker: never a pool id, its size or its other investors. */
        poolInvestment: {
          state: "waiting_for_pool" | "in_pool";
        } | null;
        poolingAcceptedAt: string | null;
        /** The pooling disclaimer exactly as the investor accepted it. HTML: sanitise before rendering. */
        poolingAcceptedText: string | null;
        agreementPartySnapshot: {
          partyType?: "individual" | "business";
          fullName?: string;
          email?: string;
          phone?: string;
          nationalityOrJurisdiction?: string | null;
          primaryIdentityNumber?: string | null;
          taxId?: string | null;
          address?: string | null;
          identityDocumentType: string | null;
          identityDocumentNumber: string | null;
          nextOfKin: {
            name: string;
            relationship: string | null;
            phone: string | null;
            email: string | null;
            address: string | null;
          } | null;
          bankDetails: {
            legalName: string;
            /** The bank as printed on the signed agreement, with the account number, IBAN and clearing code MASKED to their last four characters (••••6819). The whole values are on the signed PDF only. */
            details: {
              [key: string]: any;
            };
          } | null;
        } | null;
        startDate: string | null;
        /** When the investment ends: the signed date, or the exit date once an early exit has taken effect. */
        maturityDate: string | null;
        /** Read only. The maturity date printed on the signed agreement, kept when an early exit moved `maturityDate` to the exit date. Null for an investment whose date never moved. */
        originalMaturityDate: string | null;
        lockInEnd: string | null;
        createdAt: string;
        package: {
          id: string;
          name: string;
          isDynamic: boolean;
          tenureYears: number | null;
        };
      };
      /** True when the new investment had already been started: nothing new was made. */
      resumed: boolean;
    };
export type PostMaturityRequestsByIdCommitReinvestmentApiArg = {
  id: string;
  body: {
    /** The package's disclaimer, accepted as for any investment. */
    disclaimerAccepted: boolean;
    professionalDeclarationAccepted: boolean;
  };
};
export type GetDashboardStatsApiResponse =
  /** status 200 The numbers */ InvestorDashboardStats;
export type GetDashboardStatsApiArg = void;
export type Error = {
  error: {
    code: string;
    message: string;
    details?: any;
  };
};
export type BankAccount = {
  id: string;
  entityType: "individual" | "company";
  legalName: string;
  firstName: string | null;
  lastName: string | null;
  currency: "USD";
  address: {
    street: string | null;
    city: string | null;
    state: string | null;
    postcode: string | null;
    country: string | null;
  } | null;
  bankDetails: {
    bankName: string | null;
    country: string | null;
    /** The account number or IBAN masked to its last four characters. The full number is never returned. */
    accountReference: string | null;
    swiftBic: string | null;
    localClearingCode: string | null;
  };
  /** When the details were last changed. Null when it was not recorded (the account predates change tracking). */
  detailsChangedAt: string | null;
  /** Admin responses only. Airwallex checks the details in the background and the investor is never shown its answer. */
  validation?: {
    status: "validated" | "not_validated" | "refused";
    validatedAt: string | null;
    /** Why Airwallex refused the details; null unless status is refused. */
    message: string | null;
  };
};
export type AgreementRequirements = {
  /** True when nothing is missing - the details do not stop the agreement being signed. */
  complete: boolean;
  /** Everything required of this investor, filled in or not - mark exactly these as required. Differs by investor type (a company has no identity-document fields; its registration number comes from its verified business record). Next of kin and tax ID are not required. */
  required: {
    /** Stable identifier, safe to key on. */
    key: string;
    /** Written for the investor - use it as the field's label. */
    label: string;
    /** Where it is supplied, as request-body paths (e.g. bankDetails.swiftBic). When there are several, any ONE of them satisfies the requirement (account number or IBAN). */
    fields: string[];
  }[];
  /** The required items still missing, in form order. */
  missing: {
    /** Stable identifier, safe to key on. */
    key: string;
    /** Written for the investor - use it as the field's label. */
    label: string;
    /** Where it is supplied, as request-body paths (e.g. bankDetails.swiftBic). When there are several, any ONE of them satisfies the requirement (account number or IBAN). */
    fields: string[];
    /** A sentence for the investor saying what to add. Show as-is. */
    message: string;
  }[];
};
export type PendingBankChange = {
  id: string;
  expiresAt: string;
  resendAvailableAt: string;
  resendsLeft: number;
  attemptsLeft: number;
};
export type BankReadiness = {
  /** Every required detail is given. */
  complete: boolean;
  /** Admin responses only. Complete AND accepted by Airwallex - the only state a refund or payout can be sent to. */
  ready?: boolean;
  /** The required details that are still empty. */
  missing: {
    field: string;
    label: string;
    kind: "missing";
    /** A sentence for the investor. Show as-is. */
    message: string;
  }[];
  /** Admin responses only: what Airwallex's background check of the details answered. */
  validationStatus?: "validated" | "not_validated" | "refused";
};
export type BankChangeOutcome = {
  status: "unchanged" | "applied" | "pending_confirmation";
  /** Set only for pending_confirmation. */
  change: PendingBankChange | null;
  /** Set only for applied: the saved account. */
  bankAccount: BankAccount | null;
  /** Set only for applied. */
  readiness: BankReadiness | null;
};
export type KycProfileInvestor = {
  id: string;
  investorId: string;
  kycType: ("individual" | "business") | null;
  status:
    | "draft"
    | "submitted"
    | "under_review"
    | "approved"
    | "rejected"
    | "more_info_requested";
  currentStep:
    | (
        | "basic_info"
        | "investor_type"
        | "identity"
        | "face"
        | "address"
        | "source_of_funds"
        | "review"
      )
    | null;
  fullLegalName: string | null;
  dateOfBirth: string | null;
  nationality: string | null;
  countryOfResidence: string | null;
  countryOfCitizenship: string | null;
  expectedInvestmentAmount: string | null;
  isPep: boolean;
  pepDetails: string | null;
  actingOnBehalf: boolean;
  taxId: string | null;
  fatcaCrsSubmitted: boolean;
  declarationAccepted: boolean;
  declarationAcceptedAt: string | null;
  heardAboutUs: string | null;
  lastReviewedAt: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
  /** ISO 8601 timestamp */
  updatedAt: string;
};
export type KycIndividualDetails = {
  id: string;
  kycProfileId: string;
  fatherOrHusbandName: string | null;
  residentialAddress: string | null;
  occupation: string | null;
  employerName: string | null;
};
export type CompanyDirector = {
  id: string;
  companyKycId: string;
  fullName: string;
  nationality: string | null;
  designation: string | null;
  isAuthorizedSignatory: boolean;
  kycDocumentId: string | null;
  addressDocumentId: string | null;
};
export type UboRecord = {
  id: string;
  companyKycId: string;
  fullName: string;
  nationality: string | null;
  ownershipPercentage: string | null;
  isPep: boolean;
  kycDocumentId: string | null;
};
export type BeneficialOwner = {
  id: string;
  kycProfileId: string;
  fullName: string;
  nationality: string | null;
  relationship: string | null;
  kycDocumentId: string | null;
};
export type KycDocumentInvestor = {
  id: string;
  kycProfileId: string;
  ownerType: "applicant" | "director" | "ubo" | "beneficial_owner" | "company";
  ownerId: string;
  documentType:
    | "passport"
    | "national_id"
    | "driving_license"
    | "proof_of_address"
    | "company_reg_cert"
    | "trade_license"
    | "moa_aoa"
    | "bank_statement"
    | "tax_certificate"
    | "financial_statements"
    | "board_resolution"
    | "power_of_attorney"
    | "cap_table"
    | "ubo_declaration"
    | "salary_slip"
    | "property_deed"
    | "inheritance_doc"
    | "fatca_crs";
  category:
    "identity" | "address" | "source_of_funds" | "company" | "authorization";
  /** S3 object key, not a public URL */
  fileUrl: string;
  status: "pending" | "verified" | "rejected" | "expired";
  rejectionReason: string | null;
  /** ISO 8601 timestamp */
  uploadedAt: string;
  verifiedAt: string | null;
  expiryDate: string | null;
};
export type SourceOfFunds = {
  id: string;
  kycProfileId: string;
  primarySource:
    | "salary"
    | "business_income"
    | "investment_returns"
    | "property_sale"
    | "inheritance_gift"
    | "other";
  sourceOfWealth: string | null;
  annualIncome: string | null;
  currency: string | null;
  explanation: string | null;
  /** ISO 8601 timestamp */
  createdAt: string;
};
export type KycReviewInvestor = {
  decision: "approve" | "reject" | "request_more_info";
  notes: string | null;
  /** ISO 8601 timestamp */
  createdAt: string;
};
export type KycEvent = {
  type: "submitted" | "resubmitted" | "under_review" | "restarted";
  /** ISO 8601 timestamp */
  createdAt: string;
};
export type KycDocumentRequestInvestor = {
  id: string;
  kycProfileId: string;
  ownerType: "investor" | "director" | "ubo" | "company";
  /** Null for the investor's own document. For a company, its company record id; else the director's, UBO's or beneficial owner's id. */
  ownerId: string | null;
  /** Whose document, for display: "You" (investor) or "Investor: <name>" (admin), "Director: <name>", "UBO: <name>", "Beneficial owner: <name>", "Company". */
  ownerLabel: string;
  category:
    "identity" | "address" | "source_of_funds" | "company" | "authorization";
  replacesDocumentId: string | null;
  reason: string;
  /** open: waiting for an upload (again after a rejected one); submitted: uploaded, waiting for compliance; fulfilled: verified; cancelled. */
  status: "open" | "submitted" | "fulfilled" | "cancelled";
  /** Why the last upload was not accepted, while the request is open again; null otherwise. */
  rejectionReason: string | null;
  submittedDocumentId: string | null;
  /** ISO 8601 timestamp (UTC) */
  createdAt: string;
  submittedAt: string | null;
  fulfilledAt: string | null;
  cancelledAt: string | null;
};
export type CompanyKyc = {
  id: string;
  kycProfileId: string;
  companyName: string | null;
  regNumber: string | null;
  jurisdiction: string | null;
  incorporationDate: string | null;
  natureOfBusiness: string | null;
  registeredAddress: string | null;
  taxId: string | null;
  bankDetails: {
    [key: string]: any;
  } | null;
};
export type EsignEnvelope = {
  id: string;
  templateId: string;
  investmentId: string | null;
  status: "pending" | "completed" | "declined";
  documentHash: string | null;
  completedDate: string | null;
  createdAt: string;
};
export type EsignField = {
  id: string;
  type:
    | "signature"
    | "initials"
    | "date_signed"
    | "full_name"
    | "email"
    | "company"
    | "title"
    | "textbox"
    | "checkbox"
    | "dropdown"
    | "radio_group";
  fillMode: "auto" | "signer_entered" | "signature";
  label: string | null;
  dataBinding: string | null;
  page: number;
  position: {
    xFrac: number;
    yFrac: number;
    widthFrac: number;
    heightFrac: number;
    fontSizePt?: number;
    choices?: {
      value: string;
      xFrac: number;
      widthFrac: number;
    }[];
    wraps?: boolean;
  };
  required: boolean;
  options: any | null;
  /** For a box the signer types into, what it must hold (checked at signing): text, email, phone (with its country code; spaces, brackets, dashes and dots are ignored) or address. A name box (type full_name) must be in Latin letters (422 NAME_NOT_LATIN). null for anything else. */
  format: ("text" | "email" | "phone" | "address") | null;
  /** The kind of signer who fills it: investor, witness, or additional (a signer the admin named; see signerKey). */
  templateRoleKey:
    | (
        | "me_now"
        | "sender"
        | "investor"
        | "agent"
        | "joint"
        | "witness"
        | "additional"
        | "custom"
      )
    | null;
  /** Who fills it: "investor" or the key of one of signers[]. null: no signer (treated as the investor's). */
  signerKey: string | null;
};
export type EsignSigner = {
  /** The signer's key: what presentRoles lists and fields[].signerKey names (e.g. witness, guarantor). */
  key: string;
  /** The signer's name as people read it, e.g. Guarantor. */
  label: string;
  /** true: they must sign now (list them in presentRoles). false: ask the investor the prompt; list them only if the answer is yes. */
  required: boolean;
  /** The order they sign in, after the investor. */
  signingOrder: number | null;
  /** The question to ask the investor about an optional signer, e.g. "Do you have a Guarantor?". */
  prompt: string;
};
export type AgreementPartyDetails = {
  envelopeId: string;
  /** True while the agreement is unsigned. Once signed (or no longer open), nothing can be corrected and PATCH returns 409. */
  editable: boolean;
  partyType: "individual" | "business";
  fullName: string;
  /** Read-only - see readOnlyFields. */
  email: string;
  phone: string;
  /** Nationality (individual) or jurisdiction of incorporation (company) - exactly what the agreement prints. */
  nationality: string | null;
  /** Residential (individual) or registered (company) address, as printed. */
  address: string | null;
  taxId: string | null;
  identityDocumentType: ("passport" | "national_id") | null;
  /** Passport / national ID number (individual) or company registration number (company) - the value in the agreement's "Passport / Registration No." row. */
  identityDocumentNumber: string | null;
  nextOfKin: {
    name: string;
    relationship: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
  } | null;
  /** The payout bank account the agreement prints, masked. Changing it goes through a confirmation code: see pendingBankChange. */
  bankAccount: {
    legalName: string;
    firstName: string | null;
    lastName: string | null;
    /** Always USD - never asked for or stored. */
    currency: string;
    address: {
      street: string | null;
      city: string | null;
      state: string | null;
      postcode: string | null;
      country: string | null;
    } | null;
    /** The bank, masked: the account number or IBAN shows only its last four characters (accountReference). */
    details: {
      [key: string]: any;
    };
  } | null;
  /** A bank-details change waiting for the investor's emailed code. Signing is refused (409) while one is waiting. */
  pendingBankChange: PendingBankChange | null;
  /** What is still needed before this agreement can be signed - the same shape and rules as GET /investors/me/agreement-profile. Signing is refused (422, AGREEMENT_DETAILS_INCOMPLETE) until complete. */
  requirements: AgreementRequirements;
  /** Fields shown on the agreement that can't be corrected here, with the reason. */
  readOnlyFields: {
    field: string;
    /** Written for the investor - show it as-is. */
    reason: string;
  }[];
};
export type AgreementTerms = {
  envelopeId: string;
  /** True while the agreement is unsigned. Once signed (or no longer open), nothing can be corrected and PATCH returns 409. */
  editable: boolean;
  /** Read-only - see readOnlyFields. */
  packageName: string;
  /** Read-only on the agreement - see readOnlyFields for why and where to change it instead. `value` is a decimal string. */
  amount: {
    value: string;
    currency: string;
  };
  payoutFrequency: ("quarterly" | "half_yearly" | "yearly") | null;
  /** The payout frequencies this package offers - `payoutFrequency` must be one of them. */
  payoutOptions: ("quarterly" | "half_yearly" | "yearly")[];
  /** True for a package where the investor chooses the lock-in period. */
  tenureEditable: boolean;
  /** The lock-in period the investor chose (dynamic packages); null for a fixed-tenure package. */
  chosenTenureYears: number | null;
  /** A fixed-tenure package's own lock-in period; null for a dynamic package. */
  fixedTenureYears: number | null;
  /** Valid values for `chosenTenureYears` when `tenureEditable`. */
  tenureRange: {
    min: number;
    max: number;
  };
  /** Terms shown on the agreement that can't be changed here, with the reason. */
  readOnlyFields: {
    field: string;
    /** Written for the investor - show it as-is. */
    reason: string;
  }[];
};
export type EsignRecipient = {
  id: string;
  role: string | null;
  status: "pending" | "viewed" | "signed" | "declined";
  displayName: string | null;
  signedDate: string | null;
};
export type BankRequirements = {
  country: string | null;
  entityType: "individual" | "company";
  currency: "USD";
  fields: {
    /** The request-body path to send this value in, e.g. bankDetails.iban or accountAddress.postcode. */
    name: string;
    /** Written for the investor - use as the field's label. */
    label: string;
    /** Never true for the IBAN or the account number: see `oneOf`. No field has a format rule. */
    required: boolean;
  }[];
  /** Groups of field names where at least one must be given: always the account number or the IBAN (neither has a format rule of its own). */
  oneOf: string[][];
};
export type AccountClosureRequest = {
  id: string;
  /** pending = waiting for an administrator; approved = the account is closed (you can no longer sign in); rejected = see `decisionReason`; cancelled = you withdrew it. */
  status: "pending" | "approved" | "rejected" | "cancelled";
  /** What the investor wrote when asking. */
  reason: string | null;
  requestedAt: string;
  decidedAt: string | null;
  /** Why it was rejected. Plain text: escape it when showing it. */
  decisionReason: string | null;
  cancelledAt: string | null;
};
export type OwnTicket = {
  id: string;
  issueType:
    | "kyc"
    | "payment"
    | "documents"
    | "payout"
    | "withdrawal"
    | "package_query"
    | "technical"
    | "general";
  subject: string;
  /** open = nobody has answered yet; awaiting_admin = you wrote last; awaiting_investor = we replied and are waiting for you; resolved = we consider it answered (replying reopens it); closed = finished (no more replies). */
  status:
    "open" | "awaiting_investor" | "awaiting_admin" | "resolved" | "closed";
  investment: {
    id: string;
    internalRef: string;
  } | null;
  package: {
    id: string;
    name: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
  lastMessageFrom: "you" | "support";
};
export type TicketAttachment = {
  id: string;
  fileName: string;
  contentType: "image/jpeg" | "image/png" | "application/pdf";
  sizeBytes: number;
};
export type OwnTicketMessage = {
  id: string;
  /** Support staff are never named. */
  from: "you" | "support";
  /** Plain text: escape it when showing it. */
  body: string;
  createdAt: string;
  attachments: TicketAttachment[];
};
export type OwnTicketDetail = {
  id: string;
  issueType:
    | "kyc"
    | "payment"
    | "documents"
    | "payout"
    | "withdrawal"
    | "package_query"
    | "technical"
    | "general";
  subject: string;
  /** open = nobody has answered yet; awaiting_admin = you wrote last; awaiting_investor = we replied and are waiting for you; resolved = we consider it answered (replying reopens it); closed = finished (no more replies). */
  status:
    "open" | "awaiting_investor" | "awaiting_admin" | "resolved" | "closed";
  investment: {
    id: string;
    internalRef: string;
  } | null;
  package: {
    id: string;
    name: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
  lastMessageFrom: "you" | "support";
  messages: OwnTicketMessage[];
};
export type MaturityRequest = {
  id: string;
  /** requested = waiting for us to be in touch; plan_confirmed = the terms are agreed, continue to sign; reinvestment_committed = your new agreement is under way; completed = done; declined = we could not proceed (we will have been in touch); cancelled = you withdrew it. */
  status:
    | "requested"
    | "plan_confirmed"
    | "reinvestment_committed"
    | "completed"
    | "declined"
    | "cancelled";
  option: "withdraw" | "reinvest" | "partial";
  package: {
    id: string;
    name: string;
  } | null;
  /** USD, for a partial reinvestment. */
  reinvestAmount: string | null;
  chosenTenureYears: number | null;
  payoutFrequency: ("quarterly" | "half_yearly" | "yearly") | null;
  note: string | null;
  /** The terms we have agreed with you, once confirmed. Start the new investment from them. */
  plan: {
    package: {
      id: string;
      name: string;
    };
    /** USD: what will be reinvested. */
    amount: string;
    chosenTenureYears: number | null;
    payoutFrequency: "quarterly" | "half_yearly" | "yearly";
  } | null;
  /** The new investment, once you have started it: continue and sign its agreement as for any investment. */
  reinvestmentInvestmentId: string | null;
  createdAt: string;
};
export type OwnMaturity = {
  investmentId: string;
  internalRef: string;
  packageName: string;
  /** running = before we have sent your maturity notice; notice_sent = we have; matured = the maturity date has passed and we are settling it; exit_approved = your early exit is approved: `amountDue` is what you will receive and `releasedAfter` the date after which it is released; settled = the amount due below is ready to withdraw or reinvest; closed = everything has been paid out or reinvested. */
  state:
    | "running"
    | "notice_sent"
    | "matured"
    | "exit_approved"
    | "settled"
    | "closed";
  maturityKind: ("maturity" | "early_exit") | null;
  /** Only in state exit_approved: the amount due is released after this date (YYYY-MM-DD; the end date of the profit period it waits for, normally a quarter end), or soon, if null. */
  releasedAfter: string | null;
  maturityDate: string;
  noticeSentAt: string | null;
  /** USD. The amount of your principal that is yours to withdraw or reinvest. Null until the investment has been settled. */
  amountDue: string | null;
  /** True only in state exit_approved while the last profit period is still to come: `amountDue` is then a good estimate that can still change before it is released. False once it is final (and when there is no amount yet). */
  amountDueIsEstimate: boolean;
  /** Whether you can ask us what to do with it now. */
  canRequest: boolean;
  /** The least you can reinvest, USD; a package may ask for more. */
  minimumReinvestment: string;
  /** Your latest request, or null. */
  request: MaturityRequest | null;
  /** Your withdrawal of this investment's principal, once we have raised one; null before. */
  withdrawal: {
    /** being_prepared = we are arranging it (this also covers a short delay we are looking into); on_its_way = sent to your bank; paid = delivered. */
    state: "being_prepared" | "on_its_way" | "paid";
    /** USD. */
    amount: string;
    /** Plain text when we have paused this withdrawal and chose to tell you why; null otherwise. It is the whole message: there is nothing more to show. */
    holdMessage: string | null;
  } | null;
};
export type MaturityRequestInput = {
  /** withdraw = take everything out; reinvest = put all of it into a new investment; partial = reinvest an amount and withdraw the rest. Nothing happens until an administrator has spoken with you and confirmed the terms. */
  option: "withdraw" | "reinvest" | "partial";
  /** Required for `reinvest` and `partial`, and refused for `withdraw`. */
  reinvest?: {
    /** Any published package. */
    packageId: string;
    /** Only for `partial`: the amount to reinvest, at least $50,000 (or the package's own minimum if higher), and less than everything. */
    amount?: string;
    /** Only for the Multi-Asset Fund: 1 to 5 years. */
    chosenTenureYears?: number;
    payoutFrequency: "quarterly" | "half_yearly" | "yearly";
  };
  /** Anything you want us to know. Optional. */
  note?: string;
};
export type OwnEarlyExit = {
  id: string;
  /** requested / under_review = with us; deferred = not now (see `deferredUntil` and our note); conditions_attached = we would agree on the conditions in `conditions`; approved = agreed, we are working out the final amount; rejected = see our note; settled = the amount due is ready (see your investment); cancelled = you withdrew it. */
  status:
    | "requested"
    | "under_review"
    | "deferred"
    | "conditions_attached"
    | "approved"
    | "rejected"
    | "settled"
    | "cancelled";
  message: string;
  /** Our answer, written for you. Plain text: escape it when showing it. */
  decisionNote: string | null;
  /** Plain text: escape it when showing it. */
  conditions: string | null;
  deferredUntil: string | null;
  decidedAt: string | null;
  createdAt: string;
};
export type EarlyExitRequestInput = {
  /** Your written request to withdraw or redeem your capital before the end of its lock-in period (Clause 12 of your agreement). The company may approve, reject, defer or attach conditions to it, and may apply costs and deductions if it approves. */
  message: string;
};
export type InvestorDashboardStats = {
  asOf: string;
  /** The day the account was created. */
  memberSince: string;
  /** Each paying investment's next payout, soonest first: the same as `nextPayout` in the portfolio. */
  upcomingPayouts: {
    investmentId: string;
    internalRef: string;
    packageName: string;
    state: "scheduled" | "being_prepared" | "on_its_way";
    expectedDate: string;
    periodEnd: string;
    range: {
      /** USD to two decimal places. */
      min: string;
      /** USD to two decimal places. */
      max: string;
    };
    /** Only once the payout has been prepared for sending; otherwise the estimate is `range`. */
    amount: string | null;
    /** Plain text when we have paused this payout and chose to tell you why; null otherwise. It is the whole message: there is nothing more to show. */
    holdMessage: string | null;
  }[];
  /** This month and the eleven after it, oldest first, every month listed. Every payout still expected on every investment (not only the next one), by the month it is expected in; a payout being prepared after its expected day counts in this month. Each range is worked out as the portfolio's next payout and remaining range are (from the range signed for, in whole dollars, the minimum rounded down and the maximum up). An estimate, not a promise. */
  upcomingByMonth: {
    /** YYYY-MM (UTC). */
    month: string;
    /** USD to two decimal places. */
    min: string;
    /** USD to two decimal places. */
    max: string;
    /** The month's total, only once every payout in it has been raised for approval or sent; null otherwise (the estimate is `min`..`max`). */
    amount: string | null;
    /** How many payouts are expected in the month. */
    count: number;
  }[];
  /** Where the investor's running capital sits, largest first: the amounts each running investment (active, or matured and not yet settled) put into each category at activation, from the ledger, added up. They add up to the capital still locked in those investments. A later change to a package's mix does not change them; profit is never in them. */
  allocationByCategory: {
    categoryId: string;
    name: string;
    /** What the investor's running investments deployed into this category when each was activated. */
    amount: string;
    /** This category's part of the total, as a fraction to four decimals ("0.4000" = 40%). Rounded, so the shares can add up to a hair over or under 1. */
    share: string;
  }[];
  /** Every payout paid so far on all the investor's investments, closed ones included - the same figure as `/portfolio`'s `totals.paidToDate`. The months below add up to this, or to less when something was paid more than 12 months ago. */
  paidToDate: string;
  /** Payouts really paid, by the month they were paid, for the last 12 months, oldest first. */
  paidByMonth: {
    /** YYYY-MM (UTC). */
    month: string;
    /** USD to two decimal places. */
    amount: string;
  }[];
  /** Principal plus the lowest and highest of the payouts still to come, worked out from the return range signed for. An estimate, not a promise. */
  projectedAtMaturity: {
    investments: {
      investmentId: string;
      internalRef: string;
      packageName: string;
      maturityDate: string | null;
      /** USD to two decimal places. */
      principal: string;
      /** USD to two decimal places. */
      min: string;
      /** USD to two decimal places. */
      max: string;
    }[];
    total: {
      /** USD to two decimal places. */
      principal: string;
      /** USD to two decimal places. */
      min: string;
      /** USD to two decimal places. */
      max: string;
    };
  };
};
export const {
  usePostAuthRegisterMutation,
  usePostAuthVerifyEmailMutation,
  usePostAuthResendOtpMutation,
  usePostAuthMfaVerifyMutation,
  usePostAuthForgotPasswordMutation,
  usePostAuthResetPasswordMutation,
  usePostAuthChangePasswordMutation,
  useGetAuthMeQuery,
  useLazyGetAuthMeQuery,
  useGetInvestorsMeAgreementProfileQuery,
  useLazyGetInvestorsMeAgreementProfileQuery,
  usePatchInvestorsMeAgreementProfileMutation,
  usePostInvestmentsMutation,
  useGetInvestmentsQuery,
  useLazyGetInvestmentsQuery,
  useGetInvestmentsByIdQuery,
  useLazyGetInvestmentsByIdQuery,
  usePatchInvestmentsByIdMutation,
  useGetInvestmentsByIdFundingInstructionsQuery,
  useLazyGetInvestmentsByIdFundingInstructionsQuery,
  usePostInvestmentsByIdCancelMutation,
  usePostInvestmentsByIdPaymentSentMutation,
  useGetInvestmentsByIdPaymentInstructionsQuery,
  useLazyGetInvestmentsByIdPaymentInstructionsQuery,
  useGetKycMeQuery,
  useLazyGetKycMeQuery,
  useGetKycMeDocumentRequestsQuery,
  useLazyGetKycMeDocumentRequestsQuery,
  usePatchKycMeBasicInfoMutation,
  usePatchKycMeInvestorTypeMutation,
  usePutKycMeIndividualDetailsMutation,
  usePutKycMeCompanyMutation,
  usePutKycMeSourceOfFundsMutation,
  usePostKycMeSubmitMutation,
  usePostKycMeRestartMutation,
  usePostKycDocumentsPresignMutation,
  usePostKycDocumentsMutation,
  useGetKycDocumentsByIdDownloadQuery,
  useLazyGetKycDocumentsByIdDownloadQuery,
  useDeleteKycDocumentsByIdMutation,
  useGetPackagesQuery,
  useLazyGetPackagesQuery,
  useGetPackagesByIdQuery,
  useLazyGetPackagesByIdQuery,
  useGetPackagesByIdUpdatesQuery,
  useLazyGetPackagesByIdUpdatesQuery,
  useGetPackagesByIdPreviewQuery,
  useLazyGetPackagesByIdPreviewQuery,
  useGetPackagesByIdPerformanceQuery,
  useLazyGetPackagesByIdPerformanceQuery,
  usePostEsignInvestmentsByInvestmentIdEnvelopeMutation,
  useGetEsignEnvelopesByEnvelopeIdPreviewQuery,
  useLazyGetEsignEnvelopesByEnvelopeIdPreviewQuery,
  useGetEsignEnvelopesByEnvelopeIdPartyDetailsQuery,
  useLazyGetEsignEnvelopesByEnvelopeIdPartyDetailsQuery,
  usePatchEsignEnvelopesByEnvelopeIdPartyDetailsMutation,
  useGetEsignEnvelopesByEnvelopeIdTermsQuery,
  useLazyGetEsignEnvelopesByEnvelopeIdTermsQuery,
  usePatchEsignEnvelopesByEnvelopeIdTermsMutation,
  usePostEsignEnvelopesByEnvelopeIdSignatureUploadsPresignMutation,
  usePostEsignEnvelopesByEnvelopeIdSignMutation,
  useGetEsignEnvelopesByEnvelopeIdDownloadQuery,
  useLazyGetEsignEnvelopesByEnvelopeIdDownloadQuery,
  useGetInvestorsMeBankAccountQuery,
  useLazyGetInvestorsMeBankAccountQuery,
  useGetInvestorsMeBankAccountRequirementsQuery,
  useLazyGetInvestorsMeBankAccountRequirementsQuery,
  usePostInvestorsMeBankAccountChangesMutation,
  usePostInvestorsMeBankAccountChangesByChangeIdConfirmMutation,
  usePostInvestorsMeBankAccountChangesByChangeIdCancelMutation,
  usePostInvestorsMeBankAccountChangesByChangeIdResendMutation,
  useGetPortfolioQuery,
  useLazyGetPortfolioQuery,
  useGetPortfolioActivityQuery,
  useLazyGetPortfolioActivityQuery,
  useGetPortfolioTransactionsQuery,
  useLazyGetPortfolioTransactionsQuery,
  useGetInvestmentsByIdSpreadQuery,
  useLazyGetInvestmentsByIdSpreadQuery,
  useGetNotificationsQuery,
  useLazyGetNotificationsQuery,
  useGetNotificationsUnreadCountQuery,
  useLazyGetNotificationsUnreadCountQuery,
  usePostNotificationsReadAllMutation,
  usePostNotificationsByIdReadMutation,
  useGetNotificationsPreferencesQuery,
  useLazyGetNotificationsPreferencesQuery,
  usePatchNotificationsPreferencesMutation,
  useGetDashboardOverviewQuery,
  useLazyGetDashboardOverviewQuery,
  usePostAuthMobileLoginMutation,
  usePostAuthMobileMfaVerifyMutation,
  usePostAuthMobileRefreshMutation,
  usePostAuthMobileLogoutMutation,
  useGetAccountClosureQuery,
  useLazyGetAccountClosureQuery,
  usePostAccountClosureMutation,
  usePostAccountClosureCancelMutation,
  useGetTicketsQuery,
  useLazyGetTicketsQuery,
  usePostTicketsMutation,
  useGetTicketsSummaryQuery,
  useLazyGetTicketsSummaryQuery,
  usePostTicketsAttachmentsPresignMutation,
  useGetTicketsByIdQuery,
  useLazyGetTicketsByIdQuery,
  usePostTicketsByIdRepliesMutation,
  usePostTicketsByIdCloseMutation,
  useGetTicketsByIdAttachmentsAndAttachmentIdDownloadQuery,
  useLazyGetTicketsByIdAttachmentsAndAttachmentIdDownloadQuery,
  useGetInvestmentsPoolingDisclaimerQuery,
  useLazyGetInvestmentsPoolingDisclaimerQuery,
  useGetInvestmentsByIdMaturityQuery,
  useLazyGetInvestmentsByIdMaturityQuery,
  usePostInvestmentsByIdMaturityRequestMutation,
  usePostInvestmentsByIdMaturityRequestCancelMutation,
  useGetInvestmentsByIdEarlyExitQuery,
  useLazyGetInvestmentsByIdEarlyExitQuery,
  usePostInvestmentsByIdEarlyExitMutation,
  usePostInvestmentsByIdEarlyExitCancelMutation,
  usePostMaturityRequestsByIdCommitReinvestmentMutation,
  useGetDashboardStatsQuery,
  useLazyGetDashboardStatsQuery,
} = injectedRtkApi;
