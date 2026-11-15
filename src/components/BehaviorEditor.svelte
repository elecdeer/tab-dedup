<script lang="ts">
  import {
    ACTION_LABELS,
    DUPLICATE_ACTIONS,
    SCOPE_LABELS,
    SEARCH_SCOPES,
    type Behavior,
  } from "@/lib/settings";

  interface Props {
    behavior: Behavior;
    onChange: (behavior: Behavior) => void;
  }

  const { behavior, onChange }: Props = $props();
  const id = $props.id();
</script>

<div class="editor">
  <label for="{id}-action">重複したとき</label>
  <div class="select-wrap">
    <select
      id="{id}-action"
      value={behavior.action}
      onchange={(event) => {
        const action = DUPLICATE_ACTIONS.find((a) => a === event.currentTarget.value);
        if (action !== undefined) onChange({ ...behavior, action });
      }}
    >
      {#each DUPLICATE_ACTIONS as action (action)}
        <option value={action}>{ACTION_LABELS[action]}</option>
      {/each}
    </select>
  </div>

  <label for="{id}-scope">探す範囲</label>
  <div class="select-wrap">
    <select
      id="{id}-scope"
      value={behavior.scope}
      onchange={(event) => {
        const scope = SEARCH_SCOPES.find((s) => s === event.currentTarget.value);
        if (scope !== undefined) onChange({ ...behavior, scope });
      }}
    >
      {#each SEARCH_SCOPES as scope (scope)}
        <option value={scope}>{SCOPE_LABELS[scope]}</option>
      {/each}
    </select>
  </div>

  <span></span>
  <label class="check">
    <input
      type="checkbox"
      checked={behavior.includePinned}
      onchange={(event) => onChange({ ...behavior, includePinned: event.currentTarget.checked })}
    />
    ピン留めタブも重複として扱う
  </label>
</div>

<style>
  .editor {
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: 6px 10px;
    align-items: center;
  }

  /*
   * A native <select> rather than a custom listbox keeps keyboard and screen reader support for
   * free. Browsers with customizable select (`appearance: base-select`) get a styled picker too;
   * others get the styled closed control with their own native dropdown.
   */
  select {
    appearance: none;
    min-width: 0;
    padding: 5px 30px 5px 10px;
    border: 1px solid var(--border);
    border-radius: 6px;
    background: var(--bg);
    color: inherit;
    font: inherit;
    cursor: pointer;
    transition: border-color 120ms;
  }

  /* Fallback chevron. A mask (not a background image) so it follows the theme's muted color. */
  .select-wrap {
    --chevron: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m4 6 4 4 4-4'/%3E%3C/svg%3E");

    position: relative;
    display: grid;
  }

  .select-wrap::after {
    position: absolute;
    top: 50%;
    right: 10px;
    width: 12px;
    height: 12px;
    background: var(--muted);
    content: "";
    mask: var(--chevron) center / contain no-repeat;
    pointer-events: none;
    translate: 0 -50%;
  }

  select:hover {
    border-color: var(--muted);
  }

  select:focus-visible {
    border-color: var(--accent);
    outline: 2px solid color-mix(in srgb, var(--accent) 35%, transparent);
    outline-offset: 0;
  }

  @supports (appearance: base-select) {
    select,
    select::picker(select) {
      appearance: base-select;
    }

    select {
      display: flex;
      align-items: center;
      padding-right: 10px;
    }

    /* base-select draws its own icon, so the fallback one is not needed. */
    .select-wrap::after {
      content: none;
    }

    select::picker-icon {
      width: 12px;
      height: 12px;
      margin-left: auto;
      background: var(--muted);
      content: "";
      mask: var(--chevron) center / contain no-repeat;
      transition: rotate 150ms;
    }

    select:open::picker-icon {
      rotate: 180deg;
    }

    select::picker(select) {
      margin-block: 4px;
      padding: 4px;
      border: 1px solid var(--border);
      border-radius: 8px;
      background: var(--bg);
      color: var(--fg);
      box-shadow: 0 8px 24px rgb(0 0 0 / 15%);
    }

    option {
      gap: 6px;
      padding: 5px 8px;
      border-radius: 4px;
      cursor: pointer;
    }

    option:hover,
    option:focus-visible {
      background: color-mix(in srgb, var(--accent) 12%, transparent);
      outline: none;
    }

    option:checked {
      font-weight: 600;
    }

    option::checkmark {
      color: var(--accent);
    }
  }

  .check {
    display: flex;
    gap: 6px;
    align-items: center;
  }

  .check input {
    margin: 0;
    accent-color: var(--accent);
  }
</style>
