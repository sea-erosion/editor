# scp-novel-improved — Claude 引き継ぎ文書

> 作成日: 2026-05-03  
> 更新日: 2026-05-03  
> 前担当: Claude Sonnet 4.6  
> ステータス: バグ修正済み・認証実装済み・NML記法追加済み・未完タスクなし

---

## 1. プロジェクト概要

SCP 財団風の世界観を持つ Web 小説プラットフォーム。  
管理者がブラウザ上でオリジナルマークアップ言語 **NML (Novel Markup Language)** を使って小説を執筆・管理し、読者向けに公開する。

### 技術スタック

| 項目 | 内容 |
|---|---|
| Framework | **Next.js 16.2.4** (App Router) |
| UI | React 19 + Tailwind CSS v4 |
| DB | **Drizzle ORM + libSQL (Turso / ローカル SQLite)** |
| 言語 | TypeScript 5 |
| 認証 | **Next.js Middleware + Bearer トークン**（実装済み） |

### 起動方法

```bash
npm install
npm run dev          # 開発サーバー (localhost:3000)
npm run seed         # 初期データ投入
```

環境変数（`.env.local`）:
```
TURSO_DATABASE_URL=   # 省略時は file:local.db
TURSO_AUTH_TOKEN=
ADMIN_TOKEN=                    # サーバーサイドAPI認証トークン（必須）
NEXT_PUBLIC_ADMIN_TOKEN=        # フロントエンド用（ADMIN_TOKENと同値）
```

---

## 2. ディレクトリ構成（重要ファイルのみ）

```
scp-novel-improved/
├── app/
│   ├── api/
│   │   ├── admin/          # 管理API（Bearer トークン認証済み）
│   │   │   ├── chapters/   # 章 CRUD + snapshots / memo / reorder
│   │   │   ├── entities/   # エンティティ CRUD
│   │   │   ├── novels/     # 小説 CRUD
│   │   │   ├── backup/     # エクスポート・インポート
│   │   │   ├── search/     # 全文検索
│   │   │   └── stats/      # 統計
│   │   ├── entities/       # 公開用エンティティAPI
│   │   └── novels/         # 公開用小説API + export
│   ├── admin/              # 管理画面 (editor / entities / backup / search / stats)
│   ├── novels/[slug]/      # 公開小説ページ
│   └── entities/[type]/    # 公開エンティティ一覧・詳細
├── components/
│   ├── editor/NmlEditor.tsx        # NML エディタ（シンタックスハイライト付き）
│   ├── entity/EntityTag.tsx        # インラインエンティティタグ
│   ├── entity/EntityPopup.tsx      # エンティティ詳細ポップアップ
│   └── novel/
│       ├── NovelRenderer.tsx       # NML → React レンダラー（コア）
│       └── [各種ブロックコンポーネント].tsx
├── middleware.ts               # 管理API認証（Next.js Middleware）
├── lib/
│   ├── admin-fetch.ts      # 管理API用 fetch ラッパー（Authヘッダー自動付与）
│   ├── markup-parser.ts    # NML パーサー（トークナイザー）
│   └── nml-highlight.ts    # エディタ用シンタックスハイライト
├── db/
│   ├── schema.ts           # Drizzle スキーマ
│   ├── client.ts           # DB接続
│   └── seed.ts             # 初期データ
└── types/index.ts          # 型定義（Token, TokenType, Entity型など）
```

---

## 3. NML（Novel Markup Language）仕様

### エンティティ参照タグ（インライン）

| 本文タグ | Parser `TokenType` | EntityType |
|---|---|---|
| `[ANOMALY\|ID\|ラベル]` | `anomaly_tag` | `anomaly` |
| `[MODULE\|ID\|ラベル]` | `module_tag` | `module` |
| `[INCIDENT\|ID\|ラベル]` | `incident_tag` | `incident` |
| `[FACILITY\|ID\|ラベル]` | `facility_tag` | `facility` |
| `[PERSON\|ID\|ラベル]` | `personnel_tag` | `personnel` |

