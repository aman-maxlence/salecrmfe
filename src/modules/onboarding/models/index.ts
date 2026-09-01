/*----------------------------------------------------------------------------
 * Onboarding wizard (salecrmbd `/api/onboarding/*`, design doc §4)
 *
 * Every invited user goes through the identical 7-screen sequence; the
 * backend enforces per-step permission checks server-side regardless of
 * what the UI shows (see OnboardingService on the backend), so the FE-side
 * `usePermissions()` gating below is purely a UX convenience, not a
 * security boundary.
 *
 * Re-uses the shared `ApiSuccessResponse`/`getErrorMessage` envelope types
 * and the `Invitation` model from the settings module rather than
 * duplicating them - they're generic salecrmbd conventions, not
 * settings-specific.
 *--------------------------------------------------------------------------*/
export type { ApiSuccessResponse, ApiErrorBody } from '@/modules/settings/models';
export { getErrorMessage } from '@/modules/settings/models';

/**
 * The backend persists `current_step` as the key of the last step whose
 * data was actually saved (defaults to `'welcome'`, becomes `'done'` once
 * `POST /complete` runs) - NOT a "next step to show" pointer. A step that
 * is only ever *skipped* (never PUT/POSTed) never advances this value, so
 * a mid-wizard refresh resumes at the last *saved* step rather than the
 * last *visited* one. That's a real backend-side limitation, not a bug in
 * this frontend - see OnboardingWizard's resume comment.
 */
export type OnboardingStepKey =
  | 'welcome'
  | 'about_you'
  | 'about_company'
  | 'data_import'
  | 'pipeline_preference'
  | 'processing';

export type OnboardingStatus = 'in_progress' | 'completed';

export interface AboutYouAnswers {
  name?: string;
  jobTitle?: string;
  usedCrmBefore?: boolean;
  contactNumber?: string;
}

export interface AboutCompanyAnswers {
  teamSize?: string;
  industry?: string;
  companySize?: string;
  companyName?: string;
}

export interface DataImportAnswers {
  fileName?: string | null;
  fileUrl?: string | null;
}

export interface PipelinePreferenceAnswers {
  enabledModules?: string[];
}

export interface OnboardingAnswers {
  about_you?: AboutYouAnswers;
  about_company?: AboutCompanyAnswers;
  data_import?: DataImportAnswers;
  pipeline_preference?: PipelinePreferenceAnswers;
}

export interface OnboardingState {
  id: number;
  org_id: number;
  user_id: number | string;
  current_step: OnboardingStepKey | 'done';
  answers: OnboardingAnswers;
  status: OnboardingStatus;
}

/** The default set of CRM modules offered on the Pipeline & Module Preference step. */
export const ONBOARDING_MODULE_OPTIONS: { key: string; label: string }[] = [
  { key: 'leads', label: 'Leads' },
  { key: 'deals', label: 'Deals' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'meetings', label: 'Meetings' },
  { key: 'tickets', label: 'Tickets' },
];

/** Ordered wizard steps - drives both the progress indicator and step resume. */
export const ONBOARDING_STEPS: { key: OnboardingStepKey; label: string }[] = [
  { key: 'welcome', label: 'Welcome' },
  { key: 'about_you', label: 'About You' },
  { key: 'about_company', label: 'About Company' },
  { key: 'data_import', label: 'Import Data' },
  { key: 'pipeline_preference', label: 'Preferences' },
  { key: 'processing', label: 'Finish' },
];
