import { NovelRenderer }     from "@/components/novel/NovelRenderer";
import { ReadingProgress }   from "@/components/novel/ReadingProgress";
import { db } from "@/db/client";
import { chapters, novels } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";

async function getNovelData(slug: string) {
  const novelRows = await db.select().from(novels).where(eq(novels.slug, slug));
  if (!novelRows[0]) return null;
  const novel = novelRows[0];
  const chapterList = await db
    .select()
    .from(chapters)
    .where(eq(chapters.novelId, novel.id))
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
      <div className="flex gap-8 pt-10">
      {/* Sidebar */}
      <aside className="hidden lg:block w-52 flex-shrink-0">
        <div className="sticky top-6">
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
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {novel.classification && (
              <span className="text-[10px] font-mono border border-blue-800 text-blue-400 px-1.5 py-0.5 rounded">
                {novel.classification}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-serif text-gray-100 font-medium mb-1">{novel.title}</h1>
          <div className="flex items-center justify-between">
            <p className="text-gray-600 text-sm font-mono">著者: {novel.author}</p>
            <a href={`/api/novels/${slug}/export`} download
              className="text-[10px] font-mono text-gray-700 hover:text-gray-400 border border-gray-800 hover:border-gray-700 px-2.5 py-1 rounded transition-all">
              ↓ HTML書き出し
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
          </article>
        )}

        {/* Chapter navigation */}
        <div className="mt-10 pt-6 border-t border-gray-800 flex items-center justify-between">
          {currentChapterNum > 1 ? (
            <Link
              href={`/novels/${slug}?chapter=${currentChapterNum - 1}`}
              className="flex items-center gap-2 text-sm font-mono text-gray-500 hover:text-gray-300 transition-colors"
            >
              ← 前の章
            </Link>
          ) : <div />}
          {currentChapterNum < chapterList.length ? (
            <Link
              href={`/novels/${slug}?chapter=${currentChapterNum + 1}`}
              className="flex items-center gap-2 text-sm font-mono text-gray-500 hover:text-gray-300 transition-colors"
            >
              次の章 →
            </Link>
          ) : (
            <span className="text-xs font-mono text-gray-700">— 完 —</span>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