> ⚠️ 本文タグ名は `PERSON` だが DB・API・型では `personnel`。混同注意。

### ブロックタグ（実装済み）

```
[HEADER]タイトル[/HEADER]
[REDACTED_BLOCK|level=N]内容[/REDACTED_BLOCK]
[GLITCH]内容[/GLITCH]
[TERMINAL|prompt=#]内容[/TERMINAL]
[CHOICE]\n- 選択肢\n[/CHOICE]
[CHOICE3]A|B|C[/CHOICE3]
[CHAT]  [MSG|left/right|名前|テキスト]\n[/CHAT]
[DIALOG]  [LINE|役割|記号|テキスト]\n[/DIALOG]
[GLOSSARY]  [TERM|用語|説明]\n[/GLOSSARY]
[LOG|タイトル|日付]内容[/LOG]
[CALL|ヘッダー]  [VOICE|left/right|名前|テキスト]\n[/CALL]
[FOOTNOTE]  [N|番号|テキスト]\n[/FOOTNOTE]
[INTERVIEW|ヘッダー]  [Q|質問]\n[A|話者|回答]\n[/INTERVIEW]
[CLEARANCE|N]内容[/CLEARANCE]
[WARN|danger/info/caution|タイトル]内容[/WARN]
[SYS|英語|日本語訳]
[HR]  [HR|dots]  [HR|stars]
[IMAGE|type|キャプション]
[COUNTER|ラベル|値]
[POV|人物名]
[REPORT|分類|日付]内容[/REPORT]
[TIMELINE]  [EVENT|日時|テキスト]
[/TIMELINE]
[CLASSIFIED|理由]内容[/CLASSIFIED]
[TABLE]  [ROW]列1|列2|列3
[/TABLE]
[TRANSMISSION|送信者|受信者]内容[/TRANSMISSION]
```

### インラインタグ（実装済み）

```
[RUBY|base|reading]
[DOT|テキスト]
[EM|テキスト]
[STRONG|テキスト]
[CORRUPT|テキスト|level=N]
[NOTE|番号]
[TIME|時刻]
[FONT|キー|テキスト]
[COLOR|色名または#hex|テキスト]
[BLINK|テキスト]
[SPOILER|テキスト]
[MARK|テキスト]
[SHAKE|テキスト]
[LINK|URL|テキスト]
```

### 記法追加時に修正する 4 か所

新しいタグを追加するときは必ず以下の**すべて**を修正すること：

1. **`types/index.ts`** — `TokenType` ユニオン型に新しい型名を追加
2. **`lib/markup-parser.ts`** — ブロックなら `blockPatterns` 配列に、インラインなら `INLINE_PATTERNS` 配列に正規表現ハンドラーを追加
3. **`components/novel/NovelRenderer.tsx`** — `switch (token.type)` に `case` を追加（ブロックコンポーネントを import して使う）
4. **`lib/nml-highlight.ts`** — エディタのシンタックスハイライトパターンを追加

ブロック記法の場合は `components/novel/NewBlock.tsx` として新規コンポーネントファイルも作成し、`NovelRenderer.tsx` で import する。

---

## 4. 実施済みバグ修正（再修正不要）

### Critical（3件）

| # | 内容 | 修正ファイル |
|---|---|---|
| C-1 | 章 PATCH 後に `novels.updatedAt` が更新されない | `app/api/admin/chapters/[id]/route.ts` |
| C-2 | `serializeBody` の `toSnake()` が Drizzle の camelCase と衝突しエンティティ保存が失敗 | `app/api/admin/entities/route.ts` / `entities/[type]/[id]/route.ts` |
| C-3 | `/api/admin/**` に認証なし — Bearer トークン認証を実装 | `middleware.ts`（新規）/ `lib/admin-fetch.ts`（新規）/ `app/admin/` 全ページ |

### High（5件）

