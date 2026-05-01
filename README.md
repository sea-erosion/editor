# 財団アーカイブ — SCP風小説サイト

Next.js + TypeScript + TailwindCSS + Turso(libSQL) で構築した、SCP財団スタイルの小説公開サイト。

## セットアップ

```bash
npm install
cp .env.local.example .env.local   # 環境変数設定
npx tsx db/seed.ts                  # サンプルデータ投入
npm run dev                         # 開発サーバー起動
```

→ http://localhost:3000

## Turso本番接続

```bash
turso db create foundation-archive
turso db show foundation-archive        # URL確認
turso db tokens create foundation-archive

# .env.local に設定
TURSO_DATABASE_URL=libsql://xxx.turso.io
TURSO_AUTH_TOKEN=eyJ...
```

## 小説マークアップ言語（NML）

### エンティティタグ（クリックでポップアップ → 詳細ページ）

```
[ANOMALY|SCP-1729|永遠の子守唄]   → 琥珀色リンク
[MODULE|MOD-004|MNEMONシステム]   → シアンリンク
[INCIDENT|INC-2024-0311|停電事案] → 赤リンク
[FACILITY|SITE-19|第19サイト]     → 緑リンク
[PERSON|PRSN-0077|Dr.ミズキ]      → 紫リンク
```

### 特殊ブロック

```
[HEADER]文書ヘッダー[/HEADER]
[REDACTED_BLOCK]黒塗り（クリックで解除）[/REDACTED_BLOCK]
[GLITCH]グリッチアニメーションテキスト[/GLITCH]
[TERMINAL]
> ターミナル風タイプライター表示
[/TERMINAL]
[RUBY|拳銃|ハンドガン]
[CHOICE]
- 選択肢1
- 選択肢2
[/CHOICE]
[CHAT]
[MSG|right|キャラ名|メッセージ]
[MSG|left|キャラ名|メッセージ]
[/CHAT]
```

## ディレクトリ構造

```
app/
  page.tsx                    # トップ（小説一覧）
  novels/[slug]/page.tsx      # 読書ページ
  entities/[type]/page.tsx    # エンティティ一覧
  entities/[type]/[id]/page.tsx # 詳細ページ
  api/entities/[type]/[id]/route.ts
components/
  entity/EntityTag.tsx        # インラインタグ
  entity/EntityPopup.tsx      # ポップアップ
  novel/NovelRenderer.tsx     # メインレンダラー
  novel/TerminalBlock.tsx
  novel/GlitchText.tsx
  novel/ChoiceBlock.tsx
  novel/ChatBlock.tsx
db/
  schema.ts / client.ts / seed.ts
lib/
  markup-parser.ts            # NMLパーサー
types/index.ts
```

---

## デプロイ / 初期セットアップ

### 自動シード（推奨）

`next start` 時に `instrumentation.ts` 経由で自動的にシードが実行されます。

- DBが**空**の場合のみ初期データを投入（冪等）
- 既にデータがある場合はスキップ

```bash
npm run build && npm run start
```

### 手動シード

```bash
npm run seed
# または
npx tsx db/seed.ts
```

### 環境変数

| 変数名 | 説明 | デフォルト |
|---|---|---|
| `TURSO_DATABASE_URL` | TursoのDB URL | `file:local.db` |
| `TURSO_AUTH_TOKEN` | Tursoの認証トークン | なし（ローカルは不要） |

### Vercelへのデプロイ

```bash
# 1. Tursoでデータベースを作成
turso db create scp-archive

# 2. 接続情報を取得
turso db show scp-archive --url
turso db tokens create scp-archive

# 3. Vercelに環境変数を設定
vercel env add TURSO_DATABASE_URL
vercel env add TURSO_AUTH_TOKEN

# 4. デプロイ（postbuild でシードも実行される）
vercel --prod
```

---

## データ管理

### バックアップ（書き出し）

管理画面 `/admin/backup` から全データをJSONで書き出せます。

または APIを直接叩く：

```bash
curl http://localhost:3000/api/admin/backup -o backup.json
```

### インポート（読み込み）

管理画面 `/admin/backup` からJSONファイルを選択してインポート。

2つのモードがあります：

- **統合（merge）** — IDが重複しないレコードのみ追加。既存データを保持。
- **上書き（replace）** — 全テーブルを削除してから挿入。完全な復元に使用。

```bash
# API直接利用の例（mergeモード）
curl -X POST http://localhost:3000/api/admin/backup \
  -H "Content-Type: application/json" \
  -d '{"mode":"merge","data":{...}}'
```
