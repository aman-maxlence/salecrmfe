import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import axios from 'axios';
import { Save } from 'lucide-react';
import { RootState } from '@/store/store';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { LogoUpload } from '../components/LogoUpload';
import {
  useGetWorkspaceSettingsQuery,
  useUpdateWorkspaceSettingsMutation,
  useGetLogoPresignedUrlMutation,
} from '../services/workspaceSettingsApi';
import { getErrorMessage } from '../models';
import { FONT_OPTIONS, START_PAGE_OPTIONS, THEME_PALETTES, getThemePalette } from '../constants/themePalettes';

export default function ProfilePage() {
  const org = useSelector((state: RootState) => state.auth.organization);
  const orgId = org?.id;

  const { data: settings, isLoading } = useGetWorkspaceSettingsQuery(orgId ?? 0, { skip: !orgId });
  const [updateSettings, { isLoading: isSaving }] = useUpdateWorkspaceSettingsMutation();
  const [getLogoPresignedUrl] = useGetLogoPresignedUrlMutation();

  // undefined = logo untouched this session (don't include it in the PUT body,
  // so the existing stored value/key is left alone); null = explicitly removed;
  // string = the new S3 key from a completed upload.
  const [pendingLogoKey, setPendingLogoKey] = useState<string | null | undefined>(undefined);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [location, setLocation] = useState('');
  const [startPage, setStartPage] = useState('dashboard');
  const [font, setFont] = useState<string>(FONT_OPTIONS[0]);
  const [paletteKey, setPaletteKey] = useState('sunset');

  // Sync form fields once the saved settings arrive.
  useEffect(() => {
    if (!settings) return;
    setPendingLogoKey(undefined);
    setCompanyName(settings.company_name ?? org?.name ?? '');
    setLocation(settings.location ?? '');
    setStartPage(settings.default_start_page);
    setFont(settings.font_preference);
    setPaletteKey(settings.theme_palette);
  }, [settings, org?.name]);

  const selectedPalette = getThemePalette(paletteKey);

  const handleLogoFileSelected = async (file: File) => {
    if (!orgId) return;
    setIsUploadingLogo(true);
    try {
      const { uploadUrl, key } = await getLogoPresignedUrl({
        orgId,
        filename: file.name,
        contentType: file.type,
      }).unwrap();

      await axios.put(uploadUrl, file, { headers: { 'Content-Type': file.type } });

      setPendingLogoKey(key);
      toast.success('Logo uploaded - click "Save Changes" to apply it');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to upload logo. Please try again.'));
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleLogoRemove = () => {
    setPendingLogoKey(null);
  };

  const handleSave = async () => {
    if (!orgId) return;
    try {
      await updateSettings({
        orgId,
        body: {
          ...(pendingLogoKey !== undefined ? { logoUrl: pendingLogoKey } : {}),
          companyName: companyName.trim() || null,
          location: location.trim() || null,
          defaultStartPage: startPage as 'dashboard' | 'deals' | 'inventory',
          fontPreference: font,
          themePalette: paletteKey,
        },
      }).unwrap();
      toast.success('Workspace profile updated successfully');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update workspace profile'));
    }
  };

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading workspace profile...</p>;
  }

  return (
    <div className="w-full space-y-6 pb-12">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Workspace Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Branding and personalisation for everyone in {org?.name || 'your workspace'}.
        </p>
      </div>

      {/* Live preview of the (unsaved) selections below */}
      <div
        className="rounded-2xl border border-border h-28 flex items-center justify-center"
        style={{ backgroundColor: `${selectedPalette.swatches[0]}1a` }}
      >
        <span
          className="text-lg font-semibold"
          style={{ fontFamily: `"${font}", sans-serif`, color: selectedPalette.swatches[0] }}
        >
          {companyName || 'Preview'}
        </span>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5">
        <h2 className="text-sm font-semibold text-foreground">Basic Personalisation</h2>

        <div className="flex items-center gap-4">
          <label className="text-xs font-medium text-foreground w-24 flex-shrink-0">Logo</label>
          <LogoUpload
            currentLogoUrl={pendingLogoKey === null ? null : (settings?.logo_url ?? null)}
            onFileSelected={handleLogoFileSelected}
            onRemove={handleLogoRemove}
            isUploading={isUploadingLogo}
          />
        </div>

        <div className="flex items-center gap-4">
          <label className="text-xs font-medium text-foreground w-24 flex-shrink-0">Company Name</label>
          <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="flex-1" />
        </div>

        <div className="flex items-center gap-4">
          <label className="text-xs font-medium text-foreground w-24 flex-shrink-0">Location</label>
          <Input
            placeholder="e.g., India"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="flex-1"
          />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Default First Page</h2>
        <div className="flex items-center gap-4">
          <label className="text-xs font-medium text-foreground w-24 flex-shrink-0">Start Page</label>
          <select
            value={startPage}
            onChange={(e) => setStartPage(e.target.value)}
            className="flex-1 h-9 px-3 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {START_PAGE_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Change Font</h2>
        <div className="flex items-center gap-4">
          <label className="text-xs font-medium text-foreground w-24 flex-shrink-0">Select Font</label>
          <select
            value={font}
            onChange={(e) => setFont(e.target.value)}
            className="flex-1 h-9 px-3 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            style={{ fontFamily: `"${font}", sans-serif` }}
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f} value={f} style={{ fontFamily: `"${f}", sans-serif` }}>
                {f}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Default Theme</h2>
        <p className="text-xs text-muted-foreground">Select the accent color palette for your workspace</p>

        <div className="space-y-2.5 pt-1">
          {THEME_PALETTES.map((palette) => {
            const selected = palette.key === paletteKey;
            return (
              <button
                key={palette.key}
                type="button"
                onClick={() => setPaletteKey(palette.key)}
                className={`w-full flex items-center rounded-xl border overflow-hidden transition-all ${
                  selected ? 'border-primary ring-1 ring-primary' : 'border-border hover:border-foreground/30'
                }`}
              >
                <div className="flex h-10 flex-1">
                  {palette.swatches.map((color, idx) => (
                    <div key={idx} className="flex-1" style={{ backgroundColor: color }} />
                  ))}
                </div>
                <div className="px-4 flex-shrink-0">
                  <span
                    className={`inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      selected ? 'bg-primary justify-end' : 'bg-muted justify-start'
                    } px-0.5`}
                  >
                    <span className="h-4 w-4 rounded-full bg-white shadow" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving || isUploadingLogo}>
          <Save className="h-4 w-4" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
