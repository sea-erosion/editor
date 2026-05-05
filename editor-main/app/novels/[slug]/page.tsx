import { NovelRenderer }     from "@/components/novel/NovelRenderer";
import { ReadingProgress }   from "@/components/novel/ReadingProgress";
import { MobileToc }         from "@/components/novel/MobileToc";
import { ReactionPanel }     from "@/components/novel/ReactionPanel";
import { db } from "@/db/client";
import { chapters, novels } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";

async function getNovelData(slug: string) {
  const novelRows = await db.select().from(novels).where(eq(novels.slug, slug));
  if (!novelRows[0]) return null;
  const novel = novelRows[0];
  const chapterList = await db
    .select()
    .from(chapters)
    .where(and(eq(chapters.novelId, novel.id), eq(chapters.status, "published")))
    .orderBy(chapters.chapterNumber);
  return { novel, chapters: chapterList };
}

export default async function NovelPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ chapter?: string }>;
}) {
  const { slug } = await params;
  const { chapter } = await searchParams;
  const data = await getNovelData(slug);
  if (!data) notFound();

  const { novel, chapters: chapterList } = data;
  const currentChapterNum = chapter ? parseInt(chapter) : 1;
  const currentChapter = chapterList.find((c) => c.chapterNumber === currentChapterNum) ?? chapterList[0];

  return (
    <>
      <ReadingProgress
        novelSlug={slug}
        totalChapters={chapterList.length}
        currentChapter={currentChapterNum}
      />
      {/* スマホ用折りたたみ目次 */}
      <MobileToc
        slug={slug}
        chapters={chapterList}
        currentChapterNum={currentChapterNum}
      />

      <div className="flex gap-8 pt-10">
        {/* Sidebar (lg以上) */}
        <aside className="hidden lg:block w-52 flex-shrink-0">
          <div className="sticky top-20">
            <p className="font-mono text-[10px] text-gray-600 tracking-widest mb-3 uppercase">目次</p>
            <div className="space-y-1">
              {chapterList.map((ch) => (
                <Link
                  key={ch.id}
                  href={`/novels/${slug}?chapter=${ch.chapterNumber}`}
                  className={`block px-3 py-2 rounded text-xs font-sans transition-all
                    ${ch.chapterNumber === currentChapterNum
                      ? "bg-gray-700/60 text-gray-100 border border-gray-600"
                      : "text-gray-500 hover:text-gray-300 hover:bg-gray-800/40"
                    }`}
                >
                  <span className="font-mono text-gray-600 mr-1">{ch.chapterNumber}.</span>
                  {ch.title}
                </Link>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-gray-800">
              <Link href="/" className="text-xs font-mono text-gray-600 hover:text-gray-400 transition-colors">
                ← 一覧へ
              </Link>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Novel header */}
          <div className="mb-8 pb-6 border-b border-gray-800">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {novel.classification && (
                <span className="text-[10px] font-mono border border-blue-800 text-blue-400 px-1.5 py-0.5 rounded">
                  {novel.classification}
                </span>
              )}
              <span className="text-[10px] font-mono text-gray-600">{chapterList.length}章</span>
            </div>
            <h1 className="text-2xl font-serif text-gray-100 font-medium mb-3">{novel.title}</h1>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="text-gray-500 text-xs font-mono">
                <span className="text-gray-700 mr-1">著者</span>{novel.author}
              </p>
              <a
                href={`/api/novels/${slug}/export`}
                download
                className="inline-flex items-center gap-1.5 text-[11px] font-mono text-gray-600 hover:text-gray-300 border border-gray-700/60 hover:border-gray-600 px-2.5 py-1.5 rounded transition-all"
              >
                <span>↓</span> HTML書き出し
              </a>
            </div>
          </div>

          {/* Chapter */}
          {currentChapter && (
            <article>
              <h2 className="text-lg font-serif text-gray-200 mb-6 font-medium">
                {currentChapter.title}
              </h2>
              <NovelRenderer content={currentChapter.content} />

              {/* リアクション (2026-05-05) */}
              <ReactionPanel
                novelId={novel.id}
                chapterId={currentChapter.id}
                chapterTitle={currentChapter.title}
              />
            </article>
          )}

          {/* Chapter navigation — スマホでもタップしやすい大きめボタン */}
          <div className="mt-12 pt-6 border-t border-gray-800 grid grid-cols-2 gap-3">
            {currentChapterNum > 1 ? (
              <Link
                href={`/novels/${slug}?chapter=${currentChapterNum - 1}`}
                className="flex items-center justify-center gap-2 min-h-[52px] px-4 py-3 rounded-lg border border-gray-700/60 hover:border-gray-600 bg-gray-900/30 hover:bg-gray-800/40 text-sm font-mono text-gray-400 hover:text-gray-200 transition-all col-start-1"
              >
                ← 前の章
              </Link>
            ) : <div />}
            {currentChapterNum < chapterList.length ? (
              <Link
                href={`/novels/${slug}?chapter=${currentChapterNum + 1}`}
                className="flex items-center justify-center gap-2 min-h-[52px] px-4 py-3 rounded-lg border border-amber-800/40 hover:border-amber-700 bg-amber-950/10 hover:bg-amber-900/20 text-sm font-mono text-amber-500/80 hover:text-amber-400 transition-all col-start-2"
              >
                次の章 →
              </Link>
            ) : (
              <div className="flex items-center justify-center min-h-[52px] px-4 py-3 rounded-lg border border-gray-800/40 col-start-2">
                <span className="text-xs font-mono text-gray-700">— 完 —</span>
              </div>
            )}
          </div>

          {/* 一覧へ戻る（スマホ用） */}
          <div className="mt-4 lg:hidden text-center">
            <Link href="/" className="text-xs font-mono text-gray-600 hover:text-gray-400 transition-colors">
              ← ナラティブ一覧へ
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
