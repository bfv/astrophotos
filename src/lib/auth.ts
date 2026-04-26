import { UserManager, type User } from 'oidc-client-ts';
import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

declare global {
  interface Window {
    __APP_CONFIG__: { authAuthority: string; authClientId: string; apiBaseUrl: string };
  }
}

export const apiBaseUrl = browser ? window.__APP_CONFIG__.apiBaseUrl : '';

const config = {
  authority: browser ? window.__APP_CONFIG__.authAuthority : '',
  client_id: browser ? window.__APP_CONFIG__.authClientId : '',
  redirect_uri: browser ? `${window.location.origin}/callback` : '',
  scope: 'openid profile email',
  response_type: 'code',
};

export const userManager = browser ? new UserManager(config) : null;

export const accountUrl = browser ? `${window.__APP_CONFIG__.authAuthority}/account` : '';

const userStore = writable<User | null>(null);

export const user = { subscribe: userStore.subscribe };
export const isLoggedIn = derived(user, ($u) => $u !== null && !$u.expired);
export const accessToken = derived(user, ($u) => $u?.access_token ?? null);

export async function initAuth() {
  if (!userManager) return;
  const u = await userManager.getUser();
  userStore.set(u && !u.expired ? u : null);

  userManager.events.addUserLoaded((u) => userStore.set(u));
  userManager.events.addUserUnloaded(() => userStore.set(null));
  userManager.events.addAccessTokenExpired(() => userStore.set(null));
}

export async function login() {
  await userManager?.signinRedirect();
}

export async function logout() {
  await userManager?.signoutRedirect({
    post_logout_redirect_uri: window.location.origin + '/?logged_out=1',
  });
}

export async function handleCallback() {
  if (!userManager) return;
  const u = await userManager.signinRedirectCallback();
  userStore.set(u);
  return u;
}
