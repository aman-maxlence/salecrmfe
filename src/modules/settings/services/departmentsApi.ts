import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '@/app/api';
import { DEPARTMENTS_API_ENDPOINTS } from '@/app/apiEndpoints';
import { ApiSuccessResponse, Department, RoleStatus } from '../models';

export interface CreateDepartmentBody {
  name: string;
  description?: string;
  headUserId?: number | string;
}

export interface UpdateDepartmentArgs {
  orgId: number | string;
  id: number | string;
  name?: string;
  description?: string | null;
  headUserId?: number | string | null;
  status?: RoleStatus;
}

export const departmentsApi = createApi({
  reducerPath: 'departmentsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Department'],
  endpoints: (builder) => ({
    getDepartments: builder.query<Department[], number | string>({
      query: (orgId) => ({ url: DEPARTMENTS_API_ENDPOINTS.BASE(orgId), method: 'GET' }),
      transformResponse: (response: ApiSuccessResponse<Department[]>) => response.data,
      providesTags: (result) =>
        result
          ? [
              ...result.map((d) => ({ type: 'Department' as const, id: d.id })),
              { type: 'Department' as const, id: 'LIST' },
            ]
          : [{ type: 'Department' as const, id: 'LIST' }],
    }),

    createDepartment: builder.mutation<Department, { orgId: number | string; body: CreateDepartmentBody }>({
      query: ({ orgId, body }) => ({
        url: DEPARTMENTS_API_ENDPOINTS.BASE(orgId),
        method: 'POST',
        body,
      }),
      transformResponse: (response: ApiSuccessResponse<Department>) => response.data,
      invalidatesTags: [{ type: 'Department', id: 'LIST' }],
    }),

    updateDepartment: builder.mutation<Department, UpdateDepartmentArgs>({
      query: ({ orgId, id, ...body }) => ({
        url: DEPARTMENTS_API_ENDPOINTS.BY_ID(orgId, id),
        method: 'PUT',
        body,
      }),
      transformResponse: (response: ApiSuccessResponse<Department>) => response.data,
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Department', id },
        { type: 'Department', id: 'LIST' },
      ],
    }),

    deleteDepartment: builder.mutation<void, { orgId: number | string; id: number | string }>({
      query: ({ orgId, id }) => ({
        url: DEPARTMENTS_API_ENDPOINTS.BY_ID(orgId, id),
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Department', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetDepartmentsQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
} = departmentsApi;
