<script lang="ts">
	import TopBar from '$lib/components/TopBar.svelte';
	import StarChart from '$lib/components/StarChart.svelte';
	import InfoCard from '$lib/components/InfoCard.svelte';
	import BottomBar from '$lib/components/BottomBar.svelte';
	import type { Photo } from '$lib/types';
	import photosData from '$lib/data/photos.json';
	import { browser } from '$app/environment';

	const PROJECTIONS = [
		{ value: 'equirectangular', label: 'Equirectangular' },
		{ value: 'aitoff', label: 'Aitoff' },
		{ value: 'mollweide', label: 'Mollweide' },
		{ value: 'hammer', label: 'Hammer' },
		{ value: 'stereographic', label: 'Stereographic' },
		{ value: 'orthographic', label: 'Orthographic' },
		{ value: 'mercator', label: 'Mercator' }
	];

	const storedProjection = browser ? localStorage.getItem('projection') : null;
	let projection: string = $state(storedProjection ?? 'equirectangular');

	function handleProjectionChange(e: Event) {
		projection = (e.target as HTMLSelectElement).value;
		if (browser) localStorage.setItem('projection', projection);
	}

	const photos: Photo[] = photosData as unknown as Photo[];
	let selectedPhoto: Photo | null = $state(null);
	let clickPosition: { x: number; y: number } | null = $state(null);
	let starChart: StarChart;

	function handleSelect(photo: Photo, position: { x: number; y: number }) {
		selectedPhoto = photo;
		clickPosition = position;
	}

	function handleClose() {
		selectedPhoto = null;
	}
</script>

<TopBar>
	<select class="projection-select" value={projection} onchange={handleProjectionChange}>
		{#each PROJECTIONS as proj}
			<option value={proj.value}>{proj.label}</option>
		{/each}
	</select>
	<button class="reset-btn" onclick={() => starChart.resetCenter()}>⌖ Reset</button>
</TopBar>
<StarChart bind:this={starChart} {photos} {projection} onselect={handleSelect} />
<InfoCard photo={selectedPhoto} position={clickPosition} onclose={handleClose} />
<BottomBar photoCount={photos.length} />

<style>
	:global(.projection-select) {
		background: #0d0d1a;
		color: #e0e0e0;
		border: 1px solid #555;
		border-radius: 4px;
		padding: 2px 8px;
		font-size: 13px;
		cursor: pointer;
	}
	:global(.projection-select:focus) {
		outline: 1px solid #6688cc;
		border-color: #6688cc;
	}
	:global(.reset-btn) {
		background: #0d0d1a;
		color: #e0e0e0;
		border: 1px solid #555;
		border-radius: 4px;
		padding: 2px 10px;
		font-size: 13px;
		cursor: pointer;
	}
	:global(.reset-btn:hover) {
		background: #1a1a3e;
		border-color: #6688cc;
	}
</style>
