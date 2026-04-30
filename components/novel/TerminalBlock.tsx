// 編集日時: 2026-04-28
"use client";

import { useEffect, useRef, useState } from "react";

interface TerminalBlockProps {
  content: string;
  prompt?: string; // デフォルト ">" 、"#" など変更可能
}

export function TerminalBlock({ content, prompt = ">" }: TerminalBlockProps) {
  const lines = content.split("\n").filter(Boolean);
  const [visibleLines, setVisibleLines] = useState<string[]>([]);
  const [currentLine, setCurrentLine] = useState(0);
  const hasStarted = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => {
      hasStarted.current = true;
      setCurrentLine(0);
    }, 400);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!hasStarted.current && currentLine === 0) return;
    if (currentLine >= lines.length) return;
    const timer = setInterval(() => {
      if (currentLine < lines.length) {
        setVisibleLines((prev) => [...prev, lines[prev.length]]);
        setCurrentLine((c) => c + 1);
      } else {
        clearInterval(timer);
      }
    }, 80);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLine === 0 && hasStarted.current]);

  // シンプルな再実装：マウント後に順次表示
  useEffect(() => {
    let idx = 0;
    const run = () => {
      if (idx >= lines.length) return;
      setTimeout(() => {
        setVisibleLines((prev) => [...prev, lines[idx]]);
        idx++;
        run();
      }, idx === 0 ? 400 : 80);
    };
    run();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const promptChar = prompt;

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
        {lines.map((line, i) => {
          if (i >= visibleLines.length) return null;
          const isPromptLine = line.startsWith(promptChar) || line.startsWith(">");
          const isWarning = /warning|error|fail/i.test(line);
          const isSuccess = /success|ok|complete/i.test(line);
          return (
            <div key={i}
              className={`leading-relaxed whitespace-pre
                ${isPromptLine ? "text-green-400"
                  : isWarning   ? "text-red-400"
                  : isSuccess   ? "text-emerald-400"
                  : "text-green-200/70"}`}
            >
              {isPromptLine && <span className="text-green-700 mr-1">{promptChar}</span>}
              {line}
            </div>
          );
        })}
        {visibleLines.length < lines.length && (
          <div className="text-green-500 animate-pulse">█</div>
        )}
      </div>
    </div>
  );
}
