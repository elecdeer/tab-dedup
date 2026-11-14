<script lang="ts">
  import BehaviorEditor from "@/components/BehaviorEditor.svelte";
  import { resolveBehavior, type Behavior, type Settings } from "@/lib/settings";
  import { loadSettings, setRule, watchSettings } from "@/lib/settings-storage";
  import { toOrigin } from "@/lib/url";

  let origin: string | null | undefined = $state();
  let settings: Settings | undefined = $state();

  const hasRule = $derived(
    origin !== null && origin !== undefined && settings?.rules[origin] !== undefined,
  );

  $effect(() => {
    void (async () => {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      origin = toOrigin(tab?.url);
      settings = await loadSettings();
    })();
    return watchSettings((next) => {
      settings = next;
    });
  });

  /**
   * Saves `behavior` as this site's own rule.
   */
  async function handleChange(site: string, behavior: Behavior): Promise<void> {
    settings = await setRule(site, behavior);
  }

  /**
   * Removes this site's rule so it follows the defaults again.
   */
  async function resetRule(site: string): Promise<void> {
    settings = await setRule(site, undefined);
  }
</script>

<main>
  {#if origin === undefined || settings === undefined}
    <p class="muted">読み込み中…</p>
  {:else if origin === null}
    <p class="muted">このページではサイトごとの設定は使えません。</p>
  {:else}
    {@const site = origin}
    <h1 title={site}>{site}</h1>
    <p class="status">
      {hasRule ? "このサイト専用の設定を使用中" : "デフォルト設定を使用中（変更するとこのサイト専用になります）"}
    </p>
    <BehaviorEditor
      behavior={resolveBehavior(settings, site)}
      onChange={(behavior) => void handleChange(site, behavior)}
    />
    <div class="footer">
      <button type="button" disabled={!hasRule} onclick={() => void resetRule(site)}>
        デフォルトに戻す
      </button>
      <button type="button" class="link" onclick={() => void browser.runtime.openOptionsPage()}>
        すべての設定
      </button>
    </div>
  {/if}
</main>

<style>
  main {
    width: 320px;
    padding: 12px;
  }

  h1 {
    margin: 0 0 2px;
    overflow: hidden;
    font-size: 14px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .status,
  .muted {
    margin: 0 0 10px;
    color: var(--muted);
    font-size: 12px;
  }

  .footer {
    display: flex;
    justify-content: space-between;
    margin-top: 12px;
  }

  .link {
    border-color: transparent;
    color: var(--accent);
  }
</style>
