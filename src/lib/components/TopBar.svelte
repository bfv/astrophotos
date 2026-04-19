<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    title?: string;
    children?: Snippet;
  }

  let { title = 'Astrophotos', children }: Props = $props();
</script>

<header class="topbar">
  <span class="topbar-title">{title}</span>
  <div class="topbar-controls">
    {#if children}{@render children()}{/if}
  </div>
</header>

<style>
  .topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 40px;
    padding: 0 16px;
    background: #1a1a2e;
    border-bottom: 1px solid #333;
    color: #e0e0e0;
    font-family: system-ui, sans-serif;
    flex-shrink: 0;
  }

  .topbar-title {
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 0.5px;
  }

  .topbar-controls {
    display: flex;
    gap: 12px;
    align-items: center;
  }
</style>
