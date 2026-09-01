import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '@/app/api';
import { USERS_API_ENDPOINTS } from '@/app/apiEndpoints';
import { ApiSuccessResponse, PortalUser } from '../models';

export const usersApi = createApi({
  reducerPath: 'usersApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['PortalUser', 'Me'],
  endpoints: (builder) => ({
    /**
     * The current user's own PortalUser record - the real RBAC source for
     * this frontend (nested `role.permissions`), unlike the coarser
     * `auth.organization.userRole` flag from the auth module.
     */
    getMyPortalUser: builder.query<PortalUser, number | string>({
      query: (orgId) => ({ url: USERS_API_ENDPOINTS.ME(orgId), method: 'GET' }),
      transformResponse: (response: ApiSuccessResponse<PortalUser>) => response.data,
      providesTags: ['Me'],
    }),

    getUsers: builder.query<PortalUser[], number | string>({
      query: (orgId) => ({ url: USERS_API_ENDPOINTS.BASE(orgId), method: 'GET' }),
      transformResponse: (response: ApiSuccessResponse<PortalUser[]>) => response.data,
      providesTags: (result) =>
        result
          ? [
              ...result.map((u) => ({ type: 'PortalUser' as const, id: u.id })),
              { type: 'PortalUser' as const, id: 'LIST' },
            ]
          : [{ type: 'PortalUser' as const, id: 'LIST' }],
    }),

    updateUserRole: builder.mutation<
      PortalUser,
      { orgId: number | string; userId: number | string; roleId: number }
    >({
      query: ({ orgId, userId, roleId }) => ({
        url: USERS_API_ENDPOINTS.ROLE(orgId, userId),
        method: 'PATCH',
        body: { roleId },
      }),
      transformResponse: (response: ApiSuccessResponse<PortalUser>) => response.data,
      invalidatesTags: (_result, _error, { userId }) => [
        { type: 'PortalUser', id: userId },
        { type: 'PortalUser', id: 'LIST' },
      ],
    }),

    updateUserTerritory: builder.mutation<
      PortalUser,
      { orgId: number | string; userId: number | string; territoryId: number }
    >({
      query: ({ orgId, userId, territoryId }) => ({
        url: USERS_API_ENDPOINTS.TERRITORY(orgId, userId),
        method: 'PATCH',
        body: { territoryId },
      }),
      transformResponse: (response: ApiSuccessResponse<PortalUser>) => response.data,
      invalidatesTags: (_result, _error, { userId }) => [
        { type: 'PortalUser', id: userId },
        { type: 'PortalUser', id: 'LIST' },
      ],
    }),

    updateUserTeam: builder.mutation<
      PortalUser,
      { orgId: number | string; userId: number | string; teamId: number | null }
    >({
      query: ({ orgId, userId, teamId }) => ({
        url: USERS_API_ENDPOINTS.TEAM(orgId, userId),
        method: 'PATCH',
        body: { teamId },
      }),
      transformResponse: (response: ApiSuccessResponse<PortalUser>) => response.data,
      invalidatesTags: (_result, _error, { userId }) => [
        { type: 'PortalUser', id: userId },
        { type: 'PortalUser', id: 'LIST' },
      ],
    }),

    /** This person's own "reports to" - independent of the Team's official manager_user_id. */
    updateUserManager: builder.mutation<
      PortalUser,
      { orgId: number | string; userId: number | string; managerId: number | string | null }
    >({
      query: ({ orgId, userId, managerId }) => ({
        url: USERS_API_ENDPOINTS.MANAGER(orgId, userId),
        method: 'PATCH',
        body: { managerId },
      }),
      transformResponse: (response: ApiSuccessResponse<PortalUser>) => response.data,
      invalidatesTags: (_result, _error, { userId }) => [
        { type: 'PortalUser', id: userId },
        { type: 'PortalUser', id: 'LIST' },
      ],
    }),

    /** Soft-removes a member from the org (PortalUser.status -> 'inactive'). Their userbd account is untouched. */
    removeUser: builder.mutation<PortalUser, { orgId: number | string; userId: number | string }>({
      query: ({ orgId, userId }) => ({
        url: USERS_API_ENDPOINTS.BY_ID(orgId, userId),
        method: 'DELETE',
      }),
      transformResponse: (response: ApiSuccessResponse<PortalUser>) => response.data,
      invalidatesTags: (_result, _error, { userId }) => [
        { type: 'PortalUser', id: userId },
        { type: 'PortalUser', id: 'LIST' },
      ],
    }),

    /** Dual-access admin/user preview toggle - 403s server-side for anyone whose PortalUser isn't is_dual_access. */
    switchMyContext: builder.mutation<
      PortalUser,
      { orgId: number | string; activeContext?: 'admin' | 'user'; previewRoleId?: number | null }
    >({
      query: ({ orgId, activeContext, previewRoleId }) => ({
        url: USERS_API_ENDPOINTS.MY_CONTEXT(orgId),
        method: 'PATCH',
        body: { activeContext, previewRoleId },
      }),
      transformResponse: (response: ApiSuccessResponse<PortalUser>) => response.data,
      invalidatesTags: ['Me'],
    }),
  }),
});

export const {
  useGetMyPortalUserQuery,
  useGetUsersQuery,
  useUpdateUserRoleMutation,
  useUpdateUserTerritoryMutation,
  useUpdateUserTeamMutation,
  useUpdateUserManagerMutation,
  useRemoveUserMutation,
  useSwitchMyContextMutation,
} = usersApi;
