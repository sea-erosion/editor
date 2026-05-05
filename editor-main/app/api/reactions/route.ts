// 編集日時: 2026-05-05
import { db } from "@/db/client";
import { chapters, novels, reactions } from "@/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

const ALLOWED_EMOJIS = ["❤️", "👍", "😭", "🔥", "✨", "😮", "👏", "💀"];
const MAX_COMMENT_LEN = 200;

// GET /api/reactions?novelId=xxx&chapterId=yyy
// → { counts: {emoji: n, ...}, recent: [...] }
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const novelId    = searchParams.get("novelId");
  const chapterId  = searchParams.get("chapterId");

  if (!novelId) {
    return NextResponse.json({ error: "novelId required" }, { status: 400 });
  }

  try {
    const where = chapterId
      ? and(eq(reactions.novelId, novelId), eq(reactions.chapterId, chapterId))
      : eq(reactions.novelId, novelId);

    const rows = await db.select().from(reactions).where(where).orderBy(desc(reactions.createdAt));

    // 絵文字ごとのカウント集計
    const counts: Record<string, number> = {};
    for (const emoji of ALLOWED_EMOJIS) counts[emoji] = 0;
    for (const r of rows) {
      if (counts[r.emoji] !== undefined) counts[r.emoji]++;
    }

    // コメント付きのもの（最新20件）
    const recent = rows
      .filter((r) => r.comment && r.comment.trim())
      .slice(0, 20)
      .map((r) => ({
        id: r.id,
        emoji: r.emoji,
        comment: r.comment,
        createdAt: r.createdAt,
      }));

    return NextResponse.json({ counts, recent });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/reactions
// body: { novelId, chapterId?, emoji, comment? }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { novelId, chapterId, emoji, comment } = body;

    // バリデーション
    if (!novelId || !emoji) {
      return NextResponse.json({ error: "novelId and emoji required" }, { status: 400 });
    }
    if (!ALLOWED_EMOJIS.includes(emoji)) {
      return NextResponse.json({ error: "Invalid emoji" }, { status: 400 });
    }
    if (comment && comment.length > MAX_COMMENT_LEN) {
      return NextResponse.json({ error: `Comment too long (max ${MAX_COMMENT_LEN})` }, { status: 400 });
    }

    // novelId の存在確認
    const novel = await db.select({ id: novels.id }).from(novels).where(eq(novels.id, novelId));
    if (!novel[0]) return NextResponse.json({ error: "Novel not found" }, { status: 404 });

    // chapterId があれば存在確認
    if (chapterId) {
      const ch = await db.select({ id: chapters.id }).from(chapters).where(eq(chapters.id, chapterId));
      if (!ch[0]) return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    const id = `rxn-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    await db.insert(reactions).values({
      id,
      novelId,
      chapterId: chapterId ?? null,
      emoji,
      comment: comment?.trim() || null,
    });

    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
