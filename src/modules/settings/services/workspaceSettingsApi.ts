import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '@/app/api';
import { WORKSPACE_SETTINGS_API_ENDPOINTS } from '@/app/apiEndpoints';
import { ApiSuccessResponse, UpdateWorkspaceSettingsBody, WorkspaceSettings } from '../models';

export const workspaceSettingsApi = createApi({
  reducerPath: 'workspaceSettingsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['WorkspaceSettings'],
  endpoints: (builder) => ({
    getWorkspaceSettings: builder.query<WorkspaceSettings, number | string>({
      query: (orgId) => ({ url: WORKSPACE_SETTINGS_API_ENDPOINTS.BASE(orgId), method: 'GET' }),
      transformResponse: (response: ApiSuccessResponse<WorkspaceSettings>) => response.data,
      providesTags: ['WorkspaceSettings'],
    }),

    updateWorkspaceSettings: builder.mutation<
      WorkspaceSettings,
      { orgId: number | string; body: UpdateWorkspaceSettingsBody }
    >({
      query: ({ orgId, body }) => ({
        url: WORKSPACE_SETTINGS_API_ENDPOINTS.BASE(orgId),
        method: 'PUT',
        body,
      }),
      transformResponse: (response: ApiSuccessResponse<WorkspaceSettings>) => response.data,
      invalidatesTags: ['WorkspaceSettings'],
    }),
  }),
});

export const {
  useGetWorkspaceSettingsQuery,
  useUpdateWorkspaceSettingsMutation,
} = workspaceSettingsApi;
