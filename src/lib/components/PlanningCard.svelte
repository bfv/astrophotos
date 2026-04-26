<script lang="ts">
  import type { Photo } from '$lib/types';
  import { t } from '$lib/i18n';
  import { settings } from '$lib/stores/settings';

  interface Props {
    photo: Photo | null;
    position?: { x: number; y: number } | null;
    onclose?: () => void;
  }

  let { photo, position = null, onclose }: Props = $props();

  // ── Layout constants ───────────────────────────────────────────────────────
  const CARD_W = 465;
  const CARD_H = 345; // for position clamping
  // Graph coordinate space (matches SVG viewport below)
  const GW = 372;   // usable graph width (px)
  const GH = 135;    // usable graph height (px)
  const ALT_MIN = -20;
  const ALT_MAX = 90;
  const ALT_RANGE = ALT_MAX - ALT_MIN; // 110°
  const N_POINTS = 97; // one per 15 min → 24 h

  // ── Coordinate helpers ─────────────────────────────────────────────────────
  function xOf(hourOffset: number): number {
    return ((hourOffset + 12) / 24) * GW;
  }
  function yOf(alt: number): number {
    return ((ALT_MAX - alt) / ALT_RANGE) * GH;
  }
  const horizonY = yOf(0);
  const midnightX = xOf(0);

  // ── Formatters ─────────────────────────────────────────────────────────────
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

  // ── Midnight UTC for the configured/local timezone ─────────────────────────
  function getMidnightUTCMs(): number {
    const tz = $settings.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
    const now = new Date();

    function getOffsetMins(date: Date): number {
      const ms = date.getTime();
      const parts = new Intl.DateTimeFormat('en', {
        timeZone: tz,
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false,
      }).formatToParts(date);
      const get = (type: string) => parseInt(parts.find((p) => p.type === type)!.value, 10);
      const localMs = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
      return Math.round((localMs - ms) / 60000);
    }

    const nowOffsetMins = getOffsetMins(now);
    const dateParts = new Intl.DateTimeFormat('en', {
      timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(now);
    const getD = (type: string) => parseInt(dateParts.find((p) => p.type === type)!.value, 10);
    return Date.UTC(getD('year'), getD('month') - 1, getD('day'), 0, 0, 0) - nowOffsetMins * 60000;
  }

  // ── Altitude formula ───────────────────────────────────────────────────────
  function computeAlt(ra_deg: number, dec_deg: number, utcMs: number, lat: number, lon: number): number {

    const J2000 = Date.UTC(2000, 0, 1, 12, 0, 0);
    const d = (utcMs - J2000) / 86_400_000;
    const gmstH = (((280.46061837 + 360.98564736629 * d) % 360) + 360) % 360 / 15;
    const lst = ((gmstH + lon / 15) % 24 + 24) % 24;
    const ha_rad = ((lst - ra_deg / 15) * 15) * Math.PI / 180;
    const lat_rad = lat * Math.PI / 180;
    const dec_rad = dec_deg * Math.PI / 180;
    const sinAlt = Math.sin(lat_rad) * Math.sin(dec_rad) + Math.cos(lat_rad) * Math.cos(dec_rad) * Math.cos(ha_rad);
    return Math.asin(Math.max(-1, Math.min(1, sinAlt))) * 180 / Math.PI;
  }

  // ── Sun position (low-precision, sufficient for twilight zones) ───────────
  function computeSunAlt(utcMs: number, lat: number, lon: number): number {
    const J2000 = Date.UTC(2000, 0, 1, 12, 0, 0);
    const d = (utcMs - J2000) / 86_400_000;
    const L_deg = ((280.46646 + 0.9856474 * d) % 360 + 360) % 360;
    const g = ((357.52911 + 0.9856003 * d) % 360) * Math.PI / 180;
    const C = 1.914602 * Math.sin(g) - 0.004817 * Math.sin(2 * g) + 0.000014 * Math.sin(3 * g);
    const lambda = (L_deg + C) * Math.PI / 180;
    const eps = 23.439291111 * Math.PI / 180;
    const ra_rad = Math.atan2(Math.cos(eps) * Math.sin(lambda), Math.cos(lambda));
    const dec_rad = Math.asin(Math.sin(eps) * Math.sin(lambda));
    const ra_deg = ((ra_rad * 180 / Math.PI) + 360) % 360;
    const dec_deg = dec_rad * 180 / Math.PI;
    return computeAlt(ra_deg, dec_deg, utcMs, lat, lon);
  }

  // ── Twilight background bands ──────────────────────────────────────────────
  const twilightBands = $derived.by(() => {
    const lat = $settings.location?.lat;
    const lon = $settings.location?.lon;
    if (lat == null || lon == null) return [];

    const midnightUTC = getMidnightUTCMs();
    const segW = GW / 96 + 0.5; // slight overlap to avoid pixel gaps

    return Array.from({ length: 96 }, (_, i) => {
      const h0 = -12 + (i / 96) * 24;
      const midH = h0 + 24 / 96 / 2;
      const sunAlt = computeSunAlt(midnightUTC + midH * 3_600_000, lat, lon);

      let fill: string;
      if      (sunAlt >   0) fill = '';                             // day – no overlay
      else if (sunAlt >  -6) fill = 'rgba(200,200,210,0.30)';    // civil twilight
      else if (sunAlt > -12) fill = 'rgba(150,155,170,0.25)';    // nautical twilight
      else if (sunAlt > -18) fill = 'rgba(100,110,135,0.18)';    // astronomical twilight
      else                   fill = '';                             // night – no overlay

      return { x: xOf(h0), w: segW, fill };
    });
  });

  // ── Reactive altitude data ─────────────────────────────────────────────────
  const altPoints = $derived.by(() => {
    if (!photo) return null;
    const lat = $settings.location?.lat;
    const lon = $settings.location?.lon;
    if (lat == null || lon == null) return null;

    const midnightUTC = getMidnightUTCMs();
    return Array.from({ length: N_POINTS }, (_, i) => {
      const hourOffset = -12 + (i / (N_POINTS - 1)) * 24;
      const utcMs = midnightUTC + hourOffset * 3_600_000;
      const alt = computeAlt(photo.ra, photo.dec, utcMs, lat, lon);
      const clampedAlt = Math.max(ALT_MIN, Math.min(ALT_MAX, alt));
      return { x: xOf(hourOffset), y: yOf(clampedAlt) };
    });
  });

  const altPolyline = $derived(
    altPoints?.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') ?? ''
  );

  // Polygon that encloses the above-horizon area (clipped by a <clipPath>)
  const aboveFill = $derived.by(() => {
    if (!altPoints) return '';
    const pts = altPoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`);
    const hY = horizonY.toFixed(1);
    return [
      `${altPoints[0].x.toFixed(1)},${hY}`,
      ...pts,
      `${altPoints[altPoints.length - 1].x.toFixed(1)},${hY}`,
    ].join(' ');
  });

  // X-axis ticks every 3 hours: -12 … +12
  const xTicks = [-12, -9, -6, -3, 0, 3, 6, 9, 12].map((h) => ({
    x: xOf(h),
    label: String(((h + 24) % 24)).padStart(2, '0'),
  }));

  // ── Card positioning ───────────────────────────────────────────────────────
  let cardStyle = $derived.by(() => {
    if (!position) return '';
    const margin = 12;
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1920;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 1080;
    let left = position.x + margin;
    let top = position.y - CARD_H / 2;
    if (left + CARD_W > vw - margin) left = position.x - CARD_W - margin;
    if (top < margin) top = margin;
    if (top + CARD_H > vh - margin) top = vh - CARD_H - margin;
    return `left:${left}px;top:${top}px;`;
  });
</script>

{#if photo}
  <div class="plancard" style={cardStyle}>
    <button class="plancard-close" onclick={onclose} aria-label={$t.info.close}>&times;</button>
    <div class="plancard-body">
      <h3 class="plancard-name">{photo.name}</h3>
      <dl class="plancard-coords">
        <dt>RA</dt><dd>{formatRA(photo.ra)}</dd>
        <dt>Dec</dt><dd>{formatDec(photo.dec)}</dd>
      </dl>

      {#if altPoints}
        <!-- SVG viewBox has 22px left for y-labels, 4px top, 4px right, 14px bottom for x-labels -->
        <div class="plancard-graph">
          <svg viewBox="-22 -4 {GW + 26} {GH + 18}" width="100%" aria-hidden="true">
            <defs>
              <clipPath id="above-{photo.id}">
                <rect x="0" y="0" width={GW} height={horizonY} />
              </clipPath>
            </defs>

            <!-- Twilight zones (background) -->
            {#each twilightBands as band}
              {#if band.fill}
                <rect x={band.x.toFixed(1)} y="0" width={band.w.toFixed(1)} height={GH} fill={band.fill} />
              {/if}
            {/each}

            <!-- Above-horizon fill -->
            <polygon points={aboveFill} clip-path="url(#above-{photo.id})" fill="rgba(100,160,255,0.10)" />

            <!-- 45° guide -->
            <line x1="0" y1={yOf(45)} x2={GW} y2={yOf(45)} stroke="#2a2a4a" stroke-width="1" />

            <!-- Horizon -->
            <line x1="0" y1={horizonY} x2={GW} y2={horizonY} stroke="#555" stroke-width="1" stroke-dasharray="4,3" />

            <!-- Midnight -->
            <line x1={midnightX} y1="0" x2={midnightX} y2={GH} stroke="#445566" stroke-width="1" stroke-dasharray="4,3" />

            <!-- Altitude curve -->
            <polyline points={altPolyline} fill="none" stroke="#7799ff" stroke-width="1.5" stroke-linejoin="round" />

            <!-- Y-axis labels -->
            <text x="-4" y={yOf(90) + 3} text-anchor="end" font-size="8" fill="#666">90°</text>
            <text x="-4" y={yOf(45) + 3} text-anchor="end" font-size="8" fill="#666">45°</text>
            <text x="-4" y={horizonY + 3} text-anchor="end" font-size="8" fill="#666">0°</text>

            <!-- X-axis labels -->
            {#each xTicks as tick}
              <text x={tick.x} y={GH + 12} text-anchor="middle" font-size="8" fill="#666">{tick.label}</text>
            {/each}
          </svg>
        </div>
      {:else}
        <p class="plancard-no-location">{$t.planning.noLocation}</p>
      {/if}
    </div>
  </div>
{/if}

<style>
  .plancard {
    position: fixed;
    top: 0;
    left: 0;
    width: 465px;
    background: #1a1a2e;
    border: 1px solid #444;
    border-radius: 8px;
    color: #e0e0e0;
    font-family: system-ui, sans-serif;
    z-index: 100;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    overflow: hidden;
  }

  .plancard-close {
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
  .plancard-close:hover { color: #fff; }

  .plancard-body {
    padding: 12px;
  }

  .plancard-name {
    margin: 0 0 6px;
    font-size: 16px;
    padding-right: 20px;
  }

  .plancard-coords {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 2px 8px;
    margin: 0 0 10px;
    font-size: 13px;
  }
  .plancard-coords dt {
    color: #888;
    font-weight: normal;
  }
  .plancard-coords dd {
    margin: 0;
    font-variant-numeric: tabular-nums;
  }

  .plancard-graph {
    width: 100%;
  }

  .plancard-no-location {
    margin: 8px 0 0;
    font-size: 12px;
    color: #888;
    font-style: italic;
  }
</style>
