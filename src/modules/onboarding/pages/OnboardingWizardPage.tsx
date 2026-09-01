import { OnboardingWizard } from '../components/OnboardingWizard';

/**
 * Route-level page for `/onboarding` (see src/routes/index.tsx) - deliberately
 * rendered as a sibling of `MainLayout`, not inside it, so the wizard has no
 * sidebar/nav chrome. Auth + onboarding-status gating both happen one level
 * up in `ProtectedRoute`; this page only needs to render the wizard itself.
 */
export default function OnboardingWizardPage() {
  return <OnboardingWizard />;
}
