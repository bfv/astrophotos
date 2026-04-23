<script lang="ts">
  interface Props {
    message: string;
    duration?: number;
    onhide?: () => void;
  }

  let { message, duration = 3000, onhide }: Props = $props();

  let visible = $state(true);

  $effect(() => {
    const t = setTimeout(() => {
      visible = false;
      onhide?.();
    }, duration);
    return () => clearTimeout(t);
  });
</script>

{#if visible}
  <div class="toast" role="status" aria-live="polite">{message}</div>
{/if}

<style>
  .toast {
    position: fixed;
    bottom: 48px;
    left: 50%;
    transform: translateX(-50%);
    background: #2a2a4e;
    border: 1px solid #555;
    border-radius: 6px;
    color: #e0e0e0;
    font-family: system-ui, sans-serif;
    font-size: 13px;
    padding: 8px 20px;
    z-index: 1000;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
    animation: fadein 0.2s ease;
  }

  @keyframes fadein {
    from { opacity: 0; transform: translateX(-50%) translateY(8px); }
    to   { opacity: 1; transform: translateX(-50%) translateY(0); }
  }
</style>
