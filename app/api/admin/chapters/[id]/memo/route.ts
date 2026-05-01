// 編集日時: 2026-04-29
import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const MEMO_DIR = join(process.cwd(), ".memos");
if (!existsSync(MEMO_DIR)) mkdirSync(MEMO_DIR, { recursive: true });

function memoPath(id: string) { return join(MEMO_DIR, `${id}.txt`); }

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try { return NextResponse.json({ memo: readFileSync(memoPath(id), "utf-8") }); }
  catch { return NextResponse.json({ memo: "" }); }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { memo } = await req.json();
  writeFileSync(memoPath(id), memo ?? "");
  return NextResponse.json({ ok: true });
}
