<script lang="ts">
  import { settings } from '$lib/stores/settings';
  import { t } from '$lib/i18n';
  import type { Locale } from '$lib/i18n';

  interface Props {
    onclose: () => void;
  }

  let { onclose }: Props = $props();

  const systemTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Pre-build once — ~600 timezones with their current UTC offset
  const _tzNow = new Date();
  const timezoneOptions = Intl.supportedValuesOf('timeZone').map((tz) => {
    // Compute offset in minutes by comparing local parts to UTC parts
    const local = new Intl.DateTimeFormat('en', {
      timeZone: tz,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false,
    }).formatToParts(_tzNow);
    const get = (type: string) => parseInt(local.find((p) => p.type === type)!.value, 10);
    const localMs = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
    const offsetMin = Math.round((localMs - _tzNow.getTime()) / 60000);
    const sign = offsetMin >= 0 ? '+' : '-';
    const abs = Math.abs(offsetMin);
    const hh = String(Math.floor(abs / 60)).padStart(2, '0');
    const mm = String(abs % 60).padStart(2, '0');
    return { tz, label: `${tz} (${sign}${hh}:${mm})` };
  });

  // Resolve the IANA name from whatever the user typed/selected in the draft.
  // Accepts both a raw IANA name and a label like "Europe/Amsterdam (GMT+2)".
  function extractTz(draft: string): string {
    const trimmed = draft.trim();
    const found = timezoneOptions.find((o) => o.label === trimmed || o.tz === trimmed);
    return found ? found.tz : trimmed;
  }

  const systemTzLabel = timezoneOptions.find((o) => o.tz === systemTimezone)?.label ?? systemTimezone;

  // Local draft — only committed on Save
  let draftLanguage: Locale | '' = $state($settings.language ?? 'en');
  let draftLat: string = $state($settings.location?.lat?.toString() ?? '');
  let draftLon: string = $state($settings.location?.lon?.toString() ?? '');
  let draftAstrobinApiKey: string = $state($settings.astrobinApiKey ?? '');
  let draftAstrometryApiKey: string = $state($settings.astrometryApiKey ?? '');
  let draftTimezone: string = $state(
    $settings.timezone
      ? (timezoneOptions.find((o) => o.tz === $settings.timezone)?.label ?? $settings.timezone)
      : ''
  );

  let locationStatus: 'idle' | 'acquiring' | 'ok' | 'error' = $state('idle');
  let showDiscardConfirm = $state(false);

  const isDirty = $derived(
    draftLanguage !== ($settings.language ?? '') ||
    draftLat !== ($settings.location?.lat?.toString() ?? '') ||
    draftLon !== ($settings.location?.lon?.toString() ?? '') ||
    extractTz(draftTimezone) !== ($settings.timezone ?? '') ||
    draftAstrobinApiKey !== ($settings.astrobinApiKey ?? '') ||
    draftAstrometryApiKey !== ($settings.astrometryApiKey ?? '')
  );

  function tryClose() {
    if (isDirty) {
      showDiscardConfirm = true;
    } else {
      onclose();
    }
  }

  function handleUseMyLocation() {
    if (!navigator.geolocation) {
      locationStatus = 'error';
      return;
    }
    locationStatus = 'acquiring';
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        draftLat = pos.coords.latitude.toFixed(5);
        draftLon = pos.coords.longitude.toFixed(5);
        // Clear explicit timezone so it re-derives from the new location
        if (!draftTimezone) draftTimezone = '';
        locationStatus = 'ok';
      },
      () => {
        locationStatus = 'error';
      }
    );
  }

  function handleSave() {
    const lat = parseFloat(draftLat);
    const lon = parseFloat(draftLon);
    settings.update((s) => ({
      ...s,
      language: draftLanguage === '' ? null : (draftLanguage as Locale),
      location:
        draftLat !== '' && draftLon !== '' && !isNaN(lat) && !isNaN(lon)
          ? { lat, lon }
          : null,
      astrobinApiKey: draftAstrobinApiKey.trim() || null,
      astrometryApiKey: draftAstrometryApiKey.trim() || null,
      timezone: extractTz(draftTimezone) || null,
    }));
    onclose();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      if (showDiscardConfirm) {
        showDiscardConfirm = false;
      } else {
        tryClose();
      }
    }
  }
