import { OnboardingAnswers } from '../../models';

/** Shared prop contract every step component receives from OnboardingWizard. */
export interface StepComponentProps {
  answers: OnboardingAnswers;
  goNext: () => void;
  goBack: () => void;
  isFirstStep: boolean;
}
