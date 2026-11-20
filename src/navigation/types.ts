import { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: { notice?: string; email?: string } | undefined;
  Register: undefined;
  VerifyEmail: { email: string; message?: string };
  ForgotPassword: { email?: string };
  ResetPassword: { email: string };
  MfaVerify: undefined;
  RoleBlocked: undefined;
};

export type KycStackParamList = {
  BasicInfo: undefined;
  InvestorType: undefined;
  IndividualDetails: undefined;
  CompanyKyb: undefined;
  IdentityDocs: undefined;
  FaceCapture: undefined;
  AddressDocs: undefined;
  SourceOfFunds: undefined;
  ReviewSubmit: undefined;
  KycStatus: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Packages: undefined;
  Investments: undefined;
  Account: undefined;
};

export type RootStackParamList = {
  AuthRoot: NavigatorScreenParams<AuthStackParamList>;
  MainRoot: NavigatorScreenParams<MainTabParamList>;
  Dashboard: undefined;
  Notifications: undefined;
  KycModal: NavigatorScreenParams<KycStackParamList> | undefined;
  KycProfileView:
    | {
        initialTab?: 'personal' | 'entity' | 'identity' | 'funds';
      }
    | undefined;
  PackageDetail: { id: string };
  CommitmentModal: {
    packageId: string;
    packageName: string;
    minInvestment: string;
    initialAmount?: number;
    existingInvestmentId?: string;
    isEditMode?: boolean;
    payoutOptions: ('quarterly' | 'half_yearly' | 'yearly')[];
    isDynamic: boolean;
    defaultTenureYears?: number | null;
    disclaimerText?: string | null;
  };
  InvestmentDetail: { id: string };
  EsignModal: {
    investmentId: string;
    internalRef: string;
    packageName: string;
  };
  FundingInstructionsModal: {
    investmentId: string;
    internalRef: string;
    principal?: string;
    currency?: string;
    envelopeId?: string;
  };
  UpdatePassword: undefined;
  AccountClosure: undefined;
  Support: undefined;
  NewTicket: { initialInvestmentId?: string; initialPackageId?: string } | undefined;
  TicketDetail: { id: string };
  Documents: { highlightKind?: string; highlightId?: string; initialInvestmentId?: string } | undefined;
  Statements: { highlightStatementId?: string; initialInvestmentId?: string } | undefined;
};
