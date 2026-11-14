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

  <label for="{id}-scope">探す範囲</label>
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

  select {
    min-width: 0;
    font: inherit;
  }

  .check {
    display: flex;
    gap: 6px;
    align-items: center;
  }
</style>
