// 編集日時: 2026-04-28
"use client";
import { useEffect, useState } from "react";

const CHARS_L1 = "abcdefghijklmnopqrstuvwxyz0123456789";
const CHARS_L2 = "░▒▓█■□▪▫◆◇∷∵∴";
const CHARS_L3 = "ÿþýüûúùøöõôóòñðïîíìëêéèçæå∅∆∇∞";

function scramble(text: string, level: number): string {
  const pool = level >= 3 ? CHARS_L3 : level >= 2 ? CHARS_L2 : CHARS_L1;
  return text.split("").map(() => pool[Math.floor(Math.random() * pool.length)]).join("");
}

interface CorruptTextProps {
  content: string;
  level?: number;
}

export function CorruptText({ content, level = 1 }: CorruptTextProps) {
  const [display, setDisplay] = useState(() => scramble(content, level));

  useEffect(() => {
    // ランダムに少しずつ再スクランブル
    const id = setInterval(() => {
      setDisplay(scramble(content, level));
    }, 1200 + Math.random() * 800);
    return () => clearInterval(id);
  }, [content, level]);

  const colorClass = level >= 3 ? "text-red-600/70" : level >= 2 ? "text-gray-600" : "text-gray-500/80";

  return (
    <span
      className={`font-mono inline-block ${colorClass}`}
      title="[個人情報プロテクト適用中]"
      aria-label="[文字化け]"
    >
      {display}
    </span>
  );
}
