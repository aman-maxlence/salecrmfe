import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '@/app/api';
import { INVITE_LINK_API_ENDPOINTS } from '@/app/apiEndpoints';
import { ApiSuccessResponse, InviteLink } from '../models';

export const inviteLinkApi = createApi({
  reducerPath: 'inviteLinkApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['InviteLink'],
  endpoints: (builder) => ({
    getInviteLink: builder.query<InviteLink, number | string>({
      query: (orgId) => ({ url: INVITE_LINK_API_ENDPOINTS.BASE(orgId), method: 'GET' }),
      transformResponse: (response: ApiSuccessResponse<InviteLink>) => response.data,
      providesTags: [{ type: 'InviteLink', id: 'CURRENT' }],
    }),

    updateInviteLink: builder.mutation<
      InviteLink,
      { orgId: number | string; roleId: number; territoryId?: number }
    >({
      query: ({ orgId, roleId, territoryId }) => ({
        url: INVITE_LINK_API_ENDPOINTS.BASE(orgId),
        method: 'PUT',
        body: { roleId, territoryId },
      }),
      transformResponse: (response: ApiSuccessResponse<InviteLink>) => response.data,
      invalidatesTags: [{ type: 'InviteLink', id: 'CURRENT' }],
    }),

    regenerateInviteLink: builder.mutation<InviteLink, number | string>({
      query: (orgId) => ({ url: INVITE_LINK_API_ENDPOINTS.REGENERATE(orgId), method: 'POST' }),
      transformResponse: (response: ApiSuccessResponse<InviteLink>) => response.data,
      invalidatesTags: [{ type: 'InviteLink', id: 'CURRENT' }],
    }),

    revokeInviteLink: builder.mutation<InviteLink, number | string>({
      query: (orgId) => ({ url: INVITE_LINK_API_ENDPOINTS.REVOKE(orgId), method: 'POST' }),
      transformResponse: (response: ApiSuccessResponse<InviteLink>) => response.data,
      invalidatesTags: [{ type: 'InviteLink', id: 'CURRENT' }],
    }),
  }),
});

export const {
  useGetInviteLinkQuery,
  useUpdateInviteLinkMutation,
  useRegenerateInviteLinkMutation,
  useRevokeInviteLinkMutation,
} = inviteLinkApi;
