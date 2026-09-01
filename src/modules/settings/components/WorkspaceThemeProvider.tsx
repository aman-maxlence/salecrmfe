import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { useGetWorkspaceSettingsQuery } from '../services/workspaceSettingsApi';
import { getThemePalette } from '../constants/themePalettes';

const FONT_FALLBACK = ', ui-sans-serif, system-ui, -apple-system, sans-serif';

/**
 * Applies the org's Workspace Profile settings (accent theme + font) live,
 * app-wide, as soon as they're fetched - mount once near the app root.
 *
 * Theme: sets the `--primary` CSS variable that Tailwind's `bg-primary` /
 * `text-primary` / `ring-primary` / `border-primary` utilities read (see
 * tailwind.config.js) - anything already built on those tokens (the default
 * Button variant, focus rings, ...) re-colors immediately. Components using
 * a hardcoded color like `bg-blue-600` instead of the token won't - that's a
 * separate, much larger migration this doesn't attempt.
 *
 * Font: sets `document.body.style.fontFamily` directly, which affects
 * everything (nothing here needs a design-token migration to pick this up).
 */
export function WorkspaceThemeProvider() {
  const orgId = useSelector((state: RootState) => state.auth.organization?.id);
  const { data: settings } = useGetWorkspaceSettingsQuery(orgId ?? 0, { skip: !orgId });

  useEffect(() => {
    if (!settings) return;

    const palette = getThemePalette(settings.theme_palette);
    document.documentElement.style.setProperty('--primary', palette.primaryHsl);
    document.documentElement.style.setProperty('--ring', palette.primaryHsl);

    if (settings.font_preference) {
      document.body.style.fontFamily = `"${settings.font_preference}"${FONT_FALLBACK}`;
    }
  }, [settings]);

  return null;
}

export default WorkspaceThemeProvider;
