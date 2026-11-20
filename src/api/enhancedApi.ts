import { investorApi } from './generated/investorApi';

export const enhancedInvestorApi = investorApi.enhanceEndpoints({
  endpoints: {
        // Notifications
    getNotifications: {
      providesTags: ['Notifications'],
    },
    getNotificationsUnreadCount: {
      providesTags: ['Notifications'],
    },
    postNotificationsReadAll: {
      invalidatesTags: ['Notifications'],
    },
    postNotificationsByIdRead: {
      invalidatesTags: ['Notifications'],
    },

    // Support Tickets
    getTickets: {
      providesTags: (result) =>
        result?.tickets
          ? [
              ...result.tickets.map(({ id }) => ({ type: 'Tickets' as const, id })),
              { type: 'Tickets', id: 'LIST' },
            ]
          : [{ type: 'Tickets', id: 'LIST' }],
    },
    getTicketsSummary: {
      providesTags: ['Tickets'],
    },
    getTicketsById: {
      providesTags: (_result, _error, arg) => [{ type: 'Tickets', id: arg.id }],
    },
    postTickets: {
      invalidatesTags: [{ type: 'Tickets', id: 'LIST' }, 'Tickets', 'Notifications'],
    },
    postTicketsByIdReplies: {
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Tickets', id: arg.id },
        { type: 'Tickets', id: 'LIST' },
        'Tickets',
      ],
    },
    postTicketsByIdClose: {
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Tickets', id: arg.id },
        { type: 'Tickets', id: 'LIST' },
        'Tickets',
      ],
    },
  },
});

export * from './generated/investorApi';
