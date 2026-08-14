import { createApi } from '@reduxjs/toolkit/query/react';
import { userServiceBaseQuery } from '@/app/api';
import { AUTH_API_ENDPOINTS } from '@/app/apiEndpoints';
import { IMeResponse } from '../models';

/**
 * Since login itself happens in the shell app (userpmfe), this product
 * frontend only needs to ask the User Service "who is the currently
 * cookied-in user?" on load, using the shared `accessToken` cookie.
 *
 * NOTE: confirm the exact "current user" path against userbd's real routes
 * (src/routes/userRoutes.js) - `/users/me` here is a placeholder.
 */
export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: userServiceBaseQuery,
  endpoints: (builder) => ({
    getMe: builder.query<IMeResponse, void>({
      query: () => ({ url: AUTH_API_ENDPOINTS.ME, method: 'GET' }),
    }),
  }),
});

export const { useGetMeQuery } = authApi;