| # | 内容 | 修正ファイル |
|---|---|---|
| H-1 | `NovelRenderer` でインライントークンが段落外に切り離される | `components/novel/NovelRenderer.tsx` |
| H-2 | `chapterNumber` 重複チェックなし | `app/api/admin/chapters/route.ts` |
| H-3 | ブロック内のネストタグが解析されない | `lib/markup-parser.ts` |
| H-4 | `EntityPopup` の位置計算で DOM 更新前の値を参照する競合状態 | `components/entity/EntityPopup.tsx` |
| H-5 | export で `[A\|テキスト]`（話者省略形）が変換されない | `app/api/novels/[slug]/export/route.ts` |

### Medium（6件）

| # | 内容 | 修正ファイル |
|---|---|---|
| M-1 | `scheduleAutosave` の stale closure | `app/admin/editor/page.tsx` |
| M-2 | `chapterCount` が draft 章も含む | `app/api/admin/novels/route.ts` |
| M-3 | スナップショットの並行書き込み競合 | `app/api/admin/chapters/[id]/snapshots/route.ts` |
| M-4 | draft 章が公開ページに表示される | `app/novels/[slug]/page.tsx` |
| M-5 | Tab キーによるフォーカストラップ | `components/editor/NmlEditor.tsx` |
| M-6 | 検索結果の「編集」リンクが特定章に遷移しない | `app/admin/search/page.tsx` / `app/admin/editor/page.tsx` |

### Low（4件）

| # | 内容 |
|---|---|
| L-1 | `runSeed` 失敗時のサイレントクラッシュ → try-catch 追加 |
| L-2 | EntityPopup の登場箇所リンク → 別タブ開きに変更 |
| L-3 | バックアップインポート時の timestamp 型不一致 → UNIX epoch 変換追加 |
| L-4 | `PERSON` vs `personnel` 命名混在 → `CLAUDE.md` に規約明記 |

---

## 5. あなたへの依頼タスク

### ~~タスク A【最優先】: Critical #3 — 管理 API の認証実装~~ ✅ 実施済み（2026-05-03）

`/api/admin/**` 全エンドポイントへの Bearer トークン認証を実装した。

**実装内容:**

- **`middleware.ts`**（新規）— Next.js Middleware で `/api/admin/**` をインターセプト。`Authorization: Bearer <token>` を検証し、不一致は 401、`ADMIN_TOKEN` 未設定は 503 を返す。
- **`lib/admin-fetch.ts`**（新規）— 管理API用 fetch ラッパー。`NEXT_PUBLIC_ADMIN_TOKEN` を `Authorization` ヘッダーに自動付与。
- **`app/admin/` 配下の全ページ**（editor / entities / stats / backup / search / preview）— `/api/admin` へのすべての `fetch()` 呼び出しを `adminFetch()` に置換済み。

**セットアップ（`.env.local` に追記）:**

```bash
# openssl rand -hex 32 などで生成
ADMIN_TOKEN=<ランダムな長い文字列>
NEXT_PUBLIC_ADMIN_TOKEN=<上と同じ値>
```

> ⚠️ `NEXT_PUBLIC_ADMIN_TOKEN` はブラウザから見える。本番環境では管理画面自体を IP 制限 / VPN 背後に置くこと。  
> セキュリティ要件がより高い場合はセッション Cookie + サーバーサイド検証への移行を検討。

---

### ~~タスク B: NML 記法の追加~~ ✅ 実施済み（2026-05-03）

以下の5つのブロックタグを追加した。

| タグ | 用途 | コンポーネント |
|---|---|---|
| `[REPORT\|分類\|日付]...[/REPORT]` | 公式報告書レイアウト（分類スタンプ・財団フッター付き） | `ReportBlock.tsx` |
| `[TIMELINE]...[/TIMELINE]` + `[EVENT\|日時\|テキスト]` | 縦型タイムライン（事件経緯など） | `TimelineBlock.tsx` |
| `[CLASSIFIED\|理由]...[/CLASSIFIED]` | 公式削除ブロック（斜線・赤枠・削除理由表示） | `ClassifiedBlock.tsx` |
| `[TABLE]...[/TABLE]` + `[ROW]列1\|列2` | 財団風テーブル（ヘッダー行自動認識） | `TableBlock.tsx` |
| `[TRANSMISSION\|送信者\|受信者]...[/TRANSMISSION]` | 暗号通信ブロック（クリックで解読アニメーション） | `TransmissionBlock.tsx` |

