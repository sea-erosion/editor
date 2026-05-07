// 編集日時: 2026-05-05
"use client";

import { useState } from "react";

interface ChoiceBlockProps {
  options: string[];
}

export function ChoiceBlock({ options }: ChoiceBlockProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const choose = (i: number) => {
    if (locked) return;
    setSelected(i);
  };

  const confirm = () => {
    if (selected === null || confirming) return;
    setConfirming(true);
    // 短いフラッシュ → ロック
    setTimeout(() => {
      setLocked(true);
      setConfirming(false);
    }, 320);
  };

  return (
    <div className="my-6 border border-gray-600/60 rounded-lg bg-gray-900/50 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-gray-700 flex items-center gap-2">
        <span className="text-[10px] font-mono text-gray-500 tracking-widest uppercase">
          — 行動選択 —
        </span>
      </div>
      <div className="p-4 space-y-2">
        {options.map((opt, i) => {
          const isSelected = selected === i;
          const isConfirmed = locked && isSelected;
          return (
            <button
              key={i}
              disabled={locked}
              onClick={() => choose(i)}
              className={`w-full text-left px-4 py-3 rounded-md border text-sm
                font-sans leading-relaxed
                ${isConfirmed
                  ? "border-amber-500/60 bg-amber-900/20 text-amber-300 nml-choice-confirmed"
                  : locked
                  ? "border-gray-700/40 text-gray-600 cursor-default"
                  : isSelected
                  ? "border-amber-500/60 bg-amber-900/20 text-amber-200"
                  : "border-gray-600/40 text-gray-300 hover:border-gray-500 hover:bg-gray-800/40"
                }`}
              style={{
                transition: "border-color 0.2s, background-color 0.2s, color 0.2s, opacity 0.25s, transform 0.25s",
                opacity: locked && !isSelected ? 0 : 1,
                transform: locked && !isSelected ? "translateX(-4px)" : "translateX(0)",
              }}
            >
              <span className="font-mono text-gray-500 text-xs mr-2">
                {isConfirmed ? "▶" : `${i + 1}.`}
              </span>
              {opt}
              {isConfirmed && (
                <span
                  className="ml-2 text-xs text-amber-500 font-mono"
                  style={{ animation: "nml-choice-confirm 0.3s ease-out" }}
                >
                  【選択済み】
                </span>
              )}
            </button>
          );
        })}
      </div>

      {!locked && selected !== null && (
        <div className="px-4 pb-4">
          <button
            onClick={confirm}
            disabled={confirming}
            className={`w-full py-2 rounded border text-sm font-mono transition-all
              ${confirming
                ? "border-amber-500/80 bg-amber-900/30 text-amber-300 animate-pulse"
                : "border-amber-600/60 text-amber-400 hover:bg-amber-900/20"
              }`}
          >
            {confirming ? "記録中…" : "この選択を確定する"}
          </button>
        </div>
      )}

      {locked && (
        <div
          className="px-4 pb-3"
          style={{ animation: "nml-report-reveal 0.4s ease-out" }}
        >
          <p className="text-gray-600 text-xs font-mono text-center">
            ── 選択は記録された ──
          </p>
        </div>
      )}
    </div>
  );
}
