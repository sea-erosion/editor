// 編集日時: 2026-05-03 (fix: serializeBody camelCase保持、JSON配列フィールド直列化)
import { db } from "@/db/client";
import { anomalies, facilities, incidents, modules, personnel } from "@/db/schema";
import { NextRequest, NextResponse } from "next/server";

const TABLE_MAP = {
  anomaly:   anomalies,
  module:    modules,
  incident:  incidents,
  facility:  facilities,
  personnel: personnel,
} as const;

type TableKey = keyof typeof TABLE_MAP;

function isConstraintError(error: unknown) {
  return error instanceof Error && (error.message.includes("UNIQUE") || error.message.includes("SQLITE_CONSTRAINT"));
}

// JSON配列・オブジェクトフィールドを文字列化し、camelCaseキーはそのまま保持する
// (Drizzle は camelCase プロパティ名でカラムをマッピングする)
function serializeBody(body: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (v === undefined || v === null || v === "") continue;
    out[k] = Array.isArray(v)
      ? JSON.stringify(v)
      : typeof v === "object"
      ? JSON.stringify(v)
      : v;
  }
  return out;
}

// GET /api/admin/entities?type=anomaly&q=キーワード&full=1
export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type") as TableKey;
  const q    = req.nextUrl.searchParams.get("q")?.toLowerCase() ?? "";
  const full = req.nextUrl.searchParams.get("full") === "1";

  if (!type || !TABLE_MAP[type]) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  try {
    let rows = await db.select().from(TABLE_MAP[type]) as Array<Record<string, unknown>>;

    if (q) {
      rows = rows.filter((r) =>
        String(r.id ?? "").toLowerCase().includes(q) ||
        String(r.name ?? "").toLowerCase().includes(q)
      );
    }

    const result = full
      ? rows
      : rows.map((r) => ({ id: r.id, name: r.name }));

    return NextResponse.json(result);
  } catch (e) {
    console.error("[GET /api/admin/entities]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/admin/entities?type=anomaly
export async function POST(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type") as TableKey;
  if (!type || !TABLE_MAP[type]) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  try {
    const body = await req.json() as Record<string, unknown>;
    const values = serializeBody(body);

    if (!values.id || !values.name) {
      return NextResponse.json({ error: "id と name は必須です" }, { status: 400 });
    }

    await db.insert(TABLE_MAP[type] as never).values(values as never);

    const created = await db.select().from(TABLE_MAP[type]);
    const record = (created as Array<Record<string, unknown>>).find((r) => r.id === values.id);
    return NextResponse.json(record ?? { ok: true }, { status: 201 });
  } catch (e) {
    if (isConstraintError(e)) {
      return NextResponse.json({ error: "そのIDは既に使用されています" }, { status: 409 });
    }
    console.error("[POST /api/admin/entities]", e);
    return NextResponse.json({ error: "Internal server error", detail: String(e) }, { status: 500 });
  }
}
