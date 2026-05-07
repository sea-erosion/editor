// 編集日時: 2026-05-03
"use client";

import { useEffect, useState } from "react";

interface ClassifiedBlockProps {
  reason?: string;
  content: string;
}

export function ClassifiedBlock({ reason, content }: ClassifiedBlockProps) {
  const [mounted, setMounted] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanY, setScanY] = useState(0);

  useEffect(() => {
    queueMicrotask(() => setScanning(true));
    let start: number | null = null;
    const duration = 320;
    const tick = (ts: number) => {
      if (!start) start = ts;
      const pct = Math.min((ts - start) / duration, 1);
      setScanY(pct * 100);
      if (pct < 1) {
        requestAnimationFrame(tick);
      } else {
        setScanning(false);
        setMounted(true);
      }
    };
    requestAnimationFrame(tick);
  }, []);

  return (
    <div
      className="my-5 border border-red-900/50 rounded-sm overflow-hidden bg-red-950/10 relative"
      style={{ opacity: mounted ? 1 : 0.85, transition: "opacity 0.2s ease-out" }}
    >
      {scanning && (
        <div
          className="absolute left-0 right-0 h-px pointer-events-none z-10"
          style={{
            top: `${scanY}%`,
            background: "rgba(239,68,68,0.6)",
            boxShadow: "0 0 8px 2px rgba(239,68,68,0.4)",
          }}
        />
      )}

      <div className="flex items-center gap-3 px-4 py-2 bg-red-950/30 border-b border-red-900/40">
        <span className="text-[9px] font-mono text-red-600 tracking-[0.3em] uppercase select-none">
          ██ CLASSIFIED
        </span>
        {reason && (
          <span className="text-[10px] font-mono text-red-800/80">— {reason}</span>
        )}
      </div>

      <div className="relative px-5 py-4 select-none" aria-hidden>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(-45deg, transparent, transparent 8px, rgba(185,28,28,0.07) 8px, rgba(185,28,28,0.07) 9px)",
          }}
        />
        <p className="text-sm text-red-900/60 font-mono leading-relaxed line-through decoration-red-800/50 decoration-2">
          {content}
        </p>
      </div>

      <div className="px-4 py-2 border-t border-red-900/30 bg-red-950/20">
        <span className="text-[9px] font-mono text-red-800/70 tracking-widest">
          THIS SECTION HAS BEEN REMOVED BY ORDER OF THE OVERSEER COUNCIL
        </span>
      </div>
    </div>
  );
}
