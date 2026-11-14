<script lang="ts">
  import BehaviorEditor from "@/components/BehaviorEditor.svelte";
  import type { Behavior, Settings } from "@/lib/settings";
  import { loadSettings, saveSettings, watchSettings } from "@/lib/settings-storage";
  import { toOrigin } from "@/lib/url";

  let settings: Settings | undefined = $state();
  let newSite = $state("");
  let addError = $state("");

  const origins = $derived(settings === undefined ? [] : Object.keys(settings.rules).toSorted());

  $effect(() => {
    void loadSettings().then((loaded) => {
      settings = loaded;
    });
    return watchSettings((next) => {
      settings = next;
    });
  });

  /**
   * Stores `next` and shows it immediately.
   */
  function update(next: Settings): void {
    settings = next;
    void saveSettings(next);
  }

  /**
   * Adds a rule for the origin typed in the form, starting from the current defaults.
   */
  function addRule(current: Settings, event: SubmitEvent): void {
    event.preventDefault();
    const input = newSite.trim();
    // Accept a bare host like "example.com" as well as a full URL.
    const origin = toOrigin(input) ?? toOrigin(`https://${input}`);
    if (input === "" || origin === null) {
      addError = "URL またはドメインを入力してください";
      return;
    }
    if (current.rules[origin] !== undefined) {
      addError = `${origin} のルールは既にあります`;
      return;
    }
    addError = "";
    newSite = "";
    update({ ...current, rules: { ...current.rules, [origin]: { ...current.defaults } } });
  }

  /**
   * Replaces the rule for `origin`.
   */
  function changeRule(current: Settings, origin: string, behavior: Behavior): void {
    update({ ...current, rules: { ...current.rules, [origin]: behavior } });
  }

  /**
   * Removes the rule for `origin`.
   */
  function removeRule(current: Settings, origin: string): void {
    const { [origin]: _removed, ...rest } = current.rules;
    update({ ...current, rules: rest });
  }
</script>

<main>
  <h1>Tab Dedup の設定</h1>

  {#if settings === undefined}
    <p class="muted">読み込み中…</p>
  {:else}
    {@const current = settings}
    <section>
      <h2>デフォルト</h2>
      <p class="muted">サイト別のルールがないサイトで使われます。</p>
      <div class="card">
        <BehaviorEditor
          behavior={current.defaults}
          onChange={(defaults) => update({ ...current, defaults })}
        />
      </div>
    </section>

    <section>
      <h2>サイト別のルール</h2>
      <p class="muted">
        origin（スキーム + ホスト + ポート）ごとに設定します。ツールバーのアイコンからも、開いているサイトのルールを設定できます。
      </p>

      <form class="add" onsubmit={(event) => addRule(current, event)}>
        <input
          type="text"
          placeholder="https://example.com"
          aria-label="ルールを追加するサイト"
          bind:value={newSite}
        />
        <button type="submit">追加</button>
      </form>
      {#if addError !== ""}
        <p class="error" role="alert">{addError}</p>
      {/if}

      {#if origins.length === 0}
        <p class="muted">まだルールはありません。</p>
      {:else}
        <ul>
          {#each origins as origin (origin)}
            {@const rule = current.rules[origin]}
            {#if rule !== undefined}
              <li class="card">
                <div class="rule-header">
                  <span class="origin">{origin}</span>
                  <button
                    type="button"
                    class="danger"
                    aria-label="{origin} のルールを削除"
                    onclick={() => removeRule(current, origin)}
                  >
                    削除
                  </button>
                </div>
                <BehaviorEditor
                  behavior={rule}
                  onChange={(behavior) => changeRule(current, origin, behavior)}
                />
              </li>
            {/if}
          {/each}
        </ul>
      {/if}
    </section>
  {/if}
</main>

<style>
  main {
    max-width: 640px;
    margin: 0 auto;
    padding: 24px 16px;
  }

  h1 {
    margin: 0 0 16px;
    font-size: 20px;
  }

  h2 {
    margin: 24px 0 4px;
    font-size: 15px;
  }

  .muted {
    margin: 0 0 10px;
    color: var(--muted);
  }

  .card {
    padding: 12px;
    border: 1px solid var(--border);
    border-radius: 8px;
  }

  .add {
    display: flex;
    gap: 6px;
    margin-bottom: 8px;
  }

  .add input {
    flex: 1;
    min-width: 0;
    padding: 3px 8px;
    border: 1px solid var(--border);
    border-radius: 6px;
    background: transparent;
    color: inherit;
    font: inherit;
  }

  .error {
    margin: 0 0 8px;
    color: var(--danger);
  }

  ul {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .rule-header {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-bottom: 8px;
  }

  .origin {
    overflow: hidden;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .danger {
    margin-left: auto;
    color: var(--danger);
  }
</style>
