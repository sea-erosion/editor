import { db } from "@/db/client";
import { chapters, novels } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    const novelRows = await db.select().from(novels).where(eq(novels.slug, slug));
    if (!novelRows[0]) {
      return NextResponse.json({ error: "Novel not found" }, { status: 404 });
    }
    const novel = novelRows[0];
    const chapterRows = await db
      .select()
      .from(chapters)
      .where(eq(chapters.novelId, novel.id))
      .orderBy(chapters.chapterNumber);

    return NextResponse.json({ novel, chapters: chapterRows });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
