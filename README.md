# mochi UV

日焼け止めの塗り直しリマインダーPWA。
ターゲット: 20-30代女子 / 艶やか・可愛い系UI。

## コンセプト

「塗った達成感」を可視化するUVケアアプリ。
リマインドだけでなく、毎日のUVカット累積を「守れた%」「連続日数」として静観できる。

## 機能（MVP / Phase 1）

- 塗った / 塗らないボタン（ワンタップ記録）
- 固定間隔リマインド（2/3/4時間、ユーザー設定可）
- 日の出〜日没のみ通知発火（位置情報から自動算出）
- 冬眠モード（指定日まで完全オフ）
- 時間帯オフ（◯時〜◯時除外）
- UVカット累積の可視化（円グラフ・連続日数）
- カレンダー履歴

## Phase 2以降

- ジオフェンス（職場/自宅オフ、離れたら再開）
- 日焼け止め商品DB + アフィリエイト
- プレミアム課金（広告非表示・複数プロファイル）
- SNSシェア画像生成

## 技術スタック

| レイヤ | 採用技術 |
|---|---|
| Frontend | Vite + React + TypeScript + Tailwind CSS |
| Backend  | Cloudflare Workers + D1 (SQLite) |
| PWA      | Service Worker + Web Push API |
| Auth     | 後付け（Phase 2でメール or LINE Login） |

## ディレクトリ構成

```
uv-reminder/
├── apps/
│   ├── web/         # Vite + React PWA
│   └── worker/      # Cloudflare Workers + D1
├── packages/
│   └── shared/      # 型定義 + UVカット計算ロジック
└── README.md
```

## 起動（pCloud環境）

pCloud配下では `node_modules` のsymlinkが作れないため、
`/tmp/mochi-uv-build/` にrsyncしてからdevサーバーを起動する。
編集はpCloud側で行い、`watch.sh`で自動同期する。

```bash
# 1. /tmpにミラーしてVite dev起動
bash scripts/dev.sh

# 2. （別ターミナル）pCloud側の編集を /tmp に自動同期
bash scripts/watch.sh
```

ブラウザで http://localhost:5173/ を開く。

## デプロイ（後日）

```bash
# D1データベース作成（初回のみ）
cd apps/worker
wrangler d1 create mochi-uv
# 出てきた database_id を wrangler.toml に貼る
wrangler d1 execute mochi-uv --file=schema.sql

# Workerデプロイ
pnpm deploy
```

## 動作確認済み（Phase 1 MVP）

- ✅ 塗ったよボタン → 連続記録カウント + 今日の記録に追加
- ✅ 円形プログレスリング（守れた紫外線%）
- ✅ 次の塗り直し時刻表示
- ✅ 設定モーダル（間隔/SPF/PA/夜間オフ/冬眠モード/日の出日没のみ）
- ✅ 日の出・日没時刻の自動計算（位置情報ベース）
- ✅ LocalStorage永続化（バックエンドなしで動く）

## Phase 2 ToDo

- [ ] Web Push（Worker側のscheduled handlerからVAPIDで送信）
- [ ] D1永続化（複数デバイス同期）
- [ ] ジオフェンス（職場/自宅オフ）
- [ ] 週次/月次グラフ
- [ ] 日焼け止め商品DB + Amazonアフィリエイト
- [ ] プレミアム課金（Stripe / RevenueCat）
- [ ] SNSシェア画像生成
- [ ] iOSネイティブ移行検討
