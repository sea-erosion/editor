// 編集日時: 2026-04-28
"use client";

interface DialogLine {
  role: string;
  symbol: string;
  text: string;
}

interface DialogBlockProps {
  lines: DialogLine[];
}

// 役割ごとのスタイル定義
const ROLE_STYLES: Record<string, { indent: string; symbolColor: string; textColor: string }> = {
  AI:      { indent: "pl-0",  symbolColor: "text-cyan-500",   textColor: "text-cyan-200"  },
  USER:    { indent: "pl-6",  symbolColor: "text-gray-500",   textColor: "text-gray-300"  },
  SYSTEM:  { indent: "pl-0",  symbolColor: "text-red-600",    textColor: "text-red-400/80"},
};

function getStyle(role: string) {
  return ROLE_STYLES[role.toUpperCase()] ?? { indent: "pl-3", symbolColor: "text-gray-500", textColor: "text-gray-300" };
}

export function DialogBlock({ lines }: DialogBlockProps) {
  return (
    <div className="my-6 border-l-2 border-gray-800 pl-4 space-y-3 font-sans">
      {lines.map((line, i) => {
        const style = getStyle(line.role);
        return (
          <div key={i} className={`${style.indent}`}>
            <span className={`font-mono text-sm mr-2 select-none ${style.symbolColor}`}>
              {line.symbol}
            </span>
            <span className={`text-sm leading-relaxed ${style.textColor}`}>
              {line.text}
            </span>
          </div>
        );
      })}
    </div>
  );
}
