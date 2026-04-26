import { derived, writable } from 'svelte/store';
import type { Photo } from '$lib/types';
import messierData from '$lib/data/messier.json';
import photosData from '$lib/data/photos.json';

// Internal store — default to Messier catalog for logged-out visitors
const _photos = writable<Photo[]>(messierData as unknown as Photo[]);

// Public read-only store
export const photos = derived([_photos], ([$photos]) => $photos);

export async function loadPhotos(token: string | null): Promise<void> {
  // --- Phase 1: local data ---
  // TODO: replace with fetch('/api/photos', { headers: { Authorization: `Bearer ${token}` } })
  _photos.set(token ? photosData as unknown as Photo[] : messierData as unknown as Photo[]);
}

export function clearPhotos(): void {
  _photos.set(messierData as unknown as Photo[]);
}
