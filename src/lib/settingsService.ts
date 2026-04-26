import type { Locale } from '$lib/i18n';
import { get } from 'svelte/store';
import { accessToken, apiBaseUrl } from '$lib/auth';

export interface UserSettings {
  language: Locale | null; // null = auto-detect from token / browser
  location: { lat: number; lon: number } | null;
  timezone: string | null; // IANA timezone, null = derive from location / browser
  astrobinApiKey: string | null;
  astrometryApiKey: string | null;
}

export interface SettingsService {
  load(token?: string | null): Promise<UserSettings>;
  save(settings: UserSettings): Promise<void>;
}

export const defaults: UserSettings = {
  language: null,
  location: null,
  timezone: null,
  astrobinApiKey: null,
  astrometryApiKey: null,
};

function fromApi(raw: Record<string, unknown>): UserSettings {
  return {
    language: (raw['language'] as Locale) ?? null,
    location:
      raw['lat'] != null && raw['lon'] != null
        ? { lat: raw['lat'] as number, lon: raw['lon'] as number }
        : null,
    timezone: (raw['timezone'] as string) ?? null,
    astrobinApiKey: (raw['astrobin_api_key'] as string) ?? null,
    astrometryApiKey: (raw['astrometry_api_key'] as string) ?? null,
  };
}

function toApi(s: UserSettings): Record<string, unknown> {
  return {
    language: s.language,
    lat: s.location?.lat ?? null,
    lon: s.location?.lon ?? null,
    timezone: s.timezone,
    astrobin_api_key: s.astrobinApiKey,
    astrometry_api_key: s.astrometryApiKey,
  };
}

const apiService: SettingsService = {
  async load(token?: string | null): Promise<UserSettings> {
    const t = token ?? get(accessToken);
    if (!t) return { ...defaults };
    const res = await fetch(`${apiBaseUrl}/api/settings`, {
      headers: { Authorization: `Bearer ${t}` },
    });
    if (!res.ok) throw new Error(`Failed to load settings: ${res.status}`);
    return fromApi(await res.json());
  },

  async save(s: UserSettings): Promise<void> {
    const token = get(accessToken);
    if (!token) return;
    const res = await fetch(`${apiBaseUrl}/api/settings`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(toApi(s)),
    });
    if (!res.ok) throw new Error(`Failed to save settings: ${res.status}`);
  },
};

export const settingsService: SettingsService = apiService;
