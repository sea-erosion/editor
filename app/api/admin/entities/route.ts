// 編集日時: 2026-04-28
import { db } from "@/db/client";
import { anomalies, facilities, incidents, modules, personnel } from "@/db/schema";
import { NextRequest, NextResponse } from "next/server";

const TABLE_MAP = { anomaly: anomalies, module: modules, incident: incidents, facility: facilities, personnel } as const;

// GET /api/admin/entities?type=anomaly&q=検索ワード&lite=1
// lite=1 のときはエディタパレット用に id,name のみ返す（省略時は全フィールド返す）
export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type") as keyof typeof TABLE_MAP;
  const q    = req.nextUrl.searchParams.get("q")?.toLowerCase() ?? "";
  const lite = req.nextUrl.searchParams.get("lite") === "1";

  if (!type || !TABLE_MAP[type]) return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  try {
    const rows = await db.select().from(TABLE_MAP[type] as any) as Array<{ id: string; name: string; [k: string]: unknown }>;
    const filtered = q
      ? rows.filter((r) =>
          r.id.toLowerCase().includes(q) || r.name.toLowerCase().includes(q)
        )
      : rows;
    // lite=1 のときのみ id,name に絞る（エディタパレット用）
    const result = lite ? filtered.map((r) => ({ id: r.id, name: r.name })) : filtered;
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// integer型カラム名のセット（スキーマに合わせて定義）
const INTEGER_COLUMNS = new Set(["clearance", "capacity"]);

function serializeValue(k: string, v: unknown): unknown {
  if (v === null || v === undefined) return null;
  if (Array.isArray(v)) return JSON.stringify(v);
  if (typeof v === "object") return JSON.stringify(v);
  // integer列は必ず数値へ変換
  if (INTEGER_COLUMNS.has(k)) {
    const n = Number(v);
    return isNaN(n) ? null : n;
  }
  return v;
}

// POST /api/admin/entities — create entity
export async function POST(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type") as keyof typeof TABLE_MAP;
  if (!type || !TABLE_MAP[type]) return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  try {
    const body = await req.json();
    const serialized: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(body)) {
      const sv = serializeValue(k, v);
      // null値は送らない（DBのDEFAULT/NULLに任せる）
      if (sv !== null) serialized[k] = sv;
    }
    await db.insert(TABLE_MAP[type] as any).values(serialized);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e: any) {
    if (e?.message?.includes("UNIQUE")) return NextResponse.json({ error: "IDが既に使用されています" }, { status: 409 });
    console.error(e);
    return NextResponse.json({ error: "Internal server error", detail: e?.message }, { status: 500 });
  }
}
