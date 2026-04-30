// 編集日時: 2026-04-28
"use client";
import { useEffect, useState } from "react";

interface SysLogLineProps {
  text: string;
  translation?: string;
}

export function SysLogLine({ text, translation }: SysLogLineProps) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  const isError   = /error|fail|critical/i.test(text);
  const isWarning = /warn|caution/i.test(text);
  const isOk      = /ok|success|complete|confirmed|running/i.test(text);

  const color = isError ? "text-red-400" : isWarning ? "text-yellow-400" : isOk ? "text-emerald-400" : "text-gray-400";

  return (
    <div className={`flex items-baseline gap-2 font-mono text-xs leading-6 transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}>
      <span className="text-gray-700 flex-shrink-0 select-none">#｜</span>
      <span className={color}>{text}</span>
      {translation && (
        <span className="text-gray-600 text-[10px]">《{translation}》</span>
      )}
    </div>
  );
}
