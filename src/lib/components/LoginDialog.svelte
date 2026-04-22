<script lang="ts">
  interface Props {
    onlogin?: (username: string) => void;
    oncancel?: () => void;
  }

  let { onlogin, oncancel }: Props = $props();

  let username = $state('');
  let password = $state('');
  let error = $state('');

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      error = 'Vul gebruikersnaam en wachtwoord in.';
      return;
    }
    error = '';
    onlogin?.(username.trim());
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) oncancel?.();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') oncancel?.();
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div class="dialog-backdrop" role="dialog" aria-modal="true" aria-label="Inloggen"
  onclick={handleBackdropClick} onkeydown={handleKeydown}>
  <div class="dialog">
    <h2 class="dialog-title">Inloggen</h2>
    <form onsubmit={handleSubmit} class="dialog-form">
      <label class="dialog-label">
        Gebruikersnaam
        <input class="dialog-input" type="text" autocomplete="username" bind:value={username} />
      </label>
      <label class="dialog-label">
        Wachtwoord
        <input class="dialog-input" type="password" autocomplete="current-password" bind:value={password} />
      </label>
      {#if error}
        <p class="dialog-error">{error}</p>
      {/if}
      <div class="dialog-actions">
        <button type="button" class="dialog-btn dialog-btn--cancel" onclick={oncancel}>Annuleren</button>
        <button type="submit" class="dialog-btn dialog-btn--primary">Inloggen</button>
      </div>
    </form>
  </div>
</div>

<style>
  .dialog-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 500;
  }

  .dialog {
    background: #1a1a2e;
    border: 1px solid #444;
    border-radius: 10px;
    padding: 28px 32px;
    width: 320px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
    color: #e0e0e0;
    font-family: system-ui, sans-serif;
  }

  .dialog-title {
    margin: 0 0 20px;
    font-size: 16px;
    font-weight: 600;
    letter-spacing: 0.3px;
  }

  .dialog-form {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .dialog-label {
    display: flex;
    flex-direction: column;
    gap: 5px;
    font-size: 12px;
    color: #aaa;
  }

  .dialog-input {
    background: #0d0d1f;
    border: 1px solid #555;
    border-radius: 4px;
    color: #e0e0e0;
    font-size: 13px;
    padding: 6px 10px;
    outline: none;
    transition: border-color 0.15s;
  }

  .dialog-input:focus {
    border-color: #7a7aff;
  }

  .dialog-error {
    margin: 0;
    font-size: 12px;
    color: #ff6b6b;
  }

  .dialog-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 4px;
  }

  .dialog-btn {
    padding: 6px 16px;
    border-radius: 4px;
    font-size: 13px;
    cursor: pointer;
    border: 1px solid #555;
    background: none;
    color: #ccc;
    transition: background 0.15s, color 0.15s;
  }

  .dialog-btn:hover {
    background: #2a2a4e;
    color: #fff;
  }

  .dialog-btn--primary {
    background: #3a3aaf;
    border-color: #5a5acf;
    color: #fff;
  }

  .dialog-btn--primary:hover {
    background: #5a5acf;
  }
</style>
