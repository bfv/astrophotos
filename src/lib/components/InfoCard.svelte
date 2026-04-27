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
    const cardW = 465;
    const cardH = 320;
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
    <div class="infocard-body">
      <div class="infocard-title-row">
        <h3 class="infocard-name">{photo.designation}</h3>
      </div>
      <hr class="infocard-divider" />
      <div class="infocard-header-row">
        <dl class="infocard-coords">
          <dt>RA</dt><dd>{formatRA(photo.ra)}</dd>
          <dt>Dec</dt><dd>{formatDec(photo.dec)}</dd>
        </dl>
        {#if photo.metadata}
          <dl class="infocard-coords infocard-meta-right">
            {#if photo.metadata.date}
              <dt>{$t.info.date}</dt><dd>{photo.metadata.date}</dd>
            {/if}
            {#if photo.metadata.exposure}
              <dt>{$t.info.exposure}</dt><dd>{photo.metadata.exposure}</dd>
            {/if}
          </dl>
        {/if}
      </div>
    </div>

    <a
      href={photo.fullSizeUrl ?? '#'}
      target="_blank"
      rel="noopener noreferrer"
      class="infocard-thumb-link"
      title={photo.fullSizeUrl ?? photo.thumbnailUrl ?? undefined}
    >
      {#if photo.thumbnailUrl}
        <img class="infocard-thumb" src={photo.thumbnailUrl} alt={photo.designation} />
      {:else}
        <div class="infocard-thumb-placeholder">
          <span>&#9733;</span>
        </div>
      {/if}
    </a>

    {#if photo.metadata?.equipment}
      <div class="infocard-equipment">{photo.metadata.equipment}</div>
    {/if}

    {#if children}{@render children()}{/if}
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
  .infocard-close:hover { color: #fff; }

  .infocard-body {
    padding: 12px;
  }

  .infocard-title-row {
    margin: 0 0 6px;
    padding-right: 22px;
    min-height: 24px;
  }

  .infocard-name {
    margin: 0;
    font-size: 16px;
  }

  .infocard-divider {
    border: none;
    border-top: 1px solid rgba(255, 255, 255, 0.15);
    margin: 0 0 8px;
  }

  .infocard-header-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
  }

  .infocard-coords {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 2px 8px;
    margin: 0;
    font-size: 13px;
  }
  .infocard-coords dt {
    color: #888;
    font-weight: normal;
  }
  .infocard-coords dd {
    margin: 0;
    font-variant-numeric: tabular-nums;
  }

  .infocard-meta-right {
    text-align: right;
  }
  .infocard-meta-right dt {
    text-align: right;
  }

  .infocard-thumb-link {
    display: block;
    width: 100%;
    height: 200px;
    background: #111;
  }

  .infocard-thumb {
    width: 100%;
    height: 200px;
    object-fit: cover;
  }

  .infocard-thumb-placeholder {
    width: 100%;
    height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #0d0d1a;
    color: #555;
    font-size: 48px;
  }

  .infocard-equipment {
    padding: 6px 12px;
    font-size: 11px;
    color: #777;
  }
</style>
