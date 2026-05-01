// 編集日時: 2026-04-29
/**
 * GET  /api/admin/backup        → 全データをJSON形式で書き出し（ダウンロード）
 * POST /api/admin/backup        → JSONを受け取ってDBに一括書き込み（インポート）
 *   body: { mode: "merge" | "replace", data: BackupData }
 *   - replace: 全テーブルを削除してから挿入
 *   - merge:   IDが衝突しない場合のみ挿入（既存データを保持）
 */
import { db } from "@/db/client";
import { anomalies, chapters, facilities, incidents, modules, novels, personnel } from "@/db/schema";
import { NextRequest, NextResponse } from "next/server";

const TABLES = { anomalies, modules, incidents, facilities, personnel, novels, chapters } as const;
type TableKey = keyof typeof TABLES;

// ── エクスポート ─────────────────────────────────────────────────────
export async function GET() {
  try {
    const [ano, mod, inc, fac, per, nov, cha] = await Promise.all([
      db.select().from(anomalies),
      db.select().from(modules),
      db.select().from(incidents),
      db.select().from(facilities),
      db.select().from(personnel),
      db.select().from(novels),
      db.select().from(chapters),
    ]);

    const backup = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      counts: { anomalies: ano.length, modules: mod.length, incidents: inc.length, facilities: fac.length, personnel: per.length, novels: nov.length, chapters: cha.length },
      data: { anomalies: ano, modules: mod, incidents: inc, facilities: fac, personnel: per, novels: nov, chapters: cha },
    };

    const filename = `scp-archive-backup-${new Date().toISOString().slice(0, 10)}.json`;
    return new NextResponse(JSON.stringify(backup, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}

// ── インポート ───────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { mode: "merge" | "replace"; data: Record<TableKey, unknown[]> };
    const { mode, data } = body;

    if (!data || typeof data !== "object") {
      return NextResponse.json({ error: "data field required" }, { status: 400 });
    }

    const ORDER: TableKey[] = ["anomalies", "modules", "incidents", "facilities", "personnel", "novels", "chapters"];
    const REVERSE: TableKey[] = [...ORDER].reverse();

    const results: Record<string, { inserted: number; skipped: number }> = {};

    if (mode === "replace") {
      // 外部キー依存順に削除
      for (const key of REVERSE) {
        await db.delete(TABLES[key] as any);
      }
    }

    for (const key of ORDER) {
      const rows = data[key];
      if (!Array.isArray(rows) || rows.length === 0) { results[key] = { inserted: 0, skipped: 0 }; continue; }

      let inserted = 0; let skipped = 0;
      for (const row of rows) {
        try {
          // timestamp列とnull値は除外してDBのDEFAULTに任せる
          const TIMESTAMP_KEYS = new Set(["createdAt", "updatedAt", "created_at", "updated_at"]);
          const INTEGER_COLS = new Set(["clearance", "capacity", "clearanceRequired", "chapterNumber"]);
          const serialized: Record<string, unknown> = {};
          for (const [k, v] of Object.entries(row as Record<string, unknown>)) {
            if (TIMESTAMP_KEYS.has(k)) continue; // DBのDEFAULT(unixepoch())に任せる
            if (v === null || v === undefined) continue;
            if (Array.isArray(v)) { serialized[k] = JSON.stringify(v); continue; }
            if (typeof v === "object") { serialized[k] = JSON.stringify(v); continue; }
            if (INTEGER_COLS.has(k)) { const n = Number(v); if (!isNaN(n)) serialized[k] = n; continue; }
            serialized[k] = v;
          }
          await db.insert(TABLES[key] as any).values(serialized);
          inserted++;
        } catch (e: any) {
          if (e?.message?.includes("UNIQUE") || e?.message?.includes("SQLITE_CONSTRAINT")) {
            skipped++;
          } else {
            throw e;
          }
        }
      }
      results[key] = { inserted, skipped };
    }

    return NextResponse.json({ ok: true, mode, results });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Import failed", detail: String(e) }, { status: 500 });
  }
}
