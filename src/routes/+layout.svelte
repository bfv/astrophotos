<script lang="ts">
	import { onMount } from 'svelte';
	import { initAuth, isLoggedIn, accessToken } from '$lib/auth';
	import { loadPhotos, clearPhotos } from '$lib/photoService';
	import { loadSettings } from '$lib/stores/settings';

	let { children } = $props();

	onMount(() => {
		let unsub: (() => void) | undefined;

		initAuth().then(() => {
			unsub = isLoggedIn.subscribe(async (loggedIn) => {
				if (loggedIn) {
					let token: string | null = null;
					const t = accessToken.subscribe((v) => (token = v));
					t();
					await Promise.all([loadPhotos(token), loadSettings()]);
				} else {
					clearPhotos();
				}
			});
		});

		return () => unsub?.();
	});
</script>

<div class="app-layout">
	{@render children()}
</div>

<style>
	:global(html, body) {
		margin: 0;
		padding: 0;
		height: 100%;
		overflow: hidden;
		background: #000011;
		color: #e0e0e0;
	}

	.app-layout {
		display: flex;
		flex-direction: column;
		height: 100vh;
	}
</style>
