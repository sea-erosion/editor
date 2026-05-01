// 編集日時: 2026-04-29
"use client";
import { useEffect, useRef, useState } from "react";

interface ReadingProgressProps {
  novelSlug: string;
  totalChapters: number;
  currentChapter: number;
}

const BOOKMARK_KEY = (slug: string) => `bookmark:${slug}`;

export function ReadingProgress({ novelSlug, totalChapters, currentChapter }: ReadingProgressProps) {
  const [scrollPct, setScrollPct] = useState(0);
  const [bookmark, setBookmark]   = useState<number | null>(null);
  const [showSaved, setShowSaved] = useState(false);
  const tRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // スクロール率を計算
  useEffect(() => {
    const onScroll = () => {
      const el  = document.documentElement;
      const pct = el.scrollTop / (el.scrollHeight - el.clientHeight);
      setScrollPct(isNaN(pct) ? 0 : Math.min(1, pct));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // しおり読み込み
  useEffect(() => {
    try {
      const saved = localStorage.getItem(BOOKMARK_KEY(novelSlug));
      if (saved) setBookmark(parseInt(saved, 10));
    } catch {}
  }, [novelSlug]);

  const saveBookmark = () => {
    try { localStorage.setItem(BOOKMARK_KEY(novelSlug), String(currentChapter)); }
    catch {}
    setBookmark(currentChapter);
    setShowSaved(true);
    if (tRef.current) clearTimeout(tRef.current);
    tRef.current = setTimeout(() => setShowSaved(false), 2000);
  };

  const chapterPct = totalChapters > 1 ? ((currentChapter - 1) / (totalChapters - 1)) * 100 : 100;

  return (
    <div className="fixed top-0 left-0 right-0 z-40 pointer-events-none">
      {/* スクロール進捗バー */}
      <div className="h-0.5 bg-gray-800">
        <div
          className="h-full bg-gradient-to-r from-amber-700 to-amber-500 transition-all duration-100"
          style={{ width: `${scrollPct * 100}%` }}
        />
      </div>

      {/* 章進捗 + しおりボタン */}
      <div className="pointer-events-auto flex items-center gap-3 px-4 py-1.5 bg-[#06090c]/80 backdrop-blur-sm border-b border-gray-800/50">
        <div className="flex items-center gap-2 text-[10px] font-mono text-gray-600">
          <span>{currentChapter} / {totalChapters}章</span>
          <div className="w-24 h-1 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-amber-700/60 rounded-full transition-all" style={{ width: `${chapterPct}%` }} />
          </div>
          <span>{Math.round(chapterPct)}%</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {bookmark !== null && bookmark !== currentChapter && (
            <a href={`/novels/${novelSlug}?chapter=${bookmark}`}
              className="text-[10px] font-mono text-amber-700 hover:text-amber-500 transition-colors">
              しおり({bookmark}章)へ →
            </a>
          )}
          <button onClick={saveBookmark}
            className="text-[10px] font-mono text-gray-700 hover:text-gray-400 border border-gray-800 hover:border-gray-700 px-2 py-0.5 rounded transition-all">
            {showSaved ? "✓ 保存" : "🔖 しおり"}
          </button>
        </div>
      </div>
    </div>
  );
}
