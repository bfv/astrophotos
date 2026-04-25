<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { handleCallback } from '$lib/auth';
  import { t } from '$lib/i18n';

  let error = $state('');

  onMount(async () => {
    try {
      await handleCallback();
      goto('/', { replaceState: true });
    } catch (e) {
      error = e instanceof Error ? e.message : 'Login mislukt.';
    }
  });
</script>

{#if error}
  <div class="callback-error">
    <p>{$t.callback.loginFailed(error)}</p>
    <a href="/">{$t.callback.backToHome}</a>
  </div>
{:else}
  <div class="callback-loading">{$t.callback.loggingIn}</div>
{/if}

<style>
  .callback-loading,
  .callback-error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    color: #aaa;
    font-family: system-ui, sans-serif;
    gap: 12px;
  }
</style>
