<script lang="ts">
  import Toast from "./Toast.svelte";

  interface Props {
    text: string;
    autoDismissMs: number;
    onUndo: () => void;
    onClose: () => void;
  }

  const { text, autoDismissMs, onUndo, onClose }: Props = $props();
</script>

<Toast title={text} {autoDismissMs} onDismiss={onClose} onTimeout={onClose}>
  <button class="primary" type="button" title="閉じたタブを開き直す" onclick={onUndo}>
    元に戻す
  </button>
</Toast>
