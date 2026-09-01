import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '@/app/api';
import { DEALS_API_ENDPOINTS } from '@/app/apiEndpoints';
import { ApiSuccessResponse } from '@/modules/settings/models';
import { Deal } from '../models';

export const dealsApi = createApi({
  reducerPath: 'dealsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Deal'],
  endpoints: (builder) => ({
    getDeals: builder.query<Deal[], number | string>({
      query: (orgId) => ({ url: DEALS_API_ENDPOINTS.BASE(orgId), method: 'GET' }),
      transformResponse: (response: ApiSuccessResponse<Deal[]>) => response.data,
      providesTags: (result) =>
        result
          ? [...result.map((d) => ({ type: 'Deal' as const, id: d.id })), { type: 'Deal' as const, id: 'LIST' }]
          : [{ type: 'Deal' as const, id: 'LIST' }],
    }),

    getDeal: builder.query<Deal, { orgId: number | string; id: number | string }>({
      query: ({ orgId, id }) => ({ url: DEALS_API_ENDPOINTS.BY_ID(orgId, id), method: 'GET' }),
      transformResponse: (response: ApiSuccessResponse<Deal>) => response.data,
      providesTags: (_r, _e, { id }) => [{ type: 'Deal', id }],
    }),

    createDeal: builder.mutation<Deal, { orgId: number | string; title: string }>({
      query: ({ orgId, title }) => ({ url: DEALS_API_ENDPOINTS.BASE(orgId), method: 'POST', body: { title } }),
      transformResponse: (response: ApiSuccessResponse<Deal>) => response.data,
      invalidatesTags: [{ type: 'Deal', id: 'LIST' }],
    }),

    addDealLineItem: builder.mutation<
      Deal,
      {
        orgId: number | string;
        dealId: number | string;
        itemId: number;
        quantity: number;
        warehouseId?: number;
        pricingTierId?: number;
      }
    >({
      query: ({ orgId, dealId, ...body }) => ({
        url: DEALS_API_ENDPOINTS.LINE_ITEMS(orgId, dealId),
        method: 'POST',
        body,
      }),
      transformResponse: (response: ApiSuccessResponse<Deal>) => response.data,
      invalidatesTags: (_r, _e, { dealId }) => [
        { type: 'Deal', id: dealId },
        { type: 'Deal', id: 'LIST' },
      ],
    }),

    removeDealLineItem: builder.mutation<
      Deal,
      { orgId: number | string; dealId: number | string; lineId: number }
    >({
      query: ({ orgId, dealId, lineId }) => ({
        url: DEALS_API_ENDPOINTS.LINE_ITEM(orgId, dealId, lineId),
        method: 'DELETE',
      }),
      transformResponse: (response: ApiSuccessResponse<Deal>) => response.data,
      invalidatesTags: (_r, _e, { dealId }) => [
        { type: 'Deal', id: dealId },
        { type: 'Deal', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetDealsQuery,
  useGetDealQuery,
  useCreateDealMutation,
  useAddDealLineItemMutation,
  useRemoveDealLineItemMutation,
} = dealsApi;
