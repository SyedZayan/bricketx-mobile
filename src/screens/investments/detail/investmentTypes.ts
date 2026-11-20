import { GetInvestmentsByIdApiResponse } from '../../../api/generated/investorApi';

export type InvestmentData = GetInvestmentsByIdApiResponse['investment'];
export type InvestmentStatus = InvestmentData['status'];

export interface StatusMeta {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
  step: number; // 1 to 5 for progressive pipeline
}

export const getStatusMeta = (
  status: InvestmentStatus,
  investment?: { paymentSentAt?: string | null } | null
): StatusMeta => {
  if (
    (status === 'pending_funding' || status === 'docs_signed') &&
    Boolean(investment?.paymentSentAt)
  ) {
    return {
      label: 'AWAITING APPROVAL',
      color: '#6A1B9A',
      bgColor: '#F3E5F5',
      borderColor: '#E1BEE7',
      description: 'Payment notice submitted. Our team is verifying your bank transfer.',
      step: 4,
    };
  }

  switch (status) {
    case 'draft':
      return {
        label: 'DRAFT ALLOCATION',
        color: '#B58D3D',
        bgColor: '#FAF5EE',
        borderColor: '#E7D7C1',
        description: 'Allocation registered. Awaiting agreement signature.',
        step: 1,
      };
    case 'docs_signed':
      return {
        label: 'AGREEMENT SIGNED',
        color: '#1565C0',
        bgColor: '#E3F2FD',
        borderColor: '#BBDEFB',
        description: 'Agreement executed. Ready for bank transfer.',
        step: 2,
      };
    case 'pending_funding':
      return {
        label: 'AWAITING TRANSFER',
        color: '#D87A16',
        bgColor: '#FFF8E1',
        borderColor: '#FFE082',
        description: 'Payment instructions issued. Please transfer your investment principal.',
        step: 2,
      };
    case 'funding_received':
      return {
        label: 'FUNDS RECEIVED',
        color: '#2E7D32',
        bgColor: '#E8F5E9',
        borderColor: '#C8E6C9',
        description: 'Transfer received. Final review in progress.',
        step: 3,
      };
    case 'funding_shortfall':
      return {
        label: 'FUNDING SHORTFALL',
        color: '#C62828',
        bgColor: '#FFEBEE',
        borderColor: '#FFCDD2',
        description: 'Received amount is less than the investment principal.',
        step: 3,
      };
    case 'pending_approval':
      return {
        label: 'AWAITING APPROVAL',
        color: '#6A1B9A',
        bgColor: '#F3E5F5',
        borderColor: '#E1BEE7',
        description: 'Your investment is undergoing final review.',
        step: 4,
      };
    case 'active':
      return {
        label: 'ACTIVE INVESTMENT',
        color: '#2E7D32',
        bgColor: '#E8F5E9',
        borderColor: '#A5D6A7',
        description: 'Investment active. Payouts are scheduled according to your plan.',
        step: 5,
      };
    case 'matured':
      return {
        label: 'MATURED',
        color: '#37474F',
        bgColor: '#ECEFF1',
        borderColor: '#CFD8DC',
        description: 'Term completed. Principal is ready for redemption or reinvestment.',
        step: 5,
      };
    case 'cancelled':
    case 'funding_reversed':
    case 'withdrawn':
    default:
      return {
        label: (status || 'UNKNOWN').toUpperCase().replace(/_/g, ' '),
        color: '#757575',
        bgColor: '#EEEEEE',
        borderColor: '#E0E0E0',
        description: 'Investment is closed or archived.',
        step: 0,
      };
  }
};