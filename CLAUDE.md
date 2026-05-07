@AGENTS.md

---

## プロジェクト概要

SCP 財団風の世界観を持つ Web 小説プラットフォーム。  
管理者が NML (Novel Markup Language) で小説を執筆し、エンティティ（異常物体・施設・人物など）をデータベースで管理して本文中からインタラクティブに参照できる。

読者向けの公開サイトと、管理者向けの執筆・管理画面の2層構成。

---

## NML タグ命名規約

### エンティティタグ（本文中の参照タグ）

| 本文タグ名 | Parser `TokenType` | EntityType | APIパス |
|---|---|---|---|
| `[ANOMALY\|ID\|ラベル]` | `anomaly_tag` | `anomaly` | `/api/entities/anomaly/{id}` |
| `[MODULE\|ID\|ラベル]` | `module_tag` | `module` | `/api/entities/module/{id}` |
| `[INCIDENT\|ID\|ラベル]` | `incident_tag` | `incident` | `/api/entities/incident/{id}` |
| `[FACILITY\|ID\|ラベル]` | `facility_tag` | `facility` | `/api/entities/facility/{id}` |
| **`[PERSON\|ID\|ラベル]`** | `personnel_tag` | `personnel` | `/api/entities/personnel/{id}` |

> ⚠️ 本文タグ名は `PERSON`（5文字）だが、DBテーブル名・EntityType・APIパス・型定義ではすべて `personnel` を使う。混同しないこと。

### 管理API エンドポイント

```
GET/POST   /api/admin/entities?type={type}
GET/PATCH/DELETE /api/admin/entities/{type}/{id}
GET/POST   /api/admin/novels
GET/PATCH/DELETE /api/admin/novels/{id}
GET/POST   /api/admin/chapters?novelId={id}
GET/PATCH/DELETE /api/admin/chapters/{id}
GET/POST   /api/admin/chapters/{id}/snapshots
GET/PATCH  /api/admin/chapters/{id}/memo
POST       /api/admin/chapters/reorder
GET        /api/admin/search?q={query}
GET        /api/admin/stats
GET/POST   /api/admin/backup
GET        /api/admin/entities/usages?entityId={id}&type={type}
```

すべての `/api/admin/**` エンドポイントは `Authorization: Bearer {ADMIN_TOKEN}` ヘッダーが必要（要実装 — `middleware.ts` 参照）。

---

## 既知のバグ修正履歴（2026-05-03）

以下は修正済み。同じ問題を再導入しないこと。

| バグ | 修正内容 |
|---|---|
| `serializeBody` が snake_case に変換して Drizzle のマッピングが壊れる | `toSnake()` 削除・camelCase を直接渡すよう変更 |
| 章 PATCH 後に `novels.updatedAt` が更新されない | PATCH 後に親 novel の `updatedAt` を更新するよう追加 |
| インラインタグが段落の外に切り離される | `NovelRenderer` をインライン要素を段落バッファに積む方式に変更 |
| `chapterNumber` 重複チェックなし | POST 前に重複確認・409 返却を追加 |
| ブロック内のネストタグが解析されない | `parseInlineSegment` を独立関数化してブロック後テキストにも適用 |
| `EntityPopup` の位置計算で DOM 更新前の値を参照 | `getBoundingClientRect` を `requestAnimationFrame` 内に移動 |
| export で `[A\|テキスト]`（話者省略形）が変換されない | 正規表現を話者フィールド optional に修正 |
| `scheduleAutosave` の stale closure | `selectedChapter` を `useRef` で追跡するよう変更 |
| `chapterCount` が draft 章も含む | published 章のみカウント・`totalChapterCount` を別途返す |
| スナップショットの並行書き込み競合 | tmp ファイル → `renameSync` のアトミック書き込みに変更 |
| draft 章が公開ページに表示される | `status = "published"` フィルターを追加 |
| Tab キーによるフォーカストラップ | `Shift+Tab` はデフォルト動作を許可・`Escape` でブラー追加 |
| 検索結果の「編集」リンクが特定章に遷移しない | `?novelId=&chapterId=` を URL に付与・エディタ側で初期選択を復元 |
| `runSeed` 失敗でサイレントクラッシュ | `try-catch` でラップしてエラーログ出力・起動継続 |
| バックアップインポート時の timestamp 型不一致 | ISO文字列 → UNIX epoch（秒）変換を追加 |

| `/admin/**` ページに認証ガードなし（LoginGate未実装） | `middleware.ts` を拡張し Cookie でサーバーサイド保護・`admin-fetch.ts` で 401 時自動リダイレクト |
| `NEXT_PUBLIC_ADMIN_TOKEN` がブラウザに公開される | 環境変数フォールバックを削除・localStorage + Cookie 方式に統一 |
| `/api/reactions` POST にレート制限なし | IP ベースのインメモリレート制限を追加（60秒/10件） |

---

## 認証フロー（2026-05-07 更新）

### ページ保護の仕組み

1. ログイン画面 (`/admin/login`) でトークンを入力
2. `saveAdminToken()` が localStorage + `admin_session` Cookie を設定
3. `middleware.ts` が `/admin/**` アクセス時に Cookie を検証し、不一致なら `/admin/login?from=...` へリダイレクト
4. `adminFetch()` が API リクエストに `Authorization: Bearer` を付与し、401 受信時はクリアして自動リダイレクト

### セキュリティ上の注意

- `NEXT_PUBLIC_ADMIN_TOKEN` は**使用禁止**（バンドルに埋め込まれる）
- Cookie は `SameSite=Strict` + HTTPS なら `Secure` 付き
- 本番環境では管理画面を IP 制限 / VPN 背後に配置することを強く推奨

---

## 未完了タスク

### 次のタスク: NML 記法の追加

ユーザーから追加したい記法をヒアリングして実装する。  
実装時は上記「NML タグ追加チェックリスト」（`AGENTS.md` 参照）に従うこと。
