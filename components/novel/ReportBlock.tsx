// 編集日時: 2026-05-05
"use client";

import { useEffect, useRef, useState } from "react";

interface ReportBlockProps {
  classification: string;
  date?: string;
  content: string;
}

export function ReportBlock({ classification, date, content }: ReportBlockProps) {
  const [inView, setInView]           = useState(false);
  const [stampDropped, setStampDropped] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasTriggered = useRef(false);

  // スクロール連動出現 (2026-05-05)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasTriggered.current) {
          hasTriggered.current = true;
          observer.disconnect();
          setInView(true);
          // コンテナが出現してからスタンプを落とす
          setTimeout(() => setStampDropped(true), 350);
        }
      },
      { threshold: 0.12 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className={`my-6 border border-gray-600/50 rounded-sm overflow-hidden bg-[#0e1117]
        ${inView ? "nml-report-visible" : "nml-report-hidden"}`}
    >
      {/* ヘッダーバー */}
      <div className="flex items-center justify-between px-5 py-2.5 bg-gray-800/60 border-b border-gray-600/40">
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-mono text-gray-600 tracking-[0.2em] uppercase select-none">
            ◼ FOUNDATION REPORT
          </span>
          <span className="text-[10px] font-mono text-gray-400 border border-gray-600/60 px-2 py-0.5 rounded-sm tracking-widest">
            {classification}
          </span>
        </div>
        {date && (
          <span className="text-[10px] font-mono text-gray-600">{date}</span>
        )}
      </div>

      {/* 本文エリア */}
      <div className="relative">
        {/* スタンプ風ウォーターマーク */}
        <div
          className="absolute top-3 right-4 text-[10px] font-mono text-gray-700/40 border border-gray-700/30 px-2 py-1 rounded tracking-[0.15em] uppercase select-none rotate-[-8deg] pointer-events-none"
          aria-hidden
          style={{
            transform: `rotate(-8deg) scale(${stampDropped ? 1 : 1.4})`,
            opacity: stampDropped ? 1 : 0,
            transition: "transform 0.18s cubic-bezier(0.22,1,0.36,1), opacity 0.15s ease-out",
          }}
        >
          {classification}
        </div>

        <div className="px-6 py-5 text-sm text-gray-300 leading-[2] whitespace-pre-wrap font-serif">
          {content}
        </div>
      </div>

      {/* フッター */}
      <div className="px-5 py-2 border-t border-gray-700/30 bg-gray-900/30 flex items-center justify-between">
        <span className="text-[9px] font-mono text-gray-700 tracking-widest">
          SCP FOUNDATION — CONFIDENTIAL
        </span>
        <span className="text-[9px] font-mono text-gray-700">
          DO NOT DISTRIBUTE
        </span>
      </div>
    </div>
  );
}
