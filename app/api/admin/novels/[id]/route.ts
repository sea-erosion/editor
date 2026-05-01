import { db } from "@/db/client";
import { novels } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// PATCH /api/admin/novels/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await req.json();
    const { title, slug, author, summary, classification, clearanceRequired, status } = body;
    await db.update(novels).set({
      ...(title !== undefined && { title }),
      ...(slug !== undefined && { slug }),
      ...(author !== undefined && { author }),
      ...(summary !== undefined && { summary }),
      ...(classification !== undefined && { classification }),
      ...(clearanceRequired !== undefined && { clearanceRequired }),
      ...(status !== undefined && { status }),
    }).where(eq(novels.id, id));
    const updated = await db.select().from(novels).where(eq(novels.id, id));
    return NextResponse.json(updated[0]);
  } catch (e: any) {
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
