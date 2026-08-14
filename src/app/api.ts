import {
  fetchBaseQuery,
  BaseQueryApi,
  FetchArgs,
} from '@reduxjs/toolkit/query/react';
import { logout } from '@/modules/auth/auth-slice';
import { BASE_URL, USER_SERVICE_URL, PRODUCT_ID } from './constants';

// Base query against this product's own backend (salecrmbd)
const baseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  prepareHeaders: (headers) => {
    headers.set('productID', PRODUCT_ID);
    headers.set('Content-Type', 'application/json');
    return headers;
  },
  credentials: 'include', // shared platform cookie
});

// Base query against the central User Service (org/auth/profile)
export const userServiceBaseQuery = fetchBaseQuery({
  baseUrl: USER_SERVICE_URL,
  prepareHeaders: (headers) => {
    headers.set('Content-Type', 'application/json');
    return headers;
  },
  credentials: 'include',
});

/**
 * Auth is entirely cookie-based (issued by userbd, verified by salecrmbd),
 * so there is no client-side refresh flow here - a 401 just logs the user out.
 */
export const baseQueryWithReauth = async (
  args: string | FetchArgs,
  api: BaseQueryApi,
  extraOptions: object
) => {
  if (typeof args !== 'string' && args.body instanceof FormData) {
    if (args.headers) {
      delete (args.headers as Record<string, string>)['Content-Type'];
    } else {
      args.headers = {};
    }
  }

  const result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    api.dispatch(logout());
  }

  return result;
};
