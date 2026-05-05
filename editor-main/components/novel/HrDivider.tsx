// 編集日時: 2026-04-28
interface HrDividerProps {
  style?: string;
}

export function HrDivider({ style = "" }: HrDividerProps) {
  if (style === "dots") {
    return (
      <div className="my-6 flex items-center justify-center gap-2 text-gray-700 select-none">
        {Array.from({ length: 7 }).map((_, i) => (
          <span key={i} className="text-xs">·</span>
        ))}
      </div>
    );
  }
  if (style === "stars") {
    return (
      <div className="my-6 text-center text-gray-700 select-none font-mono text-sm tracking-widest">
        ＊　　＊　　＊
      </div>
    );
  }
  // default: ダッシュ線
  return (
    <div className="my-6 flex items-center gap-3">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
    </div>
  );
}
