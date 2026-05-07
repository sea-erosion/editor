// 編集日時: 2026-04-29
import { db } from "@/db/client";
import { chapters, novels } from "@/db/schema";
import { NextRequest, NextResponse } from "next/server";

// GET /api/admin/entities/usages?id=SCP-0048
// 指定エンティティIDが本文中に登場する章一覧を返す
export async function GET(req: NextRequest) {
  const entityId = req.nextUrl.searchParams.get("id")?.trim() ?? "";
  if (!entityId) return NextResponse.json({ error: "id required" }, { status: 400 });
  try {
    const allChapters = await db.select().from(chapters);
    const allNovels = await db.select({ id: novels.id, title: novels.title, slug: novels.slug }).from(novels);
    const novelMap = Object.fromEntries(allNovels.map((n) => [n.id, n]));
    const results = allChapters
      .filter((ch) => ch.content.includes(`|${entityId}|`))
      .map((ch) => ({
        chapterId: ch.id, chapterNumber: ch.chapterNumber, chapterTitle: ch.title,
        novelId: ch.novelId, novelTitle: novelMap[ch.novelId]?.title ?? "",
        novelSlug: novelMap[ch.novelId]?.slug ?? "",
      }));
    return NextResponse.json(results);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
