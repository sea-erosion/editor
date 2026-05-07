// 編集日時: 2026-05-07 (fix: BUG-5 小説PATCH時にupdatedAtを更新 / fix P-3: スラッグバリデーション / fix P-6: UNIQUE違反を409で返す)
import { db } from "@/db/client";
import { novels } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

/** URL安全なスラッグ: 英小文字・数字・ハイフンのみ、先頭と末尾はハイフン不可 */
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// PATCH /api/admin/novels/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await req.json();
    const { title, slug, author, summary, classification, clearanceRequired, status } = body;

    // スラッグが含まれる場合はフォーマット検証 (P-3)
    if (slug !== undefined && !SLUG_RE.test(slug)) {
      return NextResponse.json(
        { error: "スラッグは英小文字・数字・ハイフンのみ使用できます（例: my-novel-01）" },
        { status: 400 }
      );
    }

    await db.update(novels).set({
      ...(title !== undefined && { title }),
      ...(slug !== undefined && { slug }),
      ...(author !== undefined && { author }),
      ...(summary !== undefined && { summary }),
      ...(classification !== undefined && { classification }),
      ...(clearanceRequired !== undefined && { clearanceRequired }),
      ...(status !== undefined && { status }),
      updatedAt: new Date(),
    }).where(eq(novels.id, id));
    const updated = await db.select().from(novels).where(eq(novels.id, id));
    return NextResponse.json(updated[0]);
  } catch (e: any) {
    // UNIQUE制約違反（スラッグ重複）は 409 を返す (P-6)
    if (e?.message?.includes("UNIQUE")) {
      return NextResponse.json({ error: "スラッグが既に使用されています" }, { status: 409 });
    }
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/admin/novels/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await db.delete(novels).where(eq(novels.id, id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
