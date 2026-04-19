<script lang="ts">
	import TopBar from '$lib/components/TopBar.svelte';
	import StarChart from '$lib/components/StarChart.svelte';
	import InfoCard from '$lib/components/InfoCard.svelte';
	import BottomBar from '$lib/components/BottomBar.svelte';
	import type { Photo } from '$lib/types';
	import photosData from '$lib/data/photos.json';

	const photos: Photo[] = photosData as Photo[];
	let selectedPhoto: Photo | null = $state(null);
	let clickPosition: { x: number; y: number } | null = $state(null);

	function handleSelect(photo: Photo, position: { x: number; y: number }) {
		selectedPhoto = photo;
		clickPosition = position;
	}

	function handleClose() {
		selectedPhoto = null;
	}
</script>

<TopBar />
<StarChart {photos} onselect={handleSelect} />
<InfoCard photo={selectedPhoto} position={clickPosition} onclose={handleClose} />
<BottomBar photoCount={photos.length} />
