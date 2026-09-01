import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '@/app/api';
import { TERRITORIES_API_ENDPOINTS } from '@/app/apiEndpoints';
import { ApiSuccessResponse, RoleStatus, Territory } from '../models';

export interface CreateTerritoryBody {
  name: string;
  managerUserId?: number | string;
}

export interface UpdateTerritoryArgs {
  orgId: number | string;
  id: number | string;
  name?: string;
  managerUserId?: number | string | null;
  status?: RoleStatus;
}

export const territoriesApi = createApi({
  reducerPath: 'territoriesApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Territory'],
  endpoints: (builder) => ({
    getTerritories: builder.query<Territory[], number | string>({
      query: (orgId) => ({ url: TERRITORIES_API_ENDPOINTS.BASE(orgId), method: 'GET' }),
      transformResponse: (response: ApiSuccessResponse<Territory[]>) => response.data,
      providesTags: (result) =>
        result
          ? [
              ...result.map((t) => ({ type: 'Territory' as const, id: t.id })),
              { type: 'Territory' as const, id: 'LIST' },
            ]
          : [{ type: 'Territory' as const, id: 'LIST' }],
    }),

    createTerritory: builder.mutation<Territory, { orgId: number | string; body: CreateTerritoryBody }>({
      query: ({ orgId, body }) => ({
        url: TERRITORIES_API_ENDPOINTS.BASE(orgId),
        method: 'POST',
        body,
      }),
      transformResponse: (response: ApiSuccessResponse<Territory>) => response.data,
      invalidatesTags: [{ type: 'Territory', id: 'LIST' }],
    }),

    updateTerritory: builder.mutation<Territory, UpdateTerritoryArgs>({
      query: ({ orgId, id, ...body }) => ({
        url: TERRITORIES_API_ENDPOINTS.BY_ID(orgId, id),
        method: 'PUT',
        body,
      }),
      transformResponse: (response: ApiSuccessResponse<Territory>) => response.data,
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Territory', id },
        { type: 'Territory', id: 'LIST' },
      ],
    }),

    deleteTerritory: builder.mutation<void, { orgId: number | string; id: number | string }>({
      query: ({ orgId, id }) => ({
        url: TERRITORIES_API_ENDPOINTS.BY_ID(orgId, id),
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Territory', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetTerritoriesQuery,
  useCreateTerritoryMutation,
  useUpdateTerritoryMutation,
  useDeleteTerritoryMutation,
} = territoriesApi;
