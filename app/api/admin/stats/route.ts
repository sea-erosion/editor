// 編集日時: 2026-04-29
import { db } from "@/db/client";
import { anomalies, chapters, facilities, incidents, modules, novels, personnel } from "@/db/schema";
import { NextResponse } from "next/server";

function bodyChars(content: string) {
  return content.replace(/\[[^\]]*\]/g, "").replace(/\s/g, "").length;
}

export async function GET() {
  try {
    const [novs, chs, anos, mods, incs, facs, pers] = await Promise.all([
      db.select().from(novels),
      db.select().from(chapters),
      db.select({ id: anomalies.id }).from(anomalies),
      db.select({ id: modules.id }).from(modules),
      db.select({ id: incidents.id }).from(incidents),
      db.select({ id: facilities.id }).from(facilities),
      db.select({ id: personnel.id }).from(personnel),
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

    return NextResponse.json({
      novels: novelStats,
      totalNovels: novs.length,
      totalChapters: chs.length,
      totalChars: chs.reduce((acc, c) => acc + bodyChars(c.content), 0),
      entities: { anomaly: anos.length, module: mods.length, incident: incs.length, facility: facs.length, personnel: pers.length },
    });
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
