"use client";

import { useState } from "react";

interface ChoiceBlockProps {
  options: string[];
}

export function ChoiceBlock({ options }: ChoiceBlockProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);

  const choose = (i: number) => {
    if (locked) return;
    setSelected(i);
  };

  const confirm = () => {
    if (selected === null) return;
    setLocked(true);
  };

  return (
    <div className="my-6 border border-gray-600/60 rounded-lg bg-gray-900/50 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-gray-700 flex items-center gap-2">
        <span className="text-[10px] font-mono text-gray-500 tracking-widest uppercase">
          — 行動選択 —
        </span>
      </div>
      <div className="p-4 space-y-2">
        {options.map((opt, i) => (
          <button
            key={i}
            disabled={locked}
            onClick={() => choose(i)}
            className={`w-full text-left px-4 py-3 rounded-md border text-sm transition-all duration-150
              font-sans leading-relaxed
              ${locked && selected === i
                ? "border-amber-500/60 bg-amber-900/20 text-amber-300"
                : locked
                ? "border-gray-700/40 text-gray-600 cursor-default"
                : selected === i
                ? "border-amber-500/60 bg-amber-900/20 text-amber-200"
                : "border-gray-600/40 text-gray-300 hover:border-gray-500 hover:bg-gray-800/40"
              }`}
          >
            <span className="font-mono text-gray-500 text-xs mr-2">
              {locked && selected === i ? "▶" : `${i + 1}.`}
            </span>
            {opt}
            {locked && selected === i && (
              <span className="ml-2 text-xs text-amber-500 font-mono">【選択済み】</span>
            )}
          </button>
        ))}
      </div>
      {!locked && selected !== null && (
        <div className="px-4 pb-4">
          <button
            onClick={confirm}
            className="w-full py-2 rounded border border-amber-600/60 text-amber-400 text-sm
              font-mono hover:bg-amber-900/20 transition-all"
          >
            この選択を確定する
          </button>
        </div>
      )}
      {locked && (
        <div className="px-4 pb-3">
          <p className="text-gray-600 text-xs font-mono text-center">
            ── 選択は記録された ──
          </p>
        </div>
      )}
    </div>
  );
}
