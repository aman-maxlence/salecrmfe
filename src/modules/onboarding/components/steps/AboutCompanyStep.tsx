import { useState } from 'react';
import { useSelector } from 'react-redux';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'react-toastify';
import { cn } from '@/shadcn/lib/utils';
import { RootState } from '@/store/store';
import { Input } from '@/modules/settings/components/ui/Input';
import { SelectField } from '@/modules/settings/components/ui/Select';
import { getErrorMessage } from '@/modules/settings/models';
import { usePermissions } from '@/modules/settings/hooks/usePermissions';
import { useSaveOnboardingCompanyMutation } from '../../services/onboardingApi';
import { StepComponentProps } from './types';
import { MaxSalesMark } from '../MaxSalesMark';
import { WizardSidebar, buildSidebarSteps } from '../WizardSidebar';
import { SlidingFieldWindow } from '../SlidingFieldWindow';

const COMPANY_SIZE_OPTIONS = [
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-500', label: '201-500 employees' },
  { value: '500+', label: '500+ employees' },
];

const INDUSTRY_OPTIONS = [
  { value: 'software', label: 'Software / IT' },
  { value: 'retail', label: 'Retail & E-commerce' },
  { value: 'finance', label: 'Finance' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'other', label: 'Other' },
];

const TEAM_SIZE_OPTIONS = ['1', '2-10', '10-30', '50+'];

const SIDEBAR_STEPS = buildSidebarSteps(1);

type FieldState = 'done' | 'active' | 'upcoming';

/** Mirrors AboutYouStep's accordion row - see that file for the full rationale. */
function AccordionField({
  state,
  label,
  description,
  children,
}: {
  state: FieldState;
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  if (state === 'done') {
    return (
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-muted-foreground">{label}</h3>
        {children}
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-2', state === 'upcoming' && 'pointer-events-none opacity-40')}>
      <div>
        <h3 className="font-semibold">{label}</h3>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </div>
  );
}

function SizeCard({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-1 items-center justify-center rounded-md border px-4 py-4 text-sm font-medium transition-colors',
        selected ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-muted/40 hover:bg-accent'
      )}
    >
      {label}
    </button>
  );
}

/**
 * Design doc §4.2 Screen 3 - same accordion/sliding-window pattern as
 * AboutYouStep: Company name, then Company size, then Industry, then how
 * many people will use MaxSales (seat planning, not the same as company
 * size - a subset of the org will actually use the CRM).
 *
 * `PUT /company` 403s server-side without `manage_organization_settings`,
 * so a caller lacking it never gets this editable form - just the older,
 * plain read-only fallback below (no design given for that case yet).
 */
export function AboutCompanyStep({ answers, goNext, goBack }: StepComponentProps) {
  const { hasPermission, isLoading: permsLoading } = usePermissions();
  const canEdit = permsLoading ? false : hasPermission('manage_organization_settings');
  const orgName = useSelector((state: RootState) => state.auth.organization?.name) ?? '';

  const saved = answers.about_company;
  const [companyName, setCompanyName] = useState(saved?.companyName ?? orgName);
  const [companySize, setCompanySize] = useState(saved?.companySize ?? '');
  const [industry, setIndustry] = useState(saved?.industry ?? '');
  const [teamSize, setTeamSize] = useState(saved?.teamSize ?? '');
  const [saveCompany, { isLoading }] = useSaveOnboardingCompanyMutation();

  const companyNameDone = companyName.trim().length > 0;
  const companySizeDone = companySize.trim().length > 0;
  const industryDone = industry.trim().length > 0;

  const companyNameState: FieldState = companyNameDone ? 'done' : 'active';
  const companySizeState: FieldState = !companyNameDone ? 'upcoming' : companySizeDone ? 'done' : 'active';
  const industryState: FieldState = !companySizeDone ? 'upcoming' : industryDone ? 'done' : 'active';
  const teamSizeState: FieldState = !industryDone ? 'upcoming' : 'active';

  const activeFieldIndex = !companyNameDone ? 0 : !companySizeDone ? 1 : !industryDone ? 2 : 3;

  const canSubmit = companyNameDone && !isLoading;

  const handleNext = async () => {
    try {
      await saveCompany({ companyName, companySize, industry, teamSize }).unwrap();
      goNext();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to save company details'));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canEdit && canSubmit) handleNext();
  };

  const subtitle = canEdit
    ? 'We will use this information to tailor your CRM for you'
    : "You don't have permission to edit organization settings - here's what we already know.";

  return (
    <div className="flex min-h-0 flex-1">
      <div className="relative flex min-w-0 flex-1 items-center justify-center overflow-hidden bg-background">
        <MaxSalesMark className="absolute left-10 top-10 h-8 w-auto" />

        <form
          onSubmit={handleSubmit}
          className="flex w-[621px] max-w-[calc(100%-80px)] flex-col items-stretch gap-10 rounded-lg bg-white pb-10 pl-10 pr-10 pt-5 shadow-[0_2px_10px_0_rgba(0,0,0,0.08)]"
        >
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={goBack}
              aria-label="Back"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-primary text-primary transition-colors hover:bg-primary/5"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-2xl font-bold">About Your Company</h1>
              <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
            </div>
          </div>

          {canEdit ? (
            <SlidingFieldWindow activeIndex={activeFieldIndex} visibleCount={3}>
              <AccordionField state={companyNameState} label="Company name">
                <Input
                  autoFocus
                  placeholder="Start typing the name ..."
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </AccordionField>

              <AccordionField
                state={companySizeState}
                label="How big is your company?"
                description="This helps us set sensible defaults for your pipeline."
              >
                <SelectField
                  value={companySize || undefined}
                  onValueChange={setCompanySize}
                  options={COMPANY_SIZE_OPTIONS}
                  placeholder="Start typing the name ..."
                />
              </AccordionField>

              <AccordionField
                state={industryState}
                label="Company industry"
                description="This helps us recommend relevant templates."
              >
                <SelectField
                  value={industry || undefined}
                  onValueChange={setIndustry}
                  options={INDUSTRY_OPTIONS}
                  placeholder="Start typing the name ..."
                />
              </AccordionField>

              <AccordionField
                state={teamSizeState}
                label="How many people will use MaxSales in your company"
                description="This helps us plan seats for your team."
              >
                <div className="flex gap-3">
                  {TEAM_SIZE_OPTIONS.map((option) => (
                    <SizeCard
                      key={option}
                      label={option}
                      selected={teamSize === option}
                      onClick={() => setTeamSize(option)}
                    />
                  ))}
                </div>
              </AccordionField>
            </SlidingFieldWindow>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <h3 className="font-semibold">Company name</h3>
                <Input value={companyName} disabled />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="font-semibold">How big is your company?</h3>
                <Input value={companySize} placeholder="Not available yet" disabled />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="font-semibold">Company industry</h3>
                <Input value={industry} placeholder="Not available yet" disabled />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="font-semibold">How many people will use MaxSales in your company</h3>
                <Input value={teamSize} placeholder="Not available yet" disabled />
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            {canEdit ? (
              <>
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : 'Save & go next'}
                </button>
                <span className="text-sm text-muted-foreground">or press enter ↵</span>
              </>
            ) : (
              <button
                type="button"
                onClick={goNext}
                className="rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
              >
                Skip
              </button>
            )}
          </div>
        </form>
      </div>

      <WizardSidebar steps={SIDEBAR_STEPS} />
    </div>
  );
}
