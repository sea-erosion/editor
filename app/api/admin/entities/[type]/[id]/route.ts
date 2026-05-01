import { db } from "@/db/client";
import { anomalies, facilities, incidents, modules, personnel } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

const TABLE_MAP = { anomaly: anomalies, module: modules, incident: incidents, facility: facilities, personnel } as const;

const INTEGER_COLUMNS = new Set(["clearance", "capacity"]);

function serializeValue(k: string, v: unknown): unknown {
  if (v === null || v === undefined) return null;
  if (Array.isArray(v)) return JSON.stringify(v);
  if (typeof v === "object") return JSON.stringify(v);
  if (INTEGER_COLUMNS.has(k)) {
    const n = Number(v);
    return isNaN(n) ? null : n;
  }
  return v;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ type: string; id: string }> }) {
  const { type, id } = await params;
  const table = TABLE_MAP[type as keyof typeof TABLE_MAP];
  if (!table) return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  const body = await req.json();
  const serialized: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    const sv = serializeValue(k, v);
    if (sv !== null) serialized[k] = sv;
  }
  await db.update(table as any).set(serialized).where(eq((table as any).id, id));
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ type: string; id: string }> }) {
  const { type, id } = await params;
  const table = TABLE_MAP[type as keyof typeof TABLE_MAP];
  if (!table) return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  await db.delete(table as any).where(eq((table as any).id, id));
  return NextResponse.json({ ok: true });
}
