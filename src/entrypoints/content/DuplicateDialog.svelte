<script lang="ts">
  import type { DuplicateTab } from "@/lib/duplicates";

  interface Props {
    duplicates: DuplicateTab[];
    onSwitch: () => void;
    onCloseOthers: () => void;
    onDismiss: () => void;
  }

  const { duplicates, onSwitch, onCloseOthers, onDismiss }: Props = $props();

  let switchButton: HTMLButtonElement | undefined = $state();

  $effect(() => {
    switchButton?.focus();
  });

  /** Dismisses the dialog with the Escape key. */
  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === "Escape") {
      event.stopPropagation();
      onDismiss();
    }
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div class="backdrop" role="presentation" onkeydown={handleKeydown}>
  <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="tab-dedup-title">
    <h2 id="tab-dedup-title">このページは既に開かれています</h2>
    <p class="count">
      {duplicates.length === 1 ? "別のタブ" : `${duplicates.length} 個の別のタブ`}で同じページが開かれています。
    </p>
    <ul class="tabs">
      {#each duplicates as tab (tab.id)}
        <li title={tab.url}>{tab.title}</li>
      {/each}
    </ul>
    <div class="actions">
      <button bind:this={switchButton} class="primary" type="button" onclick={onSwitch}>
        既存のタブへ移動
        <span class="hint">このタブは閉じます</span>
      </button>
      <button type="button" onclick={onCloseOthers}>
        古いタブを閉じる
        <span class="hint">このタブを使います</span>
      </button>
      <button class="ghost" type="button" onclick={onDismiss}>何もしない</button>
    </div>
  </div>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 2147483647;
    display: grid;
    place-items: center;
    padding: 16px;
    background: rgb(0 0 0 / 40%);
    font-family: system-ui, sans-serif;
    color-scheme: light dark;
  }

  .dialog {
    --bg: #fff;
    --fg: #1f2328;
    --muted: #59636e;
    --border: #d1d9e0;
    --accent: #0969da;

    width: min(420px, 100%);
    padding: 20px;
    border-radius: 12px;
    background: var(--bg);
    color: var(--fg);
    box-shadow: 0 12px 32px rgb(0 0 0 / 25%);
  }

  @media (prefers-color-scheme: dark) {
    .dialog {
      --bg: #212830;
      --fg: #f0f6fc;
      --muted: #9198a1;
      --border: #3d444d;
      --accent: #4493f8;
    }
  }

  h2 {
    margin: 0 0 8px;
    font-size: 16px;
    font-weight: 600;
  }

  .count {
    margin: 0 0 8px;
    font-size: 13px;
    color: var(--muted);
  }

  .tabs {
    margin: 0 0 16px;
    padding: 0;
    list-style: none;
    font-size: 13px;
  }

  .tabs li {
    overflow: hidden;
    padding: 6px 8px;
    border: 1px solid var(--border);
    border-radius: 6px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .tabs li + li {
    margin-top: 4px;
  }

  .actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  button {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 12px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: transparent;
    color: inherit;
    font: inherit;
    font-size: 14px;
    cursor: pointer;
  }

  button:hover {
    border-color: var(--accent);
  }

  button:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  button.primary {
    border-color: var(--accent);
    background: var(--accent);
    color: #fff;
  }

  button.ghost {
    justify-content: center;
    border-color: transparent;
    color: var(--muted);
  }

  .hint {
    font-size: 12px;
    opacity: 0.8;
  }
</style>
