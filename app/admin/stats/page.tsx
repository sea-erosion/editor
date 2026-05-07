// 編集日時: 2026-05-05
"use client";
import { adminFetch } from "@/lib/admin-fetch";
import Link from "next/link";
import { useEffect, useState } from "react";

interface NovelStat {
  id: string; title: string; slug: string; status: string;
  totalChars: number; published: number; draft: number;
  chapterHistory: Array<{ num: number; chars: number; title: string }>;
  updatedAt: number | null;
}
interface RecentComment {
  id: string; novelId: string; chapterId: string | null;
  emoji: string; comment: string | null;
  createdAt: number | null; novelTitle: string; chapterTitle: string | null;
}
interface Stats {
  novels: NovelStat[]; totalNovels: number; totalChapters: number; totalChars: number;
  entities: Record<string, number>;
  reactions: { total: number; emojiCounts: Record<string, number>; recentComments: RecentComment[] };
}

function fmt(n: number) { return n.toLocaleString(); }
function relDate(ts: number | null) {
  if (!ts) return "—";
  const d = new Date(ts * 1000);
  return `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()}`;
}

const ENTITY_LABELS: Record<string, string> = {
  anomaly: "アノマリー", module: "モジュール", incident: "インシデント", facility: "施設", personnel: "人員",
};

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminFetch("/api/admin/stats").then(r => r.json()).then(setStats).finally(() => setLoading(false));
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

      {/* リアクション集計 (2026-05-05) */}
      {stats.reactions && (
        <div className="border border-gray-800 rounded-lg p-4 mb-8 bg-gray-900/20">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-mono text-gray-600 tracking-widest">◈ REACTIONS</p>
            <span className="text-[10px] font-mono text-gray-600">合計 {stats.reactions.total} 件</span>
          </div>
          {/* 絵文字カウント */}
          {Object.keys(stats.reactions.emojiCounts).length > 0 ? (
            <div className="flex flex-wrap gap-2 mb-4">
              {Object.entries(stats.reactions.emojiCounts)
                .filter(([, n]) => n > 0)
                .sort(([, a], [, b]) => b - a)
                .map(([emoji, count]) => (
                  <span key={emoji} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-700/60 bg-gray-900/40 text-sm font-mono text-gray-300">
                    {emoji} <span className="text-gray-500 text-xs">{count}</span>
                  </span>
                ))}
            </div>
          ) : (
            <p className="text-xs font-mono text-gray-700 mb-4">まだリアクションはありません</p>
          )}

          {/* 感想コメント一覧 */}
          {stats.reactions.recentComments.length > 0 && (
            <div>
              <p className="text-[10px] font-mono text-gray-700 tracking-widest mb-2">最新の感想</p>
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {stats.reactions.recentComments.map((r) => (
                  <div key={r.id} className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg border border-gray-800/60 bg-gray-900/30">
                    <span className="text-base flex-shrink-0">{r.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400 leading-relaxed">{r.comment}</p>
                      <p className="text-[10px] font-mono text-gray-700 mt-1">
                        {r.novelTitle}
                        {r.chapterTitle && <span className="ml-1">/ {r.chapterTitle}</span>}
                        {r.createdAt && <span className="ml-2">{relDate(r.createdAt)}</span>}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

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
