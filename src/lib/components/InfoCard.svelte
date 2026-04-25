<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { Photo } from '$lib/types';
  import { t } from '$lib/i18n';

  interface Props {
    photo: Photo | null;
    position?: { x: number; y: number } | null;
    onclose?: () => void;
    children?: Snippet;
  }

  let { photo, position = null, onclose, children }: Props = $props();

  function formatRA(deg: number): string {
    const totalH = deg / 15;
    const h = Math.floor(totalH);
    const m = ((totalH - h) * 60).toFixed(1);
    return `${h}h ${m}m`;
  }

  function formatDec(deg: number): string {
    const sign = deg < 0 ? '-' : '+';
    const abs = Math.abs(deg);
    const d = Math.floor(abs);
    const m = ((abs - d) * 60).toFixed(1);
    return `${sign}${d}° ${m}'`;
  }

  let cardStyle = $derived.by(() => {
    if (!position) return '';
    const cardW = 280;
    const cardH = 360;
    const margin = 12;
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1920;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 1080;

    let left = position.x + margin;
    let top = position.y - cardH / 2;

    // Flip to left side if overflowing right
    if (left + cardW > vw - margin) {
      left = position.x - cardW - margin;
    }
    // Clamp vertically
    if (top < margin) top = margin;
    if (top + cardH > vh - margin) top = vh - cardH - margin;

    return `left:${left}px;top:${top}px;`;
  });
</script>

{#if photo}
  <div class="infocard" style={cardStyle}>
    <button class="infocard-close" onclick={onclose} aria-label={$t.info.close}>&times;</button>

    <a
      href={photo.fullSizeUrl ?? '#'}
      target="_blank"
      rel="noopener noreferrer"
      class="infocard-thumb-link"
    >
      {#if photo.thumbnail}
        <img class="infocard-thumb" src={photo.thumbnail} alt={photo.name} />
      {:else}
        <div class="infocard-thumb-placeholder">
          <span>&#9733;</span>
        </div>
      {/if}
    </a>

    <div class="infocard-body">
      <h3 class="infocard-name">{photo.name}</h3>
      <dl class="infocard-meta">
        <dt>RA</dt><dd>{formatRA(photo.ra)}</dd>
        <dt>Dec</dt><dd>{formatDec(photo.dec)}</dd>
      </dl>
      {#if photo.metadata}
        <dl class="infocard-meta">
          {#if photo.metadata.date}
            <dt>{$t.info.date}</dt><dd>{photo.metadata.date}</dd>
          {/if}
          {#if photo.metadata.equipment}
            <dt>{$t.info.equipment}</dt><dd>{photo.metadata.equipment}</dd>
          {/if}
          {#if photo.metadata.exposure}
            <dt>{$t.info.exposure}</dt><dd>{photo.metadata.exposure}</dd>
          {/if}
        </dl>
      {/if}
      {#if children}{@render children()}{/if}
    </div>
  </div>
{/if}

<style>
  .infocard {
    position: fixed;
    top: 0;
    left: 0;
    width: 280px;
    background: #1a1a2e;
    border: 1px solid #444;
    border-radius: 8px;
    color: #e0e0e0;
    font-family: system-ui, sans-serif;
    overflow: hidden;
    z-index: 100;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  }

  .infocard-close {
    position: absolute;
    top: 4px;
    right: 8px;
    background: none;
    border: none;
    color: #aaa;
    font-size: 20px;
    cursor: pointer;
    z-index: 1;
  }

  .infocard-close:hover {
    color: #fff;
  }

  .infocard-thumb-link {
    display: block;
    width: 100%;
    height: 160px;
    background: #111;
  }

  .infocard-thumb {
    width: 100%;
    height: 160px;
    object-fit: cover;
  }

  .infocard-thumb-placeholder {
    width: 100%;
    height: 160px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #0d0d1a;
    color: #555;
    font-size: 48px;
  }

  .infocard-body {
    padding: 12px;
  }

  .infocard-name {
    margin: 0 0 8px;
    font-size: 16px;
  }

  .infocard-meta {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 2px 10px;
    margin: 0;
    font-size: 12px;
    color: #aaa;
  }

  .infocard-meta dt {
    font-weight: 600;
    color: #ccc;
  }

  .infocard-meta dd {
    margin: 0;
  }
</style>
