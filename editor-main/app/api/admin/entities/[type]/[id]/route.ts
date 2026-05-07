// 編集日時: 2026-05-03 (fix: serializeBody camelCase保持)
import { db } from "@/db/client";
import { anomalies, facilities, incidents, modules, personnel } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

const TABLE_MAP = {
  anomaly:   anomalies,
  module:    modules,
  incident:  incidents,
  facility:  facilities,
  personnel: personnel,
} as const;

type TableKey = keyof typeof TABLE_MAP;
type EntityTableWithId = (typeof TABLE_MAP)[TableKey] & { id: typeof anomalies.id };

// camelCaseキーを保持したまま JSON配列・オブジェクトのみ文字列化
function serializeBody(body: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (v === undefined) continue;
    out[k] = Array.isArray(v)
      ? JSON.stringify(v)
      : typeof v === "object" && v !== null
      ? JSON.stringify(v)
      : v;
  }
  return out;
}

// GET /api/admin/entities/[type]/[id] — 単体取得
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  const { type, id } = await params;
  const table = TABLE_MAP[type as TableKey] as EntityTableWithId;
  if (!table) return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  try {
    const rows = await db.select().from(table).where(eq(table.id, id));
    if (!rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch (e) {
    console.error("[GET entity]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/admin/entities/[type]/[id] — 更新
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  const { type, id } = await params;
  const table = TABLE_MAP[type as TableKey] as EntityTableWithId;
  if (!table) return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  try {
    const body = await req.json() as Record<string, unknown>;
    // id は変更不可なので除外
    const rest = { ...body };
    delete rest.id;
    const values = serializeBody(rest);
    if (Object.keys(values).length === 0) {
      return NextResponse.json({ error: "更新するフィールドがありません" }, { status: 400 });
    }
    await db.update(table as never).set(values as never).where(eq(table.id, id));
    const rows = await db.select().from(table).where(eq(table.id, id));
    return NextResponse.json(rows[0] ?? { ok: true });
  } catch (e) {
    console.error("[PATCH entity]", e);
    return NextResponse.json({ error: "Internal server error", detail: String(e) }, { status: 500 });
  }
}

// DELETE /api/admin/entities/[type]/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  const { type, id } = await params;
  const table = TABLE_MAP[type as TableKey] as EntityTableWithId;
  if (!table) return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  try {
    await db.delete(table as never).where(eq(table.id, id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[DELETE entity]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
