<!-- BEGIN:nextjs-agent-rules -->
# このプロジェクトで作業する前に必ず読むこと

## フレームワーク・バージョン

- **Next.js 16.2.4** (App Router) — 学習データと異なるAPIや慣習がある可能性がある
- **React 19.2.4** — 一部 API が変更されている
- **Drizzle ORM 0.45** — クエリAPIの変更に注意
- **Tailwind CSS v4** — 設定ファイル・ユーティリティクラス体系がv3と大きく異なる

コードを書く前に `node_modules/next/dist/docs/` 内のガイドを確認すること。deprecation 警告は無視しない。

## 必須の注意事項

### params は必ず await する
Next.js 16 では動的ルートの `params` が `Promise` になった。

```typescript
// ✅ 正しい
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
}

// ❌ 誤り（型エラー・実行時エラー）
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
}
```

### Drizzle には camelCase で渡す
Drizzle ORM はスキーマの JS プロパティ名（camelCase）でカラムをマッピングする。snake_case に変換して渡さないこと。

```typescript
// ✅ 正しい
await db.insert(chapters).values({ novelId: "...", chapterNumber: 1 });

// ❌ 誤り（カラムにマッピングされず silent に無視される）
await db.insert(chapters).values({ novel_id: "...", chapter_number: 1 });
```

### useSearchParams は Suspense でラップする
`useSearchParams()` を使うコンポーネントは `<Suspense>` でラップすること。

```typescript
export default function Page() {
  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <PageContent />
    </Suspense>
  );
}
function PageContent() {
  const searchParams = useSearchParams(); // ここで使う
  ...
}
```

### 管理APIには必ず認証ヘッダーを付ける
`/api/admin/**` へのリクエストには `Authorization: Bearer {ADMIN_TOKEN}` ヘッダーが必要。
フロントからは `lib/admin-fetch.ts` のラッパー関数を使うこと（未実装の場合は作成すること）。

## NML 記法追加時のチェックリスト

新しいタグを追加するときは**必ず以下の4か所すべて**を修正する：

- [ ] `types/index.ts` — `TokenType` ユニオン型に追加
- [ ] `lib/markup-parser.ts` — `blockPatterns` または `INLINE_PATTERNS` にパターン追加
- [ ] `components/novel/NovelRenderer.tsx` — `switch` に `case` 追加
- [ ] `lib/nml-highlight.ts` — シンタックスハイライトパターン追加

ブロック記法の場合は `components/novel/` に新規コンポーネントファイルも作成すること。

## JSON フィールドの扱い

DB の `tags`, `specifications`, `relatedAnomalies` などは SQLite 上では `TEXT`。
Drizzle で取得した値は文字列なので、使う前に `JSON.parse()` すること。
書き込む前は `JSON.stringify()` すること。
<!-- END:nextjs-agent-rules -->
