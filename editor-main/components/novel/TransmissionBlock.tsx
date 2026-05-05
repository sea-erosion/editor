// 編集日時: 2026-05-03
"use client";

import { useEffect, useState } from "react";

interface TransmissionBlockProps {
  from: string;
  to: string;
  content: string;
}

// ランダムノイズ文字列
function noiseChar() {
  const chars = "█▓▒░╳╬╪╫▪▫◆◇▲△▼▽×+";
  return chars[Math.floor(Math.random() * chars.length)];
}

function NoiseText({ length }: { length: number }) {
  const [noise, setNoise] = useState(() =>
    Array.from({ length }, () => noiseChar()).join("")
  );
  useEffect(() => {
    const id = setInterval(() => {
      setNoise(Array.from({ length }, () => noiseChar()).join(""));
    }, 80);
    return () => clearInterval(id);
  }, [length]);
  return <span className="text-gray-700 text-[10px] font-mono select-none">{noise}</span>;
}

export function TransmissionBlock({ from, to, content }: TransmissionBlockProps) {
  const [revealed, setRevealed] = useState(false);
  const [decoding, setDecoding] = useState(false);

  const handleDecode = () => {
    if (revealed) return;
    setDecoding(true);
    setTimeout(() => {
      setDecoding(false);
      setRevealed(true);
    }, 1200);
  };

  return (
    <div className="my-6 border border-cyan-900/50 rounded-sm overflow-hidden bg-[#040d10]">
      {/* ヘッダー */}
      <div className="px-4 py-2.5 bg-cyan-950/30 border-b border-cyan-900/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono text-cyan-700 tracking-[0.25em] uppercase select-none">
              ◈ ENCRYPTED TRANSMISSION
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-700 animate-pulse" />
            <span className="text-[9px] font-mono text-cyan-800">LIVE</span>
          </div>
        </div>

        <div className="mt-1.5 flex gap-4 text-[10px] font-mono">
          <span className="text-gray-600">
            FROM: <span className="text-cyan-700/80">{from}</span>
          </span>
          <span className="text-gray-600">
            TO: <span className="text-cyan-700/80">{to}</span>
          </span>
        </div>
      </div>

      {/* 本文エリア */}
      <div className="px-5 py-4 min-h-[60px]">
        {!revealed && !decoding && (
          <div className="flex items-center gap-3">
            <NoiseText length={40} />
            <button
              onClick={handleDecode}
              className="ml-2 text-[10px] font-mono text-cyan-800 hover:text-cyan-500 border border-cyan-900/60 hover:border-cyan-700/60 px-2 py-1 rounded transition-all"
            >
              [DECODE]
            </button>
          </div>
        )}

        {decoding && (
          <div className="space-y-1">
            {content.split("\n").filter(Boolean).map((_, i) => (
              <div key={i} className="flex items-center gap-1">
                <NoiseText length={Math.min(60, 20 + Math.random() * 40 | 0)} />
              </div>
            ))}
            <p className="text-[10px] font-mono text-cyan-800 mt-2 animate-pulse">
              解読中…
            </p>
          </div>
        )}

        {revealed && (
          <p className="text-sm text-cyan-200/80 leading-[1.9] whitespace-pre-wrap font-serif">
            {content}
          </p>
        )}
      </div>

      {/* フッター */}
      <div className="px-4 py-2 border-t border-cyan-900/30 bg-cyan-950/10 flex items-center justify-between">
        <span className="text-[9px] font-mono text-cyan-900 tracking-widest">
          SECURE CHANNEL — AES-256 / FOUNDATION CRYPTO v4
        </span>
        {revealed && (
          <span className="text-[9px] font-mono text-cyan-800">✓ DECODED</span>
        )}
      </div>
    </div>
  );
}
