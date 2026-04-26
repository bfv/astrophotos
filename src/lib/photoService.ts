import { derived, writable } from 'svelte/store';
import type { Photo } from '$lib/types';
import messierData from '$lib/data/messier.json';
import photosData from '$lib/data/photos.json';

export type Catalog = 'messier' | 'photos';

// Single source of truth for which catalog is active
export const currentCatalog = writable<Catalog>('messier');

// Photos store derived from currentCatalog — always in sync
export const photos = derived(currentCatalog, (catalog) =>
  (catalog === 'photos' ? photosData : messierData) as unknown as Photo[]
);

export async function loadPhotos(token: string | null): Promise<void> {
  currentCatalog.set(token ? 'photos' : 'messier');
}

export function setCatalog(catalog: Catalog): void {
  currentCatalog.set(catalog);
}

export function clearPhotos(): void {
  currentCatalog.set('messier');
}
