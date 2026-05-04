// 編集日時: 2026-05-05
"use client";

import Link from "next/link";
import { useState } from "react";

interface Chapter {
  id: string;
  chapterNumber: number;
  title: string;
}

interface MobileTocProps {
  slug: string;
  chapters: Chapter[];
  currentChapterNum: number;
}

export function MobileToc({ slug, chapters, currentChapterNum }: MobileTocProps) {
  const [open, setOpen] = useState(false);
  const current = chapters.find((c) => c.chapterNumber === currentChapterNum);

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40">
      {/* 目次パネル */}
      <div
        style={{
          maxHeight: open ? "60vh" : "0px",
          overflow: "hidden",
          transition: "max-height 0.3s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <div className="bg-[#07090d]/95 backdrop-blur-md border-t border-gray-700/60 overflow-y-auto max-h-[60vh]">
          <div className="px-4 py-2 border-b border-gray-800/60 flex items-center justify-between">
            <span className="text-[10px] font-mono text-gray-600 tracking-widest">目次</span>
            <span className="text-[10px] font-mono text-gray-700">{chapters.length}章</span>
          </div>
          <div className="py-2">
            {chapters.map((ch) => (
              <Link
                key={ch.id}
                href={`/novels/${slug}?chapter=${ch.chapterNumber}`}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors
                  ${ch.chapterNumber === currentChapterNum
                    ? "bg-gray-800/60 text-gray-100"
                    : "text-gray-500 hover:text-gray-300 hover:bg-gray-800/30"
                  }`}
              >
                <span className="font-mono text-[11px] text-gray-600 w-6 text-right flex-shrink-0">
                  {ch.chapterNumber}.
                </span>
                <span className="flex-1 truncate">{ch.title}</span>
                {ch.chapterNumber === currentChapterNum && (
                  <span className="text-amber-600 text-[10px] font-mono flex-shrink-0">▶</span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* 目次トグルバー */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-[#07090d]/95 backdrop-blur-md border-t border-gray-700/60"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[11px] font-mono text-gray-600 flex-shrink-0">
            {open ? "✕" : "📖"}
          </span>
          <span className="text-xs font-mono text-gray-400 truncate">
            {open ? "閉じる" : (current ? `${current.chapterNumber}. ${current.title}` : "目次")}
          </span>
        </div>
        <span
          className="text-[10px] font-mono text-gray-600 flex-shrink-0 ml-2"
          style={{
            display: "inline-block",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
          }}
        >
          ▲
        </span>
      </button>
    </div>
  );
}
