import { derived, writable } from 'svelte/store';
import type { Photo } from '$lib/types';
import { isLoggedIn, accessToken } from '$lib/auth';
import photosData from '$lib/data/photos.json';

// Internal store — updated by loadPhotos()
const _photos = writable<Photo[]>([]);

// Public read-only store: empty when not logged in
export const photos = derived([_photos, isLoggedIn], ([$photos, $loggedIn]) =>
  $loggedIn ? $photos : []
);

export async function loadPhotos(token: string | null): Promise<void> {
  // --- Phase 1: local data ---
  // TODO: replace with fetch('/api/photos', { headers: { Authorization: `Bearer ${token}` } })
  _photos.set(photosData as unknown as Photo[]);
}

// Auto-reload whenever login state changes
isLoggedIn.subscribe(async (loggedIn) => {
  if (loggedIn) {
    // Get current token from accessToken store (one-shot read)
    let token: string | null = null;
    const unsub = accessToken.subscribe((t) => (token = t));
    unsub();
    await loadPhotos(token);
  } else {
    _photos.set([]);
  }
});
