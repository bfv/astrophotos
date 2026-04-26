import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { settingsService, defaults, type UserSettings } from '$lib/settingsService';

export const settings = writable<UserSettings>({ ...defaults });

// Suppress auto-save during initial load and on the first (immediate) subscriber call.
let _loading = false;
let _initialized = false;

// Persist every change to the backend automatically, but not during initial load.
settings.subscribe((val) => {
  if (!_initialized) { _initialized = true; return; }
  if (browser && !_loading) {
    settingsService.save(val).catch(() => {/* ignore — no token yet or network error */});
  }
});

export async function loadSettings(token?: string | null): Promise<void> {
  if (!browser) return;
  _loading = true;
  try {
    const loaded = await settingsService.load(token);
    settings.set(loaded);
  } catch {
    // keep defaults
  } finally {
    _loading = false;
  }
}
