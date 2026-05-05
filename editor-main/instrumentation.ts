// 編集日時: 2026-05-03 (fix: runSeed 失敗時にエラーログを出してアプリを起動継続)
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      const { runSeed } = await import("./db/seed");
      await runSeed();
    } catch (e) {
      console.error("[instrumentation] runSeed failed (continuing app startup):", e);
    }
  }
}
