import { derived } from 'svelte/store';
import { browser } from '$app/environment';
import { user } from '$lib/auth';
import { settings } from '$lib/stores/settings';
import { translations, type Locale } from './translations';

export type { Locale } from './translations';

const SUPPORTED_LOCALES: Locale[] = ['en', 'nl'];
const DEFAULT_LOCALE: Locale = 'en';

function resolveLocale(claim: unknown): Locale {
  // First, try the locale claim from the ID token
  if (typeof claim === 'string') {
    const lang = claim.split('-')[0].toLowerCase();
    if ((SUPPORTED_LOCALES as string[]).includes(lang)) return lang as Locale;
  }
  // Fall back to browser language
  if (browser) {
    const lang = navigator.language.split('-')[0].toLowerCase();
    if ((SUPPORTED_LOCALES as string[]).includes(lang)) return lang as Locale;
  }
  return DEFAULT_LOCALE;
}

/** Reactive locale: user settings win, then ID token, then browser language. */
export const locale = derived(
  [user, settings],
  ([$user, $settings]) => {
    if ($settings.language) return $settings.language;
    return resolveLocale($user?.profile?.locale);
  }
);

/** Reactive translation set for the current locale. Use as `$t.section.key`. */
export const t = derived(locale, ($locale) => translations[$locale]);
