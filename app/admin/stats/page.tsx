// 編集日時: 2026-04-29
"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

interface NovelStat {
  id: string; title: string; slug: string; status: string;
  totalChars: number; published: number; draft: number;
  chapterHistory: Array<{ num: number; chars: number; title: string }>;
  updatedAt: number | string | null;
}
interface Stats {
  novels: NovelStat[]; totalNovels: number; totalChapters: number; totalChars: number;
  entities: Record<string, number>;
}

function fmt(n: number) { return n.toLocaleString(); }
function relDate(ts: number | string | null) {
  if (!ts) return "—";
  // APIはDate→JSONで ISO文字列を返す場合があるため両方対応
  const d = typeof ts === "number" ? new Date(ts * 1000) : new Date(ts);
  if (isNaN(d.getTime())) return "—";
  return `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()}`;
}

const ENTITY_LABELS: Record<string, string> = {
  anomaly: "アノマリー", module: "モジュール", incident: "インシデント", facility: "施設", personnel: "人員",
};

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats").then(r => r.json()).then(setStats).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#06090c] flex items-center justify-center">
      <p className="font-mono text-gray-700 text-sm">読み込み中…</p>
    </div>
  );
  if (!stats) return null;

  const maxChars = Math.max(...stats.novels.flatMap(n => n.chapterHistory.map(c => c.chars)), 1);

  return (
    <div className="min-h-screen bg-[#06090c] text-gray-300 p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin" className="text-gray-600 hover:text-gray-400 font-mono text-xs">← 管理</Link>
        <h1 className="font-mono text-sm text-gray-200 tracking-wider">執筆統計</h1>
      </div>

      {/* サマリーカード */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: "小説数", value: fmt(stats.totalNovels) },
          { label: "総章数", value: fmt(stats.totalChapters) },
          { label: "総文字数", value: fmt(stats.totalChars) },
          { label: "エンティティ", value: fmt(Object.values(stats.entities).reduce((a,b) => a+b, 0)) },
        ].map((c) => (
          <div key={c.label} className="border border-gray-800 rounded-lg px-4 py-3 bg-gray-900/30">
            <p className="text-[10px] font-mono text-gray-600 tracking-widest">{c.label}</p>
            <p className="text-2xl font-mono text-gray-100 mt-1">{c.value}</p>
          </div>
        ))}
      </div>

      {/* エンティティ内訳 */}
      <div className="border border-gray-800 rounded-lg p-4 mb-8 bg-gray-900/20">
        <p className="text-[10px] font-mono text-gray-600 tracking-widest mb-3">エンティティ内訳</p>
        <div className="flex flex-wrap gap-3">
          {Object.entries(stats.entities).map(([type, count]) => (
            <div key={type} className="flex items-center gap-2">
              <span className="text-xs font-mono text-gray-500">{ENTITY_LABELS[type] ?? type}</span>
              <span className="text-sm font-mono text-gray-200">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 小説ごとの詳細 */}
      <div className="space-y-6">
        {stats.novels.map((novel) => (
          <div key={novel.id} className="border border-gray-800 rounded-lg overflow-hidden bg-gray-900/20">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800/60 bg-gray-900/30">
              <div className="flex items-center gap-2">
                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border
                  ${novel.status === "published" ? "text-green-500 border-green-800" : "text-gray-600 border-gray-700"}`}>
                  {novel.status === "published" ? "公開中" : "下書き"}
                </span>
                <Link href={`/novels/${novel.slug}`} className="font-mono text-sm text-gray-200 hover:text-amber-300 transition-colors">
                  {novel.title}
                </Link>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-mono text-gray-600">
                <span>{fmt(novel.totalChars)}文字</span>
                <span>公開{novel.published} / 下書き{novel.draft}</span>
                <span>更新: {relDate(novel.updatedAt)}</span>
              </div>
            </div>

            {/* 章ごとの文字数バーグラフ */}
            {novel.chapterHistory.length > 0 && (
              <div className="px-4 py-3 space-y-1.5">
                {novel.chapterHistory.map((ch) => (
                  <div key={ch.num} className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-gray-700 w-5 text-right flex-shrink-0">{ch.num}</span>
                    <div className="flex-1 h-3 bg-gray-800 rounded-sm overflow-hidden">
                      <div
                        className="h-full bg-amber-700/60 rounded-sm transition-all"
                        style={{ width: `${Math.max(2, (ch.chars / maxChars) * 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-gray-600 w-16 text-right flex-shrink-0">{fmt(ch.chars)}字</span>
                    <span className="text-[10px] font-mono text-gray-700 truncate max-w-[120px]">{ch.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
