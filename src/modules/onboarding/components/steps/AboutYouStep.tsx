import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'react-toastify';
import { cn } from '@/shadcn/lib/utils';
import { Input } from '@/modules/settings/components/ui/Input';
import { SelectField } from '@/modules/settings/components/ui/Select';
import { getErrorMessage } from '@/modules/settings/models';
import { useSaveOnboardingProfileMutation } from '../../services/onboardingApi';
import { StepComponentProps } from './types';
import { MaxSalesMark } from '../MaxSalesMark';
import { WizardSidebar, buildSidebarSteps } from '../WizardSidebar';
import { SlidingFieldWindow } from '../SlidingFieldWindow';

const JOB_TITLE_OPTIONS = [
  { value: 'founder_ceo', label: 'Founder / CEO' },
  { value: 'sales_manager', label: 'Sales Manager' },
  { value: 'sales_rep', label: 'Sales Representative' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'operations', label: 'Operations' },
  { value: 'other', label: 'Other' },
];

const PHONE_CODE_OPTIONS = [
  { value: '+91', label: '+91' },
  { value: '+1', label: '+1' },
  { value: '+44', label: '+44' },
  { value: '+61', label: '+61' },
];

const SIDEBAR_STEPS = buildSidebarSteps(0);

type FieldState = 'done' | 'active' | 'upcoming';

/** One row of the accordion - once answered, keeps a muted label but drops the description; shows a muted preview before its turn; only the active row gets the full label/description. */
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

function YesNoRow({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-1 items-center justify-between rounded-md border px-4 py-2.5 text-left text-sm transition-colors',
        selected ? 'border-primary bg-primary/5 font-medium' : 'border-border bg-muted/40 hover:bg-accent'
      )}
    >
      {label}
      <span
        className={cn(
          'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
          selected ? 'border-primary' : 'border-muted-foreground/40'
        )}
      >
        {selected ? <span className="h-2 w-2 rounded-full bg-primary" /> : null}
      </span>
    </button>
  );
}

/**
 * Design doc §4.2 Screen 2 - accordion reveal: Name, then (once filled) Job
 * Title, then (once filled) "used a CRM before?", then (once answered)
 * Contact number. Always fully editable for every role. Saves via `PUT
 * /profile`. Layout/sidebar per the Figma "Quick & Easy Setup" mock -
 * shared by every step in the wizard (see WizardSidebar/MaxSalesMark).
 */
export function AboutYouStep({ answers, goNext, goBack }: StepComponentProps) {
  const saved = answers.about_you;
  const [name, setName] = useState(saved?.name ?? '');
  const [jobTitle, setJobTitle] = useState(saved?.jobTitle ?? '');
  const [usedCrmBefore, setUsedCrmBefore] = useState<boolean | undefined>(saved?.usedCrmBefore);
  // Saved contact numbers are stored as "<code> <digits>" (see handleNext) -
  // split that back apart on load so re-saving doesn't prepend the code a
  // second time (previously caused "+91+91 +91 ..." to pile up every time
  // this step was revisited via Back).
  const savedContact = saved?.contactNumber ?? '';
  const matchedCode = PHONE_CODE_OPTIONS.find((opt) => savedContact.startsWith(opt.value));
  const [phoneCode, setPhoneCode] = useState(matchedCode?.value ?? '+91');
  const [contactNumber, setContactNumber] = useState(
    matchedCode ? savedContact.slice(matchedCode.value.length).trim() : savedContact
  );
  const [saveProfile, { isLoading }] = useSaveOnboardingProfileMutation();

  const nameDone = name.trim().length > 0;
  const jobTitleDone = jobTitle.trim().length > 0;
  const usedCrmDone = usedCrmBefore !== undefined;

  const nameState: FieldState = nameDone ? 'done' : 'active';
  const jobTitleState: FieldState = !nameDone ? 'upcoming' : jobTitleDone ? 'done' : 'active';
  const usedCrmState: FieldState = !jobTitleDone ? 'upcoming' : usedCrmDone ? 'done' : 'active';
  const contactState: FieldState = !usedCrmDone ? 'upcoming' : 'active';

  const activeFieldIndex = !nameDone ? 0 : !jobTitleDone ? 1 : !usedCrmDone ? 2 : 3;

  const canSubmit = nameDone && !isLoading;

  const handleNext = async () => {
    try {
      await saveProfile({
        name,
        jobTitle,
        usedCrmBefore,
        contactNumber: contactNumber.trim() ? `${phoneCode} ${contactNumber.trim()}` : '',
      }).unwrap();
      goNext();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to save your details'));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canSubmit) handleNext();
  };

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
              <h1 className="text-2xl font-bold">About You</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                We will use this information to tailor your CRM for you
              </p>
            </div>
          </div>

          <SlidingFieldWindow activeIndex={activeFieldIndex} visibleCount={3}>
            <AccordionField state={nameState} label="Your Name">
              <Input
                autoFocus
                placeholder="Start typing the name ..."
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </AccordionField>

            <AccordionField
              state={jobTitleState}
              label="Which job title describes your role best?"
              description="This helps us recommend the right workflow for your role."
            >
              <SelectField
                value={jobTitle || undefined}
                onValueChange={setJobTitle}
                options={JOB_TITLE_OPTIONS}
                placeholder="Start typing the job title ..."
              />
            </AccordionField>

            <AccordionField
              state={usedCrmState}
              label="Have you used a CRM before?"
              description="This helps us tailor onboarding tips to your experience level."
            >
              <div className="flex gap-3">
                <YesNoRow label="Yes" selected={usedCrmBefore === true} onClick={() => setUsedCrmBefore(true)} />
                <YesNoRow label="No" selected={usedCrmBefore === false} onClick={() => setUsedCrmBefore(false)} />
              </div>
            </AccordionField>

            <AccordionField
              state={contactState}
              label="Contact number"
              description="We'll only use this to reach you about your account."
            >
              <div className="flex gap-2">
                <SelectField
                  value={phoneCode}
                  onValueChange={setPhoneCode}
                  options={PHONE_CODE_OPTIONS}
                  className="w-24 shrink-0"
                />
                <Input
                  placeholder="XXXXX XXXXX"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  className="flex-1"
                />
              </div>
            </AccordionField>
          </SlidingFieldWindow>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Save & go next'}
            </button>
            <span className="text-sm text-muted-foreground">or press enter ↵</span>
          </div>
        </form>
      </div>

      <WizardSidebar steps={SIDEBAR_STEPS} />
    </div>
  );
}
