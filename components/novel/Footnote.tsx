// 編集日時: 2026-04-29
"use client";
import { useState } from "react";

interface FootnoteItem {
  num: number;
  text: string;
}

interface FootnoteBlockProps {
  items: FootnoteItem[];
}

export function FootnoteBlock({ items }: FootnoteBlockProps) {
  return (
    <div className="my-6 border-t border-gray-800 pt-4 space-y-1.5">
      {items.map((item) => (
        <div key={item.num} className="flex gap-2 items-baseline">
          <span className="text-[10px] font-mono text-gray-600 flex-shrink-0">※{item.num}</span>
          <span className="text-xs text-gray-500 leading-relaxed font-serif">{item.text}</span>
        </div>
      ))}
    </div>
  );
}

interface NoteRefProps {
  num: number;
}

export function NoteRef({ num }: NoteRefProps) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-block">
      <button
        onClick={() => setShow((v) => !v)}
        className="text-[10px] font-mono text-gray-600 hover:text-amber-500 transition-colors align-super ml-0.5"
      >
        ※{num}
      </button>
      {show && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-48 bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-[11px] font-serif text-gray-400 z-10 shadow-xl leading-relaxed">
          （クリックで脚注へ）
        </span>
      )}
    </span>
  );
}
