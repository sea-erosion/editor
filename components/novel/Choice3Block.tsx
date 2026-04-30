// 編集日時: 2026-04-28
"use client";
import { useState } from "react";

interface Choice3BlockProps {
  options: string[];
}

export function Choice3Block({ options }: Choice3BlockProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);

  const choose = (i: number) => {
    if (locked) return;
    setSelected(i);
    setLocked(true);
  };

  return (
    <div className="my-6 flex flex-wrap justify-center gap-3">
      {options.map((opt, i) => (
        <button
          key={i}
          disabled={locked}
          onClick={() => choose(i)}
          className={`px-5 py-2.5 rounded border font-mono text-sm transition-all duration-150
            ${locked && selected === i
              ? "border-amber-500 bg-amber-900/30 text-amber-300"
              : locked
              ? "border-gray-800 text-gray-700 cursor-default"
              : "border-gray-600 text-gray-300 hover:border-amber-600/60 hover:bg-amber-900/10 hover:text-amber-200"
            }`}
        >
          ＜{opt}＞
        </button>
      ))}
    </div>
  );
}
