import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '@/app/api';
import { COMPANY_DETAILS_API_ENDPOINTS } from '@/app/apiEndpoints';
import { ApiSuccessResponse, CompanyDetails, UpdateCompanyDetailsBody } from '../models';

export const companyDetailsApi = createApi({
  reducerPath: 'companyDetailsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['CompanyDetails'],
  endpoints: (builder) => ({
    getCompanyDetails: builder.query<CompanyDetails, number | string>({
      query: (orgId) => ({ url: COMPANY_DETAILS_API_ENDPOINTS.BASE(orgId), method: 'GET' }),
      transformResponse: (response: ApiSuccessResponse<CompanyDetails>) => response.data,
      providesTags: ['CompanyDetails'],
    }),

    updateCompanyDetails: builder.mutation<
      CompanyDetails,
      { orgId: number | string; body: UpdateCompanyDetailsBody }
    >({
      query: ({ orgId, body }) => ({
        url: COMPANY_DETAILS_API_ENDPOINTS.BASE(orgId),
        method: 'PUT',
        body,
      }),
      transformResponse: (response: ApiSuccessResponse<CompanyDetails>) => response.data,
      invalidatesTags: ['CompanyDetails'],
    }),
  }),
});

export const {
  useGetCompanyDetailsQuery,
  useUpdateCompanyDetailsMutation,
} = companyDetailsApi;
