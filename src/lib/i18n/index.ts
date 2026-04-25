import { derived } from 'svelte/store';
import { browser } from '$app/environment';
import { user } from '$lib/auth';
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

/** Reactive locale derived from the ID token `locale` claim, with browser-language fallback. */
export const locale = derived(user, ($user) => resolveLocale($user?.profile?.locale));

/** Reactive translation set for the current locale. Use as `$t.section.key`. */
export const t = derived(locale, ($locale) => translations[$locale]);
