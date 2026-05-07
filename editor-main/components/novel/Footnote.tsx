// 編集日時: 2026-04-29
"use client";
interface FootnoteItem { num: number; text: string; }
interface FootnoteBlockProps { items: FootnoteItem[]; }

export function FootnoteBlock({ items }: FootnoteBlockProps) {
  return (
    <div id="footnotes" className="my-6 border-t border-gray-800 pt-4 space-y-1.5">
      {items.map((item) => (
        <div key={item.num} id={`fn-${item.num}`} className="flex gap-2 items-baseline scroll-mt-20">
          <span className="text-[10px] font-mono text-gray-600 flex-shrink-0">※{item.num}</span>
          <span className="text-xs text-gray-500 leading-relaxed font-serif">{item.text}</span>
        </div>
      ))}
    </div>
  );
}

interface NoteRefProps { num: number; }

export function NoteRef({ num }: NoteRefProps) {
  const scrollToNote = () => {
    const el = document.getElementById(`fn-${num}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  };
  return (
    <button
      onClick={scrollToNote}
      className="text-[10px] font-mono text-gray-600 hover:text-amber-500 transition-colors align-super ml-0.5"
      title={`脚注 ※${num} へ移動`}
    >
      ※{num}
    </button>
  );
}
