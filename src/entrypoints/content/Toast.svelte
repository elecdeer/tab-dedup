<script lang="ts">
  import type { Snippet } from "svelte";
  import { startPausableTimer, type PausableTimer } from "@/lib/pausable-timer";

  interface Props {
    title: string;
    /** How long the toast stays up without interaction before `onTimeout` fires. */
    autoDismissMs: number;
    /** The × button. */
    onDismiss: () => void;
    onTimeout: () => void;
    /** The action buttons. */
    children: Snippet;
  }

  const { title, autoDismissMs, onDismiss, onTimeout, children }: Props = $props();

  let toast: HTMLDivElement;
  let timer: PausableTimer | undefined;

  $effect(() => {
    const current = startPausableTimer(autoDismissMs, () => onTimeout());
    timer = current;
    return () => current.cancel();
  });

  /**
   * Resumes the timer only when focus actually leaves the toast,
   * not when it just moves between its buttons.
   */
  function handleFocusOut(event: FocusEvent): void {
    if (event.relatedTarget instanceof Node && toast.contains(event.relatedTarget)) return;
    timer?.resume("focus");
  }
</script>

<!-- Not a modal: it must not block the page or steal focus, so no backdrop and no autofocus. -->
<div
  class="toast"
  role="status"
  aria-live="polite"
  bind:this={toast}
  onmouseenter={() => timer?.pause("hover")}
  onmouseleave={() => timer?.resume("hover")}
  onfocusin={() => timer?.pause("focus")}
  onfocusout={handleFocusOut}
>
  <div class="header">
    <span class="title">{title}</span>
    <button class="close" type="button" aria-label="閉じる" title="閉じる" onclick={onDismiss}>
      ×
    </button>
  </div>
  <div class="actions">
    {@render children()}
  </div>
</div>

<style>
  .toast {
    --bg: #fff;
    --fg: #1f2328;
    --muted: #59636e;
    --border: #d1d9e0;
    --accent: #0969da;

    position: fixed;
    top: 12px;
    right: 12px;
    z-index: 2147483647;
    width: max-content;
    max-width: calc(100vw - 24px);
    padding: 8px 10px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--bg);
    color: var(--fg);
    box-shadow: 0 4px 12px rgb(0 0 0 / 15%);
    font: 12px/1.4 system-ui, sans-serif;
    color-scheme: light dark;
    animation: slide-in 150ms ease-out;
  }

  @media (prefers-color-scheme: dark) {
    .toast {
      --bg: #212830;
      --fg: #f0f6fc;
      --muted: #9198a1;
      --border: #3d444d;
      --accent: #4493f8;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .toast {
      animation: none;
    }
  }

  @keyframes slide-in {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
  }

  .header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
  }

  .title {
    font-weight: 600;
  }

  .actions {
    display: flex;
    gap: 6px;
  }

  /* The action buttons come from the parent's snippet, so they need :global to be styled here. */
  .toast :global(button) {
    padding: 3px 8px;
    border: 1px solid var(--border);
    border-radius: 6px;
    background: transparent;
    color: inherit;
    font: inherit;
    cursor: pointer;
  }

  .toast :global(button:hover) {
    border-color: var(--accent);
  }

  .toast :global(button:focus-visible) {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
  }

  .toast :global(button.primary) {
    border-color: var(--accent);
    background: var(--accent);
    color: #fff;
  }

  button.close {
    margin-left: auto;
    padding: 0 4px;
    border-color: transparent;
    color: var(--muted);
    font-size: 14px;
    line-height: 1;
  }
</style>
