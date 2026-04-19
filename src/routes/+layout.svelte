<script lang="ts">
	let { children } = $props();
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