</script>

<div
  class="settings-backdrop"
  role="dialog"
  aria-modal="true"
  aria-label={$t.settings.title}
  tabindex="-1"
  onkeydown={handleKeydown}
>
  <button class="settings-backdrop-inner" aria-label={$t.settings.cancel} onclick={tryClose}></button>

  <div class="settings-panel">
    <h2 class="settings-title">{$t.settings.title}</h2>

    <!-- Language -->
    <label class="settings-label" for="setting-language">{$t.settings.language}</label>
    <select id="setting-language" class="settings-select" bind:value={draftLanguage}>
      <option value="en">English</option>
      <option value="nl">Nederlands</option>
    </select>

    <!-- Location -->
    <fieldset class="settings-fieldset">
      <legend class="settings-legend">{$t.settings.location}</legend>
      <div class="settings-coords">
        <div class="settings-coord-field">
          <label class="settings-label" for="setting-lat">{$t.settings.locationLat}</label>
          <input
            id="setting-lat"
            class="settings-input"
            type="number"
            min="-90"
            max="90"
            step="0.00001"
            bind:value={draftLat}
            placeholder="0.00000"
          />
        </div>
        <div class="settings-coord-field">
          <label class="settings-label" for="setting-lon">{$t.settings.locationLon}</label>
          <input
            id="setting-lon"
            class="settings-input"
            type="number"
            min="-180"
            max="180"
            step="0.00001"
            bind:value={draftLon}
            placeholder="0.00000"
          />
        </div>
      </div>
      <button class="settings-btn settings-btn--secondary" onclick={handleUseMyLocation} disabled={locationStatus === 'acquiring'}>
        {$t.settings.useMyLocation}
      </button>
      {#if locationStatus === 'ok'}
        <span class="settings-status settings-status--ok">{$t.settings.locationAcquired}</span>
      {:else if locationStatus === 'error'}
        <span class="settings-status settings-status--err">{$t.settings.locationError}</span>
      {/if}

      <!-- Timezone -->
      <div class="settings-coord-field">
        <label class="settings-label" for="setting-timezone">{$t.settings.timezone}</label>
        <div class="settings-tz-row">
          <input
            id="setting-timezone"
            class="settings-input"
            type="text"
            list="tz-list"
            bind:value={draftTimezone}
            placeholder="{$t.settings.timezoneAuto} ({systemTimezone})"
          />
          <button
            class="settings-btn settings-btn--secondary settings-tz-detect"
            title={$t.settings.timezoneDetect}
            onclick={() => (draftTimezone = systemTzLabel)}
          >⊙</button>
        </div>
        <datalist id="tz-list">
          {#each timezoneOptions as { label } (label)}
            <option value={label}></option>
          {/each}
        </datalist>
      </div>
    </fieldset>

    <!-- API -->
    <fieldset class="settings-fieldset">
      <legend class="settings-legend">{$t.settings.api}</legend>
      <div class="settings-api-field">
        <label class="settings-label" for="setting-astrobin-key">Astrobin API key</label>
        <input
          id="setting-astrobin-key"
          class="settings-input"
          type="password"
          autocomplete="off"
          bind:value={draftAstrobinApiKey}
        />
      </div>
      <div class="settings-api-field">
        <label class="settings-label" for="setting-astrometry-key">Astrometry API key</label>
        <input
          id="setting-astrometry-key"
          class="settings-input"
          type="password"
          autocomplete="off"
          bind:value={draftAstrometryApiKey}
        />
      </div>
    </fieldset>

    <!-- Actions -->
    <div class="settings-actions">
      <button class="settings-btn settings-btn--secondary" onclick={tryClose}>{$t.settings.cancel}</button>
      <button class="settings-btn settings-btn--primary" onclick={handleSave}>{$t.settings.save}</button>
    </div>
  </div>

  <!-- Discard confirmation -->
  {#if showDiscardConfirm}
    <div class="settings-confirm-backdrop">
      <div class="settings-confirm" role="alertdialog" aria-modal="true" aria-labelledby="discard-title">
        <p id="discard-title" class="settings-confirm-title">{$t.settings.discardTitle}</p>
        <p class="settings-confirm-msg">{$t.settings.discardMessage}</p>
        <div class="settings-actions">
          <button class="settings-btn settings-btn--secondary" onclick={() => (showDiscardConfirm = false)}>{$t.settings.discardCancel}</button>
          <button class="settings-btn settings-btn--danger" onclick={onclose}>{$t.settings.discardConfirm}</button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .settings-backdrop {
    position: fixed;
    inset: 0;
    z-index: 500;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .settings-backdrop-inner {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    border: none;
    cursor: default;
    padding: 0;
  }

  .settings-panel {
    position: relative;
    background: #1a1a2e;
    border: 1px solid #444;
    border-radius: 8px;
    padding: 24px;
    min-width: 320px;
    max-width: 420px;
    width: 100%;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.7);
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .settings-title {
    margin: 0 0 4px;
    font-size: 16px;
    font-weight: 600;
    color: #e0e0e0;
  }

  .settings-label {
    display: block;
    font-size: 12px;
    color: #aaa;
    margin-bottom: 4px;
  }

  .settings-select,
  .settings-input {
    width: 100%;
    background: #0d0d1f;
    border: 1px solid #444;
    border-radius: 4px;
    color: #e0e0e0;
    font-size: 13px;
    padding: 6px 8px;
    box-sizing: border-box;
  }

  .settings-select:focus,
  .settings-input:focus {
    outline: none;
    border-color: #3a3aaf;
  }

  .settings-fieldset {
    border: 1px solid #333;
    border-radius: 6px;
    padding: 12px 12px 12px;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .settings-legend {
    font-size: 12px;
    color: #aaa;
    padding: 0 4px;
  }

  .settings-coords {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .settings-coord-field,
  .settings-api-field {
    display: flex;
    flex-direction: column;
  }

  .settings-tz-row {
    display: flex;
    gap: 6px;
  }

  .settings-tz-row .settings-input {
    flex: 1;
  }

  .settings-tz-detect {
    flex-shrink: 0;
    padding: 6px 10px;
    font-size: 14px;
  }

  .settings-status {
    font-size: 12px;
  }

  .settings-status--ok {
    color: #6f6;
  }

  .settings-status--err {
    color: #f66;
  }

  .settings-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 4px;
  }

  .settings-btn {
    padding: 7px 16px;
    border-radius: 4px;
    border: none;
    font-size: 13px;
    cursor: pointer;
    font-family: system-ui, sans-serif;
  }

  .settings-btn:disabled {
    opacity: 0.5;
    cursor: default;
  }

  .settings-btn--primary {
    background: #3a3aaf;
    color: #fff;
  }

  .settings-btn--primary:hover:not(:disabled) {
    background: #4a4acf;
  }

  .settings-btn--secondary {
    background: #2a2a4e;
    color: #ccc;
  }

  .settings-btn--secondary:hover:not(:disabled) {
    background: #3a3a5e;
  }

  .settings-btn--danger {
    background: #7a1a1a;
    color: #fff;
  }

  .settings-btn--danger:hover:not(:disabled) {
    background: #9a2a2a;
  }

  .settings-confirm-backdrop {
    position: absolute;
    inset: 0;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 8px;
  }

  .settings-confirm {
    background: #1a1a2e;
    border: 1px solid #555;
    border-radius: 8px;
    padding: 20px;
    max-width: 320px;
    width: 90%;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .settings-confirm-title {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: #e0e0e0;
  }

  .settings-confirm-msg {
    margin: 0;
    font-size: 13px;
    color: #aaa;
  }
</style>
