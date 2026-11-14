# Tab Dedup

ページを開いたとき、同じページ（origin + path が一致）が既に別のタブで開かれていれば、

- 既存のタブへ移動（このタブは閉じる）
- 古いタブを閉じる（このタブを使う）
- 何もしない（× で閉じる）

を選べる小さな通知をページ右上に表示する Chrome 拡張機能です。WXT + Svelte + Vite+ で構成しています。

## 開発

```bash
vp install
pnpm run dev      # Chrome が起動し拡張が読み込まれる
pnpm run build    # .output/chrome-mv3 に出力
vp test          # Vitest (Vite+ built-in)
vp check         # fmt + lint + type check
pnpm run check:svelte
```
