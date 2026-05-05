// 編集日時: 2026-05-03
"use client";
import { useState } from "react";

interface GlossaryTerm {
  term: string;
  desc: string;
}

interface GlossaryBlockProps {
  terms: GlossaryTerm[];
}

export function GlossaryBlock({ terms }: GlossaryBlockProps) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="my-6 border border-gray-700/60 rounded-lg overflow-hidden bg-gray-900/40">
      <div className="px-4 py-2 border-b border-gray-700/40 bg-gray-800/30 flex items-center gap-2">
        <span className="text-[10px] font-mono text-gray-500 tracking-widest uppercase">用語集</span>
      </div>
      <div className="divide-y divide-gray-800/50">
        {terms.map((t, i) => (
          <div key={i}>
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-gray-800/30 transition-colors"
            >
              <span className="font-mono text-sm text-gray-200">
                <span className="text-gray-600 mr-2">・</span>{t.term}
              </span>
              <span
                className="text-gray-600 text-xs font-mono"
                style={{
                  display: "inline-block",
                  transform: open === i ? "rotate(90deg)" : "rotate(0deg)",
                  transition: "transform 0.2s ease",
                }}
              >
                ▶
              </span>
            </button>
            {/* max-heightでアコーディオンアニメ */}
            <div
              style={{
                maxHeight: open === i ? "300px" : "0px",
                overflow: "hidden",
                transition: "max-height 0.25s ease",
              }}
            >
              <div className="px-8 pb-3 text-sm text-gray-400 leading-relaxed border-t border-gray-800/30 pt-2">
                {t.desc}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
