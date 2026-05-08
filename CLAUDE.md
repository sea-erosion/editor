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
GET/POST         /api/admin/entities?type={type}
GET/PATCH/DELETE /api/admin/entities/{type}/{id}
GET/POST         /api/admin/novels
GET/PATCH/DELETE /api/admin/novels/{id}
GET/POST         /api/admin/chapters?novelId={id}
GET/PATCH/DELETE /api/admin/chapters/{id}
GET/POST         /api/admin/chapters/{id}/snapshots
GET/PATCH        /api/admin/chapters/{id}/memo
POST             /api/admin/chapters/reorder
GET              /api/admin/search?q={query}
GET              /api/admin/stats
GET/POST         /api/admin/backup
GET              /api/admin/entities/usages?entityId={id}&type={type}
POST             /api/admin/login
POST             /api/admin/logout
```

すべての `/api/admin/**` エンドポイントは Cookie 認証（`admin_session`）が必要。  
フロントからは必ず `lib/admin-fetch.ts` の `adminFetch()` を使うこと。

---

## 認証フロー

1. `/admin/login` でトークンを入力
2. `POST /api/admin/login` が検証し HttpOnly Cookie (`admin_session`) を発行
3. `middleware.ts` が `/admin/**` および `/api/admin/**` を Cookie で保護
4. `adminFetch()` が API リクエストに `Authorization: Bearer` を付与し、401 受信時は自動リダイレクト
5. ログアウトは `POST /api/admin/logout` で Cookie を削除

### セキュリティ上の注意

- `NEXT_PUBLIC_ADMIN_TOKEN` は**使用禁止**（バンドルに埋め込まれる）
- Cookie は `SameSite=Strict` + HTTPS なら `Secure` 付き
- 本番環境では管理画面を IP 制限 / VPN 背後に配置することを強く推奨
