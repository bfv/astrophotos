<script lang="ts">
  interface Props {
    photoCount?: number;
  }

  let { photoCount = 0 }: Props = $props();
</script>

<footer class="bottombar">
  <span class="bottombar-info">{photoCount} photo{photoCount !== 1 ? 's' : ''} loaded</span>
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

  .bottombar-info {
    margin-left: auto;
  }
</style>
