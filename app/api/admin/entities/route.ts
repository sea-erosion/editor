// 編集日時: 2026-04-28
import { db } from "@/db/client";
import { anomalies, facilities, incidents, modules, personnel } from "@/db/schema";
import { NextRequest, NextResponse } from "next/server";

const TABLE_MAP = { anomaly: anomalies, module: modules, incident: incidents, facility: facilities, personnel } as const;

// GET /api/admin/entities?type=anomaly&q=検索ワード
// エディタのエンティティパレット用にq=で絞り込み対応を追加
export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type") as keyof typeof TABLE_MAP;
  const q    = req.nextUrl.searchParams.get("q")?.toLowerCase() ?? "";

  if (!type || !TABLE_MAP[type]) return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  try {
    const rows = await db.select().from(TABLE_MAP[type] as any) as Array<{ id: string; name: string; [k: string]: unknown }>;
    const filtered = q
      ? rows.filter((r) =>
          r.id.toLowerCase().includes(q) || r.name.toLowerCase().includes(q)
        )
      : rows;
    // パレット表示に必要な id と name だけを返す（軽量化）
    const lite = filtered.map((r) => ({ id: r.id, name: r.name }));
    return NextResponse.json(lite);
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/admin/entities — create entity
export async function POST(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type") as keyof typeof TABLE_MAP;
  if (!type || !TABLE_MAP[type]) return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  try {
    const body = await req.json();
    const serialized: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(body)) {
      serialized[k] = Array.isArray(v) ? JSON.stringify(v) : (typeof v === "object" && v !== null) ? JSON.stringify(v) : v;
    }
    await db.insert(TABLE_MAP[type] as any).values(serialized);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e: any) {
    if (e?.message?.includes("UNIQUE")) return NextResponse.json({ error: "IDが既に使用されています" }, { status: 409 });
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
