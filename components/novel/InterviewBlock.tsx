// 編集日時: 2026-04-29

interface QALine {
  type: "Q" | "A";
  speaker?: string;
  text: string;
}

interface InterviewBlockProps {
  header: string;
  lines: QALine[];
}

export function InterviewBlock({ header, lines }: InterviewBlockProps) {
  return (
    <div className="my-6 border border-gray-700/50 rounded-lg overflow-hidden">
      <div className="px-4 py-2.5 border-b border-gray-700/40 bg-gray-800/40 flex items-center gap-2">
        <span className="text-[10px] font-mono text-gray-600 tracking-widest uppercase">■ INTERVIEW</span>
        <span className="text-[11px] font-mono text-gray-400 ml-1">{header}</span>
      </div>
      <div className="divide-y divide-gray-800/50">
        {lines.map((line, i) => (
          <div key={i} className={`flex gap-3 px-4 py-3 ${line.type === "Q" ? "bg-gray-900/20" : "bg-transparent"}`}>
            <span className={`flex-shrink-0 w-6 text-center text-xs font-mono font-bold mt-0.5
              ${line.type === "Q" ? "text-amber-500/80" : "text-gray-500"}`}>
              {line.type}
            </span>
            <div className="flex-1 min-w-0">
              {line.speaker && (
                <span className="text-[10px] font-mono text-gray-600 block mb-0.5">{line.speaker}</span>
              )}
              <p className="text-sm text-gray-300 leading-relaxed font-serif">{line.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
