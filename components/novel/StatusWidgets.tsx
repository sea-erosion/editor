// 編集日時: 2026-04-29

export function TimeStamp({ time, content }: { time: string; content: string }) {
  return (
    <div className="flex items-baseline gap-3 my-1.5">
      <span className="flex-shrink-0 text-[10px] font-mono text-gray-700 tabular-nums">[{time}]</span>
      <span className="text-sm text-gray-300 leading-relaxed">{content}</span>
    </div>
  );
}

export function ImagePlaceholder({ type, caption }: { type: string; caption: string }) {
  const label = type === "document" ? "文書スキャン" : type === "photo" ? "写真記録" : "添付資料";
  return (
    <div className="my-6 border border-gray-700/40 rounded bg-gray-900/20">
      <div className="aspect-[16/7] flex flex-col items-center justify-center gap-2 text-gray-700">
        <div className="font-mono text-3xl select-none">▨</div>
        <div className="text-[10px] font-mono tracking-widest uppercase">{label}</div>
      </div>
      <div className="border-t border-gray-800 px-3 py-2">
        <p className="text-[11px] font-mono text-gray-600">{caption}</p>
      </div>
    </div>
  );
}

export function CounterBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="inline-flex items-center gap-2 border border-gray-700/50 rounded px-2.5 py-1 bg-gray-900/40 my-1 mr-2">
      <span className="text-[10px] font-mono text-gray-600 uppercase tracking-wider">{label}</span>
      <span className="text-[11px] font-mono text-gray-300">{value}</span>
    </div>
  );
}

export function PovMarker({ name }: { name: string }) {
  return (
    <div className="my-5 flex items-center gap-3">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
      <span className="text-[10px] font-mono text-gray-600 tracking-widest px-2">POV : {name}</span>
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
    </div>
  );
}
