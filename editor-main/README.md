# 財団アーカイブ — SCP風小説プラットフォーム

Next.js 16 + TypeScript + Tailwind CSS v4 + Drizzle ORM (libSQL/Turso) で構築した、SCP財団スタイルの小説執筆・公開プラットフォーム。

管理者がオリジナルマークアップ言語 **NML (Novel Markup Language)** で小説を執筆し、エンティティ（異常物体・施設・人物など）への参照をインタラクティブに管理できる。

---

## セットアップ

```bash
npm install
cp .env.local.example .env.local   # 環境変数を設定
npm run dev                         # 開発サーバー起動 → http://localhost:3000
npm run seed                        # 初期サンプルデータ投入（任意）
```

### 環境変数

| 変数名 | 説明 | デフォルト |
|---|---|---|
| `TURSO_DATABASE_URL` | Turso の DB URL | `file:local.db`（ローカルSQLite） |
| `TURSO_AUTH_TOKEN` | Turso 認証トークン | 不要（ローカル時） |
| `ADMIN_TOKEN` | 管理API認証トークン | **必須（要設定）** |

> ⚠️ `ADMIN_TOKEN` を設定しないと管理APIが無防備になります。必ず強いランダム文字列を設定してください。

---

## 本番デプロイ（Vercel + Turso）

```bash
# 1. Turso でデータベースを作成
turso db create foundation-archive
turso db show foundation-archive --url
turso db tokens create foundation-archive

# 2. Vercel に環境変数を設定
vercel env add TURSO_DATABASE_URL
vercel env add TURSO_AUTH_TOKEN
vercel env add ADMIN_TOKEN

# 3. デプロイ（postbuild でシードが自動実行される）
vercel --prod
```

初回起動時に `instrumentation.ts` 経由でシードが自動実行されます（DBが空の場合のみ・冪等）。

---

## NML（Novel Markup Language）

### エンティティ参照タグ（インライン）

本文中にエンティティへのリンクを埋め込む。クリックでポップアップ、ポップアップから詳細ページへ遷移できる。

```
[ANOMALY|SCP-1729|永遠の子守唄]     → 琥珀色リンク（異常物体）
[MODULE|MOD-004|MNEMONシステム]     → シアンリンク（モジュール）
[INCIDENT|INC-2024-0311|停電事案]   → 赤リンク（インシデント）
[FACILITY|SITE-19|第19サイト]       → 緑リンク（施設）
[PERSON|PRSN-0077|Dr.ミズキ]        → 紫リンク（人物）
```

### ブロックタグ

```
[HEADER]文書ヘッダーテキスト[/HEADER]
[REDACTED_BLOCK|level=N]機密テキスト（クリックで解除）[/REDACTED_BLOCK]
[GLITCH]グリッチアニメーション[/GLITCH]
[TERMINAL|prompt=#]コマンド出力[/TERMINAL]
[WARN|danger/info/caution|タイトル]警告メッセージ[/WARN]
[LOG|ログタイトル|2024-03-11]ログ本文[/LOG]
[INTERVIEW|面談記録 #001]
[Q|質問テキスト]
[A|話者名|回答テキスト]
[/INTERVIEW]
[CALL|通信記録]
[VOICE|left|オペレーター|テキスト]
[/CALL]
[CHAT]
[MSG|right|エージェント名|メッセージ]
[/CHAT]
[DIALOG]
[LINE|役割|▶|台詞テキスト]
[/DIALOG]
[CHOICE]
- 選択肢A
- 選択肢B
[/CHOICE]
[GLOSSARY]
[TERM|用語名|説明テキスト]
[/GLOSSARY]
[FOOTNOTE]
[N|1|脚注テキスト]
[/FOOTNOTE]
[CLEARANCE|3]CLR-Lv.3以上のみ閲覧可[/CLEARANCE]
[HR]  [HR|dots]  [HR|stars]
[SYS|SYSTEM ONLINE|システム起動]
[IMAGE|photo|キャプションテキスト]
[COUNTER|感染者数|1,729]
[POV|Dr.ミズキ]
```

### インラインタグ

```
[RUBY|拳銃|ハンドガン]        ルビ
[DOT|強調テキスト]            傍点
[EM|イタリック]               斜体
[STRONG|太字]                 ボールド
[CORRUPT|文字化けテキスト|level=2]
[NOTE|1]                      脚注参照番号
[TIME|03:47:22]               タイムスタンプ
```

---

## 管理画面

| パス | 機能 |
|---|---|
| `/admin` | ダッシュボード |
| `/admin/editor` | 小説・章の執筆エディタ（NML + プレビュー） |
| `/admin/entities` | エンティティ管理（異常物体・施設・人物など） |
| `/admin/search` | 全文検索 |
| `/admin/stats` | 統計 |
| `/admin/backup` | バックアップ・インポート |

---

## データ管理

### バックアップ（書き出し）

管理画面 `/admin/backup` からJSON形式で全データを書き出せる。

```bash
# API 直接利用
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:3000/api/admin/backup -o backup.json
```

### インポート（読み込み）

管理画面 `/admin/backup` からJSONファイルを選択してインポート。2つのモードがある：

- **統合（merge）** — 重複しないレコードのみ追加。既存データを保持。
- **上書き（replace）** — 全テーブルを削除してから挿入。完全な復元に使用。

```bash
# API 直接利用（merge モード）
curl -X POST http://localhost:3000/api/admin/backup \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"mode":"merge","data":{...}}'
```

---

## ディレクトリ構成

```
app/
  page.tsx                          # トップ（公開小説一覧）
  novels/[slug]/page.tsx            # 読書ページ
  entities/[type]/page.tsx          # エンティティ一覧
  entities/[type]/[id]/page.tsx     # エンティティ詳細
  admin/                            # 管理画面
  api/admin/                        # 管理API（要 ADMIN_TOKEN 認証）
  api/novels/                       # 公開小説API
  api/entities/                     # 公開エンティティAPI
components/
  editor/NmlEditor.tsx              # NMLエディタ（シンタックスハイライト付き）
  entity/EntityTag.tsx              # インラインエンティティリンク
  entity/EntityPopup.tsx            # エンティティポップアップ
  novel/NovelRenderer.tsx           # NML → React メインレンダラー
  novel/[各ブロックコンポーネント].tsx
db/
  schema.ts                         # Drizzle スキーマ定義
  client.ts                         # DB接続クライアント
  seed.ts                           # 初期データ
lib/
  markup-parser.ts                  # NMLトークナイザー
  nml-highlight.ts                  # エディタ用シンタックスハイライト
types/index.ts                      # 型定義（Token, Entity など）
instrumentation.ts                  # 起動時シード自動実行
```
