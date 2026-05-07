// 編集日時: 2026-05-07 (fix P-5: chapterNumber型バリデーション追加)
import { db } from "@/db/client";
import { chapters } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// GET /api/admin/chapters?novelId=xxx
export async function GET(req: NextRequest) {
  const novelId = req.nextUrl.searchParams.get("novelId");
  if (!novelId) return NextResponse.json({ error: "novelId required" }, { status: 400 });
  try {
    const chs = await db.select().from(chapters)
      .where(eq(chapters.novelId, novelId))
      .orderBy(chapters.chapterNumber);
    return NextResponse.json(chs);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/admin/chapters — create chapter
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { novelId, title, chapterNumber, content } = body;
    if (!novelId || !title || chapterNumber === undefined) {
      return NextResponse.json({ error: "novelId, title, chapterNumber required" }, { status: 400 });
    }
    // chapterNumber 型バリデーション (P-5)
    if (!Number.isInteger(chapterNumber) || chapterNumber < 1) {
      return NextResponse.json(
        { error: "chapterNumber は1以上の整数を指定してください" },
        { status: 400 }
      );
    }
    const id = `ch-${Date.now()}`;
    // 同一 novel 内で chapterNumber の重複を防ぐ
    const duplicate = await db.select().from(chapters)
      .where(and(eq(chapters.novelId, novelId), eq(chapters.chapterNumber, chapterNumber)));
    if (duplicate.length > 0) {
      return NextResponse.json({ error: `章番号 ${chapterNumber} は既に使用されています` }, { status: 409 });
    }
    await db.insert(chapters).values({
      id,
      novelId,
      title,
      chapterNumber,
      content: content || "",
      status: "draft",
    });
    const created = await db.select().from(chapters).where(eq(chapters.id, id));
    return NextResponse.json(created[0], { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
