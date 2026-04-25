<script lang="ts">
  import { user, isLoggedIn, login, logout, accountUrl } from '$lib/auth';

  interface Props {
    children?: import('svelte').Snippet;
  }

  let { children }: Props = $props();

  let menuOpen = $state(false);

  function handleButtonClick() {
    if ($isLoggedIn) {
      menuOpen = !menuOpen;
    } else {
      login();
    }
  }

  function handleLogout() {
    menuOpen = false;
    logout();
  }

  function handleBlur(e: FocusEvent) {
    const related = e.relatedTarget as HTMLElement | null;
    if (!related?.closest('.usermenu')) {
      menuOpen = false;
    }
  }

  const displayName = $derived($user?.profile?.preferred_username ?? $user?.profile?.name ?? 'Gebruiker');
</script>

<div class="usermenu" onblur={handleBlur}>
  <button
    class="usermenu-btn"
    class:usermenu-btn--loggedin={$isLoggedIn}
    onclick={handleButtonClick}
    aria-label={$isLoggedIn ? 'Gebruikersmenu' : 'Inloggen'}
    aria-expanded={$isLoggedIn ? menuOpen : undefined}
  >
    {#if $isLoggedIn}
      <!-- logged in: filled person circle -->
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="10" fill="#3a3aaf" />
        <path d="M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 2c-3 0-6 1.5-6 3v1h12v-1c0-1.5-3-3-6-3z" fill="#fff"/>
      </svg>
    {:else}
      <!-- not logged in: login arrow icon -->
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
        <polyline points="10 17 15 12 10 7"/>
        <line x1="15" y1="12" x2="3" y2="12"/>
      </svg>
    {/if}
  </button>

  {#if $isLoggedIn && menuOpen}
    <div class="usermenu-dropdown">
      <div class="usermenu-username">{displayName}</div>
      {#if children}{@render children()}{/if}
      <a class="usermenu-item" href={accountUrl} target="_blank" rel="noopener noreferrer">Accountinstellingen</a>
      <button class="usermenu-item usermenu-item--logout" onclick={handleLogout}>Uitloggen</button>
    </div>
  {/if}
</div>

<style>
  .usermenu {
    position: relative;
  }

  .usermenu-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: 1px solid #555;
    border-radius: 4px;
    color: #ccc;
    width: 32px;
    height: 28px;
    cursor: pointer;
    padding: 0;
    transition: color 0.15s, border-color 0.15s;
  }

  .usermenu-btn:hover {
    color: #fff;
    border-color: #aaa;
  }

  .usermenu-btn--loggedin {
    border-color: #3a3aaf;
  }

  .usermenu-dropdown {
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    min-width: 140px;
    background: #1a1a2e;
    border: 1px solid #444;
    border-radius: 6px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
    z-index: 200;
    overflow: hidden;
  }

  .usermenu-username {
    padding: 8px 14px 6px;
    font-size: 12px;
    color: #888;
    border-bottom: 1px solid #333;
  }

  .usermenu-item {
    display: block;
    width: 100%;
    padding: 8px 14px;
    background: none;
    border: none;
    color: #e0e0e0;
    font-family: system-ui, sans-serif;
    font-size: 13px;
    text-align: left;
    cursor: pointer;
    text-decoration: none;
    box-sizing: border-box;
  }

  .usermenu-item:hover {
    background: #2a2a4e;
  }

  .usermenu-item--logout {
    color: #ff8080;
  }
</style>

