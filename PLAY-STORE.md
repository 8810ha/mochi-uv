# mochi UV — Google Play 公開ガイド（TWA / Bubblewrap）

PWA を **TWA（Trusted Web Activity）** でラップして Google Play に出すための手順書。
本アプリは既に manifest / Service Worker / HTTPS / Web Push を満たしているので、TWA 化はそのまま可能。

> ⚠️ **Android のみ**。iOS は TWA 不可 → iPhone 勢は「Safari → 共有 → ホーム画面に追加」を案内する（実質これが iOS 版）。

---

## 0. 事前準備（一度だけ）

| 必要なもの | 備考 |
|---|---|
| Google Play デベロッパーアカウント | **$25 買い切り**。https://play.google.com/console |
| JDK 17+ | Bubblewrap が `~/.bubblewrap` に JDK/Android SDK を自動DLするので手動導入は基本不要 |
| Node.js | 導入済み |
| プライバシーポリシーURL | ✅ 用意済み → `https://mochi-uv.pages.dev/privacy`（**連絡先メールだけ要記入**、下記§5） |

---

## 1. Bubblewrap で TWA をビルド

```bash
# CLI 導入
npm i -g @bubblewrap/cli

# このリポジトリ直下（uv-reminder/）で実行
#  方法A: 同梱の twa-manifest.json をそのまま使う場合
bubblewrap build        # twa-manifest.json を読んで AAB を生成

#  方法B: ゼロから対話生成し直す場合（推奨されるなら）
bubblewrap init --manifest https://mochi-uv.pages.dev/manifest.webmanifest
#   → packageId: dev.pages.mochi_uv / Notifications: Yes(必須) で答える
bubblewrap build
```

- 初回ビルドで **署名鍵（android.keystore）** の作成を求められる。
  - パスワードは**自分で決めて厳重保管**（紛失すると以後のアップデート不可）。
  - `android.keystore` は **Git にコミットしない**（`.gitignore` 済み: §6 参照）。
- 成果物: `app-release-bundle.aab`（Play にアップロードするのはこれ）。
- 同梱の `twa-manifest.json` は `enableNotifications: true` 済み → **Web Push が TWA 内（Android Chrome エンジン）で動く**。

---

## 2. Digital Asset Links（URLバーを消す＝全画面化に必須）

TWA は「このAndroidアプリは mochi-uv.pages.dev の正規アプリ」という証明が要る。

1. 署名鍵の SHA-256 フィンガープリントを取得:
   ```bash
   bubblewrap fingerprint   # または keytool -list -v -keystore android.keystore
   ```
   - **Play App Signing を使う場合**（推奨）、本番の指紋は **Play Console → リリース → アプリの整合性 → アプリ署名鍵証明書** に表示される SHA-256 を使う。
2. `apps/web/public/.well-known/assetlinks.json` の
   `REPLACE_WITH_SHA256_FINGERPRINT_FROM_PLAY_APP_SIGNING` を取得した指紋（`AB:CD:...` のコロン区切り）に置換。
   - 複数指紋（アップロード鍵＋Play署名鍵）を配列に並べてよい。
3. commit → push → CI が自動デプロイ → `https://mochi-uv.pages.dev/.well-known/assetlinks.json` が更新される。
4. 確認: `curl https://mochi-uv.pages.dev/.well-known/assetlinks.json`

---

## 3. Play Console でアプリ作成 → AAB アップロード

1. Play Console → 「アプリを作成」→ 名前 `mochi UV`、言語 日本語、アプリ／無料。
2. 内部テスト トラックを作成 → `app-release-bundle.aab` をアップロード。
3. まず**内部テスト**で自分の端末に配信して動作確認（URLバーが消えて全画面なら assetlinks 成功）。

---

## 4. ストア掲載情報（用意するアセット）

| 項目 | 仕様 |
|---|---|
| アプリ名 | mochi UV |
| 簡単な説明 | 80字以内（例:「塗った達成感をかわいく可視化する日焼け止めリマインダー」） |
| 詳しい説明 | 4000字以内 |
| アプリアイコン | 512×512 PNG（`apps/web/public/icon-512.png` を流用可） |
| フィーチャーグラフィック | **1024×500 PNG**（要新規作成） |
| スクリーンショット | スマホ用 最低2枚（撮影済みのものを流用可） |
| カテゴリ | 健康＆フィットネス |
| プライバシーポリシーURL | `https://mochi-uv.pages.dev/privacy` |

---

## 5. Data Safety（データセーフティ）フォームの回答指針

本アプリの実装に基づく正確な回答（Play 申請時に必須）:

- **データを収集・共有しますか？** → 収集する／**第三者と共有しない**。
- **収集するデータ種別**:
  - アプリのアクティビティ（アプリ内操作・履歴）= 塗布記録 → **はい**
  - アプリ識別子に類するもの（アプリ生成の匿名ID・プッシュ購読）→ 該当すれば「その他ID」で申告
  - **位置情報** → **収集しない**（端末内でのみ計算し、サーバー送信なし。§privacy 参照）
  - 氏名・メール・連絡先・写真・電話番号 → **収集しない**
- **送信時に暗号化されますか？** → **はい**（HTTPS）。
- **データ削除をリクエストできますか？** → **はい**（アプリ内で通知オフ＋連絡先へ依頼）。

> ⚠️ Data Safety はストア掲載のプライバシーポリシーと矛盾しないこと。先に privacy.html の
> **連絡先メール（`[ご連絡先メールアドレスをここに記載]`）を実アドレスに置換**してから申請する。

---

## 6. Git に入れてはいけないもの（署名鍵）

`.gitignore` に以下を追加済みであること（無ければ追加）:

```
android.keystore
*.keystore
app-release-*.aab
app-release-*.apk
twa-manifest.json の signingKey パスワードを書いたメモ
```

署名鍵を失うと **二度とアップデートを出せない**。鍵は Bitwarden 等に退避推奨。

---

## 7. まとめ（最短ルート）

1. `npm i -g @bubblewrap/cli` → `bubblewrap build`（鍵作成＋AAB生成）
2. 指紋取得 → `assetlinks.json` 置換 → push（CI自動反映）
3. privacy.html の連絡先メールを記入 → push
4. Play Console（$25）→ アプリ作成 → AAB アップロード → Data Safety（§5）→ 審査提出

— 1〜3 は私（Claude）が補助可能。署名鍵パスワード・$25 決済・Play Console 提出はあなたの操作。
