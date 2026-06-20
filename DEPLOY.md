# mochi UV デプロイ手順

Cloudflare Pagesに公開する手順。最終の `wrangler pages deploy` はあなた本人が打鍵する前提（クレデンシャル保護のため）。

## 前提

- Cloudflareアカウント保持（既存の `8810hhayato.workers.dev` と同じアカウントでOK）
- Node.js 20+ / pnpm 9+
- macOS（pCloud配下でビルド不可なので /tmp 経由）

## 1. 初回セットアップ（1度だけ）

```bash
# Cloudflareにログイン
cd /tmp/mochi-uv-build/apps/web
npx wrangler login
# ブラウザが開く → Cloudflareアカウントで認証 → 戻ってきたら完了
```

## 2. ビルド（毎回）

```bash
# pCloudから /tmp にミラー
rsync -a --delete \
  --exclude node_modules --exclude .wrangler --exclude dist --exclude .pnpm-store --exclude .git \
  "/Users/hayatohirano/pCloud Drive/Test/memo/8810/engines/uv-reminder/" \
  /tmp/mochi-uv-build/

# /tmp側はsymlink可能なので .npmrc を消す
rm -f /tmp/mochi-uv-build/.npmrc

# ビルド
cd /tmp/mochi-uv-build
pnpm install   # 初回 or 依存追加時のみ
pnpm --filter @mochi-uv/web build

# 成果物: /tmp/mochi-uv-build/apps/web/dist/
ls /tmp/mochi-uv-build/apps/web/dist/
```

## 3. プレビュー（任意・本番前確認）

```bash
cd /tmp/mochi-uv-build/apps/web
npx vite preview --port 4173 --host
# → http://localhost:4173/
```

## 4. 本番デプロイ

```bash
cd /tmp/mochi-uv-build/apps/web
npx wrangler pages deploy dist --project-name mochi-uv

# 初回のみ:
#   ? The project you specified does not exist: "mochi-uv".
#   Would you like to create it? → Y
#   ? Enter the production branch name: → main
```

完了すると以下が表示される：

```
✨ Deployment complete! Take a peek over at https://<hash>.mochi-uv.pages.dev
```

本番URLは `https://mochi-uv.pages.dev/`（プロジェクト名がそのままサブドメイン）。

## 5. 独自ドメイン（任意）

Cloudflare Dashboard → Pages → mochi-uv → Custom domains から追加。
`mochi-uv.com` 等を取得済みならCNAMEで自動セットアップ。

## 6. iPhoneで「ホーム画面に追加」

1. Safariで `https://mochi-uv.pages.dev/` を開く
2. 共有ボタン → 「ホーム画面に追加」
3. アイコンが表示されたらタップで起動
4. 初回起動時に通知許可・位置情報許可をタップ

## トラブルシュート

| 症状 | 対処 |
|---|---|
| `wrangler: command not found` | `npx wrangler ...` 形式で実行する（このreadmeは全部そう書いてある） |
| pnpm installでsymlinkエラー | `/tmp/mochi-uv-build/` でやっているか確認。pCloud直下ではビルドできない |
| Cloudflareログインがブラウザで戻らない | ブラウザの戻りURLをコピーしてターミナルに貼り付け |
| デプロイ後にアイコンが古い | `pnpm --filter @mochi-uv/web build` の前に `rm -rf apps/web/dist/` で完全クリーンビルド |
| iPhoneで「ホーム画面に追加」しても通知が来ない | iOS 16.4+必須。Safari設定 → 通知をオンに |

## Cloudflare Web Analytics（無料・Cookie不要）

Pages Dashboard で1クリック有効化が最速：

1. https://dash.cloudflare.com/ → Workers & Pages → mochi-uv
2. 左メニュー → Settings → Web Analytics
3. 「Enable Web Analytics」をクリック
4. 自動でビーコンが挿入される（再デプロイ不要）

確認: 24時間後に dash → Analytics & Logs → Web Analytics で PV/UV/Core Web Vitals が見える。

> Cookie不要なので Cookie同意バナーは不要。Google Analytics 4 を入れたいときは別途 `gtag.js` を `index.html` に手動追加。

## デプロイ後のチェックリスト

- [ ] `https://mochi-uv.pages.dev/` が開く
- [ ] PWA manifest を Chrome DevTools → Application → Manifest で確認
- [ ] Lighthouse PWAスコア 90+
- [ ] iPhone Safari で「ホーム画面に追加」してフルスクリーン起動
- [ ] 通知許可を出すとリマインダーが届く
- [ ] OGPプレビュー（X, LINE, Slack）でカードが表示される
  - 確認: https://cards-dev.twitter.com/validator
  - 確認: https://developers.facebook.com/tools/debug/

## バックエンド（Worker）デプロイ

現状はフロントエンドのみ（LocalStorage完結）でPagesだけでOK。
Web Push本番実装するときに `apps/worker/` をデプロイする：

```bash
cd /tmp/mochi-uv-build/apps/worker
npx wrangler d1 create mochi-uv          # 初回のみ
# 出力されたdatabase_idを wrangler.toml に貼る
npx wrangler d1 execute mochi-uv --file=schema.sql --remote
npx wrangler deploy
```
