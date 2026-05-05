// 編集日時: 2026-04-28
interface DotTextProps {
  content: string;
}

export function DotText({ content }: DotTextProps) {
  return (
    <span className="inline" style={{ textEmphasis: "filled circle", WebkitTextEmphasis: "filled circle" } as React.CSSProperties}>
      {/* CSS text-emphasis が使えない環境向けフォールバック */}
      <span className="relative inline-block">
        {content.split("").map((ch, i) => (
          <span key={i} className="relative inline-block">
            <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[6px] leading-none select-none">・</span>
            {ch}
          </span>
        ))}
      </span>
    </span>
  );
}
