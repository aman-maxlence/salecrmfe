import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '@/app/api';
import { TEAMS_API_ENDPOINTS } from '@/app/apiEndpoints';
import { ApiSuccessResponse, CreateTeamBody, RoleStatus, Team } from '../models';

export interface UpdateTeamArgs {
  orgId: number | string;
  id: number | string;
  name?: string;
  description?: string | null;
  departmentId?: number | string;
  territoryId?: number | string;
  managerUserId?: number | string | null;
  status?: RoleStatus;
  memberUserIds?: (number | string)[];
}

export const teamsApi = createApi({
  reducerPath: 'teamsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Team'],
  endpoints: (builder) => ({
    getTeams: builder.query<Team[], { orgId: number | string; territoryId?: number | string; departmentId?: number | string }>({
      query: ({ orgId, territoryId, departmentId }) => ({
        url: TEAMS_API_ENDPOINTS.BASE(orgId),
        method: 'GET',
        params: {
          ...(territoryId ? { territoryId } : {}),
          ...(departmentId ? { departmentId } : {}),
        },
      }),
      transformResponse: (response: ApiSuccessResponse<Team[]>) => response.data,
      providesTags: (result) =>
        result
          ? [
              ...result.map((t) => ({ type: 'Team' as const, id: t.id })),
              { type: 'Team' as const, id: 'LIST' },
            ]
          : [{ type: 'Team' as const, id: 'LIST' }],
    }),

    createTeam: builder.mutation<Team, { orgId: number | string; body: CreateTeamBody }>({
      query: ({ orgId, body }) => ({
        url: TEAMS_API_ENDPOINTS.BASE(orgId),
        method: 'POST',
        body,
      }),
      transformResponse: (response: ApiSuccessResponse<Team>) => response.data,
      invalidatesTags: [{ type: 'Team', id: 'LIST' }],
    }),

    updateTeam: builder.mutation<Team, UpdateTeamArgs>({
      query: ({ orgId, id, ...body }) => ({
        url: TEAMS_API_ENDPOINTS.BY_ID(orgId, id),
        method: 'PUT',
        body,
      }),
      transformResponse: (response: ApiSuccessResponse<Team>) => response.data,
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Team', id },
        { type: 'Team', id: 'LIST' },
      ],
    }),

    deleteTeam: builder.mutation<void, { orgId: number | string; id: number | string }>({
      query: ({ orgId, id }) => ({
        url: TEAMS_API_ENDPOINTS.BY_ID(orgId, id),
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Team', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetTeamsQuery,
  useCreateTeamMutation,
  useUpdateTeamMutation,
  useDeleteTeamMutation,
} = teamsApi;
