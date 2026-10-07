export type ThemeId = 'clinical-light' | 'ocean-blue' | 'emerald-health' | 'midnight-dark';

export interface ThemeOption {
  id: ThemeId;
  name: string;
  badge: string;
  description: string;
  primaryColor: string;
  accentColor: string;
  isDark: boolean;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'clinical-light',
    name: 'Clinical Clean',
    badge: 'Modern Light',
    description: 'Pristine hospital white & cool slate with surgical clarity and high sunlight legibility.',
    primaryColor: '#ffffff',
    accentColor: '#0d9488',
    isDark: false
  },
  {
    id: 'ocean-blue',
    name: 'Ocean Medical',
    badge: 'Clinical Blue',
    description: 'Professional healthcare royal sapphire & cyan palette with clean clinical accents.',
    primaryColor: '#f0f7ff',
    accentColor: '#2563eb',
    isDark: false
  },
  {
    id: 'emerald-health',
    name: 'Emerald Care',
    badge: 'Mint Health',
    description: 'Calming mint & ayurvedic preventive care green with organic tones.',
    primaryColor: '#f2f9f5',
    accentColor: '#059669',
    isDark: false
  },
  {
    id: 'midnight-dark',
    name: 'Midnight Dark',
    badge: 'Dark Station',
    description: 'Original high-contrast deep slate for nighttime and low-light hospital monitoring.',
    primaryColor: '#020617',
    accentColor: '#14b8a6',
    isDark: true
  }
];

const STORAGE_KEY = 'sanjeevani_theme';

export function getInitialTheme(): ThemeId {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeId;
    if (saved && THEME_OPTIONS.some(t => t.id === saved)) {
      return saved;
    }
  } catch (e) {}
  // Default to the refreshed modern Clinical Clean theme
  return 'clinical-light';
}

export function applyTheme(themeId: ThemeId): void {
  try {
    document.documentElement.setAttribute('data-theme', themeId);
    if (themeId === 'midnight-dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem(STORAGE_KEY, themeId);
  } catch (e) {
    console.error('Failed to apply theme:', e);
  }
}
