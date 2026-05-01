// 編集日時: 2026-04-29
"use client";
import Link from "next/link";
import { useCallback, useState } from "react";

interface ChapterResult { id: string; title: string; chapterNumber: number; novelTitle: string; novelSlug: string; snippet: string; matchInTitle: boolean; }
interface EntityResult  { id: string; name: string; type: string; }

const TYPE_COLOR: Record<string, string> = {
  anomaly: "text-amber-400 border-amber-800", module: "text-cyan-400 border-cyan-800",
  incident: "text-red-400 border-red-800", facility: "text-green-400 border-green-800", personnel: "text-violet-400 border-violet-800",
};
const TYPE_LABEL: Record<string, string> = {
  anomaly: "アノマリー", module: "モジュール", incident: "インシデント", facility: "施設", personnel: "人員",
};

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [chapters, setChapters] = useState<ChapterResult[]>([]);
  const [entities, setEntities] = useState<EntityResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) return;
    setLoading(true); setSearched(true);
    const res = await fetch(`/api/admin/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    setChapters(data.chapters ?? []);
    setEntities(data.entities ?? []);
    setLoading(false);
  }, []);

  return (
    <div className="min-h-screen bg-[#06090c] text-gray-300 p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin" className="text-gray-600 hover:text-gray-400 font-mono text-xs">← 管理</Link>
        <h1 className="font-mono text-sm text-gray-200 tracking-wider">全文検索</h1>
      </div>

      {/* 検索バー */}
      <div className="flex gap-2 mb-8">
        <input
          type="text" value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search(q)}
          placeholder="章タイトル・本文・エンティティIDで検索…"
          className="flex-1 bg-gray-900 border border-gray-700 rounded px-4 py-2.5 text-sm font-mono text-gray-200
            outline-none focus:border-amber-700 placeholder:text-gray-700"
          autoFocus
        />
        <button onClick={() => search(q)} disabled={loading}
          className="px-4 py-2.5 rounded border border-amber-800/60 text-xs font-mono text-amber-400
            hover:bg-amber-900/20 transition-all disabled:opacity-50">
          {loading ? "検索中…" : "検索"}
        </button>
      </div>

      {searched && !loading && (
        <div className="space-y-8">
          {/* 章結果 */}
          <div>
            <p className="text-[10px] font-mono text-gray-600 tracking-widest mb-3">
              章 — {chapters.length}件
            </p>
            {chapters.length === 0
              ? <p className="text-xs font-mono text-gray-700">該当なし</p>
              : <div className="space-y-2">
                  {chapters.map((ch) => (
                    <Link key={ch.id} href={`/novels/${ch.novelSlug}?chapter=${ch.chapterNumber}`}
                      className="block border border-gray-800 rounded-lg px-4 py-3 hover:border-gray-700 hover:bg-gray-900/40 transition-all">
                      <div className="flex items-center gap-2 mb-1">
                        {ch.matchInTitle && <span className="text-[9px] font-mono bg-amber-900/30 text-amber-400 border border-amber-800 px-1.5 py-0.5 rounded">タイトル一致</span>}
                        <span className="text-[10px] font-mono text-gray-600">{ch.novelTitle} / {ch.chapterNumber}章</span>
                      </div>
                      <p className="text-sm text-gray-200 font-medium mb-1">{ch.title}</p>
                      <p className="text-xs text-gray-600 font-mono leading-relaxed">{ch.snippet}</p>
                    </Link>
                  ))}
                </div>
            }
          </div>

          {/* エンティティ結果 */}
          <div>
            <p className="text-[10px] font-mono text-gray-600 tracking-widest mb-3">
              エンティティ — {entities.length}件
            </p>
            {entities.length === 0
              ? <p className="text-xs font-mono text-gray-700">該当なし</p>
              : <div className="flex flex-wrap gap-2">
                  {entities.map((e) => (
                    <Link key={e.id} href={`/admin/entities?type=${e.type}&id=${e.id}`}
                      className={`text-xs font-mono px-3 py-1.5 rounded border bg-gray-900/40 hover:bg-gray-800 transition-all ${TYPE_COLOR[e.type] ?? "text-gray-400 border-gray-700"}`}>
                      <span className="text-gray-600 text-[10px] mr-1">[{TYPE_LABEL[e.type]}]</span>
                      {e.id} — {e.name}
                    </Link>
                  ))}
                </div>
            }
          </div>
        </div>
      )}

      {!searched && (
        <div className="text-center mt-20">
          <p className="font-mono text-gray-700 text-sm">キーワードを入力してEnterで検索</p>
          <p className="font-mono text-gray-800 text-xs mt-1">章のタイトル・本文・エンティティID・名前で検索できます</p>
        </div>
      )}
    </div>
  );
}
