import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { cn } from '@/shadcn/lib/utils';
import { useGetOnboardingStateQuery } from '../services/onboardingApi';
import { ONBOARDING_STEPS, OnboardingStepKey } from '../models';
import { WelcomeStep } from './steps/WelcomeStep';
import { AboutYouStep } from './steps/AboutYouStep';
import { AboutCompanyStep } from './steps/AboutCompanyStep';
import { DataImportStep } from './steps/DataImportStep';
import { PreferencesStep } from './steps/PreferencesStep';
import { ProcessingStep } from './steps/ProcessingStep';

// Welcome and Processing are full-bleed bookends with their own layout;
// every step in between now shares the "Quick & Easy Setup" shell (logo,
// back button, WizardSidebar) - see AboutYouStep for the reference layout.
const STEP_KEYS_WITHOUT_SHELL: OnboardingStepKey[] = ['welcome', 'processing'];

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center text-muted-foreground">
      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
      Loading...
    </div>
  );
}

/**
 * Wizard shell: fetches `GET /state` once on mount to resume at the right
 * step with prior answers intact (design doc QA: refresh/close mid-wizard
 * must resume correctly), then owns the current-step index locally for the
 * rest of the session - individual steps call `goNext`/`goBack`, "Skip"
 * always calls `goNext` too (the wizard itself can't be skipped, but any
 * single step can).
 */
export function OnboardingWizard() {
  const navigate = useNavigate();
  const { data: state, isLoading, isError } = useGetOnboardingStateQuery();
  const [stepIndex, setStepIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!state || stepIndex !== null) return;

    if (state.status === 'completed') {
      // Shouldn't normally be reachable (ProtectedRoute already redirects an
      // onboarded user away from /onboarding), but guards against a stale
      // cache/race by bouncing to the dashboard instead of re-running the wizard.
      navigate('/', { replace: true });
      return;
    }

    const resumeIndex = ONBOARDING_STEPS.findIndex((s) => s.key === state.current_step);
    setStepIndex(resumeIndex >= 0 ? resumeIndex : 0);
  }, [state, stepIndex, navigate]);

  if (isLoading || stepIndex === null) {
    return <LoadingScreen />;
  }

  if (isError || !state) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-destructive">
        Couldn't load onboarding status. Please refresh the page.
      </div>
    );
  }

  const goNext = () => setStepIndex((i) => Math.min((i ?? 0) + 1, ONBOARDING_STEPS.length - 1));
  const goBack = () => setStepIndex((i) => Math.max((i ?? 0) - 1, 0));

  const currentKey = ONBOARDING_STEPS[stepIndex].key;
  const hasShell = !STEP_KEYS_WITHOUT_SHELL.includes(currentKey);
  const stepProps = { answers: state.answers, goNext, goBack, isFirstStep: stepIndex === 0 };

  return (
    <div
      className={cn(
        'flex flex-col bg-background',
        // Shelled steps are pinned to exactly the viewport height - any
        // taller content scrolls inside the step itself, not the whole page
        // (which otherwise grows past 100vh and adds a page-level
        // scrollbar/horizontal shift).
        hasShell ? 'h-screen overflow-hidden' : 'min-h-screen'
      )}
    >
      {currentKey === 'welcome' ? <WelcomeStep {...stepProps} /> : null}
      {currentKey === 'about_you' ? <AboutYouStep {...stepProps} /> : null}
      {currentKey === 'about_company' ? <AboutCompanyStep {...stepProps} /> : null}
      {currentKey === 'data_import' ? <DataImportStep {...stepProps} /> : null}
      {currentKey === 'pipeline_preference' ? <PreferencesStep {...stepProps} /> : null}
      {currentKey === 'processing' ? <ProcessingStep /> : null}
    </div>
  );
}