修正した4ファイル: `types/index.ts` / `lib/markup-parser.ts` / `components/novel/NovelRenderer.tsx` / `lib/nml-highlight.ts`

**追加インラインタグ（2026-05-03）:**

| タグ | 用途 | コンポーネント |
|---|---|---|
| `[FONT\|キー\|テキスト]` | `public/fonts/fonts.json` で定義したwoff2フォントをインラインで適用 | `FontText.tsx` |

**追加インラインタグ（2026-05-03）:**

| タグ | 用途 | 実装箇所 |
|---|---|---|
| `[COLOR\|色\|テキスト]` | 文字色変更。色名（red/cyan/amber/green/purple 等）または `#hex` | `InlineDecorations.tsx` |
| `[BLINK\|テキスト]` | ゆっくり点滅（CSSアニメーション） | `InlineDecorations.tsx` |
| `[SPOILER\|テキスト]` | ホバー/タップするまで黒塗り。インライン版REDACTED | `InlineDecorations.tsx` |
| `[MARK\|テキスト]` | 蛍光ペン風ハイライト（amber） | `InlineDecorations.tsx` |
| `[SHAKE\|テキスト]` | テキストを細かく震わせる（CSSアニメーション） | `InlineDecorations.tsx` |
| `[LINK\|URL\|テキスト]` | 外部リンク（別タブ・noopener付き） | `InlineDecorations.tsx` |

アニメーション（blink/shake）のCSSは `app/globals.css` に定義。

フォントの追加手順:
1. woff2ファイルを `public/fonts/` に配置
2. `public/fonts/fonts.json` にエントリを追加: `{"キー": {"file": "ファイル名.woff2", "label": "フォント表示名"}}`
3. NML本文で `[FONT|キー|テキスト]` と書くだけで適用される（`@font-face` は初回レンダリング時に動的挿入）

---

## 6. DB スキーマ概要

```
anomalies   : id(PK), name, classification, containmentClass, riskClass,
              disruptionClass, description, containmentProcedures, addendum,
              tags(JSON), imageUrl, createdAt, updatedAt
modules     : id(PK), name, type, status, description,
              specifications(JSON), relatedAnomalies(JSON), createdAt
incidents   : id(PK), name, severity, status, date, location, description,
              casualties, relatedAnomalies(JSON), relatedPersonnel(JSON), createdAt
facilities  : id(PK), name, type, location, status, description,
              director, capacity, containedAnomalies(JSON), createdAt
personnel   : id(PK), name, codename, rank, clearance(int 1-5), status, description,
              specialties(JSON), assignedFacility, relatedAnomalies(JSON), createdAt
novels      : id(PK), title, slug(UNIQUE), author, summary, classification,
              clearanceRequired, status, createdAt, updatedAt
chapters    : id(PK), novelId(FK→novels CASCADE), title, chapterNumber,
              content(NML text), status, createdAt
```

> JSON 配列フィールドは DB 上は `TEXT`。Drizzle で取得すると文字列なので `JSON.parse()` が必要。  
> Drizzle には必ず **camelCase** プロパティ名でデータを渡すこと（snake_case に変換しない）。

---

## 7. その他の注意事項

- **`/api/admin/novels` の `chapterCount`** は published 章のみ、`totalChapterCount` は全章（draft含む）を返す（M-2 修正後の仕様）
- **スナップショット**は DB でなくサーバーの `.snapshots/` ディレクトリにファイル保存。tmp→rename のアトミック書き込みで競合防止済み
- **`params` は Promise** — Next.js 16 系では `const { id } = await params;` とすること
- **`app/admin/editor/page.tsx`** は `useSearchParams` を使うため `<Suspense>` でラップ済み。`EditorContent` が実体コンポーネント
- **管理API呼び出しは必ず `adminFetch()`** を使うこと（`lib/admin-fetch.ts`）。素の `fetch()` を使うと 401 になる
