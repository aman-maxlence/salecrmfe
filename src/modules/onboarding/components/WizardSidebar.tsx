import { Check } from 'lucide-react';
import { cn } from '@/shadcn/lib/utils';

export interface WizardSidebarStep {
  label: string;
  status: 'done' | 'active' | 'upcoming';
}

/**
 * The wizard still has 5 real steps behind these 4 sidebar labels until the
 * remaining screens (Your Goals / Optimization setup) are specced and the
 * step list itself gets consolidated to match - see OnboardingWizard.tsx's
 * STEP_KEYS_WITH_OWN_SHELL.
 */
export const WIZARD_SIDEBAR_LABELS = ['About You', 'Your Company', 'Your Goals', 'Optimization setup'];

export function buildSidebarSteps(activeIndex: number): WizardSidebarStep[] {
  return WIZARD_SIDEBAR_LABELS.map((label, i) => ({
    label,
    status: i < activeIndex ? 'done' : i === activeIndex ? 'active' : 'upcoming',
  }));
}

/** The blue "Quick & Easy Setup" panel from the design. */
export function WizardSidebar({ steps }: { steps: WizardSidebarStep[] }) {
  return (
    <aside className="flex w-[300px] shrink-0 flex-col overflow-hidden bg-primary px-9 py-10 text-primary-foreground">
      <h2 className="text-2xl font-bold leading-tight">Quick & Easy Setup</h2>

      <ol className="mt-10 flex flex-col">
        {steps.map((step, i) => (
          <li key={step.label} className="relative flex items-center gap-3 pb-8 last:pb-0">
            {i < steps.length - 1 ? (
              <span className="absolute left-[5px] top-3 h-full w-px bg-primary-foreground/30" aria-hidden="true" />
            ) : null}
            <span
              className={cn(
                'relative z-10 mt-1 h-2.5 w-2.5 shrink-0 self-start rounded-full',
                step.status === 'upcoming' ? 'bg-primary-foreground/40' : 'bg-primary-foreground'
              )}
              aria-hidden="true"
            />
            <span
              className={cn(
                'flex items-center gap-1.5 text-sm',
                step.status === 'upcoming' ? 'text-primary-foreground/70' : 'font-semibold text-primary-foreground'
              )}
            >
              {step.label}
              {step.status === 'done' ? (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary-foreground">
                  <Check className="h-2.5 w-2.5 text-primary" strokeWidth={3} />
                </span>
              ) : null}
            </span>
          </li>
        ))}
      </ol>

      <div className="mt-auto text-sm text-primary-foreground/85">
        Need help?{' '}
        <a href="#" className="font-medium underline underline-offset-2">
          Connect with support
        </a>
      </div>
    </aside>
  );
}
