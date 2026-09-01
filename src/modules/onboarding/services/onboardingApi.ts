import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '@/app/api';
import { ONBOARDING_API_ENDPOINTS } from '@/app/apiEndpoints';
import { ApiSuccessResponse } from '@/modules/settings/models';
import {
  AboutCompanyAnswers,
  AboutYouAnswers,
  OnboardingState,
  PipelinePreferenceAnswers,
} from '../models';

export interface SaveOnboardingImportBody {
  fileName?: string;
  fileUrl?: string;
}

export const onboardingApi = createApi({
  reducerPath: 'onboardingApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['OnboardingState'],
  endpoints: (builder) => ({
    /** Resume point for the wizard - called once on mount (design doc QA: refresh/close mid-wizard must resume correctly). */
    getOnboardingState: builder.query<OnboardingState, void>({
      query: () => ({ url: ONBOARDING_API_ENDPOINTS.STATE, method: 'GET' }),
      transformResponse: (response: ApiSuccessResponse<OnboardingState>) => response.data,
      providesTags: ['OnboardingState'],
    }),

    /** Screen 2 (About You) - always allowed for any role. */
    saveOnboardingProfile: builder.mutation<OnboardingState, Partial<AboutYouAnswers>>({
      query: (body) => ({ url: ONBOARDING_API_ENDPOINTS.PROFILE, method: 'PUT', body }),
      transformResponse: (response: ApiSuccessResponse<OnboardingState>) => response.data,
      invalidatesTags: ['OnboardingState'],
    }),

    /** Screen 3 (About Company) - server 403s without `manage_organization_settings`; don't call it in that case. */
    saveOnboardingCompany: builder.mutation<OnboardingState, Partial<AboutCompanyAnswers>>({
      query: (body) => ({ url: ONBOARDING_API_ENDPOINTS.COMPANY, method: 'PUT', body }),
      transformResponse: (response: ApiSuccessResponse<OnboardingState>) => response.data,
      invalidatesTags: ['OnboardingState'],
    }),

    /** Screen 5 (Data Import) - requires `import_leads`. Backend stub: only stages a file reference. */
    saveOnboardingImport: builder.mutation<OnboardingState, SaveOnboardingImportBody>({
      query: (body) => ({ url: ONBOARDING_API_ENDPOINTS.IMPORT, method: 'POST', body }),
      transformResponse: (response: ApiSuccessResponse<OnboardingState>) => response.data,
      invalidatesTags: ['OnboardingState'],
    }),

    /** Screen 6 (Pipeline & Module Preference) - requires `manage_organization_settings`. */
    saveOnboardingPreferences: builder.mutation<OnboardingState, Partial<PipelinePreferenceAnswers>>({
      query: (body) => ({ url: ONBOARDING_API_ENDPOINTS.PREFERENCES, method: 'PUT', body }),
      transformResponse: (response: ApiSuccessResponse<OnboardingState>) => response.data,
      invalidatesTags: ['OnboardingState'],
    }),

    /** Screen 7 (Processing -> Done) - marks this user's PortalUser.has_onboarded true. No body. */
    completeOnboarding: builder.mutation<OnboardingState, void>({
      query: () => ({ url: ONBOARDING_API_ENDPOINTS.COMPLETE, method: 'POST' }),
      transformResponse: (response: ApiSuccessResponse<OnboardingState>) => response.data,
      invalidatesTags: ['OnboardingState'],
    }),
  }),
});

export const {
  useGetOnboardingStateQuery,
  useSaveOnboardingProfileMutation,
  useSaveOnboardingCompanyMutation,
  useSaveOnboardingImportMutation,
  useSaveOnboardingPreferencesMutation,
  useCompleteOnboardingMutation,
} = onboardingApi;
