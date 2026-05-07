// 編集日時: 2026-04-29 (initial) / 2026-05-07 (fix P-2: 検索クエリ長の上限追加)
import { db } from "@/db/client";
import { anomalies, chapters, facilities, incidents, modules, novels, personnel } from "@/db/schema";
import { like, or } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

const MAX_Q_LEN = 100;

// GET /api/admin/search?q=キーワード
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 1) return NextResponse.json({ chapters: [], entities: [] });
  if (q.length > MAX_Q_LEN) {
    return NextResponse.json(
      { error: `検索キーワードは ${MAX_Q_LEN} 文字以内にしてください` },
      { status: 400 }
    );
  }

  const pat = `%${q}%`;
  try {
    const [chs, novs, anos, mods, incs, facs, pers] = await Promise.all([
      db.select({ id: chapters.id, title: chapters.title, novelId: chapters.novelId, chapterNumber: chapters.chapterNumber, content: chapters.content })
        .from(chapters).where(or(like(chapters.title, pat), like(chapters.content, pat))),
      db.select({ id: novels.id, title: novels.title, slug: novels.slug }).from(novels),
      db.select({ id: anomalies.id, name: anomalies.name }).from(anomalies).where(or(like(anomalies.id, pat), like(anomalies.name, pat))),
      db.select({ id: modules.id, name: modules.name }).from(modules).where(or(like(modules.id, pat), like(modules.name, pat))),
      db.select({ id: incidents.id, name: incidents.name }).from(incidents).where(or(like(incidents.id, pat), like(incidents.name, pat))),
      db.select({ id: facilities.id, name: facilities.name }).from(facilities).where(or(like(facilities.id, pat), like(facilities.name, pat))),
      db.select({ id: personnel.id, name: personnel.name }).from(personnel).where(or(like(personnel.id, pat), like(personnel.name, pat))),
    ]);

    const novelMap = Object.fromEntries(novs.map((n) => [n.id, n]));
    const SNIPPET_LEN = 120;

    const chapterResults = chs.map((ch) => {
      const novel = novelMap[ch.novelId];
      const lower = ch.content.toLowerCase();
      const idx = lower.indexOf(q.toLowerCase());
      const snippet = idx >= 0
        ? "…" + ch.content.slice(Math.max(0, idx - 30), idx + SNIPPET_LEN).replace(/\[[^\]]*\]/g, "") + "…"
        : ch.content.slice(0, SNIPPET_LEN).replace(/\[[^\]]*\]/g, "") + "…";
      return { id: ch.id, title: ch.title, chapterNumber: ch.chapterNumber, novelTitle: novel?.title ?? "", novelSlug: novel?.slug ?? "", snippet, matchInTitle: ch.title.toLowerCase().includes(q.toLowerCase()) };
    });

    const entityResults = [
      ...anos.map((e) => ({ ...e, type: "anomaly" as const })),
      ...mods.map((e) => ({ ...e, type: "module" as const })),
      ...incs.map((e) => ({ ...e, type: "incident" as const })),
      ...facs.map((e) => ({ ...e, type: "facility" as const })),
      ...pers.map((e) => ({ ...e, type: "personnel" as const })),
    ];

    return NextResponse.json({ chapters: chapterResults, entities: entityResults });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
