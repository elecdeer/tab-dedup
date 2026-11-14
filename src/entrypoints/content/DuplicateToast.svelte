<script lang="ts">
  import type { DuplicateTab } from "@/lib/duplicates";
  import Toast from "./Toast.svelte";

  interface Props {
    duplicates: DuplicateTab[];
    autoDismissMs: number;
    onSwitch: () => void;
    onCloseOthers: () => void;
    onDismiss: () => void;
    onTimeout: () => void;
  }

  const { duplicates, autoDismissMs, onSwitch, onCloseOthers, onDismiss, onTimeout }: Props =
    $props();
</script>

<Toast
  title={duplicates.length === 1
    ? "別のタブで開かれています"
    : `${duplicates.length} 個の別のタブで開かれています`}
  {autoDismissMs}
  {onDismiss}
  {onTimeout}
>
  <button class="primary" type="button" title="このタブを閉じて既存のタブへ移動" onclick={onSwitch}>
    既存のタブへ移動
  </button>
  <button type="button" title="既存のタブを閉じてこのタブを使う" onclick={onCloseOthers}>
    古いタブを閉じる
  </button>
</Toast>
