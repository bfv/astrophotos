import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { settingsService, type UserSettings } from '$lib/settingsService';

const initial: UserSettings = browser
  ? settingsService.load()
  : { language: null, location: null };

export const settings = writable<UserSettings>(initial);

// Persist every change automatically
settings.subscribe((val) => {
  if (browser) settingsService.save(val);
});
