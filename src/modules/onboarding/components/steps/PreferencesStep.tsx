import { useState } from 'react';
import { toast } from 'react-toastify';
import { ArrowLeft } from 'lucide-react';
import { Switch } from '@/modules/settings/components/ui/Switch';
import { getErrorMessage } from '@/modules/settings/models';
import { usePermissions } from '@/modules/settings/hooks/usePermissions';
import { useSaveOnboardingPreferencesMutation } from '../../services/onboardingApi';
import { ONBOARDING_MODULE_OPTIONS } from '../../models';
import { StepComponentProps } from './types';
import { MaxSalesMark } from '../MaxSalesMark';
import { WizardSidebar, buildSidebarSteps } from '../WizardSidebar';

const SIDEBAR_STEPS = buildSidebarSteps(3);

/**
 * Design doc §4.2 Screen 6 - a stub preference toggle list, not a real
 * module-provisioning system. Requires `manage_organization_settings`;
 * read-only-with-skip otherwise. Same shell as the earlier steps - no
 * dedicated mock for this screen yet.
 */
export function PreferencesStep({ answers, goNext, goBack }: StepComponentProps) {
  const { hasPermission, isLoading: permsLoading } = usePermissions();
  const canEdit = permsLoading ? false : hasPermission('manage_organization_settings');

  const saved = answers.pipeline_preference?.enabledModules;
  const [enabled, setEnabled] = useState<Set<string>>(
    new Set(saved ?? ONBOARDING_MODULE_OPTIONS.map((m) => m.key))
  );
  const [savePreferences, { isLoading }] = useSaveOnboardingPreferencesMutation();

  const toggle = (key: string) => {
    setEnabled((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleNext = async () => {
    if (!canEdit) {
      goNext();
      return;
    }
    try {
      await savePreferences({ enabledModules: Array.from(enabled) }).unwrap();
      goNext();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to save preferences'));
    }
  };

  return (
    <div className="flex min-h-0 flex-1">
      <div className="relative flex min-w-0 flex-1 items-center justify-center overflow-hidden bg-background">
        <MaxSalesMark className="absolute left-10 top-10 h-8 w-auto" />

        <div className="flex w-[621px] max-w-[calc(100%-80px)] flex-col items-stretch gap-10 rounded-lg bg-white pb-10 pl-10 pr-10 pt-5 shadow-[0_2px_10px_0_rgba(0,0,0,0.08)]">
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
              <h1 className="text-2xl font-bold">Pipeline & Module Preferences</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {canEdit
                  ? 'Choose which modules to enable by default - you can change this later in Settings.'
                  : "You don't have permission to manage organization settings."}
              </p>
            </div>
          </div>

          <div className="flex flex-col divide-y divide-border rounded-md border border-border">
            {ONBOARDING_MODULE_OPTIONS.map((mod) => (
              <div key={mod.key} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm">{mod.label}</span>
                <Switch
                  checked={enabled.has(mod.key)}
                  onCheckedChange={() => toggle(mod.key)}
                  disabled={!canEdit}
                  aria-label={mod.label}
                />
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleNext}
              disabled={isLoading}
              className="rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : canEdit ? 'Save & go next' : 'Skip'}
            </button>
            {canEdit ? <span className="text-sm text-muted-foreground">or press enter ↵</span> : null}
          </div>
        </div>
      </div>

      <WizardSidebar steps={SIDEBAR_STEPS} />
    </div>
  );
}
