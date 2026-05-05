// 編集日時: 2026-05-03
"use client";
import { useEffect, useRef, useState } from "react";

interface ClearanceGateProps {
  level: number;
  content: string;
}

export function ClearanceGate({ level, content }: ClearanceGateProps) {
  const [phase, setPhase] = useState<"locked" | "scanning" | "unlocked">("locked");
  const [scanY, setScanY] = useState(0);
  const [contentVisible, setContentVisible] = useState(false);
  const rafRef = useRef<number | null>(null);

  const handleUnlock = () => {
    if (phase !== "locked") return;
    setPhase("scanning");
    setScanY(0);
    let start: number | null = null;
    const duration = 600;
    const tick = (ts: number) => {
      if (!start) start = ts;
      const pct = Math.min((ts - start) / duration, 1);
      setScanY(pct * 100);
      if (pct < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setPhase("unlocked");
        // コンテンツはわずかに遅れてフェードイン
        setTimeout(() => setContentVisible(true), 80);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  if (phase === "unlocked") {
    return (
      <div className="my-4 border border-green-800/40 rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-1.5 bg-green-950/20 border-b border-green-800/30">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
          <span className="text-[10px] font-mono text-green-700 tracking-widest">
            CLR-Lv.{level} — アクセス許可
          </span>
          <button
            onClick={() => { setPhase("locked"); setContentVisible(false); setScanY(0); }}
            className="ml-auto text-[10px] font-mono text-gray-700 hover:text-gray-500"
          >
            [閉じる]
          </button>
        </div>
        <div
          className="px-5 py-4 text-sm text-gray-300 leading-[1.9] font-serif whitespace-pre-wrap transition-opacity duration-400"
          style={{ opacity: contentVisible ? 1 : 0 }}
        >
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="my-4 border border-red-900/50 rounded-lg bg-red-950/10 overflow-hidden relative">
      {/* スキャンライン */}
      {phase === "scanning" && (
        <div
          className="absolute left-0 right-0 h-0.5 pointer-events-none z-10"
          style={{
            top: `${scanY}%`,
            background: "rgba(34,197,94,0.7)",
            boxShadow: "0 0 10px 3px rgba(34,197,94,0.35)",
          }}
        />
      )}

      <div className="px-4 py-5 flex flex-col items-center gap-3">
        <div className="text-center">
          <p className={`text-[10px] font-mono tracking-widest mb-1 transition-colors duration-300 ${
            phase === "scanning" ? "text-green-700" : "text-red-700"
          }`}>
            {phase === "scanning" ? "認証中…" : "アクセス拒否"}
          </p>
          <p className="text-xs font-mono text-red-900/80">
            このコンテンツの閲覧にはクリアランスLv.{level}以上が必要です
          </p>
        </div>

        {/* クリアランスバー */}
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="w-6 h-2 rounded-sm transition-colors duration-200"
              style={{
                background: i < level
                  ? phase === "scanning" ? "rgba(34,197,94,0.6)" : "rgba(153,27,27,0.8)"
                  : "rgba(31,41,55,0.8)",
                transitionDelay: `${i * 80}ms`,
              }}
            />
          ))}
        </div>

        <button
          onClick={handleUnlock}
          disabled={phase === "scanning"}
          className="text-[10px] font-mono text-gray-700 hover:text-gray-500 border border-gray-800 px-3 py-1 rounded transition-colors disabled:opacity-40"
        >
          {phase === "scanning" ? "検証中…" : "[デモ: クリアランスを確認して解除]"}
        </button>
      </div>
    </div>
  );
}
