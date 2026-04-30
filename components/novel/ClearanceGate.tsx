// 編集日時: 2026-04-29
"use client";
import { useState } from "react";

interface ClearanceGateProps {
  level: number;
  content: string;
}

// 実際の運用ではユーザーセッションからクリアランスを取得するが、
// デモ用にローカルステートで切り替えを模擬する
export function ClearanceGate({ level, content }: ClearanceGateProps) {
  const [unlocked, setUnlocked] = useState(false);

  if (unlocked) {
    return (
      <div className="my-4 border border-green-800/40 rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-1.5 bg-green-950/20 border-b border-green-800/30">
          <span className="text-[10px] font-mono text-green-700 tracking-widest">CLR-Lv.{level} — アクセス許可</span>
          <button
            onClick={() => setUnlocked(false)}
            className="ml-auto text-[10px] font-mono text-gray-700 hover:text-gray-500"
          >
            [閉じる]
          </button>
        </div>
        <div className="px-5 py-4 text-sm text-gray-300 leading-[1.9] font-serif whitespace-pre-wrap">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="my-4 border border-red-900/50 rounded-lg bg-red-950/10 px-4 py-5 flex flex-col items-center gap-3">
      <div className="text-center">
        <p className="text-[10px] font-mono text-red-700 tracking-widest mb-1">アクセス拒否</p>
        <p className="text-xs font-mono text-red-900/80">
          このコンテンツの閲覧にはクリアランスLv.{level}以上が必要です
        </p>
      </div>
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={`w-6 h-2 rounded-sm ${i < level ? "bg-red-800" : "bg-gray-800"}`} />
        ))}
      </div>
      {/* デモ用解除ボタン — 実運用では認証フローに差し替え */}
      <button
        onClick={() => setUnlocked(true)}
        className="text-[10px] font-mono text-gray-700 hover:text-gray-500 border border-gray-800 px-3 py-1 rounded transition-colors"
      >
        [デモ: クリアランスを確認して解除]
      </button>
    </div>
  );
}
