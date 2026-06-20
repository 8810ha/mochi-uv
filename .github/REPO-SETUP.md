# mochi UV GitHubリポジトリ初期化手順

mochi UVを独立リポジトリ化してGitHub Actionsで自動デプロイする。

## 1. リポジトリ初期化

```bash
# /tmp 側ではなく pCloud のソースを使う
cd "/Users/hayatohirano/pCloud Drive/Test/memo/8810/engines/uv-reminder"

# 新規 git リポジトリ
git init
git add .
git commit -m "init: mochi UV v0.1 - PWA, mascot, week+month stats, SPF-aware timer, sweat button"

# GitHub にリポジトリ作成（public でOK、private でも可）
gh repo create mochi-uv --public --source=. --remote=origin --description "もちもち肌を守る、日焼け止めリマインダーPWA"

# main branch を push
git branch -M main
git push -u origin main
```

## 2. Cloudflare API Token を作成

1. https://dash.cloudflare.com/profile/api-tokens
2. 「Create Token」→ 「Custom token」
3. 設定:
   - **Token name**: `mochi-uv-deploy`
   - **Permissions**:
     - Account → `Cloudflare Pages` → `Edit`
     - Account → `Workers Scripts` → `Edit`
     - Account → `D1` → `Edit`
   - **Account Resources**: Include → `8810hhayato`（あなたのアカウント）
   - **TTL**: 1年程度
4. 「Continue to summary」→「Create Token」
5. **表示されたトークンを必ずコピー（再表示不可）**

## 3. Account ID を控える

1. https://dash.cloudflare.com/ → 右サイドバーに `Account ID` がある
2. 例: `1a2b3c4d5e6f7g8h9i0j` のような32桁の16進

## 4. GitHub Secrets に登録

```bash
cd "/Users/hayatohirano/pCloud Drive/Test/memo/8810/engines/uv-reminder"

# CF API Token を Secret に
gh secret set CLOUDFLARE_API_TOKEN
# → プロンプトでトークン貼り付け → Enter

# Account ID も
gh secret set CLOUDFLARE_ACCOUNT_ID
# → 32桁の hex を貼り付け → Enter

# 確認
gh secret list
```

## 5. 動作テスト

```bash
# 何か小さく編集してpush（README修正等）
git commit -am "test: trigger CI/CD"
git push

# Actions タブで進行確認
gh run watch
```

成功すれば `mochi-uv.pages.dev` に自動デプロイされる。

## 6. PR フロー

- PR作成時 → `ci.yml` がtype checkとbuildを走らせる
- main にmerge → `deploy.yml` が自動デプロイ
- Cloudflare側はGitHub連携設定不要（wrangler-action経由でAPI直叩き）

## 7. Worker（Web Push）連携時

`apps/worker/wrangler.toml` の `database_id` を本物に置き換えれば、`deploy.yml` の `worker-deploy` ジョブも有効になる。
