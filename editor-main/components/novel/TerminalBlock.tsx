// 編集日時: 2026-04-29
"use client";
import { useEffect, useRef, useState } from "react";

interface TerminalBlockProps {
  content: string;
  prompt?: string;
}

export function TerminalBlock({ content, prompt = ">" }: TerminalBlockProps) {
  const lines = content.split("\n").filter(Boolean);
  const [visibleCount, setVisibleCount] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setVisibleCount(0);
    let idx = 0;
    const schedule = () => {
      timerRef.current = setTimeout(() => {
        idx++;
        setVisibleCount(idx);
        if (idx < lines.length) schedule();
      }, idx === 0 ? 400 : 80);
    };
    schedule();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  return (
    <div className="my-6 rounded-md border border-green-900/60 bg-black/80 font-mono text-xs overflow-x-auto">
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-green-900/40 bg-green-950/20">
        <div className="w-2.5 h-2.5 rounded-full bg-red-600/70" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-600/70" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-600/70" />
        <span className="ml-2 text-green-700 text-[10px] tracking-widest uppercase">
          FOUNDATION TERMINAL v3.4.1
        </span>
      </div>
      <div className="p-4 space-y-0.5 min-h-[80px]">
        {lines.slice(0, visibleCount).map((line, i) => {
          const isPromptLine = line.startsWith(prompt) || line.startsWith(">");
          const isWarning = /warning|error|fail/i.test(line);
          const isSuccess = /success|ok|complete/i.test(line);
          return (
            <div key={i}
              className={`leading-relaxed whitespace-pre
                ${isPromptLine ? "text-green-400"
                  : isWarning  ? "text-red-400"
                  : isSuccess  ? "text-emerald-400"
                  : "text-green-200/70"}`}
            >
              {isPromptLine && <span className="text-green-700 mr-1">{prompt}</span>}
              {line}
            </div>
          );
        })}
        {visibleCount < lines.length && (
          <div className="text-green-500 animate-pulse">█</div>
        )}
      </div>
    </div>
  );
}
