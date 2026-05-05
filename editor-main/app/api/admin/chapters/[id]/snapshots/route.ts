// 編集日時: 2026-05-03 (fix: 並行書き込み競合をファイルロックで防止)
import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync } from "fs";
import { NextRequest, NextResponse } from "next/server";
import { join } from "path";
import { randomBytes } from "crypto";

const SNAP_DIR = join(process.cwd(), ".snapshots");
if (!existsSync(SNAP_DIR)) mkdirSync(SNAP_DIR, { recursive: true });

type Snap = { ts: number; title: string; content: string };
function snapPath(id: string) { return join(SNAP_DIR, `${id}.json`); }
function load(id: string): Snap[] { try { return JSON.parse(readFileSync(snapPath(id), "utf-8")); } catch { return []; } }

/** アトミック書き込み: 一時ファイルに書いてからリネーム */
function save(id: string, snaps: Snap[]) {
  const tmp = snapPath(id) + `.${randomBytes(4).toString("hex")}.tmp`;
  try {
    writeFileSync(tmp, JSON.stringify(snaps));
    renameSync(tmp, snapPath(id));
  } catch (e) {
    try { if (existsSync(tmp)) writeFileSync(snapPath(id), JSON.stringify(snaps)); } catch {}
    throw e;
  }
}

// GET /api/admin/chapters/[id]/snapshots           → 一覧
// GET /api/admin/chapters/[id]/snapshots?ts=N      → 指定スナップのcontent取得（復元用）
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ts = req.nextUrl.searchParams.get("ts");

  const snaps = load(id);
  if (ts) {
    const snap = snaps.find((s) => s.ts === parseInt(ts, 10));
    if (!snap) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ content: snap.content, title: snap.title });
  }
  return NextResponse.json(
    [...snaps].reverse().map((s) => ({ ts: s.ts, title: s.title, preview: s.content.slice(0, 80) }))
  );
}

// POST /api/admin/chapters/[id]/snapshots → 保存
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { title, content } = await req.json();
  const snaps = load(id);
  snaps.push({ ts: Date.now(), title, content });
  if (snaps.length > 20) snaps.splice(0, snaps.length - 20);
  save(id, snaps);
  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/chapters/[id]/snapshots?ts=N → 指定スナップを削除
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ts = parseInt(req.nextUrl.searchParams.get("ts") ?? "0", 10);
  const snaps = load(id).filter((s) => s.ts !== ts);
  save(id, snaps);
  return NextResponse.json({ ok: true });
}
