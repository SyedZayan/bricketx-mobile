import { GetInvestmentsByIdApiResponse } from '../api/generated/investorApi';

export interface PoolingOffer {
  available: boolean;
  html: string | null;
  version: number;
  minMemberAmount: number;
}

type PoolState = NonNullable<
  NonNullable<GetInvestmentsByIdApiResponse['investment']>['poolInvestment']
>['state'];

const POOL_STATE_LABELS: Record<string, { label: string; tone: 'warning' | 'success' | 'neutral' }> = {
  waiting_for_pool: { label: 'Waiting to be pooled', tone: 'warning' },
  in_pool: { label: 'Pooled', tone: 'success' },
};

export function getPoolStateMeta(state?: string): { label: string; tone: 'warning' | 'success' | 'neutral' } {
  if (!state) return { label: 'Pending', tone: 'neutral' };
  return (
    POOL_STATE_LABELS[state] ?? {
      label: state.charAt(0).toUpperCase() + state.slice(1).replace(/_/g, ' '),
      tone: 'neutral',
    }
  );
}

export function isBelowMinimum(principal: string | number, minInvestment: string | number): boolean {
  const amount = Number(principal);
  const min = Number(minInvestment);
  return !Number.isNaN(amount) && !Number.isNaN(min) && amount < min;
}