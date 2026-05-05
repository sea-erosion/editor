// 編集日時: 2026-05-05
import { db } from "@/db/client";
import { anomalies, chapters, facilities, incidents, modules, novels, personnel } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

function bodyChars(content: string) {
  return content.replace(/\[[^\]]*\]/g, "").replace(/\s/g, "").length;
}

export async function GET() {
  try {
    const [novs, chs, anos, mods, incs, facs, pers, rxns] = await Promise.all([
      db.select().from(novels),
      db.select().from(chapters),
      db.select({ id: anomalies.id }).from(anomalies),
      db.select({ id: modules.id }).from(modules),
      db.select({ id: incidents.id }).from(incidents),
      db.select({ id: facilities.id }).from(facilities),
      db.select({ id: personnel.id }).from(personnel),
      db.select().from(reactions).orderBy(desc(reactions.createdAt)),
    ]);

    const novelStats = novs.map((n) => {
      const novelChapters = chs.filter((c) => c.novelId === n.id);
      const totalChars = novelChapters.reduce((acc, c) => acc + bodyChars(c.content), 0);
      const published = novelChapters.filter((c) => c.status === "published").length;
      const draft = novelChapters.filter((c) => c.status === "draft").length;
      const chapterHistory = novelChapters
        .sort((a, b) => a.chapterNumber - b.chapterNumber)
        .map((c) => ({ num: c.chapterNumber, chars: bodyChars(c.content), title: c.title }));
      return { id: n.id, title: n.title, slug: n.slug, status: n.status, totalChars, published, draft, chapterHistory, updatedAt: n.updatedAt };
    });

    // reactions 集計 (2026-05-05)
    const emojiCounts: Record<string, number> = {};
    for (const r of rxns) {
      emojiCounts[r.emoji] = (emojiCounts[r.emoji] ?? 0) + 1;
    }
    const recentComments = rxns
      .filter((r) => r.comment && r.comment.trim())
      .slice(0, 50)
      .map((r) => ({
        id: r.id,
        novelId: r.novelId,
        chapterId: r.chapterId,
        emoji: r.emoji,
        comment: r.comment,
        createdAt: r.createdAt,
        novelTitle: novs.find((n) => n.id === r.novelId)?.title ?? r.novelId,
        chapterTitle: chs.find((c) => c.id === r.chapterId)?.title ?? null,
      }));

    return NextResponse.json({
      novels: novelStats,
      totalNovels: novs.length,
      totalChapters: chs.length,
      totalChars: chs.reduce((acc, c) => acc + bodyChars(c.content), 0),
      entities: { anomaly: anos.length, module: mods.length, incident: incs.length, facility: facs.length, personnel: pers.length },
      reactions: { total: rxns.length, emojiCounts, recentComments },
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
