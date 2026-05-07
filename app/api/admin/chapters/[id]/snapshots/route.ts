// 編集日時: 2026-05-07 (fix P-1: パストラバーサル脆弱性 — ID バリデーション + resolve チェック追加)
import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync } from "fs";
import { NextRequest, NextResponse } from "next/server";
import { join, resolve, sep } from "path";
import { randomBytes } from "crypto";

const SNAP_DIR = join(process.cwd(), ".snapshots");
if (!existsSync(SNAP_DIR)) mkdirSync(SNAP_DIR, { recursive: true });

type Snap = { ts: number; title: string; content: string };

/** ID を英数字・ハイフン・アンダースコアのみに制限し、パストラバーサルを防ぐ */
function safeSnapPath(id: string): string {
  if (!/^[\w-]+$/.test(id)) throw new Error("Invalid chapter id");
  const resolved = resolve(SNAP_DIR, `${id}.json`);
  // SNAP_DIR の外を指していないか確認
  if (!resolved.startsWith(SNAP_DIR + sep) && resolved !== SNAP_DIR) {
    throw new Error("Path traversal detected");
  }
  return resolved;
}

function load(id: string): Snap[] {
  try { return JSON.parse(readFileSync(safeSnapPath(id), "utf-8")); } catch { return []; }
}

/** アトミック書き込み: 一時ファイルに書いてからリネーム */
function save(id: string, snaps: Snap[]) {
  const path = safeSnapPath(id);
  const tmp = path + `.${randomBytes(4).toString("hex")}.tmp`;
  try {
    writeFileSync(tmp, JSON.stringify(snaps));
    renameSync(tmp, path);
  } catch (e) {
    try { if (existsSync(tmp)) writeFileSync(path, JSON.stringify(snaps)); } catch {}
    throw e;
  }
}

// GET /api/admin/chapters/[id]/snapshots           → 一覧
// GET /api/admin/chapters/[id]/snapshots?ts=N      → 指定スナップのcontent取得（復元用）
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
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
  } catch (e: any) {
    if (e?.message?.includes("Invalid") || e?.message?.includes("traversal")) {
      return NextResponse.json({ error: "Invalid chapter id" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/admin/chapters/[id]/snapshots → 保存
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { title, content } = await req.json();
    const snaps = load(id);
    snaps.push({ ts: Date.now(), title, content });
    if (snaps.length > 20) snaps.splice(0, snaps.length - 20);
    save(id, snaps);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e?.message?.includes("Invalid") || e?.message?.includes("traversal")) {
      return NextResponse.json({ error: "Invalid chapter id" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/admin/chapters/[id]/snapshots?ts=N → 指定スナップを削除
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const ts = parseInt(req.nextUrl.searchParams.get("ts") ?? "0", 10);
    const snaps = load(id).filter((s) => s.ts !== ts);
    save(id, snaps);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e?.message?.includes("Invalid") || e?.message?.includes("traversal")) {
      return NextResponse.json({ error: "Invalid chapter id" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
