import { db } from "@/db/client";
import { chapters, novels } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import Link from "next/link";

async function getNovels() {
  try {
    const novelList = await db.select().from(novels).where(eq(novels.status, "published"));
    // Get chapter counts
    const result = await Promise.all(
      novelList.map(async (novel) => {
        const chaps = await db.select().from(chapters).where(eq(chapters.novelId, novel.id));
        return { ...novel, chapterCount: chaps.length };
      })
    );
    return result;
  } catch {
    return [];
  }
}

const CLASS_COLORS: Record<string, string> = {
  Narrative:  "border-blue-700 text-blue-400 bg-blue-950/30",
  Report:     "border-amber-700 text-amber-400 bg-amber-950/30",
  Interview:  "border-green-700 text-green-400 bg-green-950/30",
  Log:        "border-gray-700 text-gray-400 bg-gray-800/30",
};

export default async function HomePage() {
  const novelList = await getNovels();

  return (
    <div>
      {/* Hero */}
      <div className="mb-10 border border-gray-700/60 rounded-xl bg-gray-900/30 p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 mt-1">
            <div className="w-12 h-12 border-2 border-amber-700/60 rounded-full flex items-center justify-center bg-amber-950/20">
              <span className="text-amber-500 text-lg">⚠</span>
            </div>
          </div>
          <div>
            <h2 className="text-gray-100 font-mono text-base font-semibold mb-1">
              財団ナラティブアーカイブへようこそ
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              本データベースには財団の機密ナラティブ文書が保管されています。
              文中の<span className="text-amber-400 border border-amber-700 px-1 rounded text-xs">アノマリー</span>、
              <span className="text-violet-400 border border-violet-700 px-1 rounded text-xs">人員</span>、
              <span className="text-green-400 border border-green-700 px-1 rounded text-xs">施設</span>等のタグをクリックすることで
              詳細情報を参照できます。不正アクセスは記録されます。
            </p>
          </div>
        </div>
      </div>

      {/* Novel list */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-mono text-xs text-gray-500 tracking-widest uppercase">
          — 公開ナラティブ一覧 ({novelList.length}件) —
        </h2>
      </div>

      {novelList.length === 0 ? (
        <div className="text-center py-16">
          <p className="font-mono text-gray-600 text-sm">
            [データなし — シードを実行してください]
          </p>
          <p className="font-mono text-gray-700 text-xs mt-2">
            npx tsx db/seed.ts
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {novelList.map((novel) => {
            const cc = CLASS_COLORS[novel.classification || ""] || CLASS_COLORS.Log;
            return (
              <Link
                key={novel.id}
                href={`/novels/${novel.slug}`}
                className="block border border-gray-700/60 rounded-xl bg-gray-900/20 p-5
                  hover:border-gray-600 hover:bg-gray-900/40 transition-all duration-200 group"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {novel.classification && (
                        <span className={`text-[10px] font-mono border px-1.5 py-0.5 rounded ${cc}`}>
                          {novel.classification}
                        </span>
                      )}
                      {(novel.clearanceRequired ?? 0) > 0 && (
                        <span className="text-[10px] font-mono border border-yellow-800 text-yellow-600 px-1.5 py-0.5 rounded">
                          CL-{novel.clearanceRequired}以上
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-gray-600">
                        {novel.chapterCount}章
                      </span>
                    </div>
                    <h3 className="text-gray-100 font-serif text-lg font-medium group-hover:text-amber-100 transition-colors">
                      {novel.title}
                    </h3>
                    {novel.summary && (
                      <p className="text-gray-500 text-sm mt-1.5 leading-relaxed line-clamp-2">
                        {novel.summary}
                      </p>
                    )}
                    <p className="text-gray-600 text-[11px] font-mono mt-2">
                      著者: {novel.author}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-gray-700 group-hover:text-gray-500 transition-colors text-lg mt-1">
                    →
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Entity quick links */}
      <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { type: "anomaly", label: "アノマリー", icon: "⚠", color: "border-amber-800/60 hover:border-amber-600 text-amber-500" },
          { type: "module", label: "モジュール", icon: "⬡", color: "border-cyan-800/60 hover:border-cyan-600 text-cyan-500" },
          { type: "incident", label: "インシデント", icon: "⚡", color: "border-red-800/60 hover:border-red-600 text-red-500" },
          { type: "facility", label: "施設", icon: "◼", color: "border-green-800/60 hover:border-green-600 text-green-500" },
        ].map(({ type, label, icon, color }) => (
          <Link
            key={type}
            href={`/entities/${type}`}
            className={`border rounded-lg p-4 text-center transition-all ${color} bg-gray-900/20 hover:bg-gray-900/40`}
          >
            <div className="text-2xl mb-1">{icon}</div>
            <div className="font-mono text-xs tracking-wide">{label}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
