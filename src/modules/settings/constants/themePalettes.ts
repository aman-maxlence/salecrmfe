/**
 * Fixed catalog of workspace accent themes. `primaryHsl` is applied at
 * runtime to the `--primary` CSS variable (see WorkspaceThemeProvider) -
 * that's what Tailwind's `bg-primary`/`text-primary`/`ring-primary`/
 * `border-primary` utilities read (see tailwind.config.js), so anything
 * already using those tokens (the default Button variant, focus rings, the
 * sidebar/header brand elements) re-themes live. Any component still using
 * a hardcoded color like `bg-blue-600` instead of the token won't - watch
 * for that in new code.
 */
export interface ThemePalette {
  key: string;
  label: string;
  swatches: string[];
  primaryHsl: string;
}

export const THEME_PALETTES: ThemePalette[] = [
  { key: 'sunset', label: 'Sunset', swatches: ['#b23a6b', '#8b5cf6', '#3b1a6b', '#000000'], primaryHsl: '262 66% 47%' },
  { key: 'orchid', label: 'Orchid', swatches: ['#7c1f7c', '#c026d3', '#e9a8f2', '#fdf2f8'], primaryHsl: '292 74% 42%' },
  { key: 'meadow', label: 'Meadow', swatches: ['#1e3a5f', '#4a90d9', '#8bc34a', '#e8e04a'], primaryHsl: '207 65% 46%' },
  { key: 'lagoon', label: 'Lagoon', swatches: ['#0f2f2b', '#1f5c52', '#5a8f87', '#e2735a'], primaryHsl: '174 60% 22%' },
  { key: 'blossom', label: 'Blossom', swatches: ['#2b2560', '#7c4dbd', '#c96fc9', '#f2b8d8'], primaryHsl: '261 45% 40%' },
  { key: 'ember', label: 'Ember', swatches: ['#1a1a1a', '#c1440e', '#e08b2e', '#e8d24a'], primaryHsl: '18 76% 45%' },
  { key: 'twilight', label: 'Twilight', swatches: ['#242850', '#8b4a3d', '#e0724a', '#f2e4a8'], primaryHsl: '231 39% 30%' },
];

export const DEFAULT_THEME_PALETTE_KEY = 'sunset';

export function getThemePalette(key: string | undefined | null): ThemePalette {
  return THEME_PALETTES.find((p) => p.key === key) ?? THEME_PALETTES[0];
}

export const FONT_OPTIONS = ['Inter', 'Poppins', 'Roboto', 'Manrope', 'Lato', 'Nunito'] as const;

export const START_PAGE_OPTIONS: { value: string; label: string; path: string }[] = [
  { value: 'dashboard', label: 'Dashboard', path: '/' },
  { value: 'deals', label: 'Deals', path: '/deals' },
  { value: 'inventory', label: 'Inventory', path: '/inventory' },
];
