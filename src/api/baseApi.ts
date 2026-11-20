import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQuery';

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  // Cache fetched data in memory for 10 minutes (600s) across navigation tabs
  keepUnusedDataFor: 600,
  // Do not refetch all endpoints when switching mobile app foreground/background
  refetchOnFocus: false,
  refetchOnReconnect: false,
  tagTypes: [
    'Auth',
    'Kyc',
    'KycDocuments',
    'Investments',
    'Packages',
    'Portfolio',
    'E-Sign',
    'Investors',
    'DashboardStats',
    'Notifications',
    'AgreementProfile',
    'Tickets',
    'Investor Documents',
  ],
  endpoints: () => ({}),
});

