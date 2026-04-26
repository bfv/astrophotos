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

  function xOfDay(dayIndex: number): number {
    return (dayIndex / 364) * GW;
  }

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
    const thisMidnight = Date.UTC(getD('year'), getD('month') - 1, getD('day'), 0, 0, 0) - nowOffsetMins * 60000;
    // If we're past noon, plan for tonight (next midnight); otherwise use last midnight
    const hoursSince = (now.getTime() - thisMidnight) / 3_600_000;
    return hoursSince > 12 ? thisMidnight + 86_400_000 : thisMidnight;
  }

  // Returns the UTC ms corresponding to `localHour:00:00` in the target timezone
  // on the calendar day that is `dayIndex` days after Jan 1 of the current year.
  // Uses noon UTC as a safe anchor to avoid date-boundary edge cases, then
  // derives the actual timezone offset for that specific day (DST-aware).
  function getYearDayUTCMs(dayIndex: number, localHour: number): number {
    const tz = $settings.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
    const year = new Date().getFullYear();
    // Noon UTC on day i — safely in the middle of the day for any timezone
    const refUtc = new Date(Date.UTC(year, 0, 1 + dayIndex, 12, 0, 0));
    const parts = new Intl.DateTimeFormat('en', {
      timeZone: tz,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false,
    }).formatToParts(refUtc);
    const get = (type: string) => parseInt(parts.find((p) => p.type === type)!.value, 10);
    // Treat local components as UTC to derive the offset at this day
    const refLocalMs = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
    const offsetMins = Math.round((refLocalMs - refUtc.getTime()) / 60000);
    // Local midnight UTC for this calendar day, then add localHour
    return Date.UTC(get('year'), get('month') - 1, get('day'), 0, 0, 0) - offsetMins * 60000 + localHour * 3_600_000;
  }

  function getYearStartUTCMs(): number {
    const tz = $settings.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
    const year = new Date().getFullYear();
    const jan1 = new Date(Date.UTC(year, 0, 1));
    const parts = new Intl.DateTimeFormat('en', {
      timeZone: tz,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false,
    }).formatToParts(jan1);
    const get = (type: string) => parseInt(parts.find((p) => p.type === type)!.value, 10);
    const localMs = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
    const offsetMins = Math.round((localMs - jan1.getTime()) / 60000);
    return Date.UTC(year, 0, 1, 0, 0, 0) - offsetMins * 60000;
  }

  // ── Altitude formula ───────────────────────────────────────────────────────
  function computeAltAz(ra_deg: number, dec_deg: number, utcMs: number, lat: number, lon: number): { alt: number; az: number } {
    const J2000 = Date.UTC(2000, 0, 1, 12, 0, 0);
    const d = (utcMs - J2000) / 86_400_000;
    const gmstH = (((280.46061837 + 360.98564736629 * d) % 360) + 360) % 360 / 15;
    const lst = ((gmstH + lon / 15) % 24 + 24) % 24;
    const ha_rad = ((lst - ra_deg / 15) * 15) * Math.PI / 180;
    const lat_rad = lat * Math.PI / 180;
    const dec_rad = dec_deg * Math.PI / 180;
    const sinAlt = Math.sin(lat_rad) * Math.sin(dec_rad) + Math.cos(lat_rad) * Math.cos(dec_rad) * Math.cos(ha_rad);
    const alt = Math.asin(Math.max(-1, Math.min(1, sinAlt))) * 180 / Math.PI;
    const az_rad = Math.atan2(
      -Math.cos(dec_rad) * Math.sin(ha_rad),
      Math.sin(dec_rad) * Math.cos(lat_rad) - Math.cos(dec_rad) * Math.cos(ha_rad) * Math.sin(lat_rad)
    );
    const az = ((az_rad * 180 / Math.PI) + 360) % 360;
    return { alt, az };
  }

  function computeAlt(ra_deg: number, dec_deg: number, utcMs: number, lat: number, lon: number): number {
    return computeAltAz(ra_deg, dec_deg, utcMs, lat, lon).alt;
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
      return { x: xOf(hourOffset), y: yOf(clampedAlt), alt };
    });
  });

  // X of the highest-altitude point
  const peakX = $derived.by(() => {
    if (!altPoints) return null;
    let best = altPoints[0];
    for (const p of altPoints) if (p.alt > best.alt) best = p;
    return best.x;
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

  // Whether the object stays entirely below the horizon
  const dailyBelowHorizon = $derived(
    !!altPoints && altPoints.every((p) => p.alt < 0)
  );

  // X-axis ticks every 3 hours: -12 … +12
  const xTicks = [-12, -9, -6, -3, 0, 3, 6, 9, 12].map((h) => ({
    x: xOf(h),
    label: String(((h + 24) % 24)).padStart(2, '0'),
  }));

  // X position for the current time
  const nowX = $derived.by(() => {
    const hourOffset = (Date.now() - getMidnightUTCMs()) / 3_600_000;
    const x = xOf(hourOffset);
    return (x >= 0 && x <= GW) ? x : null;
  });

  // ── Graph mode ────────────────────────────────────────────────────────────
  type GraphMode = 'daily' | 'yearly';
  let graphMode: GraphMode = $state('daily');
  let yearlyObsHour = $state(0); // local hour to sample altitude for yearly view
  const yearlyHours = Array.from({ length: 24 }, (_, i) => (19 + i) % 24);

  // ── Yearly altitude data ──────────────────────────────────────────────────
  const yearlyPoints = $derived.by(() => {
    if (!photo) return null;
    const lat = $settings.location?.lat;
    const lon = $settings.location?.lon;
    if (lat == null || lon == null) return null;

    return Array.from({ length: 365 }, (_, i) => {
      const utcMs = getYearDayUTCMs(i, yearlyObsHour);
      const alt = computeAlt(photo.ra, photo.dec, utcMs, lat, lon);
      const clampedAlt = Math.max(ALT_MIN, Math.min(ALT_MAX, alt));
      return { x: xOfDay(i), y: yOf(clampedAlt), alt };
    });
  });

  const yearlyPeakX = $derived.by(() => {
    if (!yearlyPoints) return null;
    let best = yearlyPoints[0];
    for (const p of yearlyPoints) if (p.alt > best.alt) best = p;
    return best.x;
  });

  const yearlyPolyline = $derived(
    yearlyPoints?.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') ?? ''
  );

  const yearlyAboveFill = $derived.by(() => {
    if (!yearlyPoints) return '';
    const pts = yearlyPoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`);
    const hY = horizonY.toFixed(1);
    return [
      `${yearlyPoints[0].x.toFixed(1)},${hY}`,
      ...pts,
      `${yearlyPoints[yearlyPoints.length - 1].x.toFixed(1)},${hY}`,
    ].join(' ');
  });

  const yearlyBelowHorizon = $derived(
    !!yearlyPoints && yearlyPoints.every((p) => p.alt < 0)
  );

  const _curYear = new Date().getFullYear();
  const yearlyXTicks = Array.from({ length: 12 }, (_, m) => {
    const dayIndex = Math.round(
      (new Date(_curYear, m, 1).getTime() - new Date(_curYear, 0, 1).getTime()) / 86_400_000
    );
    const label = new Intl.DateTimeFormat('en', { month: 'short' }).format(new Date(_curYear, m, 1));
    return { x: xOfDay(dayIndex), label };
  });

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

  // ── Hover time + altitude ─────────────────────────────────────────────────
  let svgEl: SVGSVGElement | undefined = $state();
  let hoverX: number | null = $state(null);

  function onSvgMouseMove(e: MouseEvent) {
    if (!svgEl) return;
    // Convert CSS offsetX → SVG viewBox x coordinate
    const svgX = e.offsetX * (GW + 26) / svgEl.clientWidth - 22;
    hoverX = (svgX >= 0 && svgX <= GW) ? svgX : null;
  }

  function onSvgMouseLeave() {
    hoverX = null;
  }

  // The active x: hover position, or peak altitude position when not hovering
  const activeX = $derived(hoverX ?? (graphMode === 'daily' ? peakX : yearlyPeakX));

  // ── Hover time + altitude ─────────────────────────────────────────────────
  const hoverInfo = $derived.by(() => {
    if (activeX === null || !photo) return null;
    const lat = $settings.location?.lat;
    const lon = $settings.location?.lon;
    if (lat == null || lon == null) return null;

    const tz = $settings.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
    let utcMs: number;
    let timeStr: string;

    if (graphMode === 'daily') {
      const hourOffset = (activeX / GW) * 24 - 12;
      utcMs = getMidnightUTCMs() + hourOffset * 3_600_000;
      timeStr = new Intl.DateTimeFormat('en', {
        timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false,
      }).format(new Date(utcMs));
    } else {
      const dayIndex = Math.round((activeX / GW) * 364);
      utcMs = getYearDayUTCMs(dayIndex, yearlyObsHour);
      timeStr = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(utcMs));
    }

    const { alt, az } = computeAltAz(photo.ra, photo.dec, utcMs, lat, lon);
    return { time: timeStr, alt: alt.toFixed(1), az: az.toFixed(1) };
  });
</script>

{#if photo}
  <div class="plancard" style={cardStyle}>
    <button class="plancard-close" onclick={onclose} aria-label={$t.info.close}>&times;</button>
    <div class="plancard-body">
      <div class="plancard-title-row">
        <h3 class="plancard-name">{photo.name}</h3>
        <div class="graph-mode-set">
          <label class="gm-option" class:gm-active={graphMode === 'daily'}>
            <input type="radio" name="graph-mode-{photo.id}" value="daily" bind:group={graphMode} />
            {$t.planning.graphDaily}
          </label>
          <label class="gm-option" class:gm-active={graphMode === 'yearly'}>
            <input type="radio" name="graph-mode-{photo.id}" value="yearly" bind:group={graphMode} />
            {$t.planning.graphYearly}
          </label>
        </div>
        {#if graphMode === 'yearly'}
          <div class="obs-hour-select">
            <select bind:value={yearlyObsHour}>
              {#each yearlyHours as h}
                <option value={h}>{String(h).padStart(2, '0')}:00</option>
              {/each}
            </select>
          </div>
        {:else}
          <div></div>
        {/if}
      </div>
      <hr class="plancard-divider" />
      <div class="plancard-header-row">
        <dl class="plancard-coords">
          <dt>RA</dt><dd>{formatRA(photo.ra)}</dd>
          <dt>Dec</dt><dd>{formatDec(photo.dec)}</dd>
        </dl>
        {#if hoverInfo}
          <dl class="plancard-coords plancard-hover-coords">
            <dt>{$t.planning.hoverTime}</dt><dd>{hoverInfo.time}</dd>
            <dt>{$t.planning.hoverAlt}</dt><dd>{hoverInfo.alt}°</dd>
            <dt>{$t.planning.hoverAz}</dt><dd>{hoverInfo.az}°</dd>
          </dl>
        {/if}
      </div>

      {#if graphMode === 'daily'}
        {#if altPoints}
          <div class="plancard-graph">
            <svg bind:this={svgEl} viewBox="-22 -4 {GW + 26} {GH + 18}" width="100%" aria-hidden="true"
                 onmousemove={onSvgMouseMove} onmouseleave={onSvgMouseLeave}>
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
              <line x1="0" y1={horizonY} x2={GW} y2={horizonY}
                stroke={dailyBelowHorizon ? '#7799ff' : '#555'} stroke-width="1" stroke-dasharray="4,3" />
              <line x1={midnightX} y1="0" x2={midnightX} y2={GH} stroke="#445566" stroke-width="1" stroke-dasharray="4,3" />

              <!-- Now -->
              {#if nowX !== null}
                <line x1={nowX} y1="0" x2={nowX} y2={GH} stroke="#ffee44" stroke-width="1" stroke-dasharray="3,3" opacity="0.7" />
              {/if}

              <!-- Altitude curve -->
              <polyline points={altPolyline} fill="none" stroke="#7799ff" stroke-width="1.5" stroke-linejoin="round" clip-path="url(#above-{photo.id})" />

              <!-- Y-axis labels -->
              <text x="-4" y={yOf(90) + 3} text-anchor="end" font-size="8" fill="#666">90°</text>
              <text x="-4" y={yOf(45) + 3} text-anchor="end" font-size="8" fill="#666">45°</text>
              <text x="-4" y={horizonY + 3} text-anchor="end" font-size="8" fill="#666">0°</text>

              <!-- X-axis labels -->
              {#each xTicks as tick}
                <text x={tick.x} y={GH + 12} text-anchor="middle" font-size="8" fill="#666">{tick.label}</text>
              {/each}

              <!-- Hover/peak crosshair -->
              {#if activeX !== null}
                <line x1={activeX} y1="0" x2={activeX} y2={GH} stroke="#aabbff" stroke-width="1" stroke-dasharray="3,3" />
              {/if}
            </svg>
          </div>
        {:else}
          <p class="plancard-no-location">{$t.planning.noLocation}</p>
        {/if}
      {:else}
        {#if yearlyPoints}
          <div class="plancard-graph">
            <svg bind:this={svgEl} viewBox="-22 -4 {GW + 26} {GH + 18}" width="100%" aria-hidden="true"
                 onmousemove={onSvgMouseMove} onmouseleave={onSvgMouseLeave}>
              <defs>
                <clipPath id="above-yr-{photo.id}">
                  <rect x="0" y="0" width={GW} height={horizonY} />
                </clipPath>
              </defs>

              <!-- Above-horizon fill -->
              <polygon points={yearlyAboveFill} clip-path="url(#above-yr-{photo.id})" fill="rgba(100,160,255,0.10)" />

              <!-- 45° guide -->
              <line x1="0" y1={yOf(45)} x2={GW} y2={yOf(45)} stroke="#2a2a4a" stroke-width="1" />

              <!-- Horizon -->
              <line x1="0" y1={horizonY} x2={GW} y2={horizonY}
                stroke={yearlyBelowHorizon ? '#7799ff' : '#555'} stroke-width="1" stroke-dasharray="4,3" />

              <!-- Altitude curve -->
              <polyline points={yearlyPolyline} fill="none" stroke="#7799ff" stroke-width="1.5" stroke-linejoin="round" clip-path="url(#above-yr-{photo.id})" />

              <!-- Y-axis labels -->
              <text x="-4" y={yOf(90) + 3} text-anchor="end" font-size="8" fill="#666">90°</text>
              <text x="-4" y={yOf(45) + 3} text-anchor="end" font-size="8" fill="#666">45°</text>
              <text x="-4" y={horizonY + 3} text-anchor="end" font-size="8" fill="#666">0°</text>

              <!-- X-axis labels -->
              {#each yearlyXTicks as tick}
                <text x={tick.x} y={GH + 12} text-anchor="middle" font-size="8" fill="#666">{tick.label}</text>
              {/each}

              <!-- Hover/peak crosshair -->
              {#if activeX !== null}
                <line x1={activeX} y1="0" x2={activeX} y2={GH} stroke="#aabbff" stroke-width="1" stroke-dasharray="3,3" />
              {/if}
            </svg>
          </div>
        {:else}
          <p class="plancard-no-location">{$t.planning.noLocation}</p>
        {/if}
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
    margin: 0;
    font-size: 16px;
  }

  .plancard-header-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    margin: 0 0 10px;
  }

  .plancard-coords {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 2px 8px;
    margin: 0;
    font-size: 13px;
  }
  .plancard-hover-coords {
    text-align: right;
  }
  .plancard-hover-coords dt {
    text-align: right;
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

  .plancard-divider {
    border: none;
    border-top: 1px solid rgba(255, 255, 255, 0.15);
    margin: 0 0 8px;
  }

  .plancard-title-row {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    margin: 0 0 6px;
    padding-right: 22px; /* leave room for absolute close button */
    min-height: 24px;
  }

  .graph-mode-set {
    display: flex;
    border: 1px solid #555;
    border-radius: 4px;
    overflow: hidden;
    flex-shrink: 0;
  }
  .gm-option {
    display: flex;
    align-items: center;
    padding: 2px 8px;
    font-size: 11px;
    cursor: pointer;
    background: #0d0d1a;
    color: #aaa;
    user-select: none;
    transition: background 0.15s;
  }
  .gm-option:not(:last-child) {
    border-right: 1px solid #555;
  }
  .gm-option:hover {
    background: #1a1a3e;
    color: #e0e0e0;
  }
  .gm-active {
    background: #1a1a4a;
    color: #aabbff;
  }
  .gm-option input[type='radio'] {
    display: none;
  }

  .obs-hour-select {
    display: flex;
    align-items: center;
    padding-left: 5px;
    font-size: 11px;
    color: #aaa;
  }

  .obs-hour-select select {
    background: #0d0d1a;
    color: #aabbff;
    border: 1px solid #555;
    border-radius: 4px;
    font-size: 11px;
    padding: 2px 4px;
    cursor: pointer;
  }

  .plancard-no-location {
    margin: 8px 0 0;
    font-size: 12px;
    color: #888;
    font-style: italic;
  }
</style>
