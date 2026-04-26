<script lang="ts">
	import TopBar from '$lib/components/TopBar.svelte';
	import StarChart from '$lib/components/StarChart.svelte';
	import InfoCard from '$lib/components/InfoCard.svelte';
	import BottomBar from '$lib/components/BottomBar.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import { photos } from '$lib/photoService';
	import type { Photo } from '$lib/types';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { t } from '$lib/i18n';
	import { settings } from '$lib/stores/settings';

	let showLoggedOutToast = $state(false);

	onMount(() => {
		const params = new URLSearchParams(window.location.search);
		if (params.get('logged_out') === '1') {
			showLoggedOutToast = true;
			goto('/', { replaceState: true });
		}
	});

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

	type CenterRAMode = '0h' | 'today' | '12h' | 'custom';

	// ── LST helpers ──────────────────────────────────────────────────────────

	/** Local Sidereal Time (hours) at the given UTC timestamp for the observer's longitude. */
	function lstAtUTC(utcMs: number): number {
		const lonHours = ($settings.location?.lon ?? 0) / 15;
		const J2000 = Date.UTC(2000, 0, 1, 12, 0, 0);
		const d = (utcMs - J2000) / 86_400_000;
		const gmstHours = (((280.46061837 + 360.98564736629 * d) % 360) + 360) % 360 / 15;
		return ((gmstHours + lonHours) % 24 + 24) % 24;
	}

	/**
	 * Returns the UTC timestamp of tonight's peak observing hour (00:00 or 01:00 local).
	 * Peak hour: 01:00 local in summer (DST active), 00:00 in winter.
	 */
	function computePeakUTCMs(): number {
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
		const jan1OffsetMins = getOffsetMins(new Date(now.getFullYear(), 0, 1));
		const isDST = nowOffsetMins > jan1OffsetMins;
		const peakHour = isDST ? 1 : 0;

		const dateParts = new Intl.DateTimeFormat('en', {
			timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
		}).formatToParts(now);
		const getD = (type: string) => parseInt(dateParts.find((p) => p.type === type)!.value, 10);

		let peakUTCMs = Date.UTC(getD('year'), getD('month') - 1, getD('day'), peakHour, 0, 0) - nowOffsetMins * 60000;
		if (peakUTCMs < now.getTime()) peakUTCMs += 86_400_000;
		return peakUTCMs;
	}

	/**
	 * Returns the RA (in hours) that culminates at the peak observing hour tonight.
	 */
	function computeTodayRA(): number {
		return lstAtUTC(computePeakUTCMs());
	}

	// ── Time stepper ─────────────────────────────────────────────────────────

	/** Format a UTC timestamp as the local "HH:00" in the configured timezone. */
	function formatLocalHour(utcMs: number): string {
		const tz = $settings.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
		const h = parseInt(
			new Intl.DateTimeFormat('en', { timeZone: tz, hour: '2-digit', hour12: false }).format(new Date(utcMs)),
			10
		);
		return `${String(h).padStart(2, '0')}:00`;
	}

	let hourOffset: number = $state(0);
	let timeLabel: string = $state(formatLocalHour(Date.now()));

	function stepHour(delta: number) {
		hourOffset += delta;
		const utcMs = Date.now() + hourOffset * 3_600_000;
		timeLabel = formatLocalHour(utcMs);
		centerRAMode = 'custom';
		centerRA = lstAtUTC(utcMs);
	}

	// ── RA radio presets ─────────────────────────────────────────────────────

	function modeToRA(mode: CenterRAMode): number {
		if (mode === '0h') return 0;
		if (mode === '12h') return 12;
		if (mode === 'today') return computeTodayRA();
		return lstAtUTC(Date.now() + hourOffset * 3_600_000);
	}

	const storedMode = browser ? (localStorage.getItem('centerRAMode') as CenterRAMode | null) : null;
	// 'custom' is transient — don't restore it
	const initialMode: CenterRAMode = (storedMode && storedMode !== 'custom') ? storedMode : '0h';

	let centerRAMode: CenterRAMode = $state(initialMode);
	let centerRA: number = $state(modeToRA(initialMode));

	function handleCenterRAChange(mode: Exclude<CenterRAMode, 'custom'>) {
		if (mode === 'today') {
			// Align the time stepper to the peak observing hour (00:00 or 01:00).
			const peakUTCMs = computePeakUTCMs();
			hourOffset = Math.round((peakUTCMs - Date.now()) / 3_600_000);
			timeLabel = formatLocalHour(peakUTCMs);
		} else {
			// Reset time stepper to "now" for the fixed presets.
			hourOffset = 0;
			timeLabel = formatLocalHour(Date.now());
		}
		centerRAMode = mode;
		centerRA = modeToRA(mode);
		if (browser) localStorage.setItem('centerRAMode', mode);
	}

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
	<div class="center-ra-set">
		<label class="ra-option" class:ra-active={centerRAMode === '0h'} title={$t.chart.ra0hTooltip}>
			<input type="radio" name="center-ra" value="0h" checked={centerRAMode === '0h'} onchange={() => handleCenterRAChange('0h')} />
			0h
		</label>
		<label class="ra-option" class:ra-active={centerRAMode === 'today'} title={$t.chart.todayTooltip}>
			<input type="radio" name="center-ra" value="today" checked={centerRAMode === 'today'} onchange={() => handleCenterRAChange('today')} />
			{$t.chart.today}
		</label>
		<label class="ra-option" class:ra-active={centerRAMode === '12h'} title={$t.chart.ra12hTooltip}>
			<input type="radio" name="center-ra" value="12h" checked={centerRAMode === '12h'} onchange={() => handleCenterRAChange('12h')} />
			12h
		</label>
	</div>
	<div class="time-stepper">
		<button class="time-step-btn" onclick={() => stepHour(-1)} aria-label="Previous hour">&#8249;</button>
		<span class="time-label">{timeLabel}</span>
		<button class="time-step-btn" onclick={() => stepHour(1)} aria-label="Next hour">&#8250;</button>
	</div>
	<select class="projection-select" value={projection} onchange={handleProjectionChange}>
		{#each PROJECTIONS as proj}
			<option value={proj.value}>{proj.label}</option>
		{/each}
	</select>
	<button class="reset-btn" onclick={() => starChart.resetCenter()}>⌖ Reset</button>
</TopBar>
<StarChart bind:this={starChart} photos={$photos} {projection} {centerRA} onselect={handleSelect} />
<InfoCard photo={selectedPhoto} position={clickPosition} onclose={handleClose} />
<BottomBar photoCount={$photos.length} />
{#if showLoggedOutToast}
	<Toast message={$t.page.loggedOut} onhide={() => (showLoggedOutToast = false)} />
{/if}

<style>
	:global(.center-ra-set) {
		display: flex;
		border: 1px solid #555;
		border-radius: 4px;
		overflow: hidden;
	}
	:global(.ra-option) {
		display: flex;
		align-items: center;
		padding: 2px 10px;
		font-size: 13px;
		cursor: pointer;
		background: #0d0d1a;
		color: #e0e0e0;
		user-select: none;
		transition: background 0.15s;
	}
	:global(.ra-option:not(:last-child)) {
		border-right: 1px solid #555;
	}
	:global(.ra-option:hover) {
		background: #1a1a3e;
	}
	:global(.ra-active) {
		background: #1a1a4a;
		color: #aabbff;
	}
	:global(.ra-option input[type='radio']) {
		display: none;
	}
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
	:global(.time-stepper) {
		display: flex;
		align-items: center;
		border: 1px solid #555;
		border-radius: 4px;
		overflow: hidden;
	}
	:global(.time-step-btn) {
		background: #0d0d1a;
		color: #e0e0e0;
		border: none;
		padding: 2px 8px;
		font-size: 16px;
		line-height: 1;
		cursor: pointer;
		transition: background 0.15s;
	}
	:global(.time-step-btn:hover) {
		background: #1a1a3e;
		color: #aabbff;
	}
	:global(.time-label) {
		background: #0d0d1a;
		color: #e0e0e0;
		padding: 2px 8px;
		font-size: 13px;
		min-width: 4ch;
		text-align: center;
		border-left: 1px solid #555;
		border-right: 1px solid #555;
		font-variant-numeric: tabular-nums;
	}
</style>
