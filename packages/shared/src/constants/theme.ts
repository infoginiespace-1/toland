/**
 * TOLAND Theme Tokens (Forest Green)
 * Non-negotiable brand color specification.
 */
export const THEME_TOKENS = {
  primary: '#14532D',        // deep forest green
  primaryHover: '#0F3F22',
  accent: '#228B22',         // forest green
  surface: '#F0F7F2',
  surfaceAlt: '#E3EFE7',
  text: '#0F1F17',
  muted: '#5B6B61',
  border: '#CFE0D5',
  danger: '#B3261E',
  warning: '#B7791F',
  success: '#1E7B3A',
} as const;

export type ThemeTokenKey = keyof typeof THEME_TOKENS;
