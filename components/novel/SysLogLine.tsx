// 編集日時: 2026-05-05
"use client";
import { useEffect, useState } from "react";

interface SysLogLineProps {
  text: string;
  translation?: string;
  /** 行インデックス（0始まり）。指定すると index * 110ms ずつ遅れてフェードイン */
  index?: number;
}

export function SysLogLine({ text, translation, index = 0 }: SysLogLineProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // 行ごとに時差をつける。最初の行は少し間を置いてから開始
    const delay = 120 + index * 110;
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [index]);

  const isError   = /error|fail|critical/i.test(text);
  const isWarning = /warn|caution/i.test(text);
  const isOk      = /ok|success|complete|confirmed|running/i.test(text);

  const color = isError
    ? "text-red-400"
    : isWarning
    ? "text-yellow-400"
    : isOk
    ? "text-emerald-400"
    : "text-gray-400";

  return (
    <div
      className="flex items-baseline gap-2 font-mono text-xs leading-6"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : "translateX(-6px)",
        transition: "opacity 0.35s ease-out, transform 0.35s ease-out",
      }}
    >
      <span className="text-gray-700 flex-shrink-0 select-none">#｜</span>
      <span className={color}>{text}</span>
      {translation && (
        <span className="text-gray-600 text-[10px]">《{translation}》</span>
      )}
    </div>
  );
}
