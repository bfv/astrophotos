import { derived, writable } from 'svelte/store';
import type { Photo } from '$lib/types';
import photosData from '$lib/data/photos.json';

// Internal store — updated by loadPhotos()
const _photos = writable<Photo[]>([]);

// Public read-only store: empty when not logged in
export const photos = derived([_photos], ([$photos]) => $photos);

export async function loadPhotos(token: string | null): Promise<void> {
  // --- Phase 1: local data ---
  // TODO: replace with fetch('/api/photos', { headers: { Authorization: `Bearer ${token}` } })
  _photos.set(photosData as unknown as Photo[]);
}

export function clearPhotos(): void {
  _photos.set([]);
}
