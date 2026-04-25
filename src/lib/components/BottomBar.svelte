<script lang="ts">
  import { t } from '$lib/i18n';

  interface Props {
    photoCount?: number;
  }

  let { photoCount = 0 }: Props = $props();
</script>

<footer class="bottombar">
  <a class="bottombar-repo" href="https://github.com/bfv/astrophotos" target="_blank" rel="noopener noreferrer">github.com/bfv/astrophotos</a>
  <span class="bottombar-info">{$t.bar.photosLoaded(photoCount)}</span>
</footer>

<style>
  .bottombar {
    display: flex;
    align-items: center;
    height: 32px;
    padding: 0 16px;
    background: #1a1a2e;
    border-top: 1px solid #333;
    color: #888;
    font-family: system-ui, sans-serif;
    font-size: 12px;
    flex-shrink: 0;
  }

  .bottombar-repo {
    color: #888;
    text-decoration: none;
  }

  .bottombar-repo:hover {
    color: #aaa;
    text-decoration: underline;
  }

  .bottombar-info {
    margin-left: auto;
  }
</style>
