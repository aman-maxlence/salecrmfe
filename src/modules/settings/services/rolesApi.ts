import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '@/app/api';
import { ROLES_API_ENDPOINTS } from '@/app/apiEndpoints';
import { ApiSuccessResponse, AuditLogEntry, Role, RoleStatus } from '../models';

export interface CreateRoleBody {
  roleName: string;
  description?: string;
}

export interface UpdateRoleArgs {
  orgId: number | string;
  id: number | string;
  roleName?: string;
  description?: string;
  status?: RoleStatus;
}

export interface UpdateRolePermissionsArgs {
  orgId: number | string;
  id: number | string;
  permissions: Record<string, boolean>;
}

export const rolesApi = createApi({
  reducerPath: 'rolesApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Role', 'RoleAuditLog'],
  endpoints: (builder) => ({
    getRoles: builder.query<Role[], number | string>({
      query: (orgId) => ({ url: ROLES_API_ENDPOINTS.BASE(orgId), method: 'GET' }),
      transformResponse: (response: ApiSuccessResponse<Role[]>) => response.data,
      providesTags: (result) =>
        result
          ? [
              ...result.map((role) => ({ type: 'Role' as const, id: role.id })),
              { type: 'Role' as const, id: 'LIST' },
            ]
          : [{ type: 'Role' as const, id: 'LIST' }],
    }),

    getRole: builder.query<Role, { orgId: number | string; id: number | string }>({
      query: ({ orgId, id }) => ({ url: ROLES_API_ENDPOINTS.BY_ID(orgId, id), method: 'GET' }),
      transformResponse: (response: ApiSuccessResponse<Role>) => response.data,
      providesTags: (_result, _error, { id }) => [{ type: 'Role', id }],
    }),

    createRole: builder.mutation<Role, { orgId: number | string; body: CreateRoleBody }>({
      query: ({ orgId, body }) => ({ url: ROLES_API_ENDPOINTS.BASE(orgId), method: 'POST', body }),
      transformResponse: (response: ApiSuccessResponse<Role>) => response.data,
      invalidatesTags: [{ type: 'Role', id: 'LIST' }],
    }),

    updateRole: builder.mutation<Role, UpdateRoleArgs>({
      query: ({ orgId, id, ...body }) => ({
        url: ROLES_API_ENDPOINTS.BY_ID(orgId, id),
        method: 'PUT',
        body,
      }),
      transformResponse: (response: ApiSuccessResponse<Role>) => response.data,
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Role', id },
        { type: 'Role', id: 'LIST' },
      ],
    }),

    updateRolePermissions: builder.mutation<Role, UpdateRolePermissionsArgs>({
      query: ({ orgId, id, permissions }) => ({
        url: ROLES_API_ENDPOINTS.PERMISSIONS(orgId, id),
        method: 'PATCH',
        body: { permissions },
      }),
      transformResponse: (response: ApiSuccessResponse<Role>) => response.data,
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Role', id },
        { type: 'Role', id: 'LIST' },
      ],
    }),

    deleteRole: builder.mutation<void, { orgId: number | string; id: number | string }>({
      query: ({ orgId, id }) => ({ url: ROLES_API_ENDPOINTS.BY_ID(orgId, id), method: 'DELETE' }),
      invalidatesTags: [{ type: 'Role', id: 'LIST' }],
    }),

    getRoleAuditLog: builder.query<AuditLogEntry[], { orgId: number | string; id: number | string }>({
      query: ({ orgId, id }) => ({ url: ROLES_API_ENDPOINTS.AUDIT_LOG(orgId, id), method: 'GET' }),
      transformResponse: (response: ApiSuccessResponse<AuditLogEntry[]>) => response.data,
      providesTags: (_result, _error, { id }) => [{ type: 'RoleAuditLog', id }],
    }),
  }),
});

export const {
  useGetRolesQuery,
  useGetRoleQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useUpdateRolePermissionsMutation,
  useDeleteRoleMutation,
  useGetRoleAuditLogQuery,
} = rolesApi;
