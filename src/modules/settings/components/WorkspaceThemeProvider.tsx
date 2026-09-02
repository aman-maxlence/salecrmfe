import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { useGetWorkspaceSettingsQuery } from '../services/workspaceSettingsApi';
import { getThemePalette } from '../constants/themePalettes';

const FONT_FALLBACK = ', ui-sans-serif, system-ui, -apple-system, sans-serif';
const STYLE_TAG_ID = 'workspace-theme-vars';

/**
 * Applies the org's Workspace Profile settings (accent theme + font) live,
 * app-wide, as soon as they're fetched - mount once near the app root.
 *
 * Theme: writes a `<style>` tag defining `--primary`/`--ring` on both
 * `:root` and `.dark`, which Tailwind's `bg-primary`/`text-primary`/
 * `ring-primary`/`border-primary` utilities read (see tailwind.config.js) -
 * anything already built on those tokens (the default Button variant, focus
 * rings, the sidebar/header brand elements) re-colors immediately, in both
 * light and dark mode. A plain inline style on `document.documentElement`
 * doesn't survive dark mode here: `.dark` in index.css redeclares
 * `--primary` on the element carrying that class (MainLayout's wrapper
 * div, not <html>), and a same-element declaration always wins over an
 * inherited one regardless of where in the tree the inline style lives -
 * so the injected stylesheet rule (same specificity, later in the cascade)
 * is what actually wins in both modes. Components still using a hardcoded
 * color like `bg-blue-600` instead of the token won't re-theme.
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
    let styleTag = document.getElementById(STYLE_TAG_ID) as HTMLStyleElement | null;
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = STYLE_TAG_ID;
      document.head.appendChild(styleTag);
    }
    styleTag.textContent = `:root, .dark { --primary: ${palette.primaryHsl}; --ring: ${palette.primaryHsl}; }`;

    if (settings.font_preference) {
      document.body.style.fontFamily = `"${settings.font_preference}"${FONT_FALLBACK}`;
    }
  }, [settings]);

  return null;
}

export default WorkspaceThemeProvider;
