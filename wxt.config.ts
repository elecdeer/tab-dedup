import { defineConfig } from "wxt";

// See https://wxt.dev/api/reference/wxt/interfaces/inlineconfig.html
export default defineConfig({
  srcDir: "src",
  modules: ["@wxt-dev/module-svelte"],
  manifest: {
    name: "Tab Dedup",
    description:
      "同じページが既に別のタブで開かれているとき、移動するか古いタブを閉じるかを選べます。",
    // `tabs` is required to read the URL of tabs other than the sender.
    // `storage` holds the per-site rules; `sessions` restores tabs closed automatically
    // (with their history) when the user clicks "undo".
    permissions: ["tabs", "storage", "sessions"],
  },
});
