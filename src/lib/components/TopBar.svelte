<script lang="ts">
  import type { Snippet } from 'svelte';
  import UserMenu from './UserMenu.svelte';

  interface Props {
    title?: string;
    children?: Snippet;
  }

  let { title = 'Astrophotos', children }: Props = $props();
</script>

<header class="topbar">
  <div class="topbar-left">
    <img src="/images/logo_32px.png" alt="logo" class="topbar-logo" />
    <span class="topbar-title">{title}</span>
  </div>
  <div class="topbar-controls">
    {#if children}{@render children()}{/if}
    <UserMenu />
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

  .topbar-left {
    display: flex;
    align-items: center;
  }

  .topbar-logo {
    height: 32px;
    width: 32px;
    margin-right: 8px;
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
