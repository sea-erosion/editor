// 編集日時: 2026-04-29
/**
 * Next.js Instrumentation Hook
 * next.config.ts に instrumentationHook: true が必要（Next.js 13.4+はデフォルト有効）
 *
 * ビルド後の初回起動時（サーバー側）に runSeed を呼び出す。
 * - DBが空なら初期データを投入
 * - 既にデータがあればスキップ（冪等）
 */
export async function register() {
  // Node.js ランタイム（サーバー側）のみで実行
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { runSeed } = await import("./db/seed");
    await runSeed();
  }
}
