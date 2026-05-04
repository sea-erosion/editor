import { db } from "@/db/client";
import { chapters, novels } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// GET single chapter
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rows = await db.select().from(chapters).where(eq(chapters.id, id));
  if (!rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(rows[0]);
}

// PATCH chapter
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await req.json();
    const { title, chapterNumber, content, status } = body;
    await db.update(chapters).set({
      ...(title !== undefined && { title }),
      ...(chapterNumber !== undefined && { chapterNumber }),
      ...(content !== undefined && { content }),
      ...(status !== undefined && { status }),
    }).where(eq(chapters.id, id));
    const updated = await db.select().from(chapters).where(eq(chapters.id, id));
    if (!updated[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
    // 親 novel の updatedAt を更新
    await db.update(novels).set({ updatedAt: new Date() })
      .where(eq(novels.id, updated[0].novelId));
    return NextResponse.json(updated[0]);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE chapter
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.delete(chapters).where(eq(chapters.id, id));
  return NextResponse.json({ ok: true });
}
