// 編集日時: 2026-05-03 / 2026-05-07 (fix: LinkTextをホワイトリスト方式に変更)
"use client";

/** http / https のみ許可。それ以外のスキームは # に置換してリンクを無効化 */
function safeLinkHref(href: string): string {
  const trimmed = href.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  // スキームなし（例: "example.com"）は https:// を付与
  if (!/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmed)) return `https://${trimmed}`;
  // javascript: / data: / vbscript: など危険なスキームは無効化
  return "#";
}

export function EmText({ content }: { content: string }) {
  return (
    <span className="underline underline-offset-4 decoration-gray-400 decoration-1">
      {content}
    </span>
  );
}

export function StrongText({ content }: { content: string }) {
  return (
    <strong className="font-bold text-gray-100">{content}</strong>
  );
}

// ── 追加インラインタグ (2026-05-03) ──────────────────────────────────────

// COLOR: 文字色変更。色名（red/cyan/amber/green/purple/gray）または #hex を受け付ける
const COLOR_MAP: Record<string, string> = {
  red:    "#f87171",
  cyan:   "#67e8f9",
  amber:  "#fbbf24",
  green:  "#4ade80",
  purple: "#c084fc",
  gray:   "#9ca3af",
  white:  "#f3f4f6",
  orange: "#fb923c",
  blue:   "#60a5fa",
  pink:   "#f472b6",
};

export function ColorText({ color, content }: { color: string; content: string }) {
  const resolvedColor = COLOR_MAP[color.toLowerCase()] ?? (color.startsWith("#") ? color : undefined);
  if (!resolvedColor) return <span title={`NML: 不明な色 "${color}"`} className="underline decoration-dotted decoration-red-600/60">{content}</span>;
  return <span style={{ color: resolvedColor }}>{content}</span>;
}

// BLINK: ゆっくり点滅
export function BlinkText({ content }: { content: string }) {
  return <span className="nml-blink">{content}</span>;
}

// SPOILER: ホバー/タップで表示
// "use client" が必要なためクライアントコンポーネントとして実装
import { useState } from "react";

export function SpoilerText({ content }: { content: string }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <span
      onClick={() => setRevealed(v => !v)}
      onMouseEnter={() => setRevealed(true)}
      onMouseLeave={() => setRevealed(false)}
      title={revealed ? "クリックで隠す" : "クリックまたはホバーで表示"}
      className={`cursor-pointer rounded-sm px-0.5 select-none transition-colors duration-150 ${
        revealed
          ? "bg-transparent text-inherit"
          : "bg-gray-200/10 text-transparent"
      }`}
      style={revealed ? {} : { textShadow: "0 0 8px rgba(156,163,175,0.6)" }}
    >
      {content}
    </span>
  );
}

// MARK: 蛍光ペン風ハイライト
export function MarkText({ content }: { content: string }) {
  return (
    <mark className="bg-amber-400/25 text-amber-200 rounded-sm px-0.5 not-italic">
      {content}
    </mark>
  );
}

// SHAKE: テキストを震わせる
export function ShakeText({ content }: { content: string }) {
  return <span className="nml-shake">{content}</span>;
}

// LINK: 外部リンク
export function LinkText({ href, content }: { href: string; content: string }) {
  const safe = safeLinkHref(href);
  return (
    <a
      href={safe}
      target="_blank"
      rel="noopener noreferrer"
      className="text-cyan-500 hover:text-cyan-300 underline underline-offset-2 decoration-cyan-700 hover:decoration-cyan-400 transition-colors"
    >
      {content}
    </a>
  );
}
