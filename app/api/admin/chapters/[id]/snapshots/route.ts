// 編集日時: 2026-04-29
// スナップショットはsqliteの別テーブルではなくローカルJSONファイルで管理（DB変更不要）
import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const SNAP_DIR = join(process.cwd(), ".snapshots");
if (!existsSync(SNAP_DIR)) mkdirSync(SNAP_DIR, { recursive: true });

function snapPath(id: string) { return join(SNAP_DIR, `${id}.json`); }
function loadSnaps(id: string): Array<{ ts: number; title: string; content: string }> {
  try { return JSON.parse(readFileSync(snapPath(id), "utf-8")); } catch { return []; }
}
function saveSnaps(id: string, snaps: Array<{ ts: number; title: string; content: string }>) {
  writeFileSync(snapPath(id), JSON.stringify(snaps));
}

// GET /api/admin/chapters/[id]/snapshots
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const snaps = loadSnaps(id).map((s) => ({ ts: s.ts, title: s.title, preview: s.content.slice(0, 80) }));
  return NextResponse.json(snaps.reverse());
}

// POST /api/admin/chapters/[id]/snapshots — save snapshot
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { title, content } = await req.json();
  const snaps = loadSnaps(id);
  snaps.push({ ts: Date.now(), title, content });
  // 最大20件保持
  if (snaps.length > 20) snaps.splice(0, snaps.length - 20);
  saveSnaps(id, snaps);
  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/chapters/[id]/snapshots?ts=xxx — restore snapshot (returns content)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ts = parseInt(req.nextUrl.searchParams.get("ts") ?? "0", 10);
  const snaps = loadSnaps(id);
  const snap = snaps.find((s) => s.ts === ts);
  if (!snap) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ content: snap.content, title: snap.title });
}
