import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '@/app/api';
import { INVITES_API_ENDPOINTS } from '@/app/apiEndpoints';
import { ApiSuccessResponse, CreateInvitePayload, Invitation, InvitationStatus } from '../models';

export const invitesApi = createApi({
  reducerPath: 'invitesApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Invite'],
  endpoints: (builder) => ({
    getInvites: builder.query<Invitation[], { orgId: number | string; status?: InvitationStatus }>({
      query: ({ orgId, status }) => ({
        url: INVITES_API_ENDPOINTS.BASE(orgId),
        method: 'GET',
        params: status ? { status } : undefined,
      }),
      transformResponse: (response: ApiSuccessResponse<Invitation[]>) => response.data,
      providesTags: (result) =>
        result
          ? [
              ...result.map((i) => ({ type: 'Invite' as const, id: i.id })),
              { type: 'Invite' as const, id: 'LIST' },
            ]
          : [{ type: 'Invite' as const, id: 'LIST' }],
    }),

    /** Always an array, even for a single invite - max 100 rows per call. */
    createInvites: builder.mutation<
      Invitation[],
      { orgId: number | string; invites: CreateInvitePayload[] }
    >({
      query: ({ orgId, invites }) => ({
        url: INVITES_API_ENDPOINTS.BASE(orgId),
        method: 'POST',
        body: { invites },
      }),
      transformResponse: (response: ApiSuccessResponse<Invitation[]>) => response.data,
      invalidatesTags: [{ type: 'Invite', id: 'LIST' }],
    }),

    /** Only succeeds while the invite is still 'pending'. */
    revokeInvite: builder.mutation<void, { orgId: number | string; id: number | string }>({
      query: ({ orgId, id }) => ({ url: INVITES_API_ENDPOINTS.BY_ID(orgId, id), method: 'DELETE' }),
      invalidatesTags: [{ type: 'Invite', id: 'LIST' }],
    }),

    /**
     * Only succeeds while the invite is still 'pending'; depends on a
     * userbd endpoint that may not be deployed everywhere yet - a 502 here
     * is a known backend-side gap, not necessarily a frontend bug.
     */
    resendInvite: builder.mutation<void, { orgId: number | string; id: number | string }>({
      query: ({ orgId, id }) => ({
        url: INVITES_API_ENDPOINTS.RESEND(orgId, id),
        method: 'POST',
      }),
    }),
  }),
});

export const {
  useGetInvitesQuery,
  useCreateInvitesMutation,
  useRevokeInviteMutation,
  useResendInviteMutation,
} = invitesApi;
