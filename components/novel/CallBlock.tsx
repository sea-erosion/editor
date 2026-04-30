// 編集日時: 2026-04-29
"use client";
import { useEffect, useState } from "react";

interface VoiceLine {
  side: "left" | "right";
  name: string;
  text: string;
}

interface CallBlockProps {
  header: string;
  lines: VoiceLine[];
}

const STATIC_CHARS = "▒░▓▒░";

export function CallBlock({ header, lines }: CallBlockProps) {
  const [noise, setNoise] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setNoise(true);
      setTimeout(() => setNoise(false), 120);
    }, 4000 + Math.random() * 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="my-6 border border-gray-700/40 rounded-lg overflow-hidden bg-[#080c10]">
      {/* ヘッダー */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-800 bg-gray-900/60">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${noise ? "bg-red-500" : "bg-green-500"} transition-colors`} />
        <span className="text-[10px] font-mono text-gray-500 tracking-widest">SECURE CHANNEL</span>
        <span className="ml-2 text-[11px] font-mono text-gray-400">{header}</span>
        <span className="ml-auto text-[10px] font-mono text-gray-700">E2E-ENCRYPTED</span>
      </div>

      {/* 通話ライン */}
      <div className="px-4 py-4 space-y-3">
        {lines.map((line, i) => (
          <div key={i} className={`flex gap-2 items-start ${line.side === "right" ? "flex-row-reverse" : ""}`}>
            {/* コールサイン */}
            <div className={`flex-shrink-0 w-8 h-8 rounded-sm flex items-center justify-center text-[9px] font-mono font-bold
              ${line.side === "right" ? "bg-emerald-900/50 text-emerald-400 border border-emerald-800/50" : "bg-gray-800 text-gray-400 border border-gray-700"}`}>
              {line.name.slice(0, 2)}
            </div>
            <div className={`flex flex-col gap-0.5 max-w-[72%] ${line.side === "right" ? "items-end" : "items-start"}`}>
              <span className="text-[10px] font-mono text-gray-600">{line.name}</span>
              <div className={`px-3 py-2 text-sm font-mono leading-relaxed rounded
                ${line.side === "right"
                  ? "bg-emerald-900/30 text-emerald-200/90 border border-emerald-800/30"
                  : "bg-gray-800/60 text-gray-300 border border-gray-700/40"}`}>
                {noise && i === lines.length - 1
                  ? STATIC_CHARS
                  : line.text}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* フッター */}
      <div className="px-4 py-1.5 border-t border-gray-800/50 flex items-center gap-2">
        <span className={`text-[9px] font-mono ${noise ? "text-red-500" : "text-gray-700"}`}>
          {noise ? "SIGNAL INTERRUPTED" : "SIGNAL NOMINAL"}
        </span>
      </div>
    </div>
  );
}
