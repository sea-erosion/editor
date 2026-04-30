import { db } from "@/db/client";
import { chapters, novels } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// GET /api/admin/novels — list all novels with chapter count
export async function GET() {
  try {
    const all = await db.select().from(novels).orderBy(novels.createdAt);
    const withCounts = await Promise.all(
      all.map(async (n) => {
        const chs = await db.select().from(chapters).where(eq(chapters.novelId, n.id));
        return { ...n, chapterCount: chs.length };
      })
    );
    return NextResponse.json(withCounts);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/admin/novels — create novel
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, slug, author, summary, classification, clearanceRequired } = body;
    if (!title || !slug || !author) {
      return NextResponse.json({ error: "title, slug, author are required" }, { status: 400 });
    }
    const id = `novel-${Date.now()}`;
    await db.insert(novels).values({
      id,
      title,
      slug,
      author,
      summary: summary || null,
      classification: classification || "Narrative",
      clearanceRequired: clearanceRequired || 0,
      status: "draft",
    });
    const created = await db.select().from(novels).where(eq(novels.id, id));
    return NextResponse.json(created[0], { status: 201 });
  } catch (e: any) {
    if (e?.message?.includes("UNIQUE")) {
      return NextResponse.json({ error: "スラッグが既に使用されています" }, { status: 409 });
    }
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
