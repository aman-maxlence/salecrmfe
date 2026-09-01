import { useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { ArrowLeft, UploadCloud } from 'lucide-react';
import { getErrorMessage } from '@/modules/settings/models';
import { usePermissions } from '@/modules/settings/hooks/usePermissions';
import { useSaveOnboardingImportMutation } from '../../services/onboardingApi';
import { StepComponentProps } from './types';
import { MaxSalesMark } from '../MaxSalesMark';
import { WizardSidebar, buildSidebarSteps } from '../WizardSidebar';

const SIDEBAR_STEPS = buildSidebarSteps(2);

/**
 * Design doc §4.2 Screen 5. The backend is an explicit stub (`POST /import`
 * just stages a `{fileName, fileUrl}` reference, it doesn't process
 * anything) - a real upload/S3 flow is out of scope, so this only captures
 * whichever filename the user picked from their local disk and sends that
 * along. Read-only-with-skip when the caller lacks `import_leads`. Same
 * shell (logo, sidebar, card, back button) as AboutYouStep/AboutCompanyStep -
 * no dedicated mock for this screen yet, so the content below is unchanged
 * from before, just restyled to match.
 */
export function DataImportStep({ goNext, goBack }: StepComponentProps) {
  const { hasPermission, isLoading: permsLoading } = usePermissions();
  const canImport = permsLoading ? false : hasPermission('import_leads');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [saveImport, { isLoading }] = useSaveOnboardingImportMutation();

  const handleContinue = async () => {
    if (!canImport) {
      goNext();
      return;
    }
    if (!fileName) {
      goNext();
      return;
    }
    try {
      await saveImport({ fileName }).unwrap();
      toast.success('File staged for import');
      goNext();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to stage file'));
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
              <h1 className="text-2xl font-bold">Import Your Data</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {canImport
                  ? 'Pick a CSV of leads/contacts to import, or skip for now.'
                  : "You don't have permission to import data."}
              </p>
            </div>
          </div>

          <div
            className={`flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-border p-10 text-center text-sm text-muted-foreground ${
              !canImport ? 'opacity-50' : ''
            }`}
          >
            <UploadCloud className="h-8 w-8" />
            {fileName ? (
              <span className="font-medium text-foreground">{fileName}</span>
            ) : (
              <span>No file selected</span>
            )}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              disabled={!canImport}
              onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
            />
            <button
              type="button"
              disabled={!canImport}
              onClick={() => fileInputRef.current?.click()}
              className="rounded-md border border-border bg-background px-4 py-1.5 text-sm font-medium transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
            >
              Choose file
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleContinue}
              disabled={isLoading}
              className="rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
            >
              {isLoading ? 'Staging...' : canImport ? 'Save & go next' : 'Skip'}
            </button>
            {canImport ? <span className="text-sm text-muted-foreground">or press enter ↵</span> : null}
          </div>
        </div>
      </div>

      <WizardSidebar steps={SIDEBAR_STEPS} />
    </div>
  );
}
