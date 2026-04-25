import type { Locale } from '$lib/i18n';

export interface UserSettings {
  language: Locale | null; // null = auto-detect from token / browser
  location: { lat: number; lon: number } | null;
  timezone: string | null; // IANA timezone, null = derive from location / browser
  astrobinApiKey: string | null;
  astrometryApiKey: string | null;
}

export interface SettingsService {
  load(): UserSettings;
  save(settings: UserSettings): void;
}

const STORAGE_KEY = 'user_settings';

const defaults: UserSettings = { language: null, location: null, timezone: null, astrobinApiKey: null, astrometryApiKey: null };

const localStorageService: SettingsService = {
  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? { ...defaults, ...JSON.parse(raw) } : { ...defaults };
    } catch {
      return { ...defaults };
    }
  },
  save(settings) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  },
};

/** Swap this export to switch to a server-backed implementation. */
export const settingsService: SettingsService = localStorageService;
