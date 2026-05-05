// 編集日時: 2026-04-29
"use client";

interface LogBlockProps {
  title: string;
  date?: string;
  content: string;
}

export function LogBlock({ title, date, content }: LogBlockProps) {
  return (
    <div className="my-6 border border-gray-700/60 rounded-lg overflow-hidden bg-gray-900/30">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-700/40 bg-gray-800/40">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-gray-600 tracking-widest uppercase select-none">◼ LOG</span>
          <span className="text-[11px] font-mono text-gray-300">{title}</span>
        </div>
        {date && (
          <span className="text-[10px] font-mono text-gray-600">{date}</span>
        )}
      </div>
      <div className="px-5 py-4 text-sm text-gray-300 leading-[1.9] whitespace-pre-wrap font-serif">
        {content}
      </div>
    </div>
  );
}
